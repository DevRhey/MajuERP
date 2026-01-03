/**
 * Assistente Orquestrador
 * - Monitora eventos, financeiro e operadores
 * - Gera sugestões/avisos e lembretes
 * - Integração opcional com WhatsApp via webhook
 * - UI leve: botão flutuante + modal de sugestões
 */

(function () {
  const STORAGE_KEY = 'assistenteSugestoes';

  class AssistenteOrquestrador {
    constructor() {
      this.sugestoes = this.loadSugestoes();
      this.notifier = typeof ToastNotification !== 'undefined' ? new ToastNotification() : null;
      this.checkInterval = null;
      this.badgeEl = null;
      this.buttonEl = null;
      this.init();
    }

    init() {
      this.createFloatingButton();
      this.registerListeners();
      this.scheduleChecks();
      // Primeira varredura após pequeno delay
      setTimeout(() => this.runAllChecks('init'), 500);
    }

    loadSugestoes() {
      try {
        return Storage.get(STORAGE_KEY) || [];
      } catch (e) {
        console.warn('Assistente: não foi possível carregar sugestões', e);
        return [];
      }
    }

    saveSugestoes() {
      Storage.save(STORAGE_KEY, this.sugestoes);
      this.updateBadge();
    }

    registerListeners() {
      // Storage updates
      window.addEventListener('storageUpdate', (e) => {
        const { key } = e.detail || {};
        if (key === 'eventos' || key === 'financeiroTransacoes' || key === 'clientes' || key === 'itens' || key === 'operadores') {
          this.runAllChecks(key);
        }
      });

      // Background sync updates (se disponível)
      if (typeof backgroundSync !== 'undefined' && backgroundSync?.onUpdate) {
        backgroundSync.onUpdate('eventos', () => this.runAllChecks('bg-eventos'));
        backgroundSync.onUpdate('financeiroTransacoes', () => this.runAllChecks('bg-financeiro'));
      }
    }

    scheduleChecks() {
      const interval = (CONFIG?.ASSISTENTE?.CHECK_INTERVAL) || 60_000; // padrão: 1 min
      if (this.checkInterval) clearInterval(this.checkInterval);
      this.checkInterval = setInterval(() => this.runAllChecks('interval'), interval);
    }

    runAllChecks(origin = 'manual') {
      const eventos = (typeof backgroundSync !== 'undefined' && backgroundSync?.getData('eventos')) || Storage.get('eventos') || [];
      const transacoes = (typeof backgroundSync !== 'undefined' && backgroundSync?.getData('financeiroTransacoes')) || Storage.get('financeiroTransacoes') || [];
      const clientes = Storage.get('clientes') || [];

      const novas = [];
      novas.push(...this.regraLembreteMontagem(eventos));
      novas.push(...this.regraRetirada(eventos));
      novas.push(...this.regraCobranca(transacoes, clientes));
      novas.push(...this.regraOverbooking(eventos));

      if (novas.length > 0) {
        novas.forEach((s) => this.addSugestao(s));
        this.saveSugestoes();
        this.notifyNew(novas.length);
      }
    }

    // ===== Regras =====
    regraLembreteMontagem(eventos) {
      const limiarHoras = CONFIG?.ASSISTENTE?.HORAS_LIMIAR_MONTAGEM ?? 24;
      const bufferMin = CONFIG?.EVENTOS?.BUFFER_MONTAGEM ?? 40;
      const agora = new Date();
      return eventos
        .filter(e => e && e.dataInicio && e.status !== 'cancelado')
        .map(e => {
          const inicio = this.parse(e.dataInicio, e.horaInicio);
          const diffH = this.diffHoras(agora, inicio);
          if (diffH <= limiarHoras && diffH >= 0) {
            return {
              id: `montagem-${e.id}`,
              tipo: 'operacional',
              prioridade: 'alta',
              titulo: 'Lembrete de montagem',
              mensagem: `Montar/entregar brinquedos para "${e.nome || 'Evento'}" às ${e.horaInicio || ''}. Chegar ${bufferMin}min antes.`,
              eventoId: e.id,
              clienteId: e.clienteId,
              acao: { tipo: 'whatsapp', template: 'lembrete_montagem' },
              createdAt: Date.now(),
              status: 'pendente'
            };
          }
          return null;
        })
        .filter(Boolean);
    }

    regraRetirada(eventos) {
      const limiarHoras = CONFIG?.ASSISTENTE?.HORAS_LIMIAR_RETIRADA ?? 2;
      const bufferMin = CONFIG?.EVENTOS?.BUFFER_DESMONTAGEM ?? 40;
      const agora = new Date();
      return eventos
        .filter(e => e && e.dataFim && e.status === 'andamento')
        .map(e => {
          const fim = this.parse(e.dataFim, e.horaFim);
          const diffH = this.diffHoras(agora, fim);
          if (diffH <= limiarHoras && diffH >= -2) {
            return {
              id: `retirada-${e.id}`,
              tipo: 'operacional',
              prioridade: 'media',
              titulo: 'Lembrete de retirada',
              mensagem: `Retirar/desmontar brinquedos do evento "${e.nome || 'Evento'}". Estar ${bufferMin}min antes do fim.`,
              eventoId: e.id,
              clienteId: e.clienteId,
              acao: { tipo: 'whatsapp', template: 'lembrete_retirada' },
              createdAt: Date.now(),
              status: 'pendente'
            };
          }
          return null;
        })
        .filter(Boolean);
    }

    regraCobranca(transacoes, clientes) {
      const limiarHoras = CONFIG?.ASSISTENTE?.HORAS_LIMIAR_COBRANCA ?? 24;
      const agora = new Date();
      return (transacoes || [])
        .filter(t => t && (t.status === 'pendente' || t.status === 'atrasado') && t.dataVencimento)
        .map(t => {
          const venc = new Date(t.dataVencimento);
          const diffH = this.diffHoras(agora, venc);
          if (diffH <= limiarHoras) {
            const cliente = clientes.find(c => c.id === t.clienteId);
            return {
              id: `cobranca-${t.id}`,
              tipo: 'financeiro',
              prioridade: t.status === 'atrasado' ? 'alta' : 'media',
              titulo: t.status === 'atrasado' ? 'Cobrança atrasada' : 'Lembrete de cobrança',
              mensagem: `${cliente?.nome || 'Cliente'} tem parcela ${t.status} vencendo em ${t.dataVencimento}. Valor: R$ ${(t.valor || 0).toFixed?.(2) || t.valor}.`,
              clienteId: t.clienteId,
              eventoId: t.eventoId,
              acao: { tipo: 'whatsapp', template: 'cobranca' },
              createdAt: Date.now(),
              status: 'pendente'
            };
          }
          return null;
        })
        .filter(Boolean);
    }

    regraOverbooking(eventos) {
      const alerta = CONFIG?.ASSISTENTE?.LIMIAR_OCUPACAO_ALERTA ?? 0.8;
      const mapa = new Map();
      const itensCatalogo = Storage.get('itens') || [];
      const nomeItem = (id) => itensCatalogo.find((i) => i.id === id)?.nome || `Item ${id}`;
      eventos.forEach(e => {
        (e.itens || []).forEach(item => {
          if (!item || !item.id) return;
          const count = mapa.get(item.id) || 0;
          mapa.set(item.id, count + (item.quantidade || 1));
        });
      });
      // Sem estoque total disponível, apenas alerta genérico por repetição alta
      return Array.from(mapa.entries())
        .filter(([_, qty]) => qty >= (CONFIG?.ASSISTENTE?.LIMITE_REPETICAO_ITEM || 3))
        .map(([itemId, qty]) => ({
          id: `overbooking-${itemId}`,
          tipo: 'risco',
          prioridade: 'media',
          titulo: 'Risco de overbooking',
          mensagem: `${nomeItem(itemId)} presente em ${qty} eventos. Verifique estoque para evitar conflito.`,
          createdAt: Date.now(),
          status: 'pendente'
        }));
    }

    // ===== Helpers =====
    parse(dataIso, hora) {
      if (!dataIso) return new Date();
      if (hora && /^\d{2}:\d{2}$/.test(hora)) {
        return new Date(`${dataIso}T${hora}:00`);
      }
      return new Date(dataIso);
    }

    diffHoras(a, b) {
      return (b - a) / (1000 * 60 * 60);
    }

    addSugestao(s) {
      // evitar duplicatas por id
      if (this.sugestoes.find((x) => x.id === s.id)) return;
      this.sugestoes.push(s);
    }

    updateBadge() {
      if (!this.badgeEl) return;
      const pendentes = this.sugestoes.filter(s => s.status === 'pendente').length;
      this.badgeEl.textContent = pendentes;
      this.badgeEl.style.display = pendentes > 0 ? 'inline-block' : 'none';
    }

    notifyNew(qtd) {
      if (!this.notifier) return;
      this.notifier.info(`Assistente gerou ${qtd} nova(s) sugestão(ões).`);
    }

    // ===== UI =====
    createFloatingButton() {
      const btn = document.createElement('button');
      btn.id = 'assistente-btn';
      btn.className = 'btn btn-primary shadow';
      btn.style.position = 'fixed';
      btn.style.bottom = '20px';
      btn.style.right = '20px';
      btn.style.zIndex = '9998';
      btn.innerHTML = '<i class="bi bi-robot"></i> Assistente';

      const badge = document.createElement('span');
      badge.className = 'badge bg-danger ms-2';
      badge.style.display = 'none';
      btn.appendChild(badge);
      this.badgeEl = badge;

      btn.addEventListener('click', () => this.openModal());
      document.body.appendChild(btn);
      this.buttonEl = btn;
      this.updateBadge();
    }

    openModal() {
      const itens = this.sugestoes
        .sort((a, b) => b.createdAt - a.createdAt)
        .map((s) => `
          <div class="d-flex align-items-start gap-2 border-bottom py-2">
            <div class="flex-grow-1">
              <div class="d-flex align-items-center gap-2">
                <span class="badge bg-${this.badgeColor(s.prioridade)} text-uppercase">${s.prioridade}</span>
                <strong>${s.titulo}</strong>
              </div>
              <small class="text-muted">${new Date(s.createdAt).toLocaleString('pt-BR')}</small>
              <p class="mb-1">${s.mensagem}</p>
            </div>
            <div class="d-flex flex-column gap-1">
              ${s.acao ? `<button class="btn btn-sm btn-outline-success" data-action="whatsapp" data-id="${s.id}"><i class="bi bi-whatsapp"></i></button>` : ''}
              <button class="btn btn-sm btn-outline-secondary" data-action="done" data-id="${s.id}"><i class="bi bi-check2"></i></button>
            </div>
          </div>
        `).join('');

      const html = itens || '<p class="text-muted">Sem sugestões no momento.</p>';
      UI.showModal('Central do Assistente', `<div>${html}</div>`, true);

      // Bind ações
      document.querySelectorAll('[data-action]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          const id = e.currentTarget.dataset.id;
          const action = e.currentTarget.dataset.action;
          if (action === 'done') this.marcarConcluido(id);
          if (action === 'whatsapp') this.enviarWhatsApp(id);
        });
      });
    }

    badgeColor(prioridade) {
      return prioridade === 'alta' ? 'danger' : prioridade === 'media' ? 'warning' : 'info';
    }

    marcarConcluido(id) {
      const item = this.sugestoes.find((s) => s.id === id);
      if (item) {
        item.status = 'concluido';
        this.saveSugestoes();
        if (this.notifier) this.notifier.success('Marcado como concluído.');
        // Fechar modal se aberto
        const modalEl = document.getElementById('dynamicModal');
        if (modalEl) {
          const modal = bootstrap.Modal.getInstance(modalEl);
          modal?.hide();
        }
      }
    }

    async enviarWhatsApp(id) {
      const item = this.sugestoes.find((s) => s.id === id);
      if (!item) return;
      const cfg = CONFIG?.ASSISTENTE?.WHATSAPP || {};
      if (!cfg.ENABLED || !cfg.WEBHOOK_URL) {
        if (this.notifier) this.notifier.warning('Configurar webhook do WhatsApp antes de enviar.');
        return;
      }
      try {
        const payload = {
          template: item.acao?.template || 'generic',
          eventoId: item.eventoId,
          clienteId: item.clienteId,
          mensagem: item.mensagem,
        };
        await fetch(cfg.WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(cfg.TOKEN ? { Authorization: `Bearer ${cfg.TOKEN}` } : {}),
          },
          body: JSON.stringify(payload),
        });
        item.status = 'enviado';
        this.saveSugestoes();
        if (this.notifier) this.notifier.success('WhatsApp enviado (webhook).');
      } catch (err) {
        console.error('WhatsApp webhook error', err);
        if (this.notifier) this.notifier.error('Falha ao enviar WhatsApp.');
      }
    }
  }

  // Instância global
  window.assistente = new AssistenteOrquestrador();
})();
