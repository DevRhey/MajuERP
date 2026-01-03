// Calendario Module

class Calendario {
  constructor() {
    this.eventos = Storage.get("eventos") || [];
    this.clientes = Storage.get("clientes") || [];
    this.itens = Storage.get("itens") || [];
    this.currentDate = new Date();
    this.currentMonth = this.currentDate.getMonth();
    this.currentYear = this.currentDate.getFullYear();
    // Cache em memória para análises da IA por data
    this.analiseCache = new Map();
    // IA centralizada
    this.iaOrchestrator = typeof iaOrchestrator !== 'undefined' ? iaOrchestrator : null;
    
    // ✨ Web Worker para análises em background
    this.iaWorker = null;
    this.pendingAnalyses = new Map();
    this.initializeWorker();
    
    this.setupStorageListener();
    this.setupBackgroundSync();
  }

  /**
   * Inicializa Web Worker para rodar IA em background thread
   * Não bloqueia main thread enquanto calcula
   */
  initializeWorker() {
    try {
      this.iaWorker = new Worker('assets/js/ia-modules/calendario-assistente.worker.js');
      this.iaWorker.onmessage = (event) => {
        const { id, type, resultado, erro } = event.data;

        if (erro) {
          console.error(`Erro em Worker (${id}):`, erro);
          return;
        }

        // Resolver promise pendente
        if (this.pendingAnalyses.has(id)) {
          const { resolve, reject } = this.pendingAnalyses.get(id);
          this.pendingAnalyses.delete(id);
          
          if (type === 'erro') {
            reject(new Error(erro));
          } else {
            resolve(resultado);
            // Cache resultado
            this.analiseCache.set(id, resultado);
          }
        }
      };
      console.log('🔄 Web Worker (Calendario) inicializado');
    } catch (err) {
      console.error('Erro ao inicializar Worker:', err);
      this.iaWorker = null;
    }
  }

  /**
   * Envia análise para Web Worker (executa em background)
   */
  async analisarEventoNoWorker(evento, eventos) {
    // Preferir orquestrador central
    if (this.iaOrchestrator && this.iaOrchestrator.analisarEventoCalendario) {
      return this.iaOrchestrator.analisarEventoCalendario(evento, eventos);
    }

    if (!this.iaWorker) {
      // Fallback: executar na main thread (não ideal)
      return this.analisarEventoLocal(evento, eventos);
    }

    const id = `analise_${Date.now()}_${Math.random()}`;
    return new Promise((resolve, reject) => {
      this.pendingAnalyses.set(id, { resolve, reject });
      this.iaWorker.postMessage({
        id,
        type: 'analisarEvento',
        payload: { evento, eventos }
      });
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
   * Setup background sync para atualizar dados invisível
   */
  setupBackgroundSync() {
    if (typeof backgroundSync === 'undefined' || !backgroundSync) return;

    backgroundSync.onUpdate('eventos', (newData) => {
      this.eventos = newData || [];
      // Limpar análise cache para forçar re-análise
      this.analiseCache.clear();
      // Renderizar incrementalmente (sem reload de página)
      this.renderIncremental();
    });
  }

  setupStorageListener() {
    window.addEventListener('storageUpdate', (e) => {
      const { key } = e.detail;
      // Sincronizar quando dados relacionados mudam
      if (key === 'eventos' || key === 'clientes' || key === 'itens') {
        this.sync();
        // Limpar cache de análise quando eventos mudam
        if (key === 'eventos') {
          this.analiseCache.clear();
          if (typeof iaCache !== 'undefined' && iaCache) {
            iaCache.clearByType('conflitos');
            iaCache.clearByType('risco');
          }
        }
        if (app && app.currentPage === 'calendario') {
          this.renderIncremental();
        }
      }
    });
  }

  sync() {
    this.eventos = Storage.get("eventos") || [];
    this.clientes = Storage.get("clientes") || [];
    this.itens = Storage.get("itens") || [];
  }

  /**
   * Renderização incremental - atualiza apenas badges/status visíveis
   * Completamente invisível ao usuário
   */
  renderIncremental() {
    const eventDays = document.querySelectorAll('[data-event-date]');
    eventDays.forEach(dayEl => {
      const dateStr = dayEl.dataset.eventDate;
      const dayEvents = this.eventos.filter(e => e.dataInicio === dateStr);
      
      // Atualizar badge de contagem
      const badgeEl = dayEl.querySelector('.event-count-badge');
      if (badgeEl) {
        badgeEl.textContent = dayEvents.length;
      }
    });
  }

  // Função utilitária para converter string de data para objeto Date no horário local
  parseDataLocal(isoDateStr) {
    const [ano, mes, dia] = isoDateStr.split("-").map(Number);
    return new Date(ano, mes - 1, dia);
  }

  render() {
    // Sincronizar dados antes de renderizar
    this.sync();
    
    const mainContent = document.getElementById("main-content");
    mainContent.innerHTML = `
            <div class="container">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h2>Calendário de Eventos</h2>
                    <div>
                        <button class="btn btn-outline-primary" onclick="app.modules.calendario.previousMonth()">
                            <i class="bi bi-chevron-left"></i>
                        </button>
                        <span class="mx-3" id="current-month-year"></span>
                        <button class="btn btn-outline-primary" onclick="app.modules.calendario.nextMonth()">
                            <i class="bi bi-chevron-right"></i>
                        </button>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-body">
                        <div class="calendar">
                            <div class="calendar-header">
                                <div>Domingo</div>
                                <div>Segunda</div>
                                <div>Terça</div>
                                <div>Quarta</div>
                                <div>Quinta</div>
                                <div>Sexta</div>
                                <div>Sábado</div>
                            </div>
                            <div class="calendar-body" id="calendar-body">
                                ${this.renderCalendarDays()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

    this.updateMonthYearDisplay();
  }

  renderCalendarDays() {
    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
    const startingDay = firstDay.getDay();
    const totalDays = lastDay.getDate();

    let daysHtml = "";
    let dayCount = 1;

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      daysHtml += '<div class="calendar-day empty"></div>';
    }

    // Add cells for each day of the month
    while (dayCount <= totalDays) {
      const currentDate = new Date(
        this.currentYear,
        this.currentMonth,
        dayCount
      );
      const dateStr = `${currentDate.getFullYear()}-${String(
        currentDate.getMonth() + 1
      ).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`;
      const hasEvents = this.hasEventsOnDate(currentDate);
      const events = this.getEventsOnDate(currentDate);

      daysHtml += `
                <div class="calendar-day ${hasEvents ? "has-events" : ""}" 
                     data-date="${dateStr}"
                     onclick="app.modules.calendario.showDayEvents('${dateStr}')">
                    <div class="day-number">${dayCount}</div>
                    ${
                      hasEvents
                        ? `
                            <div class="event-indicator">
                                <i class="bi bi-calendar-event"></i>
                                <span class="event-count">${
                                  events.length
                                }</span>
                            </div>
                            <div class="event-preview">
                                ${this.renderEventPreview(events)}
                            </div>
                        `
                        : ""
                    }
                </div>
            `;

      dayCount++;
    }

    return daysHtml;
  }

  renderEventPreview(events) {
    return events
      .slice(0, 2)
      .map((evento) => {
        const cliente = this.getClienteNome(evento.clienteId);
        const statusClass = this.getStatusClass(evento.status);
        return `
                <div class="event-preview-item ${statusClass}">
                    <small>
                        <span class="event-time">${evento.horaInicio}</span>
                        <span class="event-client">${cliente}</span>
                    </small>
                </div>
            `;
      })
      .join("");
  }

  hasEventsOnDate(date) {
    if (!this.eventos || this.eventos.length === 0) return false;
    return this.eventos.some((evento) => {
      const eventoDate = this.parseDataLocal(evento.dataInicio);
      return (
        eventoDate.getDate() === date.getDate() &&
        eventoDate.getMonth() === date.getMonth() &&
        eventoDate.getFullYear() === date.getFullYear()
      );
    });
  }

  getEventsOnDate(date) {
    if (!this.eventos || this.eventos.length === 0) return [];
    return this.eventos.filter((evento) => {
      const eventoDate = this.parseDataLocal(evento.dataInicio);
      return (
        eventoDate.getDate() === date.getDate() &&
        eventoDate.getMonth() === date.getMonth() &&
        eventoDate.getFullYear() === date.getFullYear()
      );
    });
  }

  showDayEvents(dateString) {
    // Sincronizar dados antes de mostrar eventos
    this.sync();
    
    // Re-sincronizar uma segunda vez com pequeno delay para garantir dados frescos
    // (caso haja operações pendentes no localStorage)
    setTimeout(() => {
      this.sync();
    }, 0);
    
    // Garantir formato local YYYY-MM-DD
    const [y, m, d] = dateString.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    
    if (isNaN(date.getTime())) {
      console.error("Data inválida:", dateString);
      return;
    }
    
    // Sincronizar novamente antes de buscar eventos (garantir dados mais recentes)
    this.sync();
    const events = this.getEventsOnDate(date);
    
    console.log(`[Calendário] Mostrando eventos para ${dateString}:`, events.length, 'eventos encontrados');

    const eventsHtml = `
            <div class="card">
                <div class="card-header">
                    <h5 class="mb-0">Eventos em ${DateUtils.formatDate(
                      date
                    )}</h5>
                </div>
                <div class="card-body">
                    ${
                      events.length > 0
                        ? this.renderEventsList(events)
                        : "<p>Nenhum evento para esta data.</p>"
                    }
                    
                    <!-- Análise IA será carregada aqui após a modal abrir -->
                    <div id="analise-ia-container"></div>
                    
                    <div class="text-end mt-3">
                        <button class="btn btn-primary" onclick="app.modules.eventos.showForm(null, '${dateString}')">
                            <i class="bi bi-plus-circle"></i> Novo Evento
                        </button>
                    </div>
                </div>
            </div>
        `;

    UI.showModal(`Eventos - ${DateUtils.formatDate(date)}`, eventsHtml, true);
    
    // ✨ Carregar análise IA de forma invisível usando Web Worker
    this.carregarAnaliseIAAsync(events, dateString);
    
    // Garantir sincronização após fechar a modal
    const modalElement = document.getElementById("dynamicModal");
    if (modalElement) {
      modalElement.addEventListener('hidden.bs.modal', () => {
        this.sync();
        // Renderização incremental em vez de reload total
        this.renderIncremental();
      });
    }
  }

  /**
   * Carrega análise IA em background usando Web Worker
   * Não bloqueia UI, usuário não percebe carregamento
   */
  async carregarAnaliseIAAsync(events, dateString) {
    // Usar requestIdleCallback para não bloquear UI crítica
    const callback = async () => {
      if (!events || events.length === 0) return;
      
      try {
        // Enviar para Web Worker (executa em background)
        const analises = [];
        
        for (const event of events) {
          try {
            // Check cache first
            const cacheKey = `analise_${event.id}`;
            let analise = this.analiseCache.get(cacheKey);
            
            if (!analise) {
              // Executar no Worker (não bloqueia main thread)
              analise = await this.analisarEventoNoWorker(event, events);
              this.analiseCache.set(cacheKey, analise);
            }
            analises.push(analise);
          } catch (err) {
            console.warn(`Erro ao analisar evento ${event.id}:`, err);
          }
        }

        // Renderizar resultado incrementalmente
        const analiseHtml = this.renderAnaliseIADia(events, dateString, analises);
        const container = document.getElementById('analise-ia-container');
        
        if (container && analiseHtml) {
          // Fade-in suave
          container.style.opacity = '0';
          container.innerHTML = analiseHtml;
          // Smooth fade-in
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

  renderEventsList(events) {
    return `
            <div class="list-group">
                ${events
                  .map((evento) => {
                    const statusClass = this.getStatusClass(evento.status);
                    const statusText = this.getStatusText(evento.status);
                    const cliente = this.getClienteNome(evento.clienteId);
                    const itensDetalhados = this.renderItensDetalhados(
                      evento.itens
                    );

                    return `
                        <div class="list-group-item ${statusClass}">
                            <div class="d-flex justify-content-between align-items-start">
                                <div class="flex-grow-1">
                                    <h6 class="mb-1">${evento.horaInicio} - ${
                      evento.horaFim
                    }</h6>
                                    <p class="mb-1"><strong>Evento:</strong> ${evento.nome || "Sem nome"}</p>
                                    <p class="mb-1"><strong>Cliente:</strong> ${cliente}</p>
                                    <div class="mb-2">
                                        <strong>Itens Alugados:</strong>
                                        <ul class="list-unstyled ms-3">
                                            ${itensDetalhados}
                                        </ul>
                                    </div>
                                    <div class="mb-2">
                                        <strong>Valor Total:</strong> R$ ${evento.valorTotal.toFixed(
                                          2
                                        )}
                                    </div>
                                    ${
                                      evento.observacoes
                                        ? `
                                        <div class="mb-2">
                                            <strong>Observações:</strong>
                                            <p class="mb-0">${evento.observacoes}</p>
                                        </div>
                                    `
                                        : ""
                                    }
                                </div>
                                <div class="ms-3">
                                    <span class="badge ${statusClass}">${statusText}</span>
                                    <div class="mt-2">
                                        <button class="btn btn-sm btn-info" onclick="app.modules.eventos.editEvento(${
                                          evento.id
                                        })">
                                            <i class="bi bi-pencil"></i>
                                        </button>
                                        <button class="btn btn-sm btn-danger" onclick="app.modules.eventos.deleteEvento(${
                                          evento.id
                                        })">
                                            <i class="bi bi-trash"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                  })
                  .join("")}
            </div>
        `;
  }

  renderItensDetalhados(itens) {
    return itens
      .map((item) => {
        const itemObj = this.itens.find((i) => i.id === item.id);
        if (!itemObj) return "";

        return `
        <li>
          <i class="bi bi-check-circle-fill text-success me-2"></i>
          ${itemObj.nome} - ${item.quantidade} unidade(s)
          <small class="text-muted">(R$ ${itemObj.valorDiaria.toFixed(
            2
          )}/dia)</small>
        </li>
      `;
      })
      .join("");
  }

  getClienteNome(clienteId) {
    const cliente = this.clientes.find((c) => c.id === clienteId);
    return cliente ? cliente.nome : "Cliente não encontrado";
  }

  getStatusClass(status) {
    switch (status) {
      case "finalizado":
        return "status-finalizado";
      case "andamento":
        return "status-andamento";
      case "aguardando":
        return "status-aguardando";
      default:
        return "";
    }
  }

  getStatusText(status) {
    switch (status) {
      case "finalizado":
        return "Finalizado";
      case "andamento":
        return "Em Andamento";
      case "aguardando":
        return "Aguardando";
      default:
        return "Desconhecido";
    }
  }

  previousMonth() {
    this.currentMonth--;
    if (this.currentMonth < 0) {
      this.currentMonth = 11;
      this.currentYear--;
    }
    this.render();
  }

  nextMonth() {
    this.currentMonth++;
    if (this.currentMonth > 11) {
      this.currentMonth = 0;
      this.currentYear++;
    }
    this.render();
  }

  updateMonthYearDisplay() {
    const monthNames = [
      "Janeiro",
      "Fevereiro",
      "Março",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro",
    ];

    const monthYearElement = document.getElementById("current-month-year");
    if (monthYearElement) {
      monthYearElement.textContent = `${monthNames[this.currentMonth]} ${
        this.currentYear
      }`;
    }
  }

  // ===== INTEGRAÇÃO IA: Análise do Dia =====
  renderAnaliseIADia(events, dateString, analises = []) {
    if (!events || events.length === 0) return '';

    try {
      // Se temos análises do Worker, usar elas
      if (analises && analises.length > 0) {
        // Combinar sugestões de todas as análises
        let todassSugestoes = [];
        let todosConflitos = [];
        
        analises.forEach(analise => {
          if (analise.sugestoes) todassSugestoes = todassSugestoes.concat(analise.sugestoes);
          if (analise.conflitos && analise.conflitos.conflitos) {
            todosConflitos = todosConflitos.concat(analise.conflitos.conflitos);
          }
        });

        if (todassSugestoes.length === 0 && todosConflitos.length === 0) return '';

        const sugestoesHtml = todassSugestoes
          .slice(0, 3)
          .map(sugestao => `<li class="list-group-item py-2"><i class="bi bi-lightbulb me-2 text-warning"></i>${sugestao.titulo || sugestao}</li>`)
          .join('');

        const conflitosHtml = todosConflitos
          .slice(0, 2)
          .map(conflito => `<li class="list-group-item py-2"><i class="bi bi-exclamation-triangle me-2 text-danger"></i>${conflito.titulo || conflito}</li>`)
          .join('');

        return `
          <div class="mt-3 alert alert-light border border-warning">
            <div class="d-flex align-items-start gap-2">
              <i class="bi bi-bar-chart text-warning fs-6"></i>
              <div style="flex-grow: 1;">
                <h6 class="mb-2">📊 Análise IA do Dia</h6>
                <ul class="list-group list-group-flush" style="font-size: 0.85rem;">
                  ${conflitosHtml}${sugestoesHtml}
                </ul>
              </div>
            </div>
          </div>
        `;
      }

      // Fallback para análise local (se Worker não disponível)
      if (typeof iaEngine === 'undefined' || !iaEngine.availabilityAnalyzer) return '';

      const analise = iaEngine.availabilityAnalyzer.analisarDisponibilidadesDia(events);
      
      if (!analise || !analise.alertas || analise.alertas.length === 0) return '';

      const alertasHtml = analise.alertas.map(alerta => {
        const iconClass = alerta.severidade === 'alta' ? 'bi-exclamation-triangle text-danger' : 'bi-info-circle text-warning';
        return `<li class="list-group-item py-2"><i class="bi ${iconClass} me-2"></i>${alerta.descricao}</li>`;
      }).join('');

      const resultado = `
        <div class="mt-3 alert alert-light border border-warning">
          <div class="d-flex align-items-start gap-2">
            <i class="bi bi-bar-chart text-warning fs-6"></i>
            <div>
              <h6 class="mb-2">📊 Análise IA do Dia</h6>
              <ul class="list-group list-group-flush" style="font-size: 0.85rem;">
                ${alertasHtml}
              </ul>
            </div>
          </div>
        </div>
      `;
      
      // Armazenar no cache
      this.analiseCache.set(dateString, resultado);
      
      return resultado;
    } catch (error) {
      console.warn('Erro ao gerar análise IA:', error);
      return '';
    }
  }
  // ===== FIM INTEGRAÇÃO IA =====
}

// Export Calendario class
window.Calendario = Calendario;
