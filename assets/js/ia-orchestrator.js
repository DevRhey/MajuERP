/**
 * IA Orchestrator
 * Camada única de coordenação para todos os serviços de IA.
 * - Centraliza chamadas de IA (calendário, financeiro, riscos)
 * - Usa Web Workers via workers-manager (se disponível) ou fallback local
 * - Faz cache e dedup de requisições
 * - Expõe API única: window.iaOrchestrator
 */

(function () {
  class IAOrchestrator {
    constructor() {
      this.cache = typeof iaCache !== 'undefined' ? iaCache : null;
      this.calWorker = (typeof getCalendarioWorker === 'function') ? getCalendarioWorker() : null;
      this.finWorker = (typeof getFinanceiroWorker === 'function') ? getFinanceiroWorker() : null;
      this.queue = new Map(); // para dedup por chave
      this.initListeners();
    }

    initListeners() {
      // Invalida cache em mudanças relevantes
      window.addEventListener('storageUpdate', (e) => {
        const { key } = e.detail || {};
        if (!this.cache) return;
        if (key === 'eventos') this.cache.clearByType('conflitos');
        if (key === 'financeiroTransacoes') this.cache.clearByType('risco');
      });
    }

    // ===== Public API =====
    async analisarEventoCalendario(evento, eventos) {
      const cacheKey = this.makeKey('calendario_evento', { evento, eventos: eventos?.length });
      const cached = this.getCache(cacheKey);
      if (cached) return cached;

      const result = await this.runDedup(cacheKey, async () => {
        if (this.calWorker) {
          return this.calWorker.analisarEvento(evento, eventos);
        }
        // Fallback local
        const assist = new CalendarioAssistente();
        return assist.validarAgendamento(evento);
      });
      const normalized = this.normalizeCalendario(result);
      this.setCache(cacheKey, normalized);
      return normalized;
    }

    async analisarDisponibilidade(evento, eventos) {
      const cacheKey = this.makeKey('calendario_disp', { evento, eventos: eventos?.length });
      const cached = this.getCache(cacheKey);
      if (cached) return cached;
      const result = await this.runDedup(cacheKey, async () => {
        if (this.calWorker) {
          return this.calWorker.analisarDisponibilidade(evento, eventos);
        }
        const assist = new CalendarioAssistente();
        return assist.gerarAvisos?.(evento) || {};
      });
      this.setCache(cacheKey, result);
      return result;
    }

    async dashboardFinanceiro(eventos, clientes, transacoes) {
      const cacheKey = this.makeKey('fin_dashboard', { e: eventos?.length, c: clientes?.length, t: transacoes?.length });
      const cached = this.getCache(cacheKey);
      if (cached) return cached;
      const result = await this.runDedup(cacheKey, async () => {
        if (this.finWorker) {
          return this.finWorker.obterDashboardFinanceiro(eventos, clientes, transacoes);
        }
        const af = new AssistenteFinanceiro();
        return af.obterDashboardFinanceiro();
      });
      this.setCache(cacheKey, result, 60 * 1000); // 1 min
      return result;
    }

    async riscoFinanceiro(eventos, transacoes) {
      const cacheKey = this.makeKey('fin_risco', { e: eventos?.length, t: transacoes?.length });
      const cached = this.getCache(cacheKey);
      if (cached) return cached;
      const result = await this.runDedup(cacheKey, async () => {
        if (this.finWorker) {
          return this.finWorker.analisarRiscoGeral(eventos, transacoes);
        }
        const af = new AssistenteFinanceiro();
        return af.riskAnalyzer.analisarRiscoGeral(eventos, transacoes);
      });
      this.setCache(cacheKey, result, 60 * 1000);
      return result;
    }

    async analisarClienteFinanceiro(cliente, eventos, transacoes, clientes) {
      const clienteId = typeof cliente === 'object' ? cliente?.id : cliente;
      const cacheKey = this.makeKey('fin_cliente', { id: clienteId, e: eventos?.length, t: transacoes?.length });
      const cached = this.getCache(cacheKey);
      if (cached) return cached;

      const result = await this.runDedup(cacheKey, async () => {
        if (this.finWorker?.analisarRiscoInadimplencia) {
          return this.finWorker.analisarRiscoInadimplencia(clienteId, clientes, transacoes);
        }
        const af = new AssistenteFinanceiro();
        return af.analisarCliente(clienteId);
      });

      const normalized = this.normalizeCliente(result, clienteId, eventos, transacoes, clientes);
      this.setCache(cacheKey, normalized, 5 * 60 * 1000);
      return normalized;
    }

    // ===== Helpers de cache/dedup =====
    makeKey(prefix, obj) {
      return `${prefix}_${JSON.stringify(obj)}`;
    }

    getCache(key) {
      if (!this.cache) return null;
      const val = this.cache.cache?.get?.(key);
      if (!val) return null;
      const age = Date.now() - val.timestamp;
      if (age > (this.cache.TTL || 300000)) {
        this.cache.cache.delete(key);
        return null;
      }
      return val.resultado || val;
    }

    setCache(key, value, ttlOverride) {
      if (!this.cache) return;
      const ttl = ttlOverride || this.cache.TTL || 300000;
      this.cache.cache.set(key, { resultado: value, timestamp: Date.now(), ttl });
    }

    async runDedup(key, fn) {
      if (this.queue.has(key)) return this.queue.get(key);
      const p = (async () => {
        try {
          return await fn();
        } finally {
          this.queue.delete(key);
        }
      })();
      this.queue.set(key, p);
      return p;
    }

    normalizeCalendario(result) {
      if (!result) return result;
      const temConflitos = typeof result.temConflitos !== 'undefined'
        ? result.temConflitos
        : Array.isArray(result.conflitos) && result.conflitos.length > 0;
      return { ...result, temConflitos };
    }

    normalizeCliente(result, clienteId, eventos = [], transacoes = [], clientes = []) {
      if (!result) return null;

      const clienteInfo = (clientes || []).find?.((c) => c.id === clienteId) || null;
      const eventosCliente = (eventos || []).filter?.((e) => e.clienteId === clienteId) || [];
      const transacoesCliente = (transacoes || []).filter?.((t) => t.clienteId === clienteId) || [];

      const base = {
        cliente: clienteInfo?.nome,
        risco_inadimplencia: result.risco_inadimplencia || result.nivel || result.nivelRisco || result.nivel_risco,
        score: result.score || result.score_risco,
      };

      if (!base.risco_inadimplencia && base.score >= 70) {
        base.risco_inadimplencia = 'Alto';
      }

      const pendente = transacoesCliente
        .filter((t) => t.status === 'atrasado' || t.status === 'pendente')
        .reduce((sum, t) => sum + (t.valor || 0), 0);

      const descricaoPartes = [];
      if (pendente > 0) descricaoPartes.push(`Pendências de R$ ${pendente.toFixed(2)}`);
      if (eventosCliente.length > 3) descricaoPartes.push(`${eventosCliente.length} eventos já realizados`);
      if (result.descricao) descricaoPartes.push(result.descricao);

      return {
        ...result,
        ...base,
        descricao: descricaoPartes.join(' | ') || result.descricao,
      };
    }
  }

  // Exporta instância global
  window.iaOrchestrator = new IAOrchestrator();
})();
