# ✅ Plano de Testes e Validação - Sistema IA

## 1. TESTES DO DETECTOR DE CONFLITOS

### Teste 1.1: Detecção de Sobreposição Simples
```javascript
// No console do navegador:

// Criar evento de teste
const evento1 = {
  id: 1,
  cliente: "João",
  dataInicio: "2026-01-20",
  dataFim: "2026-01-20",
  itensAlugados: [{ itemId: "item1", quantidade: 1 }],
  status: "confirmado"
};

const evento2 = {
  id: 2,
  cliente: "Maria",
  dataInicio: "2026-01-20",
  dataFim: "2026-01-20",
  itensAlugados: [{ itemId: "item1", quantidade: 1 }],
  status: "confirmado"
};

// Testar detector
iaEngine.conflictDetector.verificarConflitos(evento2, [evento1]);

// ✅ Esperado: temConflitos: true, com mensagem de conflito
```

### Teste 1.2: Detecção de Item Indisponível
```javascript
// Mesmo cenário, mas verificando quantidade de itens

const evento3 = {
  id: 3,
  cliente: "Pedro",
  dataInicio: "2026-01-20",
  dataFim: "2026-01-20",
  itensAlugados: [{ itemId: "item1", quantidade: 5 }], // Mais quantidade
  status: "confirmado"
};

iaEngine.conflictDetector.verificarConflitos(evento3, [evento1, evento2]);

// ✅ Esperado: temConflitos: true, tipo: "item_indisponivel"
```

### Teste 1.3: Sem Conflitos
```javascript
const evento4 = {
  id: 4,
  cliente: "Ana",
  dataInicio: "2026-01-21", // Dia diferente
  dataFim: "2026-01-21",
  itensAlugados: [{ itemId: "item1", quantidade: 1 }],
  status: "confirmado"
};

iaEngine.conflictDetector.verificarConflitos(evento4, [evento1]);

// ✅ Esperado: temConflitos: false, podeAgendar: true
```

---

## 2. TESTES DO ANALISADOR DE DISPONIBILIDADE

### Teste 2.1: Disponibilidade Total
```javascript
// Analisar disponibilidade em período sem eventos
const disponibilidade = iaEngine.availabilityAnalyzer.analisarDisponibilidadeItens(
  "2026-02-01",
  "2026-02-07" // Semana limpa
);

console.log(disponibilidade);

// ✅ Esperado: Todos os itens com 100% de disponibilidade
```

### Teste 2.2: Disponibilidade Parcial
```javascript
// Com eventos no período
const disponibilidadeParcial = iaEngine.availabilityAnalyzer.analisarDisponibilidadeItens(
  "2026-01-19", // Período com eventos
  "2026-01-21"
);

// ✅ Esperado: Alguns itens com disponibilidade < 100%
```

### Teste 2.3: Recomendação de Substituição
```javascript
// Se item não está disponível, sugerir similar
const itemIndisponivel = Storage.get("itens")[0];
const substituicoes = iaEngine.availabilityAnalyzer.recomendarSubstituicoes(
  itemIndisponivel,
  2 // quantidade necessária
);

// ✅ Esperado: Array com itens similares disponíveis
```

---

## 3. TESTES DO PREDITOR FINANCEIRO

### Teste 3.1: Previsão de Receita Mês Atual
```javascript
const receita = iaEngine.financialPredictor.preverReceita({
  mes: 1,
  ano: 2026
});

console.log(receita);

// ✅ Esperado: 
// {
//   receita: number,
//   eventos: { total, confirmados, pendentes },
//   ticket_medio: number,
//   confiabilidade: string
// }
```

### Teste 3.2: Análise de Risco por Cliente
```javascript
// Obter ID de um cliente existente
const clienteId = Storage.get("clientes")[0]?.id;

const risco = iaEngine.financialPredictor.analisarRiscoInadimplencia(clienteId);

console.log(risco);

// ✅ Esperado: 
// {
//   cliente: string,
//   score: number (0-100),
//   nivel: "Alto"|"Médio"|"Baixo",
//   recomendacao: string
// }
```

### Teste 3.3: Alertas Financeiros
```javascript
const alertas = assistenteFinanceiro.gerarAlertasFinanceiros();

// ✅ Esperado: Array com alertas relevantes
```

---

## 4. TESTES DO MOTOR DE RECOMENDAÇÕES

### Teste 4.1: Recomendação de Itens
```javascript
const recomendacoes = iaEngine.recommendationEngine.recomendarItens(
  "aniversario", // tipo evento
  15, // quantidade de crianças
  "salão" // local
);

// ✅ Esperado: Array com itens recomendados ordenados por score
```

### Teste 4.2: Recomendação de Pacotes
```javascript
const pacotes = iaEngine.recommendationEngine.recomendarPacotes("festa");

// ✅ Esperado: Array com pacotes populares para este tipo
```

---

## 5. TESTES DO ANALISADOR DE RISCO

### Teste 5.1: Análise de Risco Completa
```javascript
const evento = Storage.get("eventos")[0];

const analiseRisco = iaEngine.riskAnalyzer.analisarRisco(evento);

// ✅ Esperado:
// {
//   temRiscos: boolean,
//   riscos: array,
//   nivelRiscoGeral: "Baixo"|"Médio"|"Alto"
// }
```

---

## 6. TESTES DO ASSISTENTE DE CALENDÁRIO

### Teste 6.1: Validação de Agendamento
```javascript
const evento = {
  id: 999,
  cliente: "Teste",
  dataInicio: "2026-01-25",
  dataFim: "2026-01-25",
  itensAlugados: [{ itemId: "item1", quantidade: 1 }],
  tipoEvento: "aniversario",
  quantidadePessoas: 20
};

const validacao = calendarioAssistente.validarAgendamento(evento);

console.log(validacao);

// ✅ Esperado:
// {
//   valido: boolean,
//   conflitos: array,
//   avisos: array,
//   sugestoes: array
// }
```

### Teste 6.2: Encontrar Melhor Horário
```javascript
const horarios = calendarioAssistente.encontrarMelhorHorario(
  new Date("2026-01-25")
);

// ✅ Esperado: Array com horários disponíveis ordenados por qualidade
```

### Teste 6.3: Análise de Disponibilidade de Período
```javascript
const disponibilidade = calendarioAssistente.analisarDisponibilidadePeriodo(
  new Date("2026-01-15"),
  new Date("2026-01-31")
);

// ✅ Esperado:
// {
//   diasTotais: number,
//   diasDisponiveis: number,
//   diasOcupados: number,
//   percentualDisponibilidade: number,
//   detalhes: array
// }
```

---

## 7. TESTES DO ASSISTENTE FINANCEIRO

### Teste 7.1: Dashboard Financeiro Completo
```javascript
const dashboard = assistenteFinanceiro.obterDashboardFinanceiro();

console.log(dashboard);

// ✅ Esperado: Objeto com análise completa de finanças
```

### Teste 7.2: Análise de Cliente Detalhada
```javascript
const clienteId = Storage.get("clientes")[0]?.id;

const analiseCliente = assistenteFinanceiro.analisarCliente(clienteId);

// ✅ Esperado: Análise completa com histórico e recomendações
```

### Teste 7.3: Identificação de Oportunidades
```javascript
const oportunidades = assistenteFinanceiro.identificarOportunidades();

// ✅ Esperado: Array com oportunidades de receita
```

---

## 8. TESTES DE INTEGRAÇÃO

### Teste 8.1: Fluxo Completo de Agendamento
```
1. Usuário acessa formulário de novo evento
2. Sistema IA sugere itens complementares
3. Usuário seleciona data
4. Sistema mostra horários disponíveis
5. Sistema detecta conflitos (se houver)
6. Sistema propõe datas alternativas (se houver conflito)
7. Usuário confirma
8. Sistema valida uma última vez
9. Evento é salvo com IA ativa
10. Dashboard mostra previsão atualizada
```

### Teste 8.2: Notificações Automáticas
```
1. Configurar sistema para monitorar alertas
2. Criar evento para daqui a 7 dias
3. Esperar próxima verificação (a cada minuto)
4. Validar se alerta é gerado
5. Criar evento para amanhã
6. Validar alerta de evento próximo
```

---

## 9. CHECKLIST DE FUNCIONALIDADES

### Detector de Conflitos
- [ ] Detecta sobreposição de datas
- [ ] Detecta item indisponível
- [ ] Sugere datas alternativas
- [ ] Funciona com eventos cancelados (ignora)
- [ ] Mostra mensagens claras ao usuário

### Disponibilidade
- [ ] Mostra % de disponibilidade por item
- [ ] Recomenda substituições
- [ ] Funciona em período
- [ ] Calcula período de buffer corretamente

### Financeiro
- [ ] Prevê receita do mês
- [ ] Calcula ticket médio
- [ ] Detecta risco de inadimplência
- [ ] Gera alertas relevantes
- [ ] Identifica oportunidades

### Recomendações
- [ ] Recomenda itens por tipo de evento
- [ ] Recomenda pacotes populares
- [ ] Ordena por relevância/score
- [ ] Funciona com histórico vazio

### Calendário
- [ ] Valida agendamento
- [ ] Sugere horários
- [ ] Analisa ocupação
- [ ] Encontra períodos ociosos

---

## 10. TESTES DE PERFORMANCE

### Teste 10.1: Com 100 Eventos
```javascript
// Criar 100 eventos de teste e medir tempo

console.time("verificarConflitos");
iaEngine.conflictDetector.verificarConflitos(novoEvento, 100eventos);
console.timeEnd("verificarConflitos");

// ✅ Esperado: < 100ms
```

### Teste 10.2: Análise Completa
```javascript
console.time("dashboardCompleto");
assistenteFinanceiro.obterDashboardFinanceiro();
console.timeEnd("dashboardCompleto");

// ✅ Esperado: < 500ms
```

---

## 11. RELATÓRIO DE BUGS ENCONTRADOS

Use este template para reportar bugs:

```
**Bug #001**
- **Descrição**: Descrição do problema
- **Como reproduzir**: Passos para reproduzir
- **Esperado**: O que deveria acontecer
- **Atual**: O que realmente acontece
- **Teste**: 
- **Severidade**: Baixa | Média | Alta | Crítica
```

---

## 12. MÉTRICAS DE SUCESSO

| Métrica | Meta | Atual |
|---------|------|-------|
| Tempo de resposta IA | < 200ms | _____ |
| Precisão de conflitos | 100% | _____ |
| Satisfação com recomendações | 80%+ | _____ |
| Redução de erros de booking | 50%+ | _____ |
| Aumento de receita (recomendações) | 10%+ | _____ |
| Taxa de aceitação de sugestões | 40%+ | _____ |

---

## 13. COMANDOS ÚTEIS PARA TESTES

```javascript
// Limpar todos os dados e começar do zero
Storage.resetAll();

// Popular com dados de teste
popularSistema();

// Ver dados brutos
console.log("Clientes:", Storage.get("clientes"));
console.log("Eventos:", Storage.get("eventos"));
console.log("Itens:", Storage.get("itens"));

// Testar IA sem dados
iaEngine.conflictDetector.verificarConflitos({}, []);

// Ver todos os alertas
iaEngine.notificationSystem.verificarAlertasPendentes();

// Análise rápida de todos os clientes
Storage.get("clientes").forEach(c => {
  console.log(
    c.nome, 
    assistenteFinanceiro.financialPredictor.analisarRiscoInadimplencia(c.id)
  );
});
```

---

## 14. CHECKLIST FINAL ANTES DE PRODUÇÃO

- [ ] Todos os testes passaram
- [ ] Nenhum erro no console
- [ ] Performance aceitável (< 500ms)
- [ ] Sugestões são relevantes
- [ ] Alertas funcionam
- [ ] Interface é clara
- [ ] Documentação está atualizada
- [ ] Usuários conseguem entender as recomendações
- [ ] Sistema funciona offline
- [ ] Dados são salvos corretamente

