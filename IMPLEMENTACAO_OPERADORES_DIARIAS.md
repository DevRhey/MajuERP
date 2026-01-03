# 📋 SISTEMA DE GESTÃO DE OPERADORES/MONITORES

## Visão Geral

Sistema completo para gerenciar operadores/monitores que trabalham por diária em eventos de locação de brinquedos.

### Funcionalidades Principais

✅ **Gerenciamento de Operadores**
- CRUD (Criar, Editar, Deletar, Listar)
- Dados de contato (CPF, telefone, email)
- Especialidades (quais brinquedos pode supervisionar)
- Tipo de contrato (CLT ou PJ)

✅ **Controle de Diárias**
- Registrar diárias trabalhadas por evento
- Valor configurável por operador
- Histórico de trabalhos
- Ajustes (bônus, descontos)

✅ **Gestão de Pagamentos**
- Registrar pagamentos
- Pagar uma diária ou em lote
- Rastreamento de pendências
- Métodos de pagamento (dinheiro, transferência, cheque)

✅ **Relatórios**
- Relatório geral de operadores
- Total ganho vs pago
- Diárias pendentes
- Exportar para CSV/Excel

---

## PARTE 1: IMPLEMENTAÇÃO TÉCNICA

### 1.1 Incluir o módulo no HTML

```html
<!-- No arquivo index.html, após db.js e antes de app.js -->
<script src="assets/js/operadores.js"></script>
```

### 1.2 Estrutura de Dados

#### Operador (Objeto Principal)

```javascript
operador = {
  // Identificação
  id: 1672857600000,                      // Timestamp único
  nome: "João Silva",
  cpf: "123.456.789-00",
  telefone: "(11) 98765-4321",
  email: "joao@email.com",
  
  // Contrato
  diaria_valor: 150.00,                   // Quanto cobra por dia
  tipo_contrato: "pj",                    // 'clt' ou 'pj'
  especialidades: ["pula-pula", "castelo", "escorregador"],
  disponivel: true,
  
  // Histórico Financeiro
  total_diarias_trabalhadas: 12,
  total_ganho: 1800.00,                   // Tudo que deveria receber
  total_pago: 1650.00,                    // Tudo que já foi pago
  total_pendente: 150.00,                 // Ainda deve receber
  
  // Metadata
  data_cadastro: "2025-01-03T10:30:00Z",
  nota_interna: "Muito responsável, sempre chega no horário",
  documentos: ["url/cpf.pdf", "url/contrato.pdf"]
}
```

#### Diária (Trabalho Realizado)

```javascript
diaria = {
  id: 1672857700000,
  operador_id: 1672857600000,
  evento_id: 1672750000000,
  
  data: "2025-01-03T10:00:00Z",
  valor_diaria: 150.00,                   // Valor acordado
  valor_ajuste: 0,                        // Bônus (+) ou desconto (-)
  horas_trabalhadas: 1,                   // Informativo
  
  itens_supervisionados: [
    { item_id: 1, item_nome: "Pula-pula", inicio: "14:00", fim: "22:00" },
    { item_id: 2, item_nome: "Castelo", inicio: "14:00", fim: "22:00" }
  ],
  
  status: "pendente",                     // 'pendente' ou 'pago'
  
  // Quando foi pago
  data_pagamento: "2025-01-04T11:00:00Z",
  metodo_pagamento: "transferencia",      // dinheiro, transferencia, cheque
  comprovante: "url/comprovante.pdf",     // Comprovante de pagamento
  
  observacoes: "Trabalhou bem, cliente não reclamou"
}
```

---

## PARTE 2: API - COMO USAR

### 2.1 Inicializar o Módulo

```javascript
// Já é inicializado automaticamente
// Mas você pode forçar:
await operadoresService.inicializar();

// Listar todos os operadores carregados
console.log(operadoresService.listar());
```

### 2.2 Criar Novo Operador

```javascript
const novoOperador = await operadoresService.criar({
  nome: "João Silva",
  cpf: "123.456.789-00",
  telefone: "(11) 98765-4321",
  email: "joao@email.com",
  diaria_valor: 150.00,                   // Valor por dia
  tipo_contrato: "pj",                    // 'clt' ou 'pj'
  especialidades: ["pula-pula", "castelo"],
  nota_interna: "Muito responsável"
});

console.log(novoOperador);
// Retorna o operador com ID gerado automaticamente
```

### 2.3 Buscar Operador

```javascript
// Por ID
const operador = operadoresService.obter(1672857600000);

// Filtrar por critérios
const operadoresDisponiveis = operadoresService.filtrar({
  disponivel: true,
  especialidade: "pula-pula"
});

const operadoresPJ = operadoresService.filtrar({
  tipo_contrato: "pj"
});
```

### 2.4 Atualizar Operador

```javascript
await operadoresService.atualizar(operadorId, {
  diaria_valor: 160.00,      // Aumentar diária
  especialidades: ["pula-pula", "castelo", "escorregador"],
  disponivel: false          // Marcar como indisponível
});
```

### 2.5 Registrar uma Diária (Quando Evento Termina)

```javascript
// Quando o evento é finalizado, registrar que o operador trabalhou

const diaria = await operadoresService.registrarDiaria(
  operador_id,
  evento_id,
  {
    data: "2025-01-03",
    itens_supervisionados: [
      { item_id: 1, item_nome: "Pula-pula", inicio: "14:00", fim: "22:00" },
      { item_id: 2, item_nome: "Castelo", inicio: "14:00", fim: "22:00" }
    ],
    horas_trabalhadas: 1,
    valor_ajuste: 50,                     // Bônus por desempenho
    observacoes: "Cliente pediu pra aumentar o valor, aceitei cobrar +R$50"
  }
);

console.log(diaria);
// {
//   id: 1672857700000,
//   operador_id: ...,
//   evento_id: ...,
//   valor_diaria: 150,
//   valor_ajuste: 50,
//   total_trabalho: 200,
//   status: "pendente"
// }
```

### 2.6 Pagar uma Diária

```javascript
// Pagar uma diária específica
await operadoresService.pagarDiaria(
  diaria_id,
  "transferencia",  // Método: 'dinheiro', 'transferencia', 'cheque'
  "url/comprovante.pdf"  // Opcional
);
```

### 2.7 Pagar Múltiplas Diárias de Uma Vez

```javascript
// Pagar todas as diárias pendentes de um operador
const resultado = await operadoresService.pagarEmLote(
  operador_id,
  "transferencia"
);

console.log(resultado);
// {
//   sucesso: 5,
//   falhadas: 0,
//   total_pago: 750.00
// }
```

### 2.8 Ver Diárias de um Operador

```javascript
const diarias = operadoresService.obterDiarias(operador_id);

console.log(diarias);
// [
//   { id: 1, valor: 150, status: 'pago', data_pagamento: '2025-01-03' },
//   { id: 2, valor: 150, status: 'pendente', data_pagamento: null }
// ]
```

### 2.9 Ver Diárias Pendentes de Pagamento

```javascript
const pendentes = operadoresService.obterDiariasAtraso();

console.log(pendentes);
// Retorna todas as diárias de TODOS os operadores que ainda não foram pagas
```

### 2.10 Gerar Relatório

```javascript
const relatorio = operadoresService.gerarRelatorio({
  tipo_contrato: "pj"  // Opcional: filtrar
});

console.log(relatorio);
// {
//   total_operadores: 5,
//   total_pendente_geral: 300.00,
//   total_pago_geral: 4500.00,
//   detalhes: [
//     {
//       nome: "João",
//       diaria_valor: 150,
//       total_diarias: 12,
//       total_ganho: 1800,
//       total_pago: 1650,
//       total_pendente: 150,
//       percentual_pago: "91.7%"
//     }
//   ],
//   diariasPendentes: [
//     { operador: "João", valor: 150, data: "2025-01-03" }
//   ]
// }
```

### 2.11 Exportar para CSV

```javascript
const csv = operadoresService.exportarCSV();

// Salvar em arquivo
const blob = new Blob([csv], { type: 'text/csv' });
const url = URL.createObjectURL(blob);
const link = document.createElement('a');
link.href = url;
link.download = `operadores_${new Date().toISOString().split('T')[0]}.csv`;
link.click();
```

---

## PARTE 3: INTEGRAÇÃO COM EVENTOS

### 3.1 Estrutura do Evento Atualizada

```javascript
evento = {
  id: 1,
  nome: "Festa do João",
  cliente: { id: 1, nome: "Maria" },
  
  // ... campos existentes ...
  
  // NOVO: Operadores necessários
  operadores_necessarios: [
    {
      item_id: 1,                    // Qual brinquedo?
      item_nome: "Pula-pula",
      operador_id: 1672857600000,    // Qual operador?
      operador_nome: "João Silva",
      diaria_valor: 150.00,
      valor_ajuste: 0,               // Ajuste de preço (se houver)
      status_trabalho: "pendente"    // 'pendente', 'em_trabalho', 'concluido', 'pago'
    },
    {
      item_id: 2,
      item_nome: "Castelo",
      operador_id: 1672857700000,
      operador_nome: "Carlos Santos",
      diaria_valor: 180.00,
      valor_ajuste: 50,              // Cliente aceitou pagar R$ 50 a mais
      status_trabalho: "pago"
    }
  ],
  
  // Cálculos
  custo_operadores: 330.00,          // Total que será pago aos operadores
  custo_total: 1050.00,              // = valor_aluguel + custo_operadores
  margenm_liquida: 750.00            // valor - custo_operadores - custo_manutencao
}
```

### 3.2 Workflow de um Evento com Operadores

```
1. CRIAR EVENTO
   └─ Adicionar itens (brinquedos)
   
2. ATRIBUIR OPERADORES
   └─ Para cada item, escolher qual operador supervisionará
   └─ Confirmar valor da diária
   
3. EVENTO ACONTECE
   └─ Operador supervisiona seu brinquedo
   
4. FINALIZAR EVENTO
   └─ Sistema calcula automático:
      • Total que foi ganho com evento
      • Total que precisa pagar aos operadores
      • Se há lucro ou prejuízo
   └─ Registrar trabalho de cada operador
   
5. PAGAR OPERADORES
   └─ Ver lista de operadores com diárias pendentes
   └─ Marcar como pago quando transferência/dinheiro for realizada
   └─ Emitir comprovante/recibo
```

---

## PARTE 4: CASOS DE USO

### Caso 1: Evento Simples (1 Operador em 1 Brinquedo)

```javascript
// Evento de aniversário
const evento = {
  nome: "Aniversário do João",
  data: "2025-01-15",
  itens: [
    { id: 1, nome: "Pula-pula" }
  ],
  valor_aluguel: 300.00,
  
  // Atribuir operador
  operadores_necessarios: [
    {
      item_id: 1,
      operador_id: 123,  // João Silva
      diaria_valor: 150
    }
  ]
};

// Resultado:
// Valor cobrado do cliente: R$ 300
// Custo com operador: R$ 150
// Lucro: R$ 150
```

### Caso 2: Evento Grande (Múltiplos Operadores)

```javascript
const evento = {
  nome: "Festa na Creche",
  data: "2025-01-20",
  
  itens: [
    { id: 1, nome: "Pula-pula" },
    { id: 2, nome: "Castelo" },
    { id: 3, nome: "Escorregador" },
    { id: 4, nome: "Piscina de bolinhas" }
  ],
  
  valor_aluguel: 1200.00,  // Cobrado da creche
  
  operadores_necessarios: [
    { item_id: 1, operador_id: 123, diaria_valor: 150 },  // João
    { item_id: 2, operador_id: 456, diaria_valor: 150 },  // Carlos
    { item_id: 3, operador_id: 789, diaria_valor: 150 },  // Maria
    { item_id: 4, operador_id: 123, diaria_valor: 100 }   // João (brinquedo 2)
  ]
};

// Resultado:
// Valor cobrado: R$ 1.200
// Custo operadores: R$ 550 (150+150+150+100)
// Lucro: R$ 650

// Ao finalizar evento:
await operadoresService.registrarDiaria(123, evento.id, { ... });
await operadoresService.registrarDiaria(456, evento.id, { ... });
await operadoresService.registrarDiaria(789, evento.id, { ... });

// Cria 3 diárias no histórico de cada operador
```

### Caso 3: Bônus por Desempenho

```javascript
// Cliente pediu operador fazer extra
const diaria = await operadoresService.registrarDiaria(
  operador_id,
  evento_id,
  {
    itens_supervisionados: [...],
    valor_ajuste: 50  // Operador recebe R$ 150 + R$ 50 de bônus = R$ 200
  }
);

// Operador agora tem mais a receber
// João Silva: Total pendente aumenta para R$ 200 (neste evento)
```

---

## PARTE 5: DASHBOARD DE OPERADORES (UI)

### 5.1 Tela de Listagem

```
╔════════════════════════════════════════════════════════════╗
║ OPERADORES / MONITORES                                    ║
║ ┌──────────────────────────────────────────────────────┐  ║
║ │ [+ Novo Operador] [Pagar Diárias] [Exportar]        │  ║
║ └──────────────────────────────────────────────────────┘  ║
║                                                            ║
║ ╔═══════════════════════════════════════════════════╗    ║
║ ║ Nome        │ Diária │ Diárias │ Total   │ Pendente ║    ║
║ ║             │        │ Trabs   │ Ganho   │          ║    ║
║ ╠═══════════════════════════════════════════════════╣    ║
║ ║ João Silva  │ R$150  │ 12      │ R$1800  │ R$150   ║    ║
║ ║ Carlos      │ R$150  │ 8       │ R$1200  │ R$0     ║    ║
║ ║ Maria       │ R$180  │ 5       │ R$900   │ R$360   ║    ║
║ ║ Pedro       │ R$120  │ 15      │ R$1800  │ R$240   ║    ║
║ ╚═══════════════════════════════════════════════════╝    ║
║                                                            ║
║ RESUMO:                                                   ║
║ • Total operadores: 4                                    ║
║ • Total pendente: R$ 750                                 ║
║ • Total já pago: R$ 4.150                                ║
╚════════════════════════════════════════════════════════════╝
```

### 5.2 Modal de Novo Operador

```
╔════════════════════════════════════════════╗
║ NOVO OPERADOR                              ║
╠════════════════════════════════════════════╣
║                                            ║
║ Nome: [____________________________]        ║
║ CPF:  [______________] ✓                   ║
║ Tel:  [______________]                    ║
║ Email:[______________]                    ║
║                                            ║
║ Diária (R$): [______]                      ║
║ Tipo: ○ PJ   ○ CLT                         ║
║                                            ║
║ Especialidades:                            ║
║ ☑ Pula-pula    ☐ Castelo                   ║
║ ☑ Escorregador ☑ Piscina                   ║
║                                            ║
║ Anotações:                                 ║
║ [_______________________________]           ║
║ [_______________________________]           ║
║                                            ║
║ [Cancelar]            [Salvar Operador]   ║
╚════════════════════════════════════════════╝
```

### 5.3 Tela de Pagamento de Diárias

```
╔═════════════════════════════════════════════════╗
║ PAGAR DIÁRIAS DOS OPERADORES                   ║
╠═════════════════════════════════════════════════╣
║                                                ║
║ Filtro: ○ Todos  ○ Pendentes  ○ Pagos        ║
║         ○ João   ○ Carlos     ○ Maria         ║
║                                                ║
║ ╔══════════════════════════════════════════╗  ║
║ ║ Operador  │ Data     │ Valor  │ Status   ║  ║
║ ╠══════════════════════════════════════════╣  ║
║ ║ João      │ 01/01/25 │ R$150  │ Pendente ║  ║
║ ║ [x] Carlos│ 02/01/25 │ R$150  │ Pendente ║  ║
║ ║ [x] Maria │ 02/01/25 │ R$180  │ Pendente ║  ║
║ ║ Pedro     │ 03/01/25 │ R$120  │ Pendente ║  ║
║ ╚══════════════════════════════════════════╝  ║
║                                                ║
║ Total selecionado: R$ 330                     ║
║                                                ║
║ Método: ○ Dinheiro ○ Transferência ○ Cheque ║
║                                                ║
║ [Cancelar]           [Registrar Pagamento]    ║
╚═════════════════════════════════════════════════╝
```

---

## PARTE 6: INTEGRAÇÃO NO EVENTO

### 6.1 Adicionar Campo na Criação de Evento

```html
<!-- Em index.html, ao criar evento -->
<div class="modal" id="modalCriarEvento">
  <!-- Campos existentes -->
  ...
  
  <!-- NOVO: Seção de Operadores -->
  <h5>Operadores Necessários</h5>
  
  <div class="operadores-container" id="operadoresContainer">
    <!-- Gerado dinamicamente para cada item -->
  </div>
  
  <button onclick="adicionarLinhaOperador()" class="btn btn-sm btn-info">
    + Adicionar Operador a Item
  </button>
</div>
```

### 6.2 Script para Atribuir Operadores

```javascript
function adicionarLinhaOperador() {
  const html = `
    <div class="row mb-2 operador-linha">
      <div class="col-md-4">
        <label>Item:</label>
        <select class="form-control item-select" onchange="atualizarDiariaOperador()">
          <option value="">Escolher item...</option>
          ${eventoAtual.itens.map(item => 
            `<option value="${item.id}" data-item-nome="${item.nome}">
              ${item.nome}
            </option>`
          ).join('')}
        </select>
      </div>
      
      <div class="col-md-4">
        <label>Operador:</label>
        <select class="form-control operador-select" onchange="atualizarDiariaOperador()">
          <option value="">Escolher operador...</option>
          ${operadoresService.listar().map(op => 
            `<option value="${op.id}" data-diaria="${op.diaria_valor}">
              ${op.nome} (R$ ${op.diaria_valor.toFixed(2)}/dia)
            </option>`
          ).join('')}
        </select>
      </div>
      
      <div class="col-md-2">
        <label>Diária (R$):</label>
        <input type="number" class="form-control diaria-input" readonly>
      </div>
      
      <div class="col-md-2">
        <label>&nbsp;</label>
        <button onclick="removerLinhaOperador(this)" class="btn btn-danger btn-block">
          ✕
        </button>
      </div>
    </div>
  `;
  
  document.getElementById('operadoresContainer').insertAdjacentHTML('beforeend', html);
}

function atualizarDiariaOperador() {
  const linhas = document.querySelectorAll('.operador-linha');
  linhas.forEach(linha => {
    const select = linha.querySelector('.operador-select');
    const input = linha.querySelector('.diaria-input');
    
    const diaria = select.options[select.selectedIndex].dataset.diaria || 0;
    input.value = parseFloat(diaria).toFixed(2);
  });
}

function removerLinhaOperador(btn) {
  btn.closest('.operador-linha').remove();
}

function salvarOperadoresEvento() {
  const operadores = [];
  
  document.querySelectorAll('.operador-linha').forEach(linha => {
    const itemId = linha.querySelector('.item-select').value;
    const operadorId = linha.querySelector('.operador-select').value;
    const diaria = parseFloat(linha.querySelector('.diaria-input').value);
    
    if (itemId && operadorId) {
      operadores.push({
        item_id: parseInt(itemId),
        item_nome: linha.querySelector('.item-select').options[
          linha.querySelector('.item-select').selectedIndex
        ].text,
        operador_id: parseInt(operadorId),
        operador_nome: linha.querySelector('.operador-select').options[
          linha.querySelector('.operador-select').selectedIndex
        ].text,
        diaria_valor: diaria,
        valor_ajuste: 0,
        status_trabalho: 'pendente'
      });
    }
  });
  
  eventoAtual.operadores_necessarios = operadores;
  atualizarCustoEvento();
}

function atualizarCustoEvento() {
  const custoOperadores = (eventoAtual.operadores_necessarios || [])
    .reduce((sum, op) => sum + (op.diaria_valor + op.valor_ajuste), 0);
  
  eventoAtual.custo_operadores = custoOperadores;
  eventoAtual.custo_total = custoOperadores + (eventoAtual.valor_aluguel || 0);
  
  // Atualizar UI
  document.getElementById('custoOperadoresDisplay').textContent = 
    `R$ ${custoOperadores.toFixed(2)}`;
  document.getElementById('custoTotalDisplay').textContent = 
    `R$ ${eventoAtual.custo_total.toFixed(2)}`;
}
```

---

## PARTE 7: EXEMPLO COMPLETO

### Criar Operador

```javascript
// 1. Criar novo operador
const joao = await operadoresService.criar({
  nome: "João Silva",
  cpf: "123.456.789-00",
  telefone: "(11) 98765-4321",
  email: "joao@email.com",
  diaria_valor: 150.00,
  tipo_contrato: "pj",
  especialidades: ["pula-pula", "castelo"],
  nota_interna: "Responsável, chega no horário"
});

console.log("Operador criado:", joao);
// { id: 1672857600000, nome: "João Silva", ... }
```

### Criar Evento com Operador

```javascript
// 2. Criar evento
const evento = {
  id: 1672750000000,
  nome: "Aniversário do João",
  cliente: { id: 1, nome: "Maria" },
  data: "2025-01-15",
  hora: "14:00",
  valor_aluguel: 300.00,
  
  itens: [
    { id: 1, nome: "Pula-pula", valorDiaria: 150 }
  ],
  
  // 3. Atribuir operador
  operadores_necessarios: [
    {
      item_id: 1,
      operador_id: joao.id,
      operador_nome: joao.nome,
      diaria_valor: 150.00,
      valor_ajuste: 0
    }
  ]
};

// Salvar evento
await eventosService.salvar(evento);
```

### Finalizar Evento e Registrar Diária

```javascript
// 4. Quando evento termina, registrar diária
await operadoresService.registrarDiaria(
  joao.id,
  evento.id,
  {
    data: "2025-01-15",
    itens_supervisionados: [
      { item_id: 1, item_nome: "Pula-pula", inicio: "14:00", fim: "22:00" }
    ],
    horas_trabalhadas: 8,
    valor_ajuste: 0,
    observacoes: "Tudo correu bem"
  }
);

// Resultado:
// João agora tem +R$ 150 a receber
// Total pendente: R$ 150
// Total ganho: R$ 150
```

### Pagar Diária

```javascript
// 5. Registrar pagamento
const diarias = operadoresService.obterDiarias(joao.id);
const ultimaDiaria = diarias[diarias.length - 1];

await operadoresService.pagarDiaria(
  ultimaDiaria.id,
  "transferencia",
  "url/comprovante.pdf"
);

// João Silva:
// Total pendente: R$ 0
// Total pago: R$ 150
```

---

## PARTE 8: CHECKLIST DE IMPLEMENTAÇÃO

- [ ] Incluir `operadores.js` no `index.html`
- [ ] Criar tela de listagem de operadores (assets/html/operadores.html)
- [ ] Adicionar botão "Operadores" no menu principal
- [ ] Integrar seleção de operadores na criação de eventos
- [ ] Adicionar "Pagar Diárias" no menu
- [ ] Criar dashboard de relatórios de operadores
- [ ] Treinar usuários no novo fluxo
- [ ] Testar com evento real

---

## COMANDOS RÁPIDOS

```javascript
// Ver todos os operadores
operadoresService.listar();

// Ver diárias pendentes
operadoresService.obterDiariasAtraso();

// Relatório geral
operadoresService.gerarRelatorio();

// Exportar para Excel
const csv = operadoresService.exportarCSV();

// Deletar operador (sem diárias pendentes)
operadoresService.deletar(operadorId);
```

---

**Próximo passo:** Integrar UI no index.html para tornar funcional!
