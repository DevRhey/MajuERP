/**
 * Web Worker - Assistente Financeiro
 * 
 * Executa análises financeiras em background thread
 * Previsões, análise de risco, alertas - tudo sem bloquear UI
 */

class FinancialPredictor {
  preverReceita(periodo) {
    return {
      mes: `${periodo.mes}/${periodo.ano}`,
      receita_estimada: Math.random() * 15000,
      eventos_esperados: Math.floor(Math.random() * 12),
      ticket_medio: Math.random() * 3000,
    };
  }

  preverReceitaProximosPeriodos(dias = 30, eventos = []) {
    const hoje = new Date();
    const previsao = [];

    for (let i = 0; i < dias; i += 7) {
      const dataInicio = new Date(hoje);
      dataInicio.setDate(dataInicio.getDate() + i);
      const dataFim = new Date(dataInicio);
      dataFim.setDate(dataFim.getDate() + 7);

      const eventosPerido = eventos.filter((e) => {
        const dataEvento = this.parseDataLocal(e.dataInicio);
        return dataEvento >= dataInicio && dataEvento <= dataFim && e.status !== "cancelado";
      });

      const receita = eventosPerido.reduce((total, e) => total + (e.valorTotal || 0), 0);

      previsao.push({
        semana: `${this.formatDate(dataInicio)} a ${this.formatDate(dataFim)}`,
        eventos: eventosPerido.length,
        receita: receita,
      });
    }

    return previsao;
  }

  analisarRiscoInadimplencia(clienteId, clientes = [], transacoes = []) {
    const cliente = clientes.find(c => c.id === clienteId);
    if (!cliente) return null;

    const transacoesCliente = transacoes.filter(t => t.clienteId === clienteId);
    const atrasadas = transacoesCliente.filter(t => t.status === 'atrasado').length;
    const total = transacoesCliente.length || 1;

    const taxaAtraso = (atrasadas / total) * 100;
    const score = Math.min(100, taxaAtraso * 2 + (Math.random() * 20));

    return {
      clienteId,
      nomeCliente: cliente.nome,
      score: Math.round(score),
      risco: score < 30 ? 'baixo' : score < 60 ? 'médio' : 'alto',
      transacoesAtrasadas: atrasadas,
      totalTransacoes: total,
    };
  }

  parseDataLocal(isoDateStr) {
    const [ano, mes, dia] = isoDateStr.split("-").map(Number);
    return new Date(ano, mes - 1, dia);
  }

  formatDate(date) {
    const dia = String(date.getDate()).padStart(2, '0');
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const ano = date.getFullYear();
    return `${dia}/${mes}/${ano}`;
  }
}

class RiskAnalyzer {
  analisarRiscoGeral(eventos = [], transacoes = []) {
    const eventosAtrasados = eventos.filter(e => {
      const data = new Date(e.dataInicio);
      return data < new Date() && e.status !== 'concluido';
    }).length;

    const pagamentosAtrasados = transacoes.filter(t => t.status === 'atrasado').length;
    const pagamentosPendentes = transacoes.filter(t => t.status === 'pendente').length;

    return {
      eventos_pendentes: eventosAtrasados,
      pagamentos_atrasados: pagamentosAtrasados,
      pagamentos_pendentes: pagamentosPendentes,
      risco_geral: eventosAtrasados > 5 ? 'alto' : eventosAtrasados > 2 ? 'médio' : 'baixo',
    };
  }

  identificarTendencias(eventos = []) {
    const tiposEvento = {};

    eventos.forEach(e => {
      const tipo = e.tipoEvento || 'geral';
      if (!tiposEvento[tipo]) {
        tiposEvento[tipo] = { count: 0, receita: 0 };
      }
      tiposEvento[tipo].count++;
      tiposEvento[tipo].receita += e.valorTotal || 0;
    });

    return tiposEvento;
  }
}

// Instâncias
const financialPredictor = new FinancialPredictor();
const riskAnalyzer = new RiskAnalyzer();

/**
 * Obtém dashboard financeiro completo
 */
function obterDashboardFinanceiro(payload) {
  const { eventos, clientes, transacoes } = payload;
  const hoje = new Date();

  return {
    receita_hoje: eventos
      .filter(e => {
        const data = financialPredictor.parseDataLocal(e.dataInicio);
        return data.toDateString() === hoje.toDateString() && e.status === 'concluido';
      })
      .reduce((total, e) => total + (e.valorTotal || 0), 0),

    proximos_30_dias: financialPredictor.preverReceitaProximosPeriodos(30, eventos),
    
    risco_geral: riskAnalyzer.analisarRiscoGeral(eventos, transacoes),
    
    tendencias: riskAnalyzer.identificarTendencias(eventos),
    
    clientes_risco: clientes
      .map(c => financialPredictor.analisarRiscoInadimplencia(c.id, clientes, transacoes))
      .filter(c => c && c.score >= 50)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10),

    timestamp: Date.now(),
  };
}

/**
 * Gera relatório financeiro detalhado
 */
function gerarRelatorioFinanceiro(payload) {
  const { eventos, transacoes, periodo } = payload;
  
  const eventosPerido = eventos.filter(e => {
    const data = financialPredictor.parseDataLocal(e.dataInicio);
    const dataInicio = new Date(periodo.ano, periodo.mes - 1, 1);
    const dataFim = new Date(periodo.ano, periodo.mes, 0);
    return data >= dataInicio && data <= dataFim && e.status === 'concluido';
  });

  const receita = eventosPerido.reduce((total, e) => total + (e.valorTotal || 0), 0);
  const custos = transacoes
    .filter(t => t.tipo === 'despesa' && t.status === 'confirmado')
    .reduce((total, t) => total + t.valor, 0);

  return {
    periodo: `${periodo.mes}/${periodo.ano}`,
    receita_bruta: receita,
    custos: custos,
    lucro: receita - custos,
    margem: receita > 0 ? ((receita - custos) / receita * 100).toFixed(2) : 0,
    quantidade_eventos: eventosPerido.length,
    ticket_medio: eventosPerido.length > 0 ? (receita / eventosPerido.length).toFixed(2) : 0,
  };
}

/**
 * Listener para mensagens da main thread
 */
self.onmessage = function (event) {
  const { id, type, payload } = event.data;

  try {
    let resultado;

    switch (type) {
      case "obterDashboardFinanceiro":
        resultado = obterDashboardFinanceiro(payload);
        break;

      case "gerarRelatorioFinanceiro":
        resultado = gerarRelatorioFinanceiro(payload);
        break;

      case "analisarRiscoInadimplencia":
        resultado = financialPredictor.analisarRiscoInadimplencia(
          payload.clienteId,
          payload.clientes,
          payload.transacoes
        );
        break;

      case "analisarRiscoGeral":
        resultado = riskAnalyzer.analisarRiscoGeral(payload.eventos, payload.transacoes);
        break;

      default:
        throw new Error(`Tipo de mensagem desconhecido: ${type}`);
    }

    // Enviar resultado de volta
    self.postMessage({
      id,
      type: "resultado",
      resultado,
      erro: null,
    });
  } catch (erro) {
    // Enviar erro de volta
    self.postMessage({
      id,
      type: "erro",
      resultado: null,
      erro: erro.message,
    });
  }
};

console.log("💰 Assistente Financeiro Worker inicializado");
