// IndexedDB Wrapper - Banco de Dados Local
// Suporta até 50MB de dados offline

class SimpleDB {
  constructor(dbName = 'ERP_DB', version = 2) {
    this.dbName = dbName;
    this.version = version;
    this.db = null;
    this.stores = ['clientes', 'itens', 'eventos', 'orcamentos', 'financeiroTransacoes'];
    this.isReady = false;
  }

  /**
   * Inicializar banco de dados
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error('❌ Erro ao abrir IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.isReady = true;
        console.log('✅ IndexedDB inicializado com sucesso');
        resolve(this.db);
      };

      // Criar/atualizar stores na primeira execução ou atualização de versão
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        console.log(`📦 Atualizando schema do banco (v${this.version})...`);
        
        this.stores.forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            const objectStore = db.createObjectStore(storeName, { 
              keyPath: 'id', 
              autoIncrement: true 
            });
            
            // Criar índices para buscas rápidas
            objectStore.createIndex('dataInicio', 'dataInicio', { unique: false });
            objectStore.createIndex('clienteId', 'clienteId', { unique: false });
            objectStore.createIndex('status', 'status', { unique: false });
            objectStore.createIndex('dataAtualizacao', 'dataAtualizacao', { unique: false });
            
            console.log(`  ✓ Store criado: ${storeName}`);
          }
        });
      };
    });
  }

  /**
   * Salvar ou atualizar documento
   */
  async save(storeName, data) {
    if (!this.db) throw new Error('DB não está inicializado');
    
    const tx = this.db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    
    // Adicionar timestamp de atualização
    const dataComTimestamp = {
      ...data,
      dataAtualizacao: new Date().toISOString()
    };
    
    return new Promise((resolve, reject) => {
      const request = data.id 
        ? store.put(dataComTimestamp)  // Atualizar
        : store.add(dataComTimestamp); // Inserir

      request.onsuccess = () => {
        console.log(`✅ Salvo em ${storeName}:`, data.id || 'novo');
        // Disparar evento de atualização
        window.dispatchEvent(new CustomEvent('dbUpdate', { 
          detail: { storeName, data: dataComTimestamp } 
        }));
        resolve(dataComTimestamp);
      };
      
      request.onerror = () => {
        console.error(`❌ Erro ao salvar em ${storeName}:`, request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Buscar todos os documentos de um store
   */
  async getAll(storeName) {
    if (!this.db) throw new Error('DB não está inicializado');
    
    const tx = this.db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        console.log(`📖 Lidos ${request.result.length} itens de ${storeName}`);
        resolve(request.result);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Buscar documento por ID
   */
  async get(storeName, id) {
    if (!this.db) throw new Error('DB não está inicializado');
    
    const tx = this.db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Buscar por índice (ex: por data, cliente, status)
   */
  async getByIndex(storeName, indexName, value) {
    if (!this.db) throw new Error('DB não está inicializado');
    
    const tx = this.db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    
    if (!store.indexNames.contains(indexName)) {
      console.warn(`⚠️ Índice ${indexName} não existe em ${storeName}`);
      return [];
    }
    
    const index = store.index(indexName);

    return new Promise((resolve, reject) => {
      const request = index.getAll(value);
      request.onsuccess = () => {
        console.log(`🔍 Encontrados ${request.result.length} itens com ${indexName}=${value}`);
        resolve(request.result);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Buscar com range (ex: datas entre X e Y)
   */
  async getRange(storeName, indexName, lower, upper) {
    if (!this.db) throw new Error('DB não está inicializado');
    
    const tx = this.db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const index = store.index(indexName);
    const range = IDBKeyRange.bound(lower, upper);

    return new Promise((resolve, reject) => {
      const request = index.getAll(range);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Deletar documento por ID
   */
  async delete(storeName, id) {
    if (!this.db) throw new Error('DB não está inicializado');
    
    const tx = this.db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => {
        console.log(`🗑️  Deletado de ${storeName}:`, id);
        window.dispatchEvent(new CustomEvent('dbUpdate', { 
          detail: { storeName, action: 'delete', id } 
        }));
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Buscar com filtro personalizado
   */
  async query(storeName, filterFn) {
    const dados = await this.getAll(storeName);
    return dados.filter(filterFn);
  }

  /**
   * Contar documentos
   */
  async count(storeName) {
    if (!this.db) throw new Error('DB não está inicializado');
    
    const tx = this.db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Limpar um store completamente
   */
  async clear(storeName) {
    if (!this.db) throw new Error('DB não está inicializado');
    
    const tx = this.db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => {
        console.log(`🧹 Store ${storeName} limpo`);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Exportar todos os dados para JSON (para backup)
   */
  async exportAll() {
    const backup = {
      timestamp: new Date().toISOString(),
      version: this.version,
      data: {}
    };

    for (const storeName of this.stores) {
      try {
        backup.data[storeName] = await this.getAll(storeName);
      } catch (error) {
        console.warn(`⚠️ Erro ao exportar ${storeName}:`, error);
        backup.data[storeName] = [];
      }
    }

    console.log('✅ Exportação completa realizada');
    return backup;
  }

  /**
   * Importar dados de backup JSON
   */
  async importAll(backup) {
    console.log('📥 Iniciando importação de backup...');
    
    for (const [storeName, items] of Object.entries(backup.data || {})) {
      if (!this.stores.includes(storeName)) continue;
      
      try {
        for (const item of items) {
          await this.save(storeName, item);
        }
        console.log(`  ✓ ${items.length} itens importados em ${storeName}`);
      } catch (error) {
        console.error(`  ✗ Erro ao importar ${storeName}:`, error);
      }
    }
    
    console.log('✅ Importação concluída');
  }

  /**
   * Sincronizar IndexedDB com localStorage (para backup)
   */
  async syncToLocalStorage() {
    console.log('💾 Sincronizando para localStorage...');
    
    for (const storeName of this.stores) {
      const dados = await this.getAll(storeName);
      localStorage.setItem(storeName, JSON.stringify(dados));
    }
    
    console.log('✅ Sincronização concluída');
  }

  /**
   * Restaurar de localStorage para IndexedDB
   */
  async syncFromLocalStorage() {
    console.log('📤 Restaurando do localStorage...');
    
    for (const storeName of this.stores) {
      const json = localStorage.getItem(storeName);
      if (!json) continue;
      
      try {
        const dados = JSON.parse(json);
        for (const item of dados) {
          await this.save(storeName, item);
        }
        console.log(`  ✓ ${dados.length} itens restaurados em ${storeName}`);
      } catch (error) {
        console.warn(`  ⚠️ Erro ao restaurar ${storeName}:`, error);
      }
    }
    
    console.log('✅ Restauração concluída');
  }

  /**
   * Obter estatísticas do banco
   */
  async getStats() {
    const stats = {
      timestamp: new Date().toISOString(),
      stores: {}
    };

    for (const storeName of this.stores) {
      try {
        stats.stores[storeName] = {
          count: await this.count(storeName),
          sampleData: (await this.getAll(storeName)).slice(0, 1)
        };
      } catch (error) {
        stats.stores[storeName] = { error: error.message };
      }
    }

    return stats;
  }
}

// Criar instância global
const simpleDB = new SimpleDB();

// Exportar para uso global
window.SimpleDB = SimpleDB;
window.simpleDB = simpleDB;
