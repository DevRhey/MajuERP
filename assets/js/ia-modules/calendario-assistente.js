// Assistente de Calendário Inteligente
// Integra IA para ajudar no agendamento e detectar conflitos

class CalendarioAssistente {
  constructor() {
    this.conflictDetector = new ConflictDetector();
    this.availabilityAnalyzer = new AvailabilityAnalyzer();
    this.recommendationEngine = new RecommendationEngine();
  }

  /**
   * Valida agendamento antes de confirmação
   */
  validarAgendamento(evento) {
    const eventos = Storage.get("eventos") || [];

    // Verificar conflitos
    const verificacao = this.conflictDetector.verificarConflitos(evento, eventos);

    return {
      valido: verificacao.podeAgendar,
      conflitos: verificacao.conflitos,
      avisos: this.gerarAvisos(evento),
      sugestoes: this.gerarSugestoes(evento, verificacao),
    };
  }

  /**
   * Gera sugestões inteligentes para o agendamento
   */
  gerarSugestoes(evento, verificacao) {
    const sugestoes = [];

    if (verificacao.temConflitos) {
      // Se há conflitos, sugerir datas alternativas
      const dataInicio = this.parseDataLocal(evento.dataInicio);
      const alternativas = this.conflictDetector.sugerirDatasAlternativas(dataInicio);

      sugestoes.push({
        tipo: "data_alternativa",
        titulo: "Datas Alternativas Disponíveis",
        opcoes: alternativas,
      });
    }

    // Sugerir itens complementares
    const itensRecomendados = this.recommendationEngine.recomendarItens(
      evento.tipoEvento || "geral",
      evento.quantidadePessoas || 10,
      evento.local || ""
    );

    if (itensRecomendados.length > 0) {
      sugestoes.push({
        tipo: "itens_recomendados",
        titulo: "Itens Frequentemente Alugados para Este Tipo de Evento",
        itens: itensRecomendados.slice(0, 3),
      });
    }

    // Sugerir pacotes
    const pacotes = this.recommendationEngine.recomendarPacotes(evento.tipoEvento || "geral");
    if (pacotes.length > 0) {
      sugestoes.push({
        tipo: "pacotes",
        titulo: "Pacotes Populares",
        pacotes: pacotes.slice(0, 2),
      });
    }

    return sugestoes;
  }

  /**
   * Gera avisos inteligentes
   */
  gerarAvisos(evento) {
    const avisos = [];
    const dataEvento = this.parseDataLocal(evento.dataInicio);
    const hoje = new Date();
    const diasAte = Math.floor((dataEvento - hoje) / (1000 * 60 * 60 * 24));

    // Aviso: agendamento muito próximo
    if (diasAte < 3 && diasAte > 0) {
      avisos.push({
        tipo: "prazo_curto",
        nivel: "warning",
        mensagem: "⚠️ Agendamento com prazo curto! Confirme disponibilidade de itens rapidamente.",
      });
    }

    // Aviso: data no passado
    if (diasAte < 0) {
      avisos.push({
        tipo: "data_passada",
        nivel: "danger",
        mensagem: "❌ Data do evento está no passado!",
      });
    }

    // Aviso: sem itens selecionados
    if (!evento.itens || evento.itens.length === 0) {
      avisos.push({
        tipo: "sem_itens",
        nivel: "info",
        mensagem: "ℹ️ Nenhum item selecionado. Considere adicionar itens ao evento.",
      });
    }

    // Aviso: sem pagamento definido
    if (!evento.valorTotal || evento.valorTotal === 0) {
      avisos.push({
        tipo: "valor_zero",
        nivel: "warning",
        mensagem: "⚠️ Valor do evento é zero. Verifique a configuração.",
      });
    }

    return avisos;
  }

  /**
   * Encontra o melhor horário para um evento
   */
  encontrarMelhorHorario(dataDesejada, duracao = 4) {
    const eventos = Storage.get("eventos") || [];
    const horarios = [];

    // Verificar cada faixa horária do dia
    const horas = [9, 10, 11, 14, 15, 16, 17, 18, 19];

    horas.forEach((hora) => {
      const horaInicio = new Date(dataDesejada);
      horaInicio.setHours(hora, 0, 0);

      const horaFim = new Date(horaInicio);
      horaFim.setHours(hora + duracao);

      const disponivel = !eventos.some((e) => {
        if (e.status === "cancelado") return false;
        return this.verificarSobreposicaoHora(horaInicio, horaFim, e);
      });

      if (disponivel) {
        horarios.push({
          hora: hora,
          descricao: `${hora.toString().padStart(2, "0")}:00 - ${(hora + duracao)
            .toString()
            .padStart(2, "0")}:00`,
          disponivel: true,
          score: this.calcularScoreHorario(hora),
        });
      }
    });

    return horarios.sort((a, b) => b.score - a.score);
  }

  /**
   * Calcula score de qualidade de um horário
   */
  calcularScoreHorario(hora) {
    // Horários com maior demanda têm score maior
    const horariosPopulares = [15, 16, 17]; // 3 PM, 4 PM, 5 PM
    return horariosPopulares.includes(hora) ? 90 : 70;
  }

  /**
   * Verifica sobreposição de horário
   */
  verificarSobreposicaoHora(horaInicio, horaFim, evento) {
    // Simplificado: compara apenas por data neste contexto
    const dataEvento = this.parseDataLocal(evento.dataInicio);
    const mesmaData =
      horaInicio.getFullYear() === dataEvento.getFullYear() &&
      horaInicio.getMonth() === dataEvento.getMonth() &&
      horaInicio.getDate() === dataEvento.getDate();

    return mesmaData;
  }

  /**
   * Analisa disponibilidade de um período
   */
  analisarDisponibilidadePeriodo(dataInicio, dataFim) {
    const resultado = {
      diasTotais: 0,
      diasDisponiveis: 0,
      diasOcupados: 0,
      percentualDisponibilidade: 0,
      detalhes: [],
    };

    const eventos = Storage.get("eventos") || [];
    let dataAtual = new Date(dataInicio);

    while (dataAtual <= dataFim) {
      resultado.diasTotais++;

      const ocupado = eventos.some(
        (e) =>
          this.isSameDay(this.parseDataLocal(e.dataInicio), dataAtual) &&
          e.status !== "cancelado"
      );

      if (ocupado) {
        resultado.diasOcupados++;
        resultado.detalhes.push({
          data: DateUtils.formatDate(dataAtual),
          status: "ocupado",
        });
      } else {
        resultado.diasDisponiveis++;
        resultado.detalhes.push({
          data: DateUtils.formatDate(dataAtual),
          status: "disponível",
        });
      }

      dataAtual.setDate(dataAtual.getDate() + 1);
    }

    resultado.percentualDisponibilidade = Math.round(
      (resultado.diasDisponiveis / resultado.diasTotais) * 100
    );

    return resultado;
  }

  /**
   * Gera relatório de ocupação do mês
   */
  gerarRelatorioOcupacaoMes(mes, ano) {
    const eventos = Storage.get("eventos") || [];
    const primeiroDia = new Date(ano, mes - 1, 1);
    const ultimoDia = new Date(ano, mes, 0);

    const analise = this.analisarDisponibilidadePeriodo(primeiroDia, ultimoDia);

    return {
      mes: new Date(ano, mes - 1).toLocaleString("pt-BR", { month: "long", year: "numeric" }),
      ...analise,
      recomendacao: this.gerarRecomendacaoOcupacao(analise),
    };
  }

  /**
   * Gera recomendação baseada em ocupação
   */
  gerarRecomendacaoOcupacao(analise) {
    const percentual = analise.percentualDisponibilidade;

    if (percentual >= 80) {
      return "✅ Mês com ótima disponibilidade! Pode oferecer promoções.";
    } else if (percentual >= 50) {
      return "⚠️ Mês com disponibilidade moderada. Aproveitar para manutenção.";
    } else if (percentual >= 20) {
      return "📈 Mês bastante ocupado! Considerar aumentar estoque.";
    } else {
      return "🔴 Mês quase lotado! Pouquíssima disponibilidade.";
    }
  }

  /**
   * Encontra períodos ociosos para manutenção/limpeza
   */
  encontrarPeriodomanutenção(diasMinimos = 2) {
    const eventos = Storage.get("eventos") || [];
    const periodosOciosos = [];
    const hoje = new Date();

    for (let i = 0; i < 180; i++) {
      const dataVerificar = new Date(hoje);
      dataVerificar.setDate(dataVerificar.getDate() + i);

      const temEvento = eventos.some(
        (e) =>
          this.isSameDay(this.parseDataLocal(e.dataInicio), dataVerificar) &&
          e.status !== "cancelado"
      );

      if (!temEvento) {
        if (periodosOciosos.length === 0 || !this.isSameDay(periodosOciosos[periodosOciosos.length - 1], new Date(dataVerificar.getTime() - 86400000))) {
          periodosOciosos.push({
            dataInicio: new Date(dataVerificar),
            dataFim: new Date(dataVerificar),
          });
        } else {
          // Estender período
          periodosOciosos[periodosOciosos.length - 1].dataFim = new Date(dataVerificar);
        }
      }
    }

    // Filtrar períodos com duração mínima
    return periodosOciosos
      .filter((p) => Math.floor((p.dataFim - p.dataInicio) / (1000 * 60 * 60 * 24)) >= diasMinimos)
      .slice(0, 5);
  }

  /**
   * Comparação de datas
   */
  isSameDay(date1, date2) {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
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
   * Exibe aviso de conflito para o usuário
   */
  mostrarAvisoConflito(validacao) {
    if (validacao.valido) {
      return UI.showAlert(
        "✅ Agendamento disponível! Nenhum conflito detectado.",
        "success"
      );
    }

    let mensagem = "❌ Conflitos detectados:\n\n";

    validacao.conflitos.forEach((conflito) => {
      mensagem += `• ${conflito.mensagem}\n`;
    });

    UI.showAlert(mensagem, "danger");

    // Mostrar avisos adicionais
    validacao.avisos.forEach((aviso) => {
      UI.showAlert(aviso.mensagem, aviso.nivel);
    });

    // Mostrar sugestões
    if (validacao.sugestoes.length > 0) {
      console.log("📋 Sugestões inteligentes:", validacao.sugestoes);
    }
  }
}

// Instanciar globalmente
let calendarioAssistente = null;

document.addEventListener("DOMContentLoaded", () => {
  if (typeof ConflictDetector !== "undefined") {
    calendarioAssistente = new CalendarioAssistente();
    console.log("✅ Assistente de Calendário Inteligente carregado!");
  }
});

// Exportar para uso global
window.CalendarioAssistente = CalendarioAssistente;
window.calendarioAssistente = calendarioAssistente;
