# 📚 GUIA DE REFERÊNCIA RÁPIDA - IA INTEGRADA

## Onde está cada funcionalidade IA?

---

## 🎯 Detector de Conflitos

**Arquivo**: `assets/js/eventos.js`
**Linhas**: 397-430
**Ativa quando**: Usuário clica SALVAR em novo/editar evento

```javascript
// Uso:
iaEngine.conflictDetector.verificarConflitos(eventoData, eventosExistentes)
// Retorna: [{ descricao: "...", tipo: "..." }, ...]

// Exibição:
- Alert com conflitos
- Sugestões de datas
- Opção de continuar ou cancelar
```

---

## 💰 Análise de Risco Financeiro

**Arquivo**: `assets/js/eventos.js` + `assets/js/clientes.js`
**Linhas (eventos)**: 431-455
**Linhas (clientes)**: 198-223, 225-248
**Ativa quando**: Usuário salva evento/cliente

```javascript
// Uso:
assistenteFinanceiro.analisarCliente(cliente, eventos)
// Retorna: { risco_inadimplencia: "Alto|Médio|Baixo", score: 0-100, descricao: "..." }

// Exibição:
- Alert de risco
- Badge na tabela de clientes
- Alerta no Dashboard
```

---

## 🎁 Recomendações de Itens

**Arquivo**: `assets/js/eventos.js`
**Linhas (addEvento)**: 683-705
**Linhas (updateEvento)**: 717-739
**Linhas (renderização)**: 165-178
**Ativa quando**: Evento é salvo

```javascript
// Uso:
iaEngine.recommendationEngine.recomendarItens(evento, historico, itens)
// Retorna: ["Adicionar X", "Considerar Y", ...]

// Armazenamento:
evento._recomendacoes_ia = [...]

// Exibição:
- Badge "💡 SUGESTÕES IA" na card
- Lista de recomendações
```

---

## 📅 Análise Diária (Calendário)

**Arquivo**: `assets/js/calendario.js`
**Linhas**: 178-203 (integração) + 377-414 (método)
**Ativa quando**: Usuário clica em dia com eventos

```javascript
// Método:
renderAnaliseIADia(events, dateString)

// Análise:
iaEngine.availabilityAnalyzer.analisarDisponibilidadesDia(events)

// Retorna:
{ alertas: [{ descricao: "...", severidade: "alta|média" }, ...] }

// Exibição:
- Painel 📊 com alertas
- Severidade com cores
- Apenas se houver alertas
```

---

## 🤖 Dashboard de Alertas

**Arquivo**: `assets/js/dashboard.js`
**Linhas**: 134-141 (integração) + 1810-1880 (método)
**Ativa quando**: Dashboard é renderizado

```javascript
// Método:
renderAlertsIADashboard()

// Análises combinadas:
1. Conflitos: iaEngine.conflictDetector
2. Risco: assistenteFinanceiro.analisarCliente()
3. Disponibilidade: iaEngine.availabilityAnalyzer

// Exibição:
- Card com 🤖 em amarelo
- Alertas por severidade
- Apenas se houver alertas
```

---

## 👥 Score de Risco (Clientes)

**Arquivo**: `assets/js/clientes.js`
**Linhas**: 67-90 (renderização) + 198-223 (add) + 225-248 (update)
**Ativa quando**: Cliente é salvo ou tabela é renderizada

```javascript
// Cálculo:
assistenteFinanceiro.analisarCliente(cliente, eventos)

// Armazenamento:
cliente._analise_ia = {
  risco: "Alto|Médio|Baixo",
  pontuacao: 0-100,
  timestamp: "2024-01-15T10:30:00Z"
}

// Exibição:
- Badge ao lado do nome
- Cores: Verde (baixo), Amarelo (médio), Vermelho (alto)
- No render da tabela
```

---

## 🔄 Sistema de Sincronização

**Arquivo**: Todos os módulos
**Como funciona**:

```javascript
// Quando dados são salvos:
Storage.save("eventos", eventos)

// Dispara evento global:
window.dispatchEvent(new CustomEvent('storageUpdate', {
  detail: { key: 'eventos' }
}))

// Todos os módulos escutam:
window.addEventListener('storageUpdate', (e) => {
  if (e.detail.key === 'eventos') {
    this.sync()
    this.render()
  }
})

// Resultado: Atualização em tempo real
```

---

## 📊 Objetos IA Globais

```javascript
// Carregados em index.html antes dos módulos

// 1. Motor principal IA
iaEngine {
  conflictDetector: ConflictDetector
  availabilityAnalyzer: AvailabilityAnalyzer
  recommendationEngine: RecommendationEngine
  riskAnalyzer: RiskAnalyzer
  notificationSystem: NotificationSystem
  financialPredictor: FinancialPredictor
}

// 2. Assistente de calendário
calendarioAssistente {
  validarAgendamento()
  analisarCarregamentoHorario()
  sugerirHorariosAlternativos()
  ...
}

// 3. Assistente financeiro
assistenteFinanceiro {
  analisarCliente()
  calcularRiscoInadimplencia()
  previsaoFluxoCaixa()
  ...
}
```

---

## 🎨 Classes Principais

### ConflictDetector
```javascript
verificarConflitos(evento, eventosExistentes)
  → [{ descricao: string, tipo: string }, ...]

sugerirDatasAlternativas(evento, eventosExistentes)
  → [string, string, ...] // datas sugeridas
```

### AvailabilityAnalyzer
```javascript
analisarDisponibilidadesDia(events)
  → { alertas: [{ descricao, severidade }, ...] }

verificarDisponibilidade(items, data, hora)
  → boolean
```

### RecommendationEngine
```javascript
recomendarItens(evento, historico, itens)
  → [string, string, ...] // recomendações
```

### RiskAnalyzer
```javascript
avaliarRisco(cliente, eventos)
  → { score: number, nivel: string }
```

---

## 🔧 Como Adicionar Nova Integração IA

### Passo 1: Identificar ponto de integração
```javascript
// Onde o código é chamado?
// Ex: addEvento(), render(), submit handler
```

### Passo 2: Verificar se IA está carregada
```javascript
if (typeof iaEngine !== 'undefined' && iaEngine.funcaoDesejada) {
  // código IA
}
```

### Passo 3: Chamar método IA
```javascript
const resultado = iaEngine.modulo.metodo(dados)

// Tratar resultado
if (resultado) {
  // atualizar UI
}
```

### Passo 4: Armazenar se necessário
```javascript
evento._dados_ia = resultado
Storage.save("eventos", eventos)
```

### Passo 5: Renderizar
```javascript
// Exibir em HTML
${resultado ? `<div>...</div>` : ''}
```

---

## 🐛 Tratamento de Erros Padrão

```javascript
// Sempre usar este padrão:

if (typeof iaEngine !== 'undefined' && iaEngine.modulo) {
  try {
    const resultado = iaEngine.modulo.metodo(dados)
    if (resultado) {
      // processar
      console.log('✅ IA: operação bem-sucedida')
    }
  } catch (error) {
    console.error('❌ Erro IA:', error)
    // não bloqueia fluxo principal
  }
}
```

---

## 📈 Variáveis de Configuração

**Arquivo**: Dentro de cada classe IA em `ia-engine.js`

```javascript
// Exemplos (procure nos arquivos):

THRESHOLD_CONFLITO = 40 // minutos de buffer
THRESHOLD_DISPONIBILIDADE = 0.8 // 80% de uso é crítico
THRESHOLD_RISCO = 0.7 // score de risco alto
DIAS_ALTERNATIVAS = 30 // procura 30 dias à frente
```

---

## 📝 Checklist de Implementação

Ao adicionar nova integração IA:
- [ ] Verificação de `typeof iaEngine !== 'undefined'`
- [ ] Try-catch para erros
- [ ] Console.log com emoji (✅, ❌, 💡)
- [ ] Graceful degradation
- [ ] Dados armazenados com prefixo `_`
- [ ] Exibição visual apropriada
- [ ] Sincronização via StorageListener
- [ ] Testado em todos os cenários
- [ ] Documentado em comentário
- [ ] Sem quebra de layout

---

## 🚀 Performance Tips

```javascript
// ❌ NÃO FAÇA:
// 1. Chamadas IA em loops
events.forEach(e => {
  iaEngine.modulo.metodo(e) // ❌ Lento
})

// ✅ FAÇA:
// 1. Processar em batch
const resultados = events.map(e => 
  iaEngine.modulo.metodo(e)
)

// 2. Cache resultados
if (evento._resultado_ia) return evento._resultado_ia

// 3. Análises síncronas (já otimizadas)
```

---

## 📞 FAQ Desenvolvimento

**P: Onde adicionar nova integração?**
R: Procure por comentários `// ===== INTEGRAÇÃO IA =====`

**P: Como debugar IA?**
R: Console.log com 🎯, 💡, 🤖, ⚠️

**P: IA não funciona?**
R: Verificar se `iaEngine` está definido (F12 → Console)

**P: Performance ruim?**
R: Procurar por loops com chamadas IA

**P: Como testar offline?**
R: Tudo funciona offline (sem dependências externas)

---

## 🔐 Segurança

- ✅ Sem requisições HTTP
- ✅ Sem dados enviados para servidor
- ✅ Tudo processado localmente
- ✅ Dados armazenados em LocalStorage
- ✅ Sem dependências externas

---

## 📚 Arquivos Relacionados

```
DOCUMENTAÇÃO:
├── IMPLEMENTACAO_IA_COMPLETA.md (detalhado)
├── RESUMO_IMPLEMENTACAO_IA.md (executivo)
├── TESTE_RAPIDO_5MIN.md (teste rápido)
├── GUIA_REFERENCIA_RAPIDA.md (este arquivo)
└── TESTES_VALIDACAO_IA.md (testes completos)

CÓDIGO:
├── assets/js/ia-engine.js (motor principal)
├── assets/js/calendario-assistente.js (assistente)
├── assets/js/financeiro-assistente.js (assistente)
├── assets/js/eventos.js (integrado)
├── assets/js/calendario.js (integrado)
├── assets/js/dashboard.js (integrado)
└── assets/js/clientes.js (integrado)
```

---

**Versão**: 1.0
**Atualizado**: 2024
**Status**: ✅ Completo
