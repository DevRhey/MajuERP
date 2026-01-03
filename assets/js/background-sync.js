/**
 * Background Sync Service
 * 
 * Fornece sincronização invisível em background sem reload de página
 * - Sincronização incremental (apenas dados que mudaram)
 * - Cache inteligente com invalidação automática
 * - Debounce para evitar múltiplas atualizações
 * - Sem percepção do usuário
 */

class BackgroundSync {
  constructor() {
    this.isRunning = false;
    this.syncInterval = null;
    this.lastSyncTime = {};
    this.pendingUpdates = new Map();
    this.debounceTimers = {};
    this.syncInProgress = false;
    
    // Intervalo mínimo entre sincronizações (ms)
    this.MIN_SYNC_INTERVAL = {
      eventos: 5000,      // A cada 5 segundos
      clientes: 15000,    // A cada 15 segundos
      itens: 15000,       // A cada 15 segundos
      financeiroTransacoes: 10000, // A cada 10 segundos
      operadores: 10000   // A cada 10 segundos
    };
    
    // Cache de dados anterior para comparação
    this.dataCache = {};
    
    // Callbacks para updates
    this.updateCallbacks = {};
    
    this.initialize();
  }

  initialize() {
    console.log('🔄 BackgroundSync initialized');
    this.setupStorageListener();
  }

  /**
   * Inicia sincronização em background
   * @param {number} interval - Intervalo em ms (padrão 3000)
   */
  start(interval = 3000) {
    if (this.isRunning) {
      console.log('⚠️ BackgroundSync já está rodando');
      return;
    }

    this.isRunning = true;
    console.log('▶️ BackgroundSync iniciado');

    // Realizar sync imediato
    this.syncAll();

    // Agendar sincronizações periódicas
    this.syncInterval = setInterval(() => {
      this.syncAll();
    }, interval);
  }

  /**
   * Para sincronização em background
   */
  stop() {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    console.log('⏹️ BackgroundSync parado');
  }

  /**
   * Sincroniza todos os dados que mudaram
   * Executa de forma não-bloqueante usando requestIdleCallback
   */
  syncAll() {
    if (this.syncInProgress) return;

    // Executar em idle callback para não bloquear UI
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => this.performSync(), { timeout: 1000 });
    } else {
      setTimeout(() => this.performSync(), 0);
    }
  }

  /**
   * Executa sincronização inteligente de dados
   */
  async performSync() {
    if (this.syncInProgress) return;
    this.syncInProgress = true;

    try {
      const dataTypes = ['eventos', 'clientes', 'itens', 'financeiroTransacoes', 'operadores'];

      for (const dataType of dataTypes) {
        const now = Date.now();
        const lastSync = this.lastSyncTime[dataType] || 0;
        const minInterval = this.MIN_SYNC_INTERVAL[dataType] || 5000;

        // Verificar se é hora de sincronizar este tipo de dado
        if (now - lastSync >= minInterval) {
          this.syncDataType(dataType);
        }
      }
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Sincroniza um tipo específico de dado
   * Usa comparação incremental para detectar mudanças
   */
  syncDataType(dataType) {
    try {
      const newData = Storage.get(dataType) || (Array.isArray(Storage.get(dataType)) ? [] : {});
      const oldData = this.dataCache[dataType];

      // Se há mudanças, notificar callbacks
      if (!oldData || JSON.stringify(oldData) !== JSON.stringify(newData)) {
        this.dataCache[dataType] = JSON.parse(JSON.stringify(newData));
        this.lastSyncTime[dataType] = Date.now();
        
        // Chamar callbacks registrados para este tipo de dado
        if (this.updateCallbacks[dataType]) {
          this.updateCallbacks[dataType].forEach(callback => {
            try {
              callback(newData);
            } catch (err) {
              console.error(`Erro em callback de ${dataType}:`, err);
            }
          });
        }

        console.log(`✅ ${dataType} sincronizado (mudanças detectadas)`);
      }
    } catch (err) {
      console.error(`Erro ao sincronizar ${dataType}:`, err);
    }
  }

  /**
   * Registra callback para ser chamado quando dados mudam
   */
  onUpdate(dataType, callback) {
    if (!this.updateCallbacks[dataType]) {
      this.updateCallbacks[dataType] = [];
    }
    this.updateCallbacks[dataType].push(callback);
    return () => {
      this.updateCallbacks[dataType] = this.updateCallbacks[dataType].filter(cb => cb !== callback);
    };
  }

  /**
   * Setup listener para storage updates
   * Dispara sincronização quando dados mudam externamente
   */
  setupStorageListener() {
    window.addEventListener('storageUpdate', (e) => {
      const { key } = e.detail;
      
      // Sincronizar imediatamente quando há update
      this.syncDataType(key);

      // Debounce de re-render (aguarda 100ms para agrupar múltiplas mudanças)
      if (this.debounceTimers[key]) {
        clearTimeout(this.debounceTimers[key]);
      }

      this.debounceTimers[key] = setTimeout(() => {
        if (window.app && app.modules[key === 'eventos' ? 'eventos' : key === 'clientes' ? 'clientes' : 'calendario']) {
          // Só re-render se estiver na página relevante
          if (app.currentPage === 'eventos' && key === 'eventos') {
            app.modules.eventos.renderIncremental?.();
          } else if (app.currentPage === 'calendario' && key === 'eventos') {
            app.modules.calendario.renderIncremental?.();
          } else if (app.currentPage === 'dashboard') {
            app.modules.dashboard.renderIncremental?.();
          }
        }
      }, 100);
    });
  }

  /**
   * Aguarda até que um tipo de dado seja sincronizado
   * Útil para garantir que dados estão atualizados
   */
  async waitForSync(dataType, timeout = 5000) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const checkInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        if (elapsed > timeout) {
          clearInterval(checkInterval);
          resolve(false);
        }
        const lastSync = this.lastSyncTime[dataType] || 0;
        if (lastSync > startTime) {
          clearInterval(checkInterval);
          resolve(true);
        }
      }, 50);
    });
  }

  /**
   * Retorna dados sincronizados em cache
   */
  getData(dataType) {
    return this.dataCache[dataType];
  }

  /**
   * Limpa cache forçando re-sync
   */
  clearCache(dataType) {
    if (dataType) {
      delete this.dataCache[dataType];
      this.lastSyncTime[dataType] = 0;
    } else {
      this.dataCache = {};
      this.lastSyncTime = {};
    }
  }

  /**
   * Retorna status atual da sincronização
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastSync: this.lastSyncTime,
      cache: Object.keys(this.dataCache),
      pendingUpdates: this.pendingUpdates.size
    };
  }

  /**
   * Destrói instância e limpa recursos
   */
  destroy() {
    this.stop();
    this.dataCache = {};
    this.updateCallbacks = {};
    this.lastSyncTime = {};
    Object.values(this.debounceTimers).forEach(timer => clearTimeout(timer));
    this.debounceTimers = {};
  }
}

// Instância global (inicializar quando app estiver pronto)
let backgroundSync = null;

// Função para inicializar após App estar ready
function initializeBackgroundSync() {
  if (!backgroundSync) {
    backgroundSync = new BackgroundSync();
    backgroundSync.start(3000); // Sync a cada 3 segundos
    console.log('✨ Sistema de Background Sync inicializado');
  }
  return backgroundSync;
}
