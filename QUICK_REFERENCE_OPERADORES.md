# ⚡ QUICK REFERENCE - Comandos Operadores

## 🚀 Copie e Cole (Via Console F12)

### 1. Criar Operador

```javascript
await operadoresService.criar({
  nome: "João Silva",
  cpf: "123.456.789-00",
  telefone: "(11) 98765-4321",
  email: "joao@email.com",
  diaria_valor: 150.00,
  tipo_contrato: "pj",
  especialidades: ["pula-pula", "castelo"],
  nota_interna: "Responsável"
});
```

### 2. Criar Múltiplos Operadores

```javascript
const operadores = [
  { nome: "João", diaria_valor: 150, tipo_contrato: "pj" },
  { nome: "Carlos", diaria_valor: 150, tipo_contrato: "clt" },
  { nome: "Maria", diaria_valor: 180, tipo_contrato: "pj" },
  { nome: "Pedro", diaria_valor: 120, tipo_contrato: "pj" }
];

for (const op of operadores) {
  await operadoresService.criar(op);
}

console.log("✅ Criados!");
```

### 3. Listar Operadores

```javascript
const ops = operadoresService.listar();
ops.forEach(op => {
  console.log(`${op.nome} - R$ ${op.diaria_valor}/dia - Pendente: R$ ${op.total_pendente}`);
});
```

### 4. Atualizar Operador

```javascript
const operador_id = 1672857600000; // Substitua com ID real

await operadoresService.atualizar(operador_id, {
  diaria_valor: 200.00,  // Novo valor
  disponivel: true
});
```

### 5. Registrar Diária

```javascript
const resultado = await operadoresService.registrarDiaria(
  1672857600000,  // operador_id - Substitua
  1672750000000,  // evento_id - Substitua
  {
    data: "2025-01-03",
    itens_supervisionados: [
      { item_id: 1, item_nome: "Pula-pula", inicio: "14:00", fim: "22:00" }
    ],
    horas_trabalhadas: 8,
    valor_ajuste: 0,
    observacoes: "Tudo ok"
  }
);

console.log("✅ Diária registrada:", resultado);
```

### 6. Ver Diárias de um Operador

```javascript
const diarias = operadoresService.obterDiarias(1672857600000);
diarias.forEach(d => {
  console.log(`${new Date(d.data).toLocaleDateString()} - R$ ${d.valor_diaria} - ${d.status}`);
});
```

### 7. Ver Diárias Pendentes

```javascript
const pendentes = operadoresService.obterDiariasAtraso();
console.log(`Total pendente: ${pendentes.length} diárias`);
pendentes.forEach(d => {
  const op = operadoresService.obter(d.operador_id);
  console.log(`${op.nome} - R$ ${d.valor_diaria}`);
});
```

### 8. Pagar Uma Diária

```javascript
const diaria_id = 1672857700000; // Substitua

await operadoresService.pagarDiaria(
  diaria_id,
  "transferencia",  // "dinheiro", "transferencia" ou "cheque"
  "url/comprovante.pdf"  // Opcional
);

console.log("✅ Pago!");
```

### 9. Pagar Todas as Diárias de um Operador

```javascript
const resultado = await operadoresService.pagarEmLote(
  1672857600000,  // operador_id
  "transferencia"
);

console.log(`✅ ${resultado.sucesso} diárias pagas`);
```

### 10. Gerar Relatório

```javascript
const relatorio = operadoresService.gerarRelatorio();

console.log("RELATÓRIO:");
console.log(`• Total operadores: ${relatorio.total_operadores}`);
console.log(`• Total pago: R$ ${relatorio.total_pago_geral.toFixed(2)}`);
console.log(`• Total pendente: R$ ${relatorio.total_pendente_geral.toFixed(2)}`);

relatorio.detalhes.forEach(op => {
  console.log(`\n${op.nome}:`);
  console.log(`  Diária: R$ ${op.diaria_valor}`);
  console.log(`  Trabalhos: ${op.total_diarias}`);
  console.log(`  Ganho: R$ ${op.total_ganho.toFixed(2)}`);
  console.log(`  Pago: R$ ${op.total_pago.toFixed(2)}`);
  console.log(`  Pendente: R$ ${op.total_pendente.toFixed(2)}`);
});
```

### 11. Exportar CSV

```javascript
const csv = operadoresService.exportarCSV();

// Opção 1: Ver no console
console.log(csv);

// Opção 2: Baixar arquivo
const blob = new Blob([csv], { type: 'text/csv' });
const url = URL.createObjectURL(blob);
const link = document.createElement('a');
link.href = url;
link.download = `operadores_${new Date().toISOString().split('T')[0]}.csv`;
link.click();

console.log("✅ Arquivo baixado!");
```

### 12. Deletar Operador

```javascript
const confirmado = confirm("Tem certeza?");
if (confirmado) {
  await operadoresService.deletar(1672857600000);
  console.log("✅ Deletado!");
}
```

### 13. Filtrar Operadores

```javascript
// Operadores disponíveis
const disponiveis = operadoresService.filtrar({ disponivel: true });

// PJ
const pj = operadoresService.filtrar({ tipo_contrato: "pj" });

// Com especialidade
const pulapula = operadoresService.filtrar({ especialidade: "pula-pula" });
```

---

## 📌 Integração com Eventos

### 14. Atribuir Operador a Item

```javascript
app.modules.eventos.atribuirOperadorAoItem(
  evento_id,      // ID do evento
  item_id,        // ID do brinquedo
  operador_id,    // ID do operador
  valor_ajuste    // 0 ou valor adicional
);
```

### 15. Remover Operador de Item

```javascript
app.modules.eventos.removerOperadorDoItem(evento_id, item_id);
```

### 16. Ver Custos do Evento

```javascript
const custos = app.modules.eventos.obterResumoCustos(evento_id);
console.log(custos);
// {
//   valor_aluguel: 300,
//   custo_operadores: 100,
//   custo_manutencao: 30,
//   custo_total: 130,
//   margem_liquida: 170,
//   percentual_margem: 56.7
// }
```

### 17. Finalizar Evento e Registrar Diárias

```javascript
const resultado = await app.modules.eventos.finalizarEventoComOperadores(evento_id);
console.log(`✅ ${resultado.sucesso} diárias registradas`);
```

### 18. Pagar Operadores do Evento

```javascript
const resultado = await app.modules.eventos.pagarOperadoresEvento(
  evento_id,
  "transferencia"
);
console.log(`✅ ${resultado.sucesso} operadores pagos`);
```

---

## 🧪 Testes Rápidos (Copy & Paste)

### Teste 1: Tudo Funcionando?

```javascript
console.log("=== TESTE RÁPIDO ===");
console.log("✓ operadoresService:", typeof operadoresService);
console.log("✓ Operadores:", operadoresService.listar().length);
console.log("✓ Diárias pendentes:", operadoresService.obterDiariasAtraso().length);
```

### Teste 2: Criar e Testar

```javascript
(async () => {
  // Criar
  const op = await operadoresService.criar({
    nome: "Teste " + Date.now(),
    diaria_valor: 100
  });
  console.log("✓ Criado:", op.nome);

  // Registrar diária
  const diaria = await operadoresService.registrarDiaria(op.id, Date.now(), {
    data: new Date().toISOString(),
    itens_supervisionados: [{ item_id: 1, item_nome: "Teste" }]
  });
  console.log("✓ Diária:", diaria.valor_diaria);

  // Pagar
  await operadoresService.pagarDiaria(diaria.id, "transferencia");
  console.log("✓ Pago!");

  // Verificar
  const op_updated = operadoresService.obter(op.id);
  console.log("✓ Total ganho:", op_updated.total_ganho);
  console.log("✓ Total pago:", op_updated.total_pago);
})();
```

### Teste 3: Gerar Dados de Teste

```javascript
(async () => {
  // Criar 5 operadores com 10 diárias cada
  for (let i = 1; i <= 5; i++) {
    const op = await operadoresService.criar({
      nome: `Operador ${i}`,
      diaria_valor: 100 + (i * 10),
      tipo_contrato: i % 2 === 0 ? "clt" : "pj",
      especialidades: ["pula-pula", "castelo"]
    });

    // 10 diárias cada
    for (let j = 1; j <= 10; j++) {
      await operadoresService.registrarDiaria(op.id, Date.now() + j, {
        data: new Date().toISOString(),
        itens_supervisionados: [{ item_id: 1, item_nome: "Teste" }]
      });
    }
  }
  console.log("✅ Dados de teste criados!");
})();
```

---

## 🔧 Troubleshooting

### Erro: "operadoresService não definido"

```javascript
// Verificar se foi carregado
if (typeof operadoresService === 'undefined') {
  console.error("❌ Operadores não foi carregado");
  console.log("Solução: Adicione em index.html:");
  console.log("<script src='assets/js/operadores.js'></script>");
  console.log("<script src='assets/js/ia-modules/eventos-operadores-extensao.js'></script>");
}
```

### Ver dados no IndexedDB

```javascript
// Se tiver db inicializado
if (window.db) {
  const ops = await window.db.getAll('operadores');
  console.log("Operadores no IndexedDB:", ops);
}
```

### Ver dados em localStorage

```javascript
// Ver tudo
console.log(JSON.parse(localStorage.getItem('operadores')));
console.log(JSON.parse(localStorage.getItem('diarias_historico')));
```

### Limpar tudo (CUIDADO!)

```javascript
// Deletar localStorage
localStorage.removeItem('operadores');
localStorage.removeItem('diarias_historico');

// Recarregar página
location.reload();
```

---

## 📊 Análises Rápidas

### Quanto cada operador ganhou?

```javascript
const relatorio = operadoresService.gerarRelatorio();
relatorio.detalhes.forEach(op => {
  console.log(`${op.nome}: R$ ${op.total_ganho.toFixed(2)}`);
});
```

### Quanto ainda devo?

```javascript
const relatorio = operadoresService.gerarRelatorio();
console.log(`TOTAL PENDENTE: R$ ${relatorio.total_pendente_geral.toFixed(2)}`);
```

### Quem trabalhou mais?

```javascript
const ops = operadoresService.listar();
ops.sort((a, b) => b.total_diarias_trabalhadas - a.total_diarias_trabalhadas);
ops.forEach((op, idx) => {
  console.log(`${idx + 1}. ${op.nome}: ${op.total_diarias_trabalhadas} diárias`);
});
```

### Eficiência de pagamento

```javascript
const relatorio = operadoresService.gerarRelatorio();
relatorio.detalhes.forEach(op => {
  const pct = ((op.total_pago / op.total_ganho) * 100).toFixed(1);
  console.log(`${op.nome}: ${pct}% pago`);
});
```

---

**Pronto para usar! 🎉**

Copie qualquer comando acima e cole no console (F12) do navegador.
