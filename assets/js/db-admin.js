// Painel de Administração do Banco de Dados
// Adicione isso ao seu app para monitorar e gerenciar o IndexedDB

const DatabaseAdmin = {
  /**
   * Mostrar painel de admin no console
   */
  showDashboard: async function() {
    console.clear();
    console.log('%c=== PAINEL DE ADMINISTRAÇÃO - BANCO DE DADOS ===', 'color: #0066cc; font-size: 16px; font-weight: bold;');
    
    const stats = await simpleDB.getStats();
    
    console.log('%c📊 ESTATÍSTICAS:', 'color: #0066cc; font-size: 12px; font-weight: bold;');
    console.table(Object.entries(stats.stores).map(([name, stat]) => ({
      'Store': name,
      'Documentos': stat.count,
      'Último atualizado': stat.sampleData?.[0]?.dataAtualizacao || 'N/A'
    })));
    
    console.log('%c💾 TOTAL DE DADOS:', 'color: #0066cc; font-size: 12px; font-weight: bold;');
    const total = Object.values(stats.stores).reduce((sum, s) => sum + s.count, 0);
    console.log(`${total} documentos armazenados`);
    
    console.log('%c⚙️ COMANDOS DISPONÍVEIS:', 'color: #0066cc; font-size: 12px; font-weight: bold;');
    console.log(`
    DatabaseAdmin.backup()              → Fazer backup
    DatabaseAdmin.restore(file)         → Restaurar backup
    DatabaseAdmin.clear(storeName)      → Limpar um store
    DatabaseAdmin.export()              → Exportar dados
    DatabaseAdmin.monitor()             → Monitorar alterações
    DatabaseAdmin.performance()         → Testar performance
    DatabaseAdmin.repair()              → Reparar inconsistências
    DatabaseAdmin.sync()                → Sincronizar com localStorage
    `);
  },

  /**
   * Fazer backup e descarregar
   */
  backup: async function() {
    console.log('💾 Criando backup...');
    const backup = await simpleDB.exportAll();
    
    const json = JSON.stringify(backup, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-erp-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('✅ Backup salvo como arquivo');
  },

  /**
   * Restaurar de arquivo
   */
  restore: async function(file) {
    try {
      console.log('📥 Restaurando backup...');
      const json = await file.text();
      const backup = JSON.parse(json);
      
      if (!backup.data) {
        console.error('❌ Arquivo de backup inválido');
        return;
      }
      
      await simpleDB.importAll(backup);
      console.log('✅ Backup restaurado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao restaurar:', error);
    }
  },

  /**
   * Limpar um store específico
   */
  clear: async function(storeName) {
    if (!confirm(`⚠️ Tem certeza que deseja limpar ${storeName}?`)) {
      return;
    }
    
    try {
      await simpleDB.clear(storeName);
      console.log(`✅ ${storeName} foi limpo`);
    } catch (error) {
      console.error(`❌ Erro ao limpar ${storeName}:`, error);
    }
  },

  /**
   * Exportar dados para CSV
   */
  export: async function(storeName = null) {
    const stores = storeName ? [storeName] : simpleDB.stores;
    
    for (const store of stores) {
      const dados = await simpleDB.getAll(store);
      
      if (dados.length === 0) {
        console.log(`⚠️ ${store} está vazio`);
        continue;
      }
      
      // Converter para CSV
      const headers = Object.keys(dados[0]);
      let csv = headers.join(',') + '\n';
      
      dados.forEach(item => {
        const row = headers.map(h => {
          const val = item[h];
          return typeof val === 'string' ? `"${val}"` : val;
        }).join(',');
        csv += row + '\n';
      });
      
      // Download
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${store}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log(`✅ ${store} exportado para CSV`);
    }
  },

  /**
   * Monitorar alterações em tempo real
   */
  monitor: function(storeName = null) {
    console.log('🔍 Monitorando alterações...');
    console.log(`Pressione Ctrl+C para parar`);
    
    window.addEventListener('dbUpdate', (e) => {
      if (storeName && e.detail.storeName !== storeName) return;
      
      console.log(`%c[${new Date().toLocaleTimeString()}] 🔄 ${e.detail.storeName}`, 'color: #00aa00; font-weight: bold;');
      
      if (e.detail.action === 'delete') {
        console.log(`  ❌ Deletado: ID ${e.detail.id}`);
      } else {
        console.log(`  ✅ Atualizado:`, e.detail.data);
      }
    });
  },

  /**
   * Testar performance
   */
  performance: async function() {
    console.log('%c⚡ TESTE DE PERFORMANCE', 'color: #ff6600; font-size: 14px; font-weight: bold;');
    
    // Teste de escrita
    console.log('\n📝 Teste de ESCRITA...');
    console.time('Escrita de 100 itens');
    for (let i = 0; i < 100; i++) {
      await simpleDB.save('eventos', {
        nome: `Teste ${i}`,
        clienteId: 1,
        dataInicio: '2025-01-20',
        status: 'aguardando'
      });
    }
    console.timeEnd('Escrita de 100 itens');
    
    // Teste de leitura
    console.log('\n📖 Teste de LEITURA...');
    console.time('Leitura de todos os eventos');
    const eventos = await simpleDB.getAll('eventos');
    console.timeEnd('Leitura de todos os eventos');
    
    // Teste de busca
    console.log('\n🔍 Teste de BUSCA COM ÍNDICE...');
    console.time('Busca por clienteId');
    const porCliente = await simpleDB.getByIndex('eventos', 'clienteId', 1);
    console.timeEnd('Busca por clienteId');
    
    console.log('\n✅ Teste concluído');
    console.log(`Total de eventos: ${eventos.length}`);
  },

  /**
   * Reparar inconsistências
   */
  repair: async function() {
    console.log('🔧 Verificando integridade do banco...');
    
    const issues = [];
    
    // Verificar eventos órfãos (cliente não existe)
    const eventos = await simpleDB.getAll('eventos');
    const clientes = await simpleDB.getAll('clientes');
    const clienteIds = clientes.map(c => c.id);
    
    eventos.forEach(evento => {
      if (!clienteIds.includes(evento.clienteId)) {
        issues.push({
          tipo: 'Evento órfão',
          eventoId: evento.id,
          clienteId: evento.clienteId,
          acao: 'Deletar evento'
        });
      }
    });
    
    if (issues.length === 0) {
      console.log('✅ Banco está íntegro - nenhum problema encontrado');
      return;
    }
    
    console.log(`⚠️ Encontrados ${issues.length} problemas:`);
    console.table(issues);
    
    if (confirm('Deseja corrigir automaticamente?')) {
      for (const issue of issues) {
        if (issue.tipo === 'Evento órfão') {
          await simpleDB.delete('eventos', issue.eventoId);
          console.log(`✅ Evento ${issue.eventoId} deletado`);
        }
      }
    }
  },

  /**
   * Sincronizar com localStorage (backup seguro)
   */
  sync: async function() {
    console.log('🔄 Sincronizando...');
    
    const confirm_sync = confirm('Sincronizar IndexedDB → localStorage (backup)?');
    if (confirm_sync) {
      await simpleDB.syncToLocalStorage();
      console.log('✅ Sincronização completa');
    }
  },

  /**
   * Mostrar dados de um store específico
   */
  view: async function(storeName) {
    const dados = await simpleDB.getAll(storeName);
    console.table(dados);
  },

  /**
   * Buscar um documento por ID
   */
  find: async function(storeName, id) {
    const doc = await simpleDB.get(storeName, id);
    console.log(doc);
  },

  /**
   * Buscar documentos por critério
   */
  query: async function(storeName, filterFn) {
    const results = await simpleDB.query(storeName, filterFn);
    console.table(results);
  }
};

// Expor globalmente
window.DatabaseAdmin = DatabaseAdmin;

// Atalho: chamar admin = DatabaseAdmin.showDashboard()
Object.defineProperty(window, 'admin', {
  get: function() {
    DatabaseAdmin.showDashboard();
    return DatabaseAdmin;
  }
});
