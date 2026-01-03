// Assistente Financeiro Inteligente
// Análise predictiva, previsões de receita e detecção de risco

class AssistenteFinanceiro {
  constructor() {
    this.financialPredictor = new FinancialPredictor();
    this.riskAnalyzer = new RiskAnalyzer();
  }

  /**
   * Dashboard de análise financeira
   */
  obterDashboardFinanceiro() {
    const hoje = new Date();
    const mesAtual = { mes: hoje.getMonth() + 1, ano: hoje.getFullYear() };
    const meshPassado = this.obterMesAnterior(mesAtual);

    return {
      mes_atual: this.financialPredictor.preverReceita(mesAtual),
      mes_passado: this.financialPredictor.preverReceita(meshPassado),
      proximos_30_dias: this.preverReceitaProximosPeriodos(30),
      analise_clientes_risco: this.analisarClientesEmRisco(),
      alertas: this.gerarAlertasFinanceiros(),
      oportunidades: this.identificarOportunidades(),
    };
  }

  /**
   * Prevê receita para os próximos dias/meses
   */
  preverReceitaProximosPeriodos(dias) {
    const eventos = Storage.get("eventos") || [];
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
        semana: `${DateUtils.formatDate(dataInicio)} a ${DateUtils.formatDate(dataFim)}`,
        eventos: eventosPerido.length,
        receita: receita,
        receita_formatada: `R$ ${receita.toFixed(2)}`,
      });
    }

    return previsao;
  }

  /**
   * Analisa clientes em risco de inadimplência
   */
  analisarClientesEmRisco() {
    const clientes = Storage.get("clientes") || [];
    const clientesRisco = [];

    clientes.forEach((cliente) => {
      const analise = this.financialPredictor.analisarRiscoInadimplencia(cliente.id);
      if (analise && analise.score >= 50) {
        clientesRisco.push(analise);
      }
    });

    return clientesRisco
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }

  /**
   * Gera alertas financeiros
   */
  gerarAlertasFinanceiros() {
    const alertas = [];
    const eventos = Storage.get("eventos") || [];
    const transacoes = Storage.get("financeiroTransacoes") || [];

    // Alerta: Pagamentos vencidos
    const pagamentosAtrasados = transacoes.filter(
      (t) => t.status === "atrasado"
    ).length;

    if (pagamentosAtrasados > 0) {
      alertas.push({
        tipo: "pagamentos_atrasados",
        nivel: "danger",
        mensagem: `🔴 ${pagamentosAtrasados} pagamento(s) em atraso! Total em risco.`,
        quantidade: pagamentosAtrasados,
      });
    }

    // Alerta: Receita baixa no mês
    const mesAtual = { mes: new Date().getMonth() + 1, ano: new Date().getFullYear() };
    const previsao = this.financialPredictor.preverReceita(mesAtual);

    if (previsao.receita < 2000) {
      alertas.push({
        tipo: "receita_baixa",
        nivel: "warning",
        mensagem: `⚠️ Receita do mês está baixa: ${previsao.receita_formatada}`,
        receita: previsao.receita,
      });
    }

    // Alerta: Falta de eventos agendados
    if (previsao.eventos.total < 3) {
      alertas.push({
        tipo: "poucos_eventos",
        nivel: "info",
        mensagem: `ℹ️ Apenas ${previsao.eventos.total} evento(s) agendado(s) para este mês.`,
        quantidade: previsao.eventos.total,
      });
    }

    return alertas;
  }

  /**
   * Identifica oportunidades de receita
   */
  identificarOportunidades() {
    const oportunidades = [];

    // Oportunidade 1: Períodos ociosos para promoções
    const periodos = this.encontrarPeriodosOciosos();
    if (periodos.length > 0) {
      oportunidades.push({
        tipo: "promocoes_periodos_ociosos",
        titulo: "Ofereça promoções em períodos ociosos",
        descricao: `Há ${periodos.length} período(s) com baixa ocupação. Considere descontos para atrair clientes.`,
        potencial_receita: "Aumento de 20-30%",
        periodos: periodos.map((p) => DateUtils.formatDate(p)),
      });
    }

    // Oportunidade 2: Pacotes populares
    const pacotesPopulares = this.identificarPacotesPopulares();
    if (pacotesPopulares.length > 0) {
      oportunidades.push({
        tipo: "pacotes_populares",
        titulo: "Destaque pacotes com melhor margem",
        descricao: `${pacotesPopulares.length} pacote(s) com alta demanda e boa margem.`,
        potencial_receita: "Aumento de 15-20% em ticket médio",
        pacotes: pacotesPopulares,
      });
    }

    // Oportunidade 3: Upsell para clientes
    const clientesComPotencial = this.identificarClientesComPotencial();
    if (clientesComPotencial.length > 0) {
      oportunidades.push({
        tipo: "upsell_clientes",
        titulo: "Clientes com potencial de aumento de gastos",
        descricao: `${clientesComPotencial.length} cliente(s) que podem comprar mais itens.`,
        potencial_receita: "Aumento de 10-15% por cliente",
        clientes: clientesComPotencial,
      });
    }

    return oportunidades;
  }

  /**
   * Encontra períodos ociosos
   */
  encontrarPeriodosOciosos() {
    const eventos = Storage.get("eventos") || [];
    const periodos = [];
    const hoje = new Date();

    for (let i = 0; i < 60; i += 7) {
      const dataInicio = new Date(hoje);
      dataInicio.setDate(dataInicio.getDate() + i);
      const dataFim = new Date(dataInicio);
      dataFim.setDate(dataFim.getDate() + 7);

      const eventosPerido = eventos.filter((e) => {
        const dataEvento = this.parseDataLocal(e.dataInicio);
        return dataEvento >= dataInicio && dataEvento <= dataFim && e.status !== "cancelado";
      });

      if (eventosPerido.length === 0) {
        periodos.push(dataInicio);
      }
    }

    return periodos;
  }

  /**
   * Identifica pacotes populares com boa margem
   */
  identificarPacotesPopulares() {
    const eventos = Storage.get("eventos") || [];
    const itens = Storage.get("itens") || [];
    const combinacoes = {};

    // Analisar combinações de itens mais frequentes
    eventos.forEach((evento) => {
      if (evento.itens && evento.itens.length > 1) {
        const chave = evento.itens
          .map((i) => i.itemId || i.id)
          .sort()
          .join(",");

        if (!combinacoes[chave]) {
          combinacoes[chave] = {
            frequencia: 0,
            itens: evento.itensAlugados,
            valorTotal: 0,
          };
        }

        combinacoes[chave].frequencia++;
        combinacoes[chave].valorTotal += evento.valorTotal || 0;
      }
    });

    // Filtrar pacotes populares
    return Object.values(combinacoes)
      .filter((c) => c.frequencia >= 2)
      .map((c) => ({
        itens_quantidade: c.itens.length,
        frequencia: c.frequencia,
        valor_medio: Math.round(c.valorTotal / c.frequencia),
        margem_estimada: "35-45%",
      }))
      .slice(0, 5);
  }

  /**
   * Identifica clientes com potencial de upsell
   */
  identificarClientesComPotencial() {
    const clientes = Storage.get("clientes") || [];
    const eventos = Storage.get("eventos") || [];
    const potenciais = [];

    clientes.forEach((cliente) => {
      const eventosCliente = eventos.filter(
        (e) => e.clienteId === cliente.id && e.status !== "cancelado"
      );

      const totalGasto = eventosCliente.reduce((sum, e) => sum + (e.valorTotal || 0), 0);
      const mediaGasto = totalGasto / Math.max(1, eventosCliente.length);

      // Cliente com histórico bom e potencial para gastar mais
      if (eventosCliente.length >= 2 && mediaGasto < 500) {
        potenciais.push({
          nome: cliente.nome,
          eventos_total: eventosCliente.length,
          total_gasto: totalGasto,
          media_gasto: Math.round(mediaGasto),
          potencial_aumento: Math.round(mediaGasto * 1.3) - Math.round(mediaGasto),
        });
      }
    });

    return potenciais.sort((a, b) => b.potencial_aumento - a.potencial_aumento).slice(0, 5);
  }

  /**
   * Análise detalhada de cliente
   */
  analisarCliente(clienteId) {
    const cliente = Storage.get("clientes")?.find((c) => c.id === clienteId);
    const eventos = Storage.get("eventos") || [];
    const transacoes = Storage.get("financeiroTransacoes") || [];

    if (!cliente) return null;

    const eventosCliente = eventos.filter((e) => e.clienteId === clienteId);
    const transacoesCliente = transacoes.filter((t) => t.clienteId === clienteId);

    const totalGasto = eventosCliente.reduce((sum, e) => sum + (e.valorTotal || 0), 0);
    const totalPago = transacoesCliente
      .filter((t) => t.status === "pago")
      .reduce((sum, t) => sum + t.valor, 0);

    const risco = this.financialPredictor.analisarRiscoInadimplencia(clienteId);

    return {
      cliente: cliente.nome,
      eventos_total: eventosCliente.length,
      total_gasto: totalGasto,
      total_pago: totalPago,
      pendente: totalGasto - totalPago,
      media_por_evento: Math.round(totalGasto / Math.max(1, eventosCliente.length)),
      ultimo_evento: eventosCliente.length > 0
        ? DateUtils.formatDate(this.parseDataLocal(eventosCliente[eventosCliente.length - 1].dataInicio))
        : "Nenhum",
      risco_inadimplencia: risco.nivel,
      score_risco: risco.score,
      status_pagamentos: {
        pagos: transacoesCliente.filter((t) => t.status === "pago").length,
        atrasados: transacoesCliente.filter((t) => t.status === "atrasado").length,
        pendentes: transacoesCliente.filter((t) => t.status === "pendente").length,
      },
      recomendacoes: this.gerarRecomendacoesCliente(cliente.id, risco),
    };
  }

  /**
   * Gera recomendações específicas para cliente
   */
  gerarRecomendacoesCliente(clienteId, risco) {
    const recomendacoes = [];

    if (risco.score >= 70) {
      recomendacoes.push("Solicitar pagamento antecipado para próximos eventos");
      recomendacoes.push("Considerar aumento de entrada (sinal)");
      recomendacoes.push("Acompanhamento mais frequente de pagamentos");
    }

    if (risco.score >= 40 && risco.score < 70) {
      recomendacoes.push("Monitorar histórico de pagamentos");
      recomendacoes.push("Oferecer descontos para pagamento à vista");
    }

    if (risco.score < 40) {
      recomendacoes.push("Cliente com bom perfil - oferecer pacotes premium");
      recomendacoes.push("Considerar programa de fidelização");
    }

    return recomendacoes;
  }

  /**
   * Retorna mes anterior
   */
  obterMesAnterior(mesAtual) {
    if (mesAtual.mes === 1) {
      return { mes: 12, ano: mesAtual.ano - 1 };
    }
    return { mes: mesAtual.mes - 1, ano: mesAtual.ano };
  }

  /**
   * Parse de data
   */
  parseDataLocal(isoDateStr) {
    if (isoDateStr instanceof Date) return isoDateStr;
    const [ano, mes, dia] = isoDateStr.split("-").map(Number);
    return new Date(ano, mes - 1, dia);
  }

  /**
   * Exibe relatório de análise financeira
   */
  exibirRelatorioFinanceiro() {
    const relatorio = this.obterDashboardFinanceiro();

    let html = `
      <div class="card mb-4">
        <div class="card-header bg-primary text-white">
          <h5 class="mb-0">📊 Análise Financeira Inteligente</h5>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-md-6">
              <h6>Receita do Mês Atual</h6>
              <p class="fs-5 text-primary">${relatorio.mes_atual.receita_formatada}</p>
              <small>${relatorio.mes_atual.eventos.total} evento(s) agendado(s)</small>
            </div>
            <div class="col-md-6">
              <h6>Ticket Médio</h6>
              <p class="fs-5 text-success">R$ ${Math.round(relatorio.mes_atual.ticket_medio).toFixed(2)}</p>
              <small>Valor médio por evento</small>
            </div>
          </div>
        </div>
      </div>
    `;

    // Alertas
    if (relatorio.alertas.length > 0) {
      html += `
        <div class="card mb-4">
          <div class="card-header bg-warning">
            <h6 class="mb-0">⚠️ Alertas Financeiros</h6>
          </div>
          <div class="card-body">
      `;

      relatorio.alertas.forEach((alerta) => {
        html += `<div class="alert alert-${alerta.nivel} mb-2">${alerta.mensagem}</div>`;
      });

      html += `</div></div>`;
    }

    // Clientes em risco
    if (relatorio.analise_clientes_risco.length > 0) {
      html += `
        <div class="card mb-4">
          <div class="card-header bg-danger text-white">
            <h6 class="mb-0">🔴 Clientes em Risco de Inadimplência</h6>
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Score Risco</th>
                    <th>Nível</th>
                    <th>Atrasos</th>
                  </tr>
                </thead>
                <tbody>
      `;

      relatorio.analise_clientes_risco.forEach((cliente) => {
        const nivelClass = cliente.nivel === "Alto" ? "danger" : cliente.nivel === "Médio" ? "warning" : "success";
        html += `
          <tr>
            <td>${cliente.cliente}</td>
            <td><span class="badge bg-${nivelClass}">${cliente.score}</span></td>
            <td>${cliente.nivel}</td>
            <td>${cliente.atrasos}</td>
          </tr>
        `;
      });

      html += `
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    }

    // Oportunidades
    if (relatorio.oportunidades.length > 0) {
      html += `
        <div class="card mb-4">
          <div class="card-header bg-success text-white">
            <h6 class="mb-0">💡 Oportunidades de Receita</h6>
          </div>
          <div class="card-body">
      `;

      relatorio.oportunidades.forEach((opp) => {
        html += `
          <div class="alert alert-info mb-2">
            <strong>${opp.titulo}</strong><br>
            <small>${opp.descricao}</small><br>
            <em>Potencial: ${opp.potencial_receita}</em>
          </div>
        `;
      });

      html += `</div></div>`;
    }

    return html;
  }
}

// Instanciar globalmente
let assistenteFinanceiro = null;

document.addEventListener("DOMContentLoaded", () => {
  if (typeof FinancialPredictor !== "undefined") {
    assistenteFinanceiro = new AssistenteFinanceiro();
    console.log("✅ Assistente Financeiro Inteligente carregado!");
  }
});

// Exportar para uso global
window.AssistenteFinanceiro = AssistenteFinanceiro;
window.assistenteFinanceiro = assistenteFinanceiro;
