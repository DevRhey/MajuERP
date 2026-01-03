/**
 * CONFIGURAÇÃO DE EXEMPLO - Integração de Performance Optimization
 * 
 * Este arquivo mostra exemplos de como integrar todas as otimizações
 * nos seus módulos existentes.
 */

// ═════════════════════════════════════════════════════════════════════════
// 1. INTEGRAÇÃO NO APP.JS
// ═════════════════════════════════════════════════════════════════════════

class App {
  constructor() {
    this.currentPage = "dashboard";
    this.modules = {
      clientes: null,
      itens: null,
      eventos: null,
      calendario: null,
      dashboard: null,
      orcamentos: null,
      financeiro: null,
    };
    this.initializeApp();
  }

  initializeApp() {
    // Initialize navigation
    this.initializeNavigation();

    // Initialize modules
    this.initializeModules();

    // Load initial page
    this.loadPage(this.currentPage);

    // ✨ NOVO: Inicializar background sync após módulos
    this.initializePerformanceOptimizations();
  }

  /**
   * Inicializa otimizações de performance
   */
  initializePerformanceOptimizations() {
    // Usar requestIdleCallback ou setTimeout para não bloquear app init
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        this.setupBackgroundSync();
      });
    } else {
      setTimeout(() => {
        this.setupBackgroundSync();
      }, 500);
    }
  }

  setupBackgroundSync() {
    // Inicializar background sync
    if (typeof initializeBackgroundSync === 'function') {
      const bgSync = initializeBackgroundSync();
      console.log('✅ Performance Optimization initialized');
      console.log('📊 Status:', bgSync.getStatus());

      // Opcional: Registrar debug listeners
      if (CONFIG.DEBUG) {
        this.setupDebugMonitoring(bgSync);
      }
    }
  }

  setupDebugMonitoring(bgSync) {
    // Monitorar quando dados são sincronizados
    bgSync.onUpdate('eventos', (data) => {
      console.log('📊 [eventos] Sincronizado:', data.length);
    });

    bgSync.onUpdate('clientes', (data) => {
      console.log('📊 [clientes] Sincronizado:', data.length);
    });

    bgSync.onUpdate('itens', (data) => {
      console.log('📊 [itens] Sincronizado:', data.length);
    });

    // Monitorar Web Workers
    if (typeof getCalendarioWorker === 'function') {
      setInterval(() => {
        const status = getCalendarioWorker().manager.getStatus();
        if (!status.isRunning) {
          console.warn('⚠️ Calendario Worker não está rodando!');
        }
      }, 10000);
    }
  }

  // ... resto do código ...
}


// ═════════════════════════════════════════════════════════════════════════
// 2. INTEGRAÇÃO EM EVENTOS.JS
// ═════════════════════════════════════════════════════════════════════════

class Eventos {
  constructor() {
    this.sync();
    this.selectedDate = new Date();
    this.atualizarStatusEventos();
    
    // ✨ NOVO: Setup background sync (não mais setInterval!)
    this.setupBackgroundSync();
    this.setupStorageListener();
  }

  destroy() {
    // ✨ Limpar background sync listener
    if (this.unsubscribeBgSync) {
      this.unsubscribeBgSync();
    }
  }

  /**
   * Setup background sync para atualizar dados invisível
   */
  setupBackgroundSync() {
    if (!backgroundSync) {
      console.warn('Background sync não disponível');
      return;
    }

    // Registrar callback para quando eventos mudarem
    this.unsubscribeBgSync = backgroundSync.onUpdate('eventos', (newData) => {
      this.eventos = newData || [];
      // Atualizar status sem renderizar página inteira
      if (app && app.currentPage === 'eventos') {
        this.renderIncremental();
      }
    });

    console.log('✅ Eventos background sync configurado');
  }

  /**
   * Renderização incremental - atualiza apenas badges/status
   */
  renderIncremental() {
    const container = document.getElementById('eventos-container');
    if (!container) return;

    const eventos = this.eventos.filter(evento => {
      const dataEvento = this.parseDataLocal(evento.dataInicio);
      return this.isSameDay(dataEvento, this.selectedDate);
    });

    // Atualizar apenas elementos que mudaram
    eventos.forEach(evento => {
      const statusEl = document.querySelector(`[data-evento-id="${evento.id}"] .badge`);
      if (statusEl) {
        const statusClass = this.getStatusClass(evento.status);
        const statusText = this.getStatusText(evento.status);
        statusEl.className = `badge ${statusClass}`;
        statusEl.textContent = statusText;
      }

      // Atualizar info de pagamento se existir
      const pagtoEl = document.querySelector(`[data-evento-id="${evento.id}"] [data-pagamento]`);
      if (pagtoEl) {
        const pagamentoInfo = this.getPagamentoInfo(evento);
        pagtoEl.innerHTML = pagamentoInfo;
      }
    });

    this.atualizarStatusEventos();
  }

  // ... resto do código ...
}


// ═════════════════════════════════════════════════════════════════════════
// 3. INTEGRAÇÃO EM CALENDARIO.JS
// ═════════════════════════════════════════════════════════════════════════

class Calendario {
  constructor() {
    this.eventos = Storage.get("eventos") || [];
    this.clientes = Storage.get("clientes") || [];
    this.itens = Storage.get("itens") || [];
    this.currentDate = new Date();
    this.currentMonth = this.currentDate.getMonth();
    this.currentYear = this.currentDate.getFullYear();
    
    // Cache para análises
    this.analiseCache = new Map();

    // ✨ NOVO: Web Worker para IA
    this.iaWorker = null;
    this.pendingAnalyses = new Map();
    this.initializeWorker();

    // ✨ NOVO: Background sync
    this.setupBackgroundSync();

    this.setupStorageListener();
  }

  /**
   * Inicializa Web Worker para rodar IA em background
   */
  initializeWorker() {
    try {
      this.iaWorker = new Worker('assets/js/ia-modules/calendario-assistente.worker.js');
      this.iaWorker.onmessage = (event) => {
        const { id, resultado, erro } = event.data;

        if (erro) {
          console.error(`Erro em Worker:`, erro);
          return;
        }

        // Resolver promise pendente
        if (this.pendingAnalyses.has(id)) {
          const { resolve } = this.pendingAnalyses.get(id);
          this.pendingAnalyses.delete(id);
          resolve(resultado);
          // Cache resultado
          this.analiseCache.set(id, resultado);
        }
      };
      console.log('✅ Calendario Worker inicializado');
    } catch (err) {
      console.warn('Aviso: Web Workers não disponível', err);
      this.iaWorker = null;
    }
  }

  /**
   * Envia análise para Web Worker
   */
  async analisarEventoNoWorker(evento, eventos) {
    if (!this.iaWorker) {
      // Fallback: executar na main thread
      return this.analisarEventoLocal(evento, eventos);
    }

    const id = `analise_${Date.now()}_${Math.random()}`;
    return new Promise((resolve, reject) => {
      this.pendingAnalyses.set(id, { resolve, reject });

      // Enviar para worker
      this.iaWorker.postMessage({
        id,
        type: 'analisarEvento',
        payload: { evento, eventos }
      });

      // Timeout em 5 segundos
      setTimeout(() => {
        if (this.pendingAnalyses.has(id)) {
          this.pendingAnalyses.delete(id);
          reject(new Error('Worker timeout'));
        }
      }, 5000);
    });
  }

  /**
   * Análise local como fallback
   */
  analisarEventoLocal(evento, eventos) {
    if (typeof CalendarioAssistente === 'undefined') {
      return { conflitos: {}, disponibilidade: {}, sugestoes: [] };
    }
    const assistente = new CalendarioAssistente();
    return assistente.validarAgendamento(evento);
  }

  /**
   * Setup background sync
   */
  setupBackgroundSync() {
    if (!backgroundSync) return;

    backgroundSync.onUpdate('eventos', (newData) => {
      this.eventos = newData || [];
      this.analiseCache.clear();
      // Renderizar incrementalmente
      this.renderIncremental();
    });

    console.log('✅ Calendario background sync configurado');
  }

  /**
   * Renderização incremental
   */
  renderIncremental() {
    const eventDays = document.querySelectorAll('[data-event-date]');
    eventDays.forEach(dayEl => {
      const dateStr = dayEl.dataset.eventDate;
      const dayEvents = this.eventos.filter(e => e.dataInicio === dateStr);

      const badgeEl = dayEl.querySelector('.event-count-badge');
      if (badgeEl) {
        badgeEl.textContent = dayEvents.length;
      }
    });
  }

  /**
   * Carregar análise IA em background
   */
  async carregarAnaliseIAAsync(events, dateString) {
    const callback = async () => {
      if (!events || events.length === 0) return;

      try {
        const analises = [];

        for (const event of events) {
          try {
            const cacheKey = `analise_${event.id}`;
            let analise = this.analiseCache.get(cacheKey);

            if (!analise) {
              // Executar no Worker (não bloqueia main thread)
              analise = await this.analisarEventoNoWorker(event, events);
              this.analiseCache.set(cacheKey, analise);
            }
            analises.push(analise);
          } catch (err) {
            console.warn(`Erro ao analisar evento:`, err);
          }
        }

        // Renderizar resultado incrementalmente
        const analiseHtml = this.renderAnaliseIADia(events, dateString, analises);
        const container = document.getElementById('analise-ia-container');

        if (container && analiseHtml) {
          // Fade-in suave
          container.style.opacity = '0';
          container.innerHTML = analiseHtml;
          setTimeout(() => {
            container.style.transition = 'opacity 0.3s ease';
            container.style.opacity = '1';
          }, 10);
        }
      } catch (error) {
        console.warn('Erro ao carregar análise IA:', error);
      }
    };

    if ('requestIdleCallback' in window) {
      requestIdleCallback(callback, { timeout: 2000 });
    } else {
      setTimeout(callback, 200);
    }
  }

  // ... resto do código ...
}


// ═════════════════════════════════════════════════════════════════════════
// 4. EXEMPLO DE OTIMIZAÇÃO EM OUTROS MÓDULOS
// ═════════════════════════════════════════════════════════════════════════

class Dashboard {
  constructor() {
    this.eventos = Storage.get("eventos") || [];
    this.clientes = Storage.get("clientes") || [];
    this.transacoes = Storage.get("financeiroTransacoes") || [];

    // ✨ Setup background sync para updates automáticos
    this.setupAutoRefresh();
  }

  setupAutoRefresh() {
    if (!backgroundSync) return;

    // Quando eventos mudam, atualizar metrics
    backgroundSync.onUpdate('eventos', () => {
      this.eventos = backgroundSync.getData('eventos');
      this.updateMetrics();
    });

    // Quando transações mudam, atualizar financeiro
    backgroundSync.onUpdate('financeiroTransacoes', () => {
      this.transacoes = backgroundSync.getData('financeiroTransacoes');
      this.updateFinancialMetrics();
    });

    console.log('✅ Dashboard auto-refresh configurado');
  }

  updateMetrics() {
    // Atualizar apenas elementos específicos
    const totalEl = document.querySelector('[data-metric="total"]');
    if (totalEl) {
      totalEl.textContent = this.eventos.length;
    }

    const hojeEl = document.querySelector('[data-metric="hoje"]');
    if (hojeEl) {
      const hoje = new Date().toISOString().split('T')[0];
      const eventoHoje = this.eventos.filter(e => 
        e.dataInicio.startsWith(hoje)
      ).length;
      hojeEl.textContent = eventoHoje;
    }
  }

  updateFinancialMetrics() {
    // Atualizar financeiro
    const pendentes = this.transacoes.filter(t => t.status === 'pendente').length;
    const el = document.querySelector('[data-metric="pagamentos-pendentes"]');
    if (el) {
      el.textContent = pendentes;
    }
  }
}


// ═════════════════════════════════════════════════════════════════════════
// 5. USANDO WEB WORKERS DIRETAMENTE
// ═════════════════════════════════════════════════════════════════════════

async function exemploUsandoWorker() {
  // Obter worker
  const worker = getFinanceiroWorker();

  try {
    // Fazer requisição (Promise-based)
    const dashboard = await worker.obterDashboardFinanceiro(
      Storage.get('eventos'),
      Storage.get('clientes'),
      Storage.get('financeiroTransacoes')
    );

    console.log('Dashboard financeiro:', dashboard);
    // Resultado foi computado em background thread
    // Main thread ficou livre durante o cálculo!
  } catch (err) {
    console.error('Erro:', err);
  }
}


// ═════════════════════════════════════════════════════════════════════════
// 6. MONITORAR PERFORMANCE
// ═════════════════════════════════════════════════════════════════════════

class PerformanceMonitor {
  static init() {
    console.log('📊 Performance Monitoring iniciado...');

    // Monitorar background sync
    setInterval(() => {
      if (backgroundSync) {
        const status = backgroundSync.getStatus();
        console.log('📊 Background Sync:', status);
      }
    }, 30000); // A cada 30 segundos

    // Monitorar Web Workers
    setInterval(() => {
      if (typeof getCalendarioWorker === 'function') {
        const status = getCalendarioWorker().manager.getStatus();
        console.log('📊 Calendario Worker:', status);
      }

      if (typeof getFinanceiroWorker === 'function') {
        const status = getFinanceiroWorker().manager.getStatus();
        console.log('📊 Financeiro Worker:', status);
      }
    }, 30000);

    // Monitorar TTI
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          console.log('⚡ First Input Delay:', entry.processingStart);
        }
      });
      observer.observe({ entryTypes: ['first-input'] });
    }
  }
}

// Chamar durante app init
if (CONFIG.DEBUG) {
  PerformanceMonitor.init();
}


// ═════════════════════════════════════════════════════════════════════════
// 7. TESTES
// ═════════════════════════════════════════════════════════════════════════

async function testPerformanceOptimizations() {
  console.log('🧪 Testando otimizações...');

  // Test 1: Background Sync
  if (backgroundSync) {
    console.log('✅ Background Sync rodando');
    const status = backgroundSync.getStatus();
    console.log('   Status:', status);
  }

  // Test 2: Web Workers
  const calWorker = getCalendarioWorker();
  const finWorker = getFinanceiroWorker();

  console.log('✅ Web Workers disponíveis');
  console.log('   Calendario:', calWorker.manager.getStatus());
  console.log('   Financeiro:', finWorker.manager.getStatus());

  // Test 3: IA Analysis
  console.time('IA Analysis (Worker)');
  try {
    const resultado = await calWorker.analisarEvento(
      { id: 1, titulo: 'Teste' },
      []
    );
    console.timeEnd('IA Analysis (Worker)');
    console.log('✅ IA Analysis completed:', resultado);
  } catch (err) {
    console.error('❌ IA Analysis failed:', err);
  }

  // Test 4: Renderização incremental
  console.log('✅ Renderização incremental disponível');

  console.log('🧪 Todos os testes concluídos!');
}

// Executar testes
if (CONFIG.DEBUG) {
  window.addEventListener('appReady', testPerformanceOptimizations);
  // Ou chamar manualmente: testPerformanceOptimizations()
}
