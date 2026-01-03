/**
 * Web Worker - Calendario Assistente
 * 
 * Executa análises de IA do calendário em background thread
 * Não bloqueia a main thread, resultado retorna via message passing
 */

// Cópia do ConflictDetector para o worker (necessário)
class ConflictDetector {
  verificarConflitos(evento, eventos) {
    const conflitos = [];
    const dataInicio = this.parseDataLocal(evento.dataInicio);
    const dataFim = this.parseDataLocal(evento.dataFim || evento.dataInicio);

    eventos.forEach((e) => {
      if (e.id === evento.id) return; // Ignorar a si mesmo
      
      const eDataInicio = this.parseDataLocal(e.dataInicio);
      const eDataFim = this.parseDataLocal(e.dataFim || e.dataInicio);

      // Verificar se há sobreposição
      if (dataInicio <= eDataFim && dataFim >= eDataInicio) {
        conflitos.push({
          id: e.id,
          titulo: e.titulo,
          dataInicio: e.dataInicio,
          dataFim: e.dataFim,
          clienteId: e.clienteId,
          status: e.status,
        });
      }
    });

    return {
      temConflitos: conflitos.length > 0,
      podeAgendar: conflitos.length === 0,
      conflitos: conflitos,
    };
  }

  sugerirDatasAlternativas(dataDesejada, dias = 14) {
    const alternativas = [];
    const dataAtual = new Date(dataDesejada);

    for (let i = 1; i <= dias; i++) {
      const proximaData = new Date(dataAtual);
      proximaData.setDate(proximaData.getDate() + i);

      // Formatar para ISO string
      const ano = proximaData.getFullYear();
      const mes = String(proximaData.getMonth() + 1).padStart(2, '0');
      const dia = String(proximaData.getDate()).padStart(2, '0');

      alternativas.push(`${ano}-${mes}-${dia}`);
    }

    return alternativas;
  }

  parseDataLocal(isoDateStr) {
    const [ano, mes, dia] = isoDateStr.split("-").map(Number);
    return new Date(ano, mes - 1, dia);
  }
}

class AvailabilityAnalyzer {
  analisarDisponibilidade(evento, eventos) {
    const dataEvento = this.parseDataLocal(evento.dataInicio);
    const eventosNaData = eventos.filter((e) => {
      const eData = this.parseDataLocal(e.dataInicio);
      return eData.toDateString() === dataEvento.toDateString() && e.status !== "cancelado";
    });

    return {
      disponivel: eventosNaData.length === 0,
      eventosNaData: eventosNaData.length,
      ocupacaoPercentual: Math.round((eventosNaData.length / 10) * 100),
    };
  }

  parseDataLocal(isoDateStr) {
    const [ano, mes, dia] = isoDateStr.split("-").map(Number);
    return new Date(ano, mes - 1, dia);
  }
}

class RecommendationEngine {
  recomendarItens(tipoEvento, quantidade, local) {
    const recomendacoes = {
      casamento: [
        { nome: "Mesas", estimativa: Math.ceil(quantidade / 6) },
        { nome: "Cadeiras", estimativa: quantidade },
        { nome: "Decoração", estimativa: 1 },
      ],
      corporativo: [
        { nome: "Projetor", estimativa: 1 },
        { nome: "Mesas", estimativa: Math.ceil(quantidade / 8) },
        { nome: "Cadeiras", estimativa: quantidade },
      ],
      infantil: [
        { nome: "Brinquedos", estimativa: 3 },
        { nome: "Mesas", estimativa: Math.ceil(quantidade / 5) },
        { nome: "Cadeiras", estimativa: quantidade },
      ],
    };

    return recomendacoes[tipoEvento] || recomendacoes.corporativo;
  }

  recomendarPacotes(tipoEvento) {
    const pacotes = {
      casamento: [
        { nome: "Pacote Clássico", itens: 8, valor: 2500 },
        { nome: "Pacote Luxo", itens: 15, valor: 5000 },
      ],
      corporativo: [
        { nome: "Pacote Básico", itens: 4, valor: 800 },
        { nome: "Pacote Premium", itens: 10, valor: 2000 },
      ],
      infantil: [
        { nome: "Pacote Diversão", itens: 6, valor: 600 },
        { nome: "Pacote Mega", itens: 12, valor: 1200 },
      ],
    };

    return pacotes[tipoEvento] || [];
  }
}

// Instância das classes IA
const conflictDetector = new ConflictDetector();
const availabilityAnalyzer = new AvailabilityAnalyzer();
const recommendationEngine = new RecommendationEngine();

/**
 * Analisa um evento e retorna insights
 */
function analisarEvento(evento, eventos) {
  const conflitos = conflictDetector.verificarConflitos(evento, eventos);
  const disponibilidade = availabilityAnalyzer.analisarDisponibilidade(evento, eventos);

  let sugestoes = [];

  if (conflitos.temConflitos) {
    const alternativas = conflictDetector.sugerirDatasAlternativas(
      conflictDetector.parseDataLocal(evento.dataInicio)
    );
    sugestoes.push({
      tipo: "data_alternativa",
      titulo: "Datas Alternativas Disponíveis",
      opcoes: alternativas.slice(0, 5),
    });
  }

  const itensRecomendados = recommendationEngine.recomendarItens(
    evento.tipoEvento || "geral",
    evento.quantidadePessoas || 10,
    evento.local || ""
  );

  if (itensRecomendados.length > 0) {
    sugestoes.push({
      tipo: "itens_recomendados",
      titulo: "Itens Frequentemente Alugados",
      itens: itensRecomendados,
    });
  }

  const pacotes = recommendationEngine.recomendarPacotes(evento.tipoEvento || "geral");
  if (pacotes.length > 0) {
    sugestoes.push({
      tipo: "pacotes",
      titulo: "Pacotes Populares",
      pacotes: pacotes,
    });
  }

  return {
    conflitos,
    disponibilidade,
    sugestoes,
    timestamp: Date.now(),
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
      case "analisarEvento":
        resultado = analisarEvento(payload.evento, payload.eventos);
        break;

      case "verificarConflitos":
        resultado = conflictDetector.verificarConflitos(
          payload.evento,
          payload.eventos
        );
        break;

      case "analisarDisponibilidade":
        resultado = availabilityAnalyzer.analisarDisponibilidade(
          payload.evento,
          payload.eventos
        );
        break;

      default:
        throw new Error(`Tipo de mensagem desconhecido: ${type}`);
    }

    // Enviar resultado de volta para main thread
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

console.log("🔄 Calendario Assistente Worker inicializado");
