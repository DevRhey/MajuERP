// Exemplos de Uso do IndexedDB no Sistema
// Copie e cole no console do navegador para testar

// ============================================
// 1. OPERAÇÕES BÁSICAS
// ============================================

// Salvar um novo cliente
await simpleDB.save('clientes', {
  nome: 'João da Silva',
  email: 'joao@example.com',
  telefone: '11999999999',
  endereco: 'Rua A, 123'
});

// Salvar um evento
await simpleDB.save('eventos', {
  nome: 'Aniversário',
  clienteId: 1,
  dataInicio: '2025-01-15',
  dataFim: '2025-01-15',
  horaInicio: '14:00',
  horaFim: '18:00',
  status: 'aguardando'
});

// Buscar todos os eventos
const todos = await simpleDB.getAll('eventos');
console.log('Todos os eventos:', todos);

// Buscar um cliente específico por ID
const cliente = await simpleDB.get('clientes', 1);
console.log('Cliente ID 1:', cliente);

// ============================================
// 2. BUSCAS COM ÍNDICES (mais rápido!)
// ============================================

// Buscar eventos por data
const eventosJaneiro = await simpleDB.getByIndex('eventos', 'dataInicio', '2025-01-15');
console.log('Eventos em 15/01:', eventosJaneiro);

// Buscar eventos de um cliente específico
const eventosCliente1 = await simpleDB.getByIndex('eventos', 'clienteId', 1);
console.log('Eventos do cliente 1:', eventosCliente1);

// Buscar eventos por status
const eventosAguardando = await simpleDB.getByIndex('eventos', 'status', 'aguardando');
console.log('Eventos aguardando:', eventosAguardando);

// ============================================
// 3. QUERIES AVANÇADAS
// ============================================

// Buscar com filtro personalizado
const eventosGrandes = await simpleDB.query('eventos', e => {
  return e.valorTotal > 1000;
});
console.log('Eventos acima de R$ 1000:', eventosGrandes);

// Buscar eventos entre datas
const eventosRangeData = await simpleDB.getRange(
  'eventos', 
  'dataInicio', 
  '2025-01-01', 
  '2025-01-31'
);
console.log('Eventos de janeiro:', eventosRangeData);

// ============================================
// 4. ATUALIZAR DADOS
// ============================================

// Buscar e atualizar
const evento = await simpleDB.get('eventos', 1);
evento.status = 'andamento';
evento.observacoes = 'Evento em progresso';
await simpleDB.save('eventos', evento);
console.log('✅ Evento atualizado');

// ============================================
// 5. DELETAR DADOS
// ============================================

// Deletar um evento
await simpleDB.delete('eventos', 1);
console.log('✅ Evento deletado');

// Limpar todos os eventos
await simpleDB.clear('eventos');
console.log('✅ Todos os eventos foram deletados');

// ============================================
// 6. BACKUP & RESTORE
// ============================================

// Fazer backup de tudo
const backup = await simpleDB.exportAll();
console.log('Backup:', backup);

// Salvar backup em arquivo (para download)
function downloadBackup() {
  const backup = await simpleDB.exportAll();
  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `backup-${new Date().toISOString()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// Restaurar de backup
async function restoreBackup(file) {
  const json = await file.text();
  const backup = JSON.parse(json);
  await simpleDB.importAll(backup);
  console.log('✅ Backup restaurado');
}

// ============================================
// 7. SINCRONIZAR COM LOCALSTORAGE
// ============================================

// Sincronizar dados atuais para localStorage (backup)
await simpleDB.syncToLocalStorage();
console.log('✅ Dados sincronizados para localStorage');

// Restaurar dados do localStorage para IndexedDB
await simpleDB.syncFromLocalStorage();
console.log('✅ Dados restaurados do localStorage');

// ============================================
// 8. ESTATÍSTICAS DO BANCO
// ============================================

// Ver quantidade de documentos em cada store
const stats = await simpleDB.getStats();
console.log('Estatísticas:', stats);

// Contar eventos específicos
const totalEventos = await simpleDB.count('eventos');
console.log(`Total de eventos: ${totalEventos}`);

const totalClientes = await simpleDB.count('clientes');
console.log(`Total de clientes: ${totalClientes}`);

// ============================================
// 9. INTEGRAÇÃO COM O SISTEMA ATUAL
// ============================================

// Substituir localStorage.getItem por simpleDB
// ANTES:
// const clientes = JSON.parse(localStorage.getItem('clientes'));

// DEPOIS:
// const clientes = await simpleDB.getAll('clientes');

// Exemplo: Atualizar eventos quando o app.js usa Storage
// Storage.save('eventos', data) 
// → simpleDB.save('eventos', data)

// ============================================
// 10. OUVIR MUDANÇAS NO BANCO
// ============================================

// Ouvir quando dados são atualizados
window.addEventListener('dbUpdate', (e) => {
  const { storeName, data } = e.detail;
  console.log(`✅ ${storeName} foi atualizado:`, data);
});

// ============================================
// 11. PERFORMANCE: COMPARAÇÃO
// ============================================

// localStorage (atual)
console.time('localStorage');
const dataLS = JSON.parse(localStorage.getItem('eventos'));
console.timeEnd('localStorage');

// IndexedDB (novo)
console.time('IndexedDB');
const dataDB = await simpleDB.getAll('eventos');
console.timeEnd('IndexedDB');

// IndexedDB com índice (mais rápido)
console.time('IndexedDB com índice');
const dataIndex = await simpleDB.getByIndex('eventos', 'clienteId', 1);
console.timeEnd('IndexedDB com índice');

// ============================================
// 12. CASOS DE USO REAIS
// ============================================

// Caso 1: Adicionar evento no calendário
async function adicionarEventoCalendario(evento) {
  try {
    const saved = await simpleDB.save('eventos', evento);
    console.log('✅ Evento salvo:', saved);
    // Disparar atualização no UI
    window.dispatchEvent(new CustomEvent('storageUpdate', { 
      detail: { key: 'eventos', data: saved } 
    }));
  } catch (error) {
    console.error('❌ Erro ao salvar evento:', error);
  }
}

// Caso 2: Buscar eventos de um cliente
async function buscarEventosDoCliente(clienteId) {
  return await simpleDB.getByIndex('eventos', 'clienteId', clienteId);
}

// Caso 3: Filtrar eventos por período
async function buscarEventosPorPeriodo(dataInicio, dataFim) {
  return await simpleDB.getRange('eventos', 'dataInicio', dataInicio, dataFim);
}

// Caso 4: Atualizar status de múltiplos eventos
async function atualizarStatusEventos(ids, novoStatus) {
  for (const id of ids) {
    const evento = await simpleDB.get('eventos', id);
    if (evento) {
      evento.status = novoStatus;
      await simpleDB.save('eventos', evento);
    }
  }
  console.log(`✅ ${ids.length} eventos atualizados`);
}

// Caso 5: Dashboard - estatísticas
async function getDashboardStats() {
  const eventos = await simpleDB.getAll('eventos');
  const clientes = await simpleDB.getAll('clientes');
  
  return {
    totalEventos: eventos.length,
    totalClientes: clientes.length,
    eventosAndamento: eventos.filter(e => e.status === 'andamento').length,
    eventosAguardando: eventos.filter(e => e.status === 'aguardando').length,
    eventosFinalizado: eventos.filter(e => e.status === 'finalizado').length,
  };
}

// ============================================
// 13. MONITORAMENTO & DEBUGGING
// ============================================

// Ver tudo que está acontecendo no banco
window.addEventListener('dbUpdate', (e) => {
  console.group('🔄 Update no Banco');
  console.log('Store:', e.detail.storeName);
  console.log('Dados:', e.detail.data);
  console.log('Timestamp:', new Date().toLocaleTimeString());
  console.groupEnd();
});

// Exportar logs
async function exportDatabaseLogs() {
  const stats = await simpleDB.getStats();
  console.log('=== RELATÓRIO DO BANCO ===');
  console.log(JSON.stringify(stats, null, 2));
}

// ============================================
// 14. TESTES DE CARGA
// ============================================

// Criar 1000 eventos de teste
async function testLoadDatabase() {
  console.log('⏳ Criando 1000 eventos de teste...');
  const start = performance.now();
  
  for (let i = 0; i < 1000; i++) {
    await simpleDB.save('eventos', {
      nome: `Evento teste ${i}`,
      clienteId: Math.floor(Math.random() * 10) + 1,
      dataInicio: '2025-01-15',
      status: ['aguardando', 'andamento', 'finalizado'][Math.floor(Math.random() * 3)],
      valorTotal: Math.random() * 5000
    });
  }
  
  const end = performance.now();
  console.log(`✅ Concluído em ${(end - start).toFixed(2)}ms`);
  
  const stats = await simpleDB.getStats();
  console.log('Stats:', stats);
}

// ============================================
// ATALHO: IMPORTAR DADOS DE TESTE
// ============================================

async function carregarDadosDeTeste() {
  console.log('📥 Carregando dados de teste...');
  
  // Clientes
  await simpleDB.save('clientes', { nome: 'Cliente 1', email: 'c1@test.com' });
  await simpleDB.save('clientes', { nome: 'Cliente 2', email: 'c2@test.com' });
  
  // Itens
  await simpleDB.save('itens', { nome: 'Pula-pula', valorDiaria: 50, quantidade: 3 });
  await simpleDB.save('itens', { nome: 'Escorregador', valorDiaria: 80, quantidade: 2 });
  
  // Eventos
  await simpleDB.save('eventos', {
    nome: 'Festa de aniversário',
    clienteId: 1,
    dataInicio: '2025-01-20',
    horaInicio: '14:00',
    status: 'aguardando',
    valorTotal: 500
  });
  
  console.log('✅ Dados de teste carregados');
}

// ============================================
// EXECUTAR TUDO
// ============================================

// Descomentar para executar automaticamente
// carregarDadosDeTeste();
// getDashboardStats().then(console.log);
// exportDatabaseLogs();
