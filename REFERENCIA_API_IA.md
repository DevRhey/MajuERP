# 🚀 REFERÊNCIA RÁPIDA - API da IA

## Objetos Globais Disponíveis

```javascript
iaEngine                    // Motor central da IA
calendarioAssistente       // Assistente de agendamentos
assistenteFinanceiro       // Assistente financeiro
```

---

## 🔍 DETECTOR DE CONFLITOS

### Método Principal
```javascript
iaEngine.conflictDetector.verificarConflitos(evento, listaEventos)
```

### Exemplo
```javascript
const resultado = iaEngine.conflictDetector.verificarConflitos(
  {
    dataInicio: "2026-01-20",
    dataFim: "2026-01-20",
    itensAlugados: [{ itemId: "item1", quantidade: 1 }]
  },
  Storage.get("eventos")
);

// Retorna:
// {
//   temConflitos: true/false,
//   conflitos: [],
//   podeAgendar: true/false
// }
```

### Sugerir Datas Alternativas
```javascript
const alternativas = iaEngine.conflictDetector.sugerirDatasAlternativas(
  new Date("2026-01-20"),
  14 // dias para procurar
);
```

---

## 📊 ANALISADOR DE DISPONIBILIDADE

### Analisar Disponibilidade de Itens
```javascript
const disponibilidade = iaEngine.availabilityAnalyzer
  .analisarDisponibilidadeItens("2026-01-20", "2026-01-20");

// Retorna objeto com cada item e seu status
```

### Recomendar Substituições
```javascript
const substitutos = iaEngine.availabilityAnalyzer
  .recomendarSubstituicoes(itemIndisponivel, quantidade);
```

---

## 💰 PREDITOR FINANCEIRO

### Prever Receita
```javascript
const receita = iaEngine.financialPredictor.preverReceita({
  mes: 1,  // Janeiro
  ano: 2026
});

// Retorna: { receita, eventos, ticket_medio, confiabilidade }
```

### Analisar Risco de Cliente
```javascript
const risco = iaEngine.financialPredictor
  .analisarRiscoInadimplencia(clienteId);

// Retorna: { score (0-100), nivel, recomendacao, ... }
```

---

## 💡 MOTOR DE RECOMENDAÇÕES

### Recomendar Itens
```javascript
const itens = iaEngine.recommendationEngine.recomendarItens(
  "aniversario",  // tipo evento
  15,             // quantidade de pessoas
  "salão"         // local
);

// Retorna: array com itens recomendados ordenados por score
```

### Recomendar Pacotes
```javascript
const pacotes = iaEngine.recommendationEngine
  .recomendarPacotes("festa");

// Retorna: array com pacotes populares
```

---

## ⚠️ ANALISADOR DE RISCO

### Analisar Risco Completo
```javascript
const risco = iaEngine.riskAnalyzer.analisarRisco(evento);

// Retorna:
// {
//   temRiscos: true/false,
//   riscos: [ { tipo, score, mensagem, recomendacao } ],
//   nivelRiscoGeral: "Baixo"|"Médio"|"Alto"
// }
```

---

## 🔔 SISTEMA DE NOTIFICAÇÕES

### Verificar Alertas Pendentes
```javascript
const alertas = iaEngine.notificationSystem
  .verificarAlertasPendentes();

// Retorna array com alertas relevantes
```

---

## 📅 ASSISTENTE DE CALENDÁRIO

### Validar Agendamento
```javascript
const validacao = calendarioAssistente.validarAgendamento(evento);

// Retorna:
// {
//   valido: true/false,
//   conflitos: [],
//   avisos: [],
//   sugestoes: []
// }
```

### Encontrar Melhor Horário
```javascript
const horarios = calendarioAssistente
  .encontrarMelhorHorario(data, duracao = 4);

// Retorna: array com horários disponíveis ordenados por qualidade
```

### Analisar Disponibilidade de Período
```javascript
const analise = calendarioAssistente
  .analisarDisponibilidadePeriodo(dataInicio, dataFim);

// Retorna:
// {
//   diasTotais,
//   diasDisponiveis,
//   diasOcupados,
//   percentualDisponibilidade,
//   detalhes: []
// }
```

### Relatório de Ocupação do Mês
```javascript
const relatorio = calendarioAssistente
  .gerarRelatorioOcupacaoMes(mes, ano);

// Retorna: análise com recomendação
```

### Encontrar Períodos Ociosos
```javascript
const periodos = calendarioAssistente
  .encontrarPeriodomanutenção(diasMinimos = 2);

// Retorna: array com períodos disponíveis
```

---

## 💼 ASSISTENTE FINANCEIRO

### Dashboard Completo
```javascript
const dashboard = assistenteFinanceiro
  .obterDashboardFinanceiro();

// Retorna:
// {
//   mes_atual: { receita, eventos, ticket_medio },
//   mes_passado: {...},
//   proximos_30_dias: [...],
//   analise_clientes_risco: [...],
//   alertas: [...],
//   oportunidades: [...]
// }
```

### Análise de Cliente Detalhada
```javascript
const analise = assistenteFinanceiro
  .analisarCliente(clienteId);

// Retorna: análise completa com histórico e recomendações
```

### Identificar Oportunidades
```javascript
const oportunidades = assistenteFinanceiro
  .identificarOportunidades();

// Retorna: array com 3-4 oportunidades principais
```

---

## 🧪 TESTES RÁPIDOS NO CONSOLE

```javascript
// 1. Verificar se IA está carregada
iaEngine && console.log("✅ IA carregada");

// 2. Teste básico de conflitos
iaEngine.conflictDetector.verificarConflitos({}, []);

// 3. Teste de receita
iaEngine.financialPredictor.preverReceita({ mes: 1, ano: 2026 });

// 4. Teste de disponibilidade
iaEngine.availabilityAnalyzer
  .analisarDisponibilidadeItens("2026-01-20", "2026-01-20");

// 5. Teste de recomendação
iaEngine.recommendationEngine.recomendarItens("aniversario", 15, "salão");

// 6. Teste de risco
assistenteFinanceiro.analisarCliente(Storage.get("clientes")[0]?.id);

// 7. Ver alertas
iaEngine.notificationSystem.verificarAlertasPendentes();

// 8. Dashboard financeiro
assistenteFinanceiro.obterDashboardFinanceiro();
```

---

## 📊 PADRÃO DE RETORNO GERAL

Todos os métodos retornam objetos no padrão:

```javascript
{
  mensagem: "Descrição humana",
  sucesso: true/false,
  dados: { ... },
  avisos: ["Aviso 1", "Aviso 2"],
  recomendacao: "Ação sugerida"
}
```

---

## 🎯 FLUXO DE DECISÃO COMUM

```
Usuário toma ação
         ↓
IA valida (detecta problema?)
         ↓
    SIM → Mostrar alerta + sugestões + propor alternativa
    NÃO → Continuar
         ↓
IA recomenda
         ↓
  Mostrar sugestões inteligentes
         ↓
Usuário decide
         ↓
Salvar e atualizar dashboard
```

---

## 💻 INTEGRAÇÃO EM FUNÇÃO EXISTENTE

Padrão para integrar IA em funções existentes:

```javascript
function fazerAlgo() {
  // 1. Coletar dados
  const dados = coletarDados();
  
  // 2. USAR IA para validar
  if (iaEngine) {
    const validacao = iaEngine.modulo.metodo(dados);
    if (!validacao.valido) {
      UI.showAlert(validacao.mensagem, "warning");
      return;
    }
  }
  
  // 3. USAR IA para recomendar (opcional)
  if (calendarioAssistente) {
    const sugestoes = calendarioAssistente.gerarSugestoes(dados);
    exibirSugestoes(sugestoes);
  }
  
  // 4. Executar ação original
  fazerAcaoOriginal(dados);
}
```

---

## 🔧 DEBUGGING

```javascript
// Ver estado completo da IA
console.log({
  iaEngine,
  calendarioAssistente,
  assistenteFinanceiro
});

// Ver dados brutos
console.log("Eventos:", Storage.get("eventos"));
console.log("Clientes:", Storage.get("clientes"));
console.log("Itens:", Storage.get("itens"));

// Testar performance
console.time("operacao");
// ... código ...
console.timeEnd("operacao");

// Ver se há erros
console.error("Verificar console acima ^");
```

---

## 📋 CHECKLIST DE USO

Antes de integrar IA em qualquer lugar:

- [ ] Verifiquei se `iaEngine` está definido
- [ ] Testei o método no console
- [ ] Tratei casos de erro
- [ ] Mostro mensagem amigável ao usuário
- [ ] Ofereci alternativas (sugestões)
- [ ] Testei com dados reais
- [ ] Validei a performance

---

## ⚡ MÉTODOS MÁS USADOS

Top 5 métodos mais importantes:

1. `iaEngine.conflictDetector.verificarConflitos()` - Validar agendamento
2. `iaEngine.financialPredictor.preverReceita()` - Prever receita
3. `iaEngine.recommendationEngine.recomendarItens()` - Sugerir itens
4. `calendarioAssistente.validarAgendamento()` - Validação completa
5. `assistenteFinanceiro.analisarCliente()` - Análise de cliente

---

## 🎓 PARA APRENDER MAIS

- **ANALISE_IA.md** - Visão geral de todos os 6 módulos
- **GUIA_IMPLEMENTACAO_IA.md** - 10 exemplos práticos
- **ia-engine.js** - Código-fonte comentado
- **TESTES_VALIDACAO_IA.md** - Como testar

---

**Última atualização**: Janeiro 2026  
**Versão**: 1.0  
**Status**: Pronto para Produção ✅

