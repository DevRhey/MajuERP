/**
 * Web Workers Manager
 * 
 * Interface simplificada para gerenciar Web Workers
 * - Gerencia lifecycle de workers
 * - Promise-based API para message passing
 * - Automatic error handling e timeouts
 * - Caching de resultados
 */

class WorkerManager {
  constructor(workerPath) {
    this.workerPath = workerPath;
    this.worker = null;
    this.pendingRequests = new Map();
    this.requestId = 0;
    this.cache = new Map();
    this.cacheEnabled = true;
    this.cacheTTL = 300000; // 5 minutos padrão
    this.isRunning = false;
    
    this.initialize();
  }

  /**
   * Inicializa worker
   */
  initialize() {
    try {
      this.worker = new Worker(this.workerPath);
      this.worker.onmessage = this.handleWorkerMessage.bind(this);
      this.worker.onerror = this.handleWorkerError.bind(this);
      this.isRunning = true;
      console.log(`✅ Worker ${this.workerPath} inicializado`);
    } catch (err) {
      console.error(`❌ Erro ao inicializar worker ${this.workerPath}:`, err);
      this.isRunning = false;
      this.worker = null;
    }
  }

  /**
   * Envia mensagem para worker e aguarda resultado (Promise-based)
   */
  async send(type, payload, timeout = 5000) {
    if (!this.isRunning || !this.worker) {
      throw new Error('Worker não está disponível');
    }

    // Verificar cache
    const cacheKey = `${type}:${JSON.stringify(payload)}`;
    if (this.cacheEnabled && this.cache.has(cacheKey)) {
      const { result, timestamp } = this.cache.get(cacheKey);
      if (Date.now() - timestamp < this.cacheTTL) {
        return result;
      } else {
        this.cache.delete(cacheKey);
      }
    }

    const id = ++this.requestId;
    
    return new Promise((resolve, reject) => {
      const timeoutHandle = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Worker timeout (${timeout}ms)`));
      }, timeout);

      this.pendingRequests.set(id, {
        resolve: (result) => {
          clearTimeout(timeoutHandle);
          // Cache resultado
          if (this.cacheEnabled) {
            this.cache.set(cacheKey, {
              result,
              timestamp: Date.now()
            });
          }
          resolve(result);
        },
        reject: (error) => {
          clearTimeout(timeoutHandle);
          reject(error);
        }
      });

      this.worker.postMessage({
        id,
        type,
        payload
      });
    });
  }

  /**
   * Handle message do worker
   */
  handleWorkerMessage(event) {
    const { id, type, resultado, erro } = event.data;

    if (!this.pendingRequests.has(id)) {
      console.warn(`Recebido mensagem com ID desconhecido: ${id}`);
      return;
    }

    const { resolve, reject } = this.pendingRequests.get(id);
    this.pendingRequests.delete(id);

    if (erro) {
      reject(new Error(erro));
    } else {
      resolve(resultado);
    }
  }

  /**
   * Handle erro do worker
   */
  handleWorkerError(error) {
    console.error('Worker error:', error);
    
    // Rejeitar todas requisições pendentes
    this.pendingRequests.forEach(({ reject }) => {
      reject(new Error(`Worker error: ${error.message}`));
    });
    this.pendingRequests.clear();
    
    this.isRunning = false;
  }

  /**
   * Limpar cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Parar worker
   */
  terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.isRunning = false;
      console.log(`⏹️ Worker ${this.workerPath} finalizado`);
    }
  }

  /**
   * Obter status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      pendingRequests: this.pendingRequests.size,
      cacheSize: this.cache.size
    };
  }
}

/**
 * Wrapper simplificado para Calendar Assistant Worker
 */
class CalendarioAssistenteWorker {
  constructor() {
    this.manager = new WorkerManager('assets/js/ia-modules/calendario-assistente.worker.js');
  }

  async analisarEvento(evento, eventos) {
    return this.manager.send('analisarEvento', { evento, eventos });
  }

  async verificarConflitos(evento, eventos) {
    return this.manager.send('verificarConflitos', { evento, eventos });
  }

  async analisarDisponibilidade(evento, eventos) {
    return this.manager.send('analisarDisponibilidade', { evento, eventos });
  }

  clearCache() {
    this.manager.clearCache();
  }

  terminate() {
    this.manager.terminate();
  }
}

/**
 * Wrapper simplificado para Financial Assistant Worker
 */
class FinanceiroAssistenteWorker {
  constructor() {
    this.manager = new WorkerManager('assets/js/ia-modules/financeiro-assistente.worker.js');
  }

  async obterDashboardFinanceiro(eventos, clientes, transacoes) {
    return this.manager.send('obterDashboardFinanceiro', { eventos, clientes, transacoes });
  }

  async gerarRelatorioFinanceiro(eventos, transacoes, periodo) {
    return this.manager.send('gerarRelatorioFinanceiro', { eventos, transacoes, periodo });
  }

  async analisarRiscoInadimplencia(clienteId, clientes, transacoes) {
    return this.manager.send('analisarRiscoInadimplencia', { clienteId, clientes, transacoes });
  }

  async analisarRiscoGeral(eventos, transacoes) {
    return this.manager.send('analisarRiscoGeral', { eventos, transacoes });
  }

  clearCache() {
    this.manager.clearCache();
  }

  terminate() {
    this.manager.terminate();
  }
}

// Instâncias globais (lazy load)
let calendarioWorker = null;
let financeiroWorker = null;

function getCalendarioWorker() {
  if (!calendarioWorker) {
    calendarioWorker = new CalendarioAssistenteWorker();
  }
  return calendarioWorker;
}

function getFinanceiroWorker() {
  if (!financeiroWorker) {
    financeiroWorker = new FinanceiroAssistenteWorker();
  }
  return financeiroWorker;
}
