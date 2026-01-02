// IA Engine - Core de Inteligência Artificial
// Módulo principal com algoritmos de IA para o sistema ERP

class IAEngine {
  constructor() {
    this.conflictDetector = new ConflictDetector();
    this.availabilityAnalyzer = new AvailabilityAnalyzer();
    this.financialPredictor = new FinancialPredictor();
    this.recommendationEngine = new RecommendationEngine();
    this.riskAnalyzer = new RiskAnalyzer();
    this.notificationSystem = new NotificationSystem();
  }

  // Inicializar o sistema de IA
  initialize() {
    console.log("🤖 IA Engine inicializado com sucesso!");
    this.notificationSystem.startAlertMonitoring();
  }

  // Método auxiliar para obter todos os dados
  getAllData() {
    return {
      eventos: Storage.get("eventos") || [],
      clientes: Storage.get("clientes") || [],
      itens: Storage.get("itens") || [],
      transacoes: Storage.get("financeiroTransacoes") || [],
    };
  }
}

// ==========================================
// 1. DETECTOR DE CONFLITOS
// ==========================================
class ConflictDetector {
  /**
   * Detecta conflitos de agendamento
   * @param {Object} novoEvento - Evento a ser adicionado
   * @param {Array} eventosExistentes - Eventos já cadastrados
   * @returns {Object} Resultado da verificação
   */
  verificarConflitos(novoEvento, eventosExistentes) {
    const conflitos = [];

    // Convertir datas para comparação
    const dataInicio = this.parseDataLocal(novoEvento.dataInicio);
    const dataFim = this.parseDataLocal(novoEvento.dataFim);

    eventosExistentes.forEach((evento) => {
      if (this.verificarSobreposicao(dataInicio, dataFim, evento)) {
        conflitos.push({
          tipo: "sobreposicao_data",
          evento: evento,
          mensagem: `Sobreposição de data com evento: ${evento.cliente}`,
        });
      }
    });

    // Verificar conflitos de itens
    if (novoEvento.itensAlugados && novoEvento.itensAlugados.length > 0) {
      const conflitosItens = this.verificarConflitosItens(
        novoEvento.itensAlugados,
        dataInicio,
        dataFim,
        eventosExistentes
      );
      conflitos.push(...conflitosItens);
    }

    return {
      temConflitos: conflitos.length > 0,
      conflitos: conflitos,
      podeAgendar: conflitos.length === 0,
    };
  }

  /**
   * Verifica se há sobreposição entre datas
   */
  verificarSobreposicao(dataInicio1, dataFim1, evento2) {
    const dataInicio2 = this.parseDataLocal(evento2.dataInicio);
    const dataFim2 = this.parseDataLocal(evento2.dataFim);

    // Se evento está cancelado, ignore
    if (evento2.status === "cancelado") return false;

    // Verifica se há sobreposição
    return dataInicio1 <= dataFim2 && dataFim1 >= dataInicio2;
  }

  /**
   * Verifica conflitos de itens alugados
   */
  verificarConflitosItens(itensAlugados, dataInicio, dataFim, eventosExistentes) {
    const conflitos = [];
    const itens = Storage.get("itens") || [];

    itensAlugados.forEach((itemAlugado) => {
      const item = itens.find((i) => i.id === itemAlugado.itemId);
      if (!item) return;

      // Contar quantos deste item já estão alugados no período
      let quantidadeAlocada = 0;

      eventosExistentes.forEach((evento) => {
        if (this.verificarSobreposicao(dataInicio, dataFim, evento)) {
          const itemNoEvento = evento.itensAlugados.find(
            (i) => i.itemId === itemAlugado.itemId
          );
          if (itemNoEvento) {
            quantidadeAlocada += itemNoEvento.quantidade;
          }
        }
      });

      // Verifica se há quantidade disponível
      if (quantidadeAlocada + itemAlugado.quantidade > item.quantidadeTotal) {
        conflitos.push({
          tipo: "item_indisponivel",
          item: item.nome,
          necessario: itemAlugado.quantidade,
          disponivel: item.quantidadeTotal - quantidadeAlocada,
          mensagem: `Item "${item.nome}" não possui quantidade suficiente no período selecionado.`,
        });
      }
    });

    return conflitos;
  }

  /**
   * Converte string de data para objeto Date (horário local)
   */
  parseDataLocal(isoDateStr) {
    if (isoDateStr instanceof Date) return isoDateStr;
    const [ano, mes, dia] = isoDateStr.split("-").map(Number);
    return new Date(ano, mes - 1, dia);
  }

  /**
   * Retorna sugestões de datas alternativas
   */
  sugerirDatasAlternativas(dataDesejada, diasParaProcurar = 14) {
    const eventos = Storage.get("eventos") || [];
    const itens = Storage.get("itens") || [];
    const sugestoes = [];

    for (let i = 1; i <= diasParaProcurar; i++) {
      const dataTentativa = new Date(dataDesejada);
      dataTentativa.setDate(dataTentativa.getDate() + i);

      const disponivel = this.verificarDisponibilidadeData(dataTentativa, eventos);
      if (disponivel) {
        sugestoes.push({
          data: dataTentativa,
          dataFormatada: DateUtils.formatDate(dataTentativa),
          motivo: "Data totalmente disponível",
        });

        if (sugestoes.length >= 3) break;
      }
    }

    return sugestoes;
  }

  /**
   * Verifica disponibilidade total de uma data
   */
  verificarDisponibilidadeData(data, eventos) {
    return !eventos.some(
      (e) =>
        this.isSameDay(this.parseDataLocal(e.dataInicio), data) &&
        e.status !== "cancelado"
    );
  }

  /**
   * Compara se duas datas são o mesmo dia
   */
  isSameDay(date1, date2) {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }
}

// ==========================================
// 2. ANALISADOR DE DISPONIBILIDADE
// ==========================================
class AvailabilityAnalyzer {
  /**
   * Analisa disponibilidade de itens em um período
   */
  analisarDisponibilidadeItens(dataInicio, dataFim) {
    const itens = Storage.get("itens") || [];
    const eventos = Storage.get("eventos") || [];
    const analise = {};

    itens.forEach((item) => {
      const disponibilidade = this.calcularDisponibilidade(
        item,
        dataInicio,
        dataFim,
        eventos
      );
      analise[item.id] = {
        nome: item.nome,
        quantidadeTotal: item.quantidadeTotal,
        disponivel: disponibilidade.disponivel,
        alugados: disponibilidade.alugados,
        percentualDisponivel: Math.round(
          (disponibilidade.disponivel / item.quantidadeTotal) * 100
        ),
        status: disponibilidade.disponivel > 0 ? "disponível" : "esgotado",
      };
    });

    return analise;
  }

  /**
   * Calcula disponibilidade de um item específico
   */
  calcularDisponibilidade(item, dataInicio, dataFim, eventos) {
    let alugados = 0;

    eventos.forEach((evento) => {
      if (this.verificarSobreposicao(dataInicio, dataFim, evento)) {
        const itemNoEvento = evento.itensAlugados.find(
          (i) => i.itemId === item.id
        );
        if (itemNoEvento) {
          alugados += itemNoEvento.quantidade;
        }
      }
    });

    return {
      disponivel: Math.max(0, item.quantidadeTotal - alugados),
      alugados: alugados,
    };
  }

  /**
   * Recomenda itens similares em caso de indisponibilidade
   */
  recomendarSubstituicoes(itemIndisponivel, quantidadeNecessaria) {
    const itens = Storage.get("itens") || [];
    const similares = itens.filter(
      (i) =>
        i.tipo === itemIndisponivel.tipo &&
        i.id !== itemIndisponivel.id &&
        i.quantidadeTotal >= quantidadeNecessaria
    );

    return similares.map((item) => ({
      id: item.id,
      nome: item.nome,
      tipo: item.tipo,
      diferencaPreco: item.valorDiaria - itemIndisponivel.valorDiaria,
      qualidadeSimilaridade: 85, // Pode ser aumentado com mais análise
    }));
  }

  /**
   * Verifica sobreposição de período
   */
  verificarSobreposicao(dataInicio1, dataFim1, evento2) {
    const dataInicio2 = this.parseDataLocal(evento2.dataInicio);
    const dataFim2 = this.parseDataLocal(evento2.dataFim);

    if (evento2.status === "cancelado") return false;
    return dataInicio1 <= dataFim2 && dataFim1 >= dataInicio2;
  }

  /**
   * Parse de data
   */
  parseDataLocal(isoDateStr) {
    if (isoDateStr instanceof Date) return isoDateStr;
    const [ano, mes, dia] = isoDateStr.split("-").map(Number);
    return new Date(ano, mes - 1, dia);
  }
}

// ==========================================
// 3. PREDITOR FINANCEIRO
// ==========================================
class FinancialPredictor {
  /**
   * Prevê receita para um período
   */
  preverReceita(mesFuturo) {
    const eventos = Storage.get("eventos") || [];
    const eventosMes = this.filtrarEventosMes(eventos, mesFuturo);

    const receita = eventosMes.reduce((total, evento) => {
      if (evento.status !== "cancelado") {
        return total + (evento.valorTotal || 0);
      }
      return total;
    }, 0);

    const eventosConfirmados = eventosMes.filter((e) => e.status === "confirmado").length;
    const totalEventos = eventosMes.length;

    return {
      receita: receita,
      receita_formatada: `R$ ${receita.toFixed(2)}`,
      eventos: {
        total: totalEventos,
        confirmados: eventosConfirmados,
        pendentes: totalEventos - eventosConfirmados,
      },
      ticket_medio: totalEventos > 0 ? receita / totalEventos : 0,
      confiabilidade: "Alta", // Pode ser calculado dinamicamente
    };
  }

  /**
   * Análise de risco de inadimplência
   */
  analisarRiscoInadimplencia(clienteId) {
    const clientes = Storage.get("clientes") || [];
    const eventos = Storage.get("eventos") || [];
    const transacoes = Storage.get("financeiroTransacoes") || [];

    const cliente = clientes.find((c) => c.id === clienteId);
    if (!cliente) return null;

    const eventosCliente = eventos.filter((e) => e.clienteId === clienteId);
    const transacoesCliente = transacoes.filter((t) => t.clienteId === clienteId);

    // Calcular métricas
    const totalEventos = eventosCliente.length;
    const totalPago = transacoesCliente
      .filter((t) => t.status === "pago")
      .reduce((sum, t) => sum + t.valor, 0);
    const totalDevido = eventosCliente.reduce((sum, e) => sum + (e.valorTotal || 0), 0);
    const atrasados = transacoesCliente.filter((t) => t.status === "atrasado").length;

    // Score de risco (0-100)
    let score = 50; // base
    score += atrasados * 15; // cada atraso aumenta risco
    score -= totalPago > totalDevido * 0.7 ? 10 : 0; // reduz se paga bem

    const risco = Math.min(100, Math.max(0, score));

    return {
      cliente: cliente.nome,
      score: Math.round(risco),
      nivel: risco >= 70 ? "Alto" : risco >= 40 ? "Médio" : "Baixo",
      total_eventos: totalEventos,
      total_pago: totalPago,
      total_devido: totalDevido,
      atrasos: atrasados,
      recomendacao:
        risco >= 70
          ? "Solicitar pagamento antecipado ou entrada maior"
          : "Monitorar",
    };
  }

  /**
   * Filtra eventos de um mês específico
   */
  filtrarEventosMes(eventos, mes) {
    const hoje = new Date();
    const ano = mes.ano || hoje.getFullYear();
    const numeroMes = mes.mes || hoje.getMonth();

    return eventos.filter((e) => {
      const data = this.parseDataLocal(e.dataInicio);
      return data.getFullYear() === ano && data.getMonth() === numeroMes;
    });
  }

  /**
   * Parse de data
   */
  parseDataLocal(isoDateStr) {
    if (isoDateStr instanceof Date) return isoDateStr;
    const [ano, mes, dia] = isoDateStr.split("-").map(Number);
    return new Date(ano, mes - 1, dia);
  }
}

// ==========================================
// 4. MOTOR DE RECOMENDAÇÕES
// ==========================================
class RecommendationEngine {
  /**
   * Recomenda itens para um novo evento
   */
  recomendarItens(tipoEvento, quantidadeCriancas, local) {
    const itens = Storage.get("itens") || [];
    const eventos = Storage.get("eventos") || [];

    // Padrões aprendidos do sistema
    const padroes = {
      aniversario: ["piscina", "escorregador", "trampolim"],
      festa: ["baloes", "decoracao", "som"],
      casamento: ["mesa", "cadeira", "decoracao"],
    };

    const itensRecomendados = itens.filter((item) =>
      padroes[tipoEvento]?.some((p) => item.nome.toLowerCase().includes(p))
    );

    // Ordenar por frequência de uso
    const recomendacoes = itensRecomendados.map((item) => ({
      id: item.id,
      nome: item.nome,
      tipo: item.tipo,
      preco: item.valorDiaria,
      frequencia: this.calcularFrequencia(item.id, eventos),
      score: this.calcularScoreRecomendacao(item, tipoEvento, quantidadeCriancas),
    }));

    return recomendacoes.sort((a, b) => b.score - a.score).slice(0, 5);
  }

  /**
   * Recomenda pacotes de itens
   */
  recomendarPacotes(tipoEvento) {
    const itens = Storage.get("itens") || [];
    const eventos = Storage.get("eventos") || [];

    // Encontrar combinações frequentes
    const combinacoes = this.analisarCombinacoesFrecuentes(eventos, itens);
    const pacotesRecomendados = combinacoes.filter((c) =>
      c.tipo === tipoEvento
    );

    return pacotesRecomendados.map((pacote) => ({
      nome: `Pacote ${pacote.nome}`,
      itens: pacote.itens,
      precoTotal: pacote.precoTotal,
      economia: pacote.economia,
      frequencia: `Usado em ${pacote.frequencia} eventos`,
    }));
  }

  /**
   * Calcula frequência de uso de um item
   */
  calcularFrequencia(itemId, eventos) {
    return eventos.filter((e) =>
      e.itensAlugados.some((i) => i.itemId === itemId)
    ).length;
  }

  /**
   * Calcula score de recomendação
   */
  calcularScoreRecomendacao(item, tipoEvento, quantidadeCriancas) {
    let score = 50;
    score += item.quantidadeTotal >= 2 ? 10 : 0;
    score += item.valorDiaria < 100 ? 10 : 0;
    return score;
  }

  /**
   * Analisa combinações frequentes de itens
   */
  analisarCombinacoesFrecuentes(eventos, itens) {
    const combinacoes = [];
    // Lógica para análise de combinações
    return combinacoes;
  }
}

// ==========================================
// 5. ANALISADOR DE RISCO
// ==========================================
class RiskAnalyzer {
  /**
   * Realiza análise completa de risco
   */
  analisarRisco(evento) {
    const riscos = [];

    // Risco de cancelamento
    const riscoCancelamento = this.calcularRiscoCancelamento(evento);
    if (riscoCancelamento.score > 40) {
      riscos.push(riscoCancelamento);
    }

    // Risco de atraso
    const riscoAtraso = this.calcularRiscoAtraso(evento);
    if (riscoAtraso.score > 30) {
      riscos.push(riscoAtraso);
    }

    return {
      temRiscos: riscos.length > 0,
      riscos: riscos,
      nivelRiscoGeral: this.determinarNivelRisco(riscos),
    };
  }

  /**
   * Calcula risco de cancelamento
   */
  calcularRiscoCancelamento(evento) {
    const eventos = Storage.get("eventos") || [];
    const clientesData = Storage.get("clientes") || [];

    const cliente = clientesData.find((c) => c.id === evento.clienteId);
    let score = 20;

    // Se cliente tem histórico de cancelamento
    const eventosCliente = eventos.filter(
      (e) => e.clienteId === evento.clienteId && e.status === "cancelado"
    );
    score += Math.min(40, eventosCliente.length * 10);

    return {
      tipo: "cancelamento",
      score: Math.min(100, score),
      mensagem: `Risco moderado de cancelamento para cliente ${cliente?.nome}`,
      recomendacao: "Considere solicitar sinal/adiantamento",
    };
  }

  /**
   * Calcula risco de atraso de pagamento
   */
  calcularRiscoAtraso(evento) {
    const cliente = Storage.get("clientes")?.find((c) => c.id === evento.clienteId);
    const transacoes = Storage.get("financeiroTransacoes") || [];

    const transacoesCliente = transacoes.filter((t) => t.clienteId === evento.clienteId);
    const atrasadas = transacoesCliente.filter((t) => t.status === "atrasado").length;

    let score = atrasadas > 0 ? 60 : 20;

    return {
      tipo: "atraso_pagamento",
      score: Math.min(100, score),
      mensagem: `Cliente tem ${atrasadas} pagamento(s) em atraso`,
      recomendacao: "Verificar situação de pagamentos pendentes",
    };
  }

  /**
   * Determina nível de risco geral
   */
  determinarNivelRisco(riscos) {
    if (riscos.length === 0) return "Baixo";
    const mediaScore = riscos.reduce((sum, r) => sum + r.score, 0) / riscos.length;
    return mediaScore >= 60 ? "Alto" : mediaScore >= 40 ? "Médio" : "Baixo";
  }
}

// ==========================================
// 6. SISTEMA DE NOTIFICAÇÕES INTELIGENTE
// ==========================================
class NotificationSystem {
  /**
   * Inicia monitoramento automático de alertas
   */
  startAlertMonitoring() {
    setInterval(() => {
      this.verificarAlertasPendentes();
    }, 60000); // Verificar a cada minuto
  }

  /**
   * Verifica alertas pendentes
   */
  verificarAlertasPendentes() {
    const eventos = Storage.get("eventos") || [];
    const alertas = [];

    eventos.forEach((evento) => {
      const dataEvento = this.parseDataLocal(evento.dataInicio);
      const hoje = new Date();
      const diasAte = Math.floor((dataEvento - hoje) / (1000 * 60 * 60 * 24));

      if (diasAte === 7) {
        alertas.push({
          tipo: "lembreteEventoProximo",
          evento: evento,
          mensagem: `Evento de ${evento.cliente} em 7 dias!`,
        });
      } else if (diasAte === 1) {
        alertas.push({
          tipo: "lembreteEventoAmanha",
          evento: evento,
          mensagem: `Evento de ${evento.cliente} acontece AMANHÃ!`,
        });
      }

      // Verificar pagamento pendente
      if (evento.status === "confirmado" && evento.pagamentoStatus === "pendente") {
        alertas.push({
          tipo: "pagamentoPendente",
          evento: evento,
          mensagem: `Pagamento pendente para evento de ${evento.cliente}`,
        });
      }
    });

    return alertas;
  }

  /**
   * Parse de data
   */
  parseDataLocal(isoDateStr) {
    if (isoDateStr instanceof Date) return isoDateStr;
    const [ano, mes, dia] = isoDateStr.split("-").map(Number);
    return new Date(ano, mes - 1, dia);
  }
}

// Inicializar IA Engine quando a página carrega
let iaEngine = null;

document.addEventListener("DOMContentLoaded", () => {
  iaEngine = new IAEngine();
  iaEngine.initialize();
});
