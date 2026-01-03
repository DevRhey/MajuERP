# 🎯 Quick Reference - IndexedDB

## 📌 Copiar e Colar Rápido

### Status do Banco
```javascript
admin
```

### Ver Todos os Dados de uma Tabela
```javascript
DatabaseAdmin.view('eventos')
DatabaseAdmin.view('clientes')
DatabaseAdmin.view('itens')
DatabaseAdmin.view('orcamentos')
DatabaseAdmin.view('financeiroTransacoes')
```

### Salvar Dados
```javascript
await simpleDB.save('eventos', {
  nome: 'Meu Evento',
  clienteId: 1,
  dataInicio: '2025-02-15',
  horaInicio: '14:00',
  horaFim: '18:00',
  status: 'aguardando',
  valorTotal: 500
});
```

### Buscar Rápido (Índice)
```javascript
// Por ID
await simpleDB.get('eventos', 1)

// Por Data
await simpleDB.getByIndex('eventos', 'dataInicio', '2025-02-15')

// Por Cliente
await simpleDB.getByIndex('eventos', 'clienteId', 1)

// Por Status
await simpleDB.getByIndex('eventos', 'status', 'aguardando')
```

### Buscar Todos
```javascript
await simpleDB.getAll('eventos')
await simpleDB.getAll('clientes')
await simpleDB.getAll('itens')
```

### Filtrar
```javascript
DatabaseAdmin.query('eventos', e => e.valorTotal > 1000)
DatabaseAdmin.query('eventos', e => e.status === 'andamento')
DatabaseAdmin.query('eventos', e => e.clienteId === 3 && e.status === 'aguardando')
```

### Atualizar
```javascript
const evento = await simpleDB.get('eventos', 1);
evento.status = 'andamento';
evento.observacoes = 'Novo texto';
await simpleDB.save('eventos', evento);
```

### Deletar
```javascript
await simpleDB.delete('eventos', 1)  // Deleta evento ID 1
```

### Limpar Tudo de uma Tabela
```javascript
await simpleDB.clear('eventos')
// ⚠️ Pede confirmação
```

### Backup (Baixar)
```javascript
DatabaseAdmin.backup()
```

### Restaurar (de arquivo)
```javascript
// Selecione o arquivo no diálogo
DatabaseAdmin.restore(fileInput.files[0])
```

### Exportar para CSV
```javascript
DatabaseAdmin.export('eventos')
DatabaseAdmin.export()  // Exporta tudo
```

### Monitorar Alterações
```javascript
DatabaseAdmin.monitor()
DatabaseAdmin.monitor('eventos')  // Apenas eventos
```

### Teste de Performance
```javascript
DatabaseAdmin.performance()
```

### Reparar Inconsistências
```javascript
DatabaseAdmin.repair()
```

### Sincronizar com localStorage
```javascript
await simpleDB.syncToLocalStorage()  // Backup
await simpleDB.syncFromLocalStorage() // Restaurar
```

### Contar Documentos
```javascript
await simpleDB.count('eventos')
await simpleDB.count('clientes')
```

### Estatísticas Completas
```javascript
const stats = await simpleDB.getStats()
console.log(stats)
```

---

## 🎯 Casos de Uso Rápidos

### Adicionar Evento + Cliente
```javascript
// 1. Salvar cliente
const cliente = await simpleDB.save('clientes', {
  nome: 'João Silva',
  email: 'joao@test.com'
});

// 2. Salvar evento com cliente
const evento = await simpleDB.save('eventos', {
  nome: 'Festa',
  clienteId: cliente.id,
  dataInicio: '2025-02-15',
  status: 'aguardando'
});

console.log('✅ Cliente e evento criados!');
```

### Listar Eventos de um Cliente
```javascript
const clienteId = 3;
const eventosCliente = await simpleDB.getByIndex('eventos', 'clienteId', clienteId);
console.table(eventosCliente);
```

### Dashboard - Contar por Status
```javascript
const todos = await simpleDB.getAll('eventos');
const aguardando = todos.filter(e => e.status === 'aguardando').length;
const andamento = todos.filter(e => e.status === 'andamento').length;
const finalizado = todos.filter(e => e.status === 'finalizado').length;

console.log(`
Aguardando: ${aguardando}
Em andamento: ${andamento}
Finalizados: ${finalizado}
`);
```

### Filtrar Eventos Caros
```javascript
const caros = await simpleDB.query('eventos', e => e.valorTotal > 1000);
console.table(caros);
```

### Buscar por Período
```javascript
const janeiro = await simpleDB.getRange('eventos', 'dataInicio', '2025-01-01', '2025-01-31');
console.log(`Eventos em janeiro: ${janeiro.length}`);
```

---

## ⌨️ Atalhos Console

```javascript
// Ver painel
admin

// Equivalente a:
DatabaseAdmin.showDashboard()

// Backup rápido
DatabaseAdmin.backup()

// Monitor rápido
DatabaseAdmin.monitor()
```

---

## 🔍 Debug

### Ver um objeto completo
```javascript
const evento = await simpleDB.get('eventos', 1);
console.log(evento);
```

### Ver estrutura de um store
```javascript
const primeiro = (await simpleDB.getAll('eventos'))[0];
console.log(Object.keys(primeiro));
```

### Contar de tudo
```javascript
for (const store of ['clientes', 'itens', 'eventos', 'orcamentos', 'financeiroTransacoes']) {
  const count = await simpleDB.count(store);
  console.log(`${store}: ${count}`);
}
```

---

## 🚨 Troubleshooting

### Não vejo dados?
```javascript
// 1. Verificar se banco está inicializado
if (!simpleDB.isReady) {
  await simpleDB.init();
}

// 2. Ver estatísticas
const stats = await simpleDB.getStats();
console.log(stats);

// 3. Se vazio, restaurar do localStorage
await simpleDB.syncFromLocalStorage();
```

### Quer resetar tudo?
```javascript
// ⚠️ CUIDADO - DELETA TUDO
for (const store of ['clientes', 'itens', 'eventos', 'orcamentos', 'financeiroTransacoes']) {
  await simpleDB.clear(store);
}
console.log('✅ Tudo deletado');
```

### Browser não suporta?
```javascript
// Fallback automático para localStorage
// Você não precisa fazer nada
```

---

## 📊 SQL Equivalente (Futuro)

Se migrar para backend:

```javascript
// Agora (IndexedDB):
await simpleDB.getByIndex('eventos', 'clienteId', 3)

// Depois (SQL):
SELECT * FROM eventos WHERE clienteId = 3

---

// Agora:
await simpleDB.getRange('eventos', 'dataInicio', '2025-01-01', '2025-01-31')

// Depois:
SELECT * FROM eventos WHERE dataInicio BETWEEN '2025-01-01' AND '2025-01-31'
```

---

## 💾 Backup Automático

```javascript
// Sincronizar a cada 5 minutos
setInterval(async () => {
  await simpleDB.syncToLocalStorage();
  console.log('✅ Backup automático realizado');
}, 5 * 60 * 1000);
```

---

## 📱 Em outro dispositivo?

```javascript
// 1. Faça backup neste PC
DatabaseAdmin.backup()

// 2. Transfira o arquivo para outro PC

// 3. No outro PC, abra index.html
// 4. No console:
DatabaseAdmin.restore(arquivo)
```

---

## 🎓 Aprender Mais

```javascript
// Ver todos os métodos disponíveis
console.log(Object.getOwnPropertyNames(SimpleDB.prototype))

// Ver métodos do admin
console.log(Object.keys(DatabaseAdmin))

// Ler documentação
console.log(COMECE_AQUI_INDEXEDDB.md)
```

---

## 🚀 Uma Linha

```javascript
// Resumo em uma linha
admin; console.log('✅ Digite comandos acima!');
```

---

## 📋 Checklist de Uso

- [ ] Abrir index.html
- [ ] Abrir Console (F12)
- [ ] Digitar `admin`
- [ ] Ver painel de status
- [ ] Fazer um teste (criar evento)
- [ ] Fazer backup
- [ ] ✅ Pronto para usar!

---

## ⏱️ Tempo de Aprendizado

- Básico (5 minutos): `admin`, `view`, `save`, `delete`
- Intermediário (15 minutos): índices, filtros, backup
- Avançado (30 minutos): migrations, performance, troubleshooting

