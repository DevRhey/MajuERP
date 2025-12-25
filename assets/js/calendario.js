// Calendario Module

class Calendario {
  constructor() {
    this.eventos = Storage.get("eventos") || [];
    this.currentDate = new Date();
    this.currentMonth = this.currentDate.getMonth();
    this.currentYear = this.currentDate.getFullYear();
    this.setupStorageListener();
  }

  setupStorageListener() {
    window.addEventListener('storageUpdate', (e) => {
      const { key } = e.detail;
      if (key === 'eventos') {
        this.sync();
        if (app.currentPage === 'calendario') {
          this.render();
        }
      }
    });
  }

  sync() {
    this.eventos = Storage.get("eventos") || [];
  }

  // Função utilitária para converter string de data para objeto Date no horário local
  parseDataLocal(isoDateStr) {
    const [ano, mes, dia] = isoDateStr.split("-").map(Number);
    return new Date(ano, mes - 1, dia);
  }

  render() {
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
    // Garantir formato local YYYY-MM-DD
    const [y, m, d] = dateString.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    
    if (isNaN(date.getTime())) {
      console.error("Data inválida:", dateString);
      return;
    }
    
    const events = this.getEventsOnDate(date);

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
                    <div class="text-end mt-3">
                        <button class="btn btn-primary" onclick="app.modules.eventos.showForm(null, '${dateString}')">
                            <i class="bi bi-plus-circle"></i> Novo Evento
                        </button>
                    </div>
                </div>
            </div>
        `;

    UI.showModal(`Eventos - ${DateUtils.formatDate(date)}`, eventsHtml, true);
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
    const itensCadastrados = Storage.get("itens") || [];
    return itens
      .map((item) => {
        const itemObj = itensCadastrados.find((i) => i.id === item.id);
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
    const clientes = Storage.get("clientes") || [];
    const cliente = clientes.find((c) => c.id === clienteId);
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
}

// Export Calendario class
window.Calendario = Calendario;
