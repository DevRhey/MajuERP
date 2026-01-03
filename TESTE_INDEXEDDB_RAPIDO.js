// ============================================
// TESTE RÁPIDO DO INDEXEDDB - COPIE E COLE NO CONSOLE
// ============================================

// 1. VER STATUS DO BANCO
console.log('📊 Verificando status do banco...');
const stats = await simpleDB.getStats();
console.table(stats.stores);

// 2. ADICIONAR DADOS DE TESTE
console.log('➕ Adicionando dados de teste...');

// Cliente
const cliente = await simpleDB.save('clientes', {
  nome: 'Empresa Festas XYZ',
  email: 'contato@festas.com',
  telefone: '11999999999',
  endereco: 'Rua das Flores, 123'
});
console.log('✅ Cliente criado:', cliente);

// Item (Pula-pula)
const item = await simpleDB.save('itens', {
  nome: 'Pula-Pula Gigante',
  descricao: 'Pula-pula de 4x4 com escada',
  valorDiaria: 150,
  quantidade: 3,
  categoria: 'inflaveis'
});
console.log('✅ Item criado:', item);

// 3. CRIAR EVENTO
console.log('📅 Criando evento...');
const evento = await simpleDB.save('eventos', {
  nome: 'Aniversário da Sofia',
  clienteId: cliente.id,
  dataInicio: '2025-02-15',
  dataFim: '2025-02-15',
  horaInicio: '14:00',
  horaFim: '18:00',
  status: 'aguardando',
  valorTotal: 800,
  itens: [
    { id: item.id, quantidade: 2 }
  ],
  observacoes: 'Incluir decoração com tema princesa'
});
console.log('✅ Evento criado:', evento);

// 4. BUSCAR EVENTOS DO CLIENTE
console.log('🔍 Buscando eventos do cliente...');
const eventosCliente = await simpleDB.getByIndex('eventos', 'clienteId', cliente.id);
console.log(`Cliente tem ${eventosCliente.length} evento(s):`);
console.table(eventosCliente);

// 5. BUSCAR POR DATA
console.log('📆 Buscando eventos em 15/02...');
const eventosData = await simpleDB.getByIndex('eventos', 'dataInicio', '2025-02-15');
console.log(`${eventosData.length} evento(s) encontrado(s):`);
console.table(eventosData);

// 6. CONTAR DOCUMENTOS
console.log('📊 Contando documentos...');
const totalClientes = await simpleDB.count('clientes');
const totalItens = await simpleDB.count('itens');
const totalEventos = await simpleDB.count('eventos');
console.log(`
✓ Clientes: ${totalClientes}
✓ Itens: ${totalItens}
✓ Eventos: ${totalEventos}
`);

// 7. ATUALIZAR EVENTO
console.log('✏️ Atualizando evento...');
const eventoAtualizado = await simpleDB.get('eventos', evento.id);
eventoAtualizado.status = 'andamento';
eventoAtualizado.observacoes = 'Evento em preparação - decoração sendo montada';
await simpleDB.save('eventos', eventoAtualizado);
console.log('✅ Evento atualizado:', eventoAtualizado);

// 8. VER TODOS OS EVENTOS
console.log('📋 Todos os eventos:');
const todosEventos = await simpleDB.getAll('eventos');
console.table(todosEventos.map(e => ({
  ID: e.id,
  Nome: e.nome,
  Cliente: cliente.id === e.clienteId ? cliente.nome : 'Outro',
  Data: e.dataInicio,
  Status: e.status,
  Valor: `R$ ${e.valorTotal}`
})));

// 9. FAZER BACKUP
console.log('💾 Fazendo backup...');
DatabaseAdmin.backup();
console.log('✅ Arquivo de backup baixado!');

// 10. VER ADMIN PANEL
console.log('🎛️ Abrindo painel de admin...');
console.log('Digite "admin" para ver mais comandos');
admin;

// ============================================
// RESULTADOS ESPERADOS
// ============================================

/*
✅ Cliente criado:
{
  id: 1,
  nome: 'Empresa Festas XYZ',
  email: 'contato@festas.com',
  telefone: '11999999999',
  endereco: 'Rua das Flores, 123',
  dataAtualizacao: '2025-01-03T10:30:00Z'
}

✅ Item criado:
{
  id: 1,
  nome: 'Pula-Pula Gigante',
  descricao: 'Pula-pula de 4x4 com escada',
  valorDiaria: 150,
  quantidade: 3,
  categoria: 'inflaveis',
  dataAtualizacao: '2025-01-03T10:30:00Z'
}

✅ Evento criado:
{
  id: 1,
  nome: 'Aniversário da Sofia',
  clienteId: 1,
  dataInicio: '2025-02-15',
  dataFim: '2025-02-15',
  horaInicio: '14:00',
  horaFim: '18:00',
  status: 'aguardando',
  valorTotal: 800,
  itens: [{id: 1, quantidade: 2}],
  observacoes: 'Incluir decoração com tema princesa',
  dataAtualizacao: '2025-01-03T10:30:00Z'
}

🔍 Buscando eventos do cliente...
Cliente tem 1 evento(s):
[{...}]  (mesmo evento criado)

📆 Buscando eventos em 15/02...
1 evento(s) encontrado(s):
[{...}]  (mesmo evento)

📊 Contando documentos...
✓ Clientes: 1
✓ Itens: 1
✓ Eventos: 1

✅ Evento atualizado - status agora é "andamento"

📋 Todos os eventos:
┌────┬──────────────────────┬───────────────────┬────────────┬──────────┬─────────┐
│ ID │ Nome                 │ Cliente           │ Data       │ Status   │ Valor   │
├────┼──────────────────────┼───────────────────┼────────────┼──────────┼─────────┤
│ 1  │ Aniversário da Sofia │ Empresa Festas XY │ 2025-02-15 │ andamento│ R$ 800  │
└────┴──────────────────────┴───────────────────┴────────────┴──────────┴─────────┘

💾 Fazendo backup...
✅ Arquivo de backup baixado!
(arquivo: backup-erp-2025-01-03.json)
*/

// ============================================
// PRÓXIMOS TESTES
// ============================================

// Testar performance
// await DatabaseAdmin.performance();

// Monitorar alterações
// DatabaseAdmin.monitor();

// Ver dados de uma tabela
// DatabaseAdmin.view('eventos');

// Buscar com filtro
// DatabaseAdmin.query('eventos', e => e.valorTotal > 500);

// Exportar para CSV
// DatabaseAdmin.export('eventos');

// Sincronizar com localStorage
// await DatabaseAdmin.sync();
