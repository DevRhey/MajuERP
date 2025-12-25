// Dashboard Module

class Dashboard {
  constructor() {
    this.clientes = Storage.get("clientes") || [];
    this.itens = Storage.get("itens") || [];
    this.eventos = Storage.get("eventos") || [];
    this.selectedDate = new Date();
    this.relogioInterval = null;
    this.autoRefreshInterval = null;
    this.storageHandler = null;
    this.setupStorageListener();
  }

  setupStorageListener() {
    window.addEventListener('storageUpdate', (e) => {
      const { key } = e.detail;
      if (key === 'eventos' || key === 'clientes' || key === 'itens') {
        this.sync();
        if (app.currentPage === 'dashboard') {
          this.refreshDados();
        }
      }
    });
  }

  sync() {
    this.clientes = Storage.get("clientes") || [];
    this.itens = Storage.get("itens") || [];
    this.eventos = Storage.get("eventos") || [];
  }

  render() {
    const mainContent = document.getElementById("main-content");
    mainContent.innerHTML = `
            <div class="container-fluid">
                <!-- Cabeçalho com Relógio -->
                <div class="row mb-4">
                    <div class="col-md-12">
                        <div class="card bg-gradient-primary text-white shadow-lg">
                            <div class="card-body">
                                <div class="row align-items-center">
                                    <div class="col-md-6">
                                        <h2 class="mb-0"><i class="bi bi-speedometer2 me-2"></i>Dashboard em Tempo Real</h2>
                                        <p class="mb-0 mt-2" id="data-atual"></p>
                                    </div>
                                    <div class="col-md-6 text-end">
                                        <div class="d-flex justify-content-end align-items-center gap-3">
                                            <div>
                                                <h1 class="display-4 mb-0" id="relogio-atual">00:00:00</h1>
                                                <small>Horário atual</small>
                                            </div>
                                            <div class="vr bg-white opacity-50"></div>
                                            <div style="min-width: 150px;">
                                                <label class="form-label text-white mb-2"><small>Selecionar data:</small></label>
                                                <input type="date" class="form-control form-control-lg" id="dashboard-date" 
                                                       value="${this.selectedDate.toISOString().split("T")[0]}">
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Cards de Estatísticas Rápidas -->
                <div class="row mb-4">
                    <div class="col-md-3">
                        <div class="card border-start border-primary border-4 shadow-sm">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 class="text-muted mb-1">Eventos Hoje</h6>
                                        <h2 class="mb-0 text-primary">${this.getEventosDoDia()}</h2>
                                    </div>
                                    <div class="fs-1 text-primary opacity-50">
                                        <i class="bi bi-calendar-event"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card border-start border-warning border-4 shadow-sm">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 class="text-muted mb-1">Aguardando</h6>
                                        <h2 class="mb-0 text-warning">${this.getEventosPorStatusHoje("aguardando")}</h2>
                                    </div>
                                    <div class="fs-1 text-warning opacity-50">
                                        <i class="bi bi-clock-history"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card border-start border-success border-4 shadow-sm">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 class="text-muted mb-1">Em Andamento</h6>
                                        <h2 class="mb-0 text-success">${this.getEventosPorStatusHoje("andamento")}</h2>
                                    </div>
                                    <div class="fs-1 text-success opacity-50">
                                        <i class="bi bi-play-circle"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card border-start border-secondary border-4 shadow-sm">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 class="text-muted mb-1">Finalizados</h6>
                                        <h2 class="mb-0 text-secondary">${this.getEventosPorStatusHoje("finalizado")}</h2>
                                    </div>
                                    <div class="fs-1 text-secondary opacity-50">
                                        <i class="bi bi-check-circle"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Timeline de Eventos do Dia -->
                <div class="row mb-4">
                    <div class="col-md-12">
                        <div class="card shadow-sm">
                            <div class="card-header bg-primary text-white">
                                <h5 class="mb-0"><i class="bi bi-clock-history me-2"></i>Timeline de Eventos - ${this.selectedDate.toLocaleDateString("pt-BR")}</h5>
                            </div>
                            <div class="card-body">
                                ${this.renderTimelineEventos()}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Disponibilidade de Itens em Tempo Real -->
                <div class="row mb-4">
                    <div class="col-md-12">
                        <div class="card shadow-sm">
                            <div class="card-header bg-success text-white">
                                <h5 class="mb-0"><i class="bi bi-box-seam me-2"></i>Disponibilidade Detalhada por Item e Horário</h5>
                            </div>
                            <div class="card-body">
                                ${this.renderDisponibilidadeDetalhada()}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Itens Disponíveis e Alugados -->
                <div class="row mb-4">
                    <div class="col-md-6">
                        <div class="card shadow-sm h-100">
                            <div class="card-header bg-success text-white d-flex justify-content-between align-items-center">
                                <h5 class="mb-0"><i class="bi bi-check-circle me-2"></i>Itens Disponíveis Agora</h5>
                                <span class="badge bg-light text-dark">${this.getTotalItensDisponiveis()} itens</span>
                            </div>
                            <div class="card-body p-0">
                                <div class="table-responsive" style="max-height: 400px; overflow-y: auto;">
                                    <table class="table table-hover mb-0">
                                        <thead class="sticky-top bg-light">
                                            <tr>
                                                <th>Item</th>
                                                <th>Total</th>
                                                <th>Alugados</th>
                                                <th>Disponíveis</th>
                                                <th>Valor/dia</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${this.renderItensDisponiveis()}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card shadow-sm h-100">
                            <div class="card-header bg-warning text-dark d-flex justify-content-between align-items-center">
                                <h5 class="mb-0"><i class="bi bi-clock me-2"></i>Itens Alugados Agora</h5>
                                <span class="badge bg-light text-dark">${this.getTotalItensAlugados()} itens</span>
                            </div>
                            <div class="card-body p-0">
                                <div class="table-responsive" style="max-height: 400px; overflow-y: auto;">
                                    <table class="table table-hover mb-0">
                                        <thead class="sticky-top bg-light">
                                            <tr>
                                                <th>Item</th>
                                                <th>Total</th>
                                                <th>Alugados</th>
                                                <th>Disponíveis</th>
                                                <th>Valor/dia</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${this.renderItensAlugados()}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Gráficos -->
                <div class="row">
                    <div class="col-md-6">
                        <div class="card shadow-sm">
                            <div class="card-header bg-info text-white">
                                <h5 class="mb-0"><i class="bi bi-pie-chart me-2"></i>Distribuição de Eventos</h5>
                            </div>
                            <div class="card-body">
                                <canvas id="eventosStatusChart"></canvas>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card shadow-sm">
                            <div class="card-header bg-info text-white">
                                <h5 class="mb-0"><i class="bi bi-bar-chart me-2"></i>Eventos por Mês</h5>
                            </div>
                            <div class="card-body">
                                <canvas id="eventosMesChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

    // Iniciar relógio
    this.iniciarRelogio();
    this.atualizarDataAtual();
    
    // Iniciar seletor de data
    this.setupDatePicker();
    
    // Iniciar auto-refresh
    this.iniciarAutoRefresh();

    // Registrar listener de storage para atualizações em tempo real
    this.registrarStorageListener();

    // Renderizar gráficos
    this.renderEventosStatusChart();
    this.renderEventosMesChart();
  }

  renderItensDisponiveis() {
    return this.getItensDisponiveisHoje()
      .map((item) => {
        return `
          <tr>
            <td>${item.nome}</td>
            <td>${item.quantidadeTotal}</td>
            <td>${item.quantidadeAlugada}</td>
            <td>${item.quantidadeTotal - item.quantidadeAlugada}</td>
            <td>R$ ${item.valorDiaria.toFixed(2)}</td>
          </tr>
        `;
      })
      .join("");
  }

  renderItensAlugados() {
    return this.getItensAlugadosHoje()
      .map((item) => {
        return `
          <tr>
            <td>${item.nome}</td>
            <td>${item.quantidadeTotal}</td>
            <td>${item.quantidadeAlugada}</td>
            <td>${item.quantidadeTotal - item.quantidadeAlugada}</td>
            <td>R$ ${item.valorDiaria.toFixed(2)}</td>
          </tr>
        `;
      })
      .join("");
  }

  getTotalItensDisponiveis() {
    return this.getItensDisponiveisHoje().length;
  }

  getTotalItensAlugados() {
    return this.getItensAlugadosHoje().length;
  }

  getEventosDoDia() {
    const dataSelecionada = this.selectedDate;
    return this.eventos.filter((evento) => {
      const dataEvento = this.parseDataLocal(evento.dataInicio);
      return this.isSameDay(dataEvento, dataSelecionada);
    }).length;
  }

  getFaturamentoEstimado() {
    const hoje = new Date();
    return this.eventos
      .filter((evento) => new Date(evento.dataInicio) >= hoje)
      .reduce((total, evento) => total + evento.valorTotal, 0);
  }

  getTotalProximosEventos() {
    const hoje = new Date();
    return this.eventos.filter((evento) => new Date(evento.dataInicio) >= hoje)
      .length;
  }

  renderProximosEventos() {
    const hoje = new Date();
    return this.eventos
      .filter((evento) => new Date(evento.dataInicio) >= hoje)
      .sort((a, b) => new Date(a.dataInicio) - new Date(b.dataInicio))
      .slice(0, 5)
      .map((evento) => {
        const cliente = this.clientes.find((c) => c.id === evento.clienteId);
        const statusClass = this.getStatusClass(evento.status);
        const statusText = this.getStatusText(evento.status);

        return `
                <tr>
                    <td>${DateUtils.formatDate(evento.dataInicio)}</td>
                    <td>${
                      cliente ? cliente.nome : "Cliente não encontrado"
                    }</td>
                    <td>${evento.horaInicio} - ${evento.horaFim}</td>
                    <td><span class="badge ${statusClass}">${statusText}</span></td>
                </tr>
            `;
      })
      .join("");
  }

  renderUltimosClientes() {
    return this.clientes
      .slice(-5)
      .map((cliente) => {
        const eventosCliente = this.eventos.filter(
          (e) => e.clienteId === cliente.id
        ).length;
        const ultimoEvento =
          eventosCliente > 0
            ? DateUtils.formatDate(this.eventos[eventosCliente - 1].dataInicio)
            : "Nenhum";

        return `
                <tr>
                    <td>${cliente.nome}</td>
                    <td>${cliente.telefone}</td>
                    <td>${eventosCliente}</td>
                    <td>${ultimoEvento}</td>
                </tr>
            `;
      })
      .join("");
  }

  getStatusClass(status) {
    switch (status) {
      case "finalizado":
        return "bg-secondary";
      case "andamento":
        return "bg-success";
      case "aguardando":
        return "bg-warning";
      default:
        return "bg-secondary";
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

  getStatusColor(status) {
    switch (status) {
      case "finalizado":
        return "#6c757d"; // Cinza
      case "andamento":
        return "#28a745"; // Verde
      case "aguardando":
        return "#ffc107"; // Amarelo
      default:
        return "#6c757d"; // Cinza
    }
  }

  renderEventosStatusChart() {
    const ctx = document.getElementById("eventosStatusChart").getContext("2d");

    const statusCounts = {
      aguardando: 0,
      andamento: 0,
      finalizado: 0,
    };

    this.eventos.forEach((evento) => {
      statusCounts[evento.status]++;
    });

    new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["Aguardando", "Em Andamento", "Finalizado"],
        datasets: [
          {
            data: [
              statusCounts.aguardando,
              statusCounts.andamento,
              statusCounts.finalizado,
            ],
            backgroundColor: [
              this.getStatusColor("aguardando"),
              this.getStatusColor("andamento"),
              this.getStatusColor("finalizado"),
            ],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "bottom",
          },
        },
        cutout: "70%",
      },
    });
  }

  renderEventosMesChart() {
    const ctx = document.getElementById("eventosMesChart").getContext("2d");

    const meses = [
      "Jan",
      "Fev",
      "Mar",
      "Abr",
      "Mai",
      "Jun",
      "Jul",
      "Ago",
      "Set",
      "Out",
      "Nov",
      "Dez",
    ];

    const eventosPorMes = new Array(12).fill(0);

    this.eventos.forEach((evento) => {
      const data = new Date(evento.dataInicio);
      const mes = data.getMonth();
      eventosPorMes[mes]++;
    });

    new Chart(ctx, {
      type: "bar",
      data: {
        labels: meses,
        datasets: [
          {
            label: "Quantidade de Eventos",
            data: eventosPorMes,
            backgroundColor: "#0d6efd",
            borderRadius: 5,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
            },
          },
        },
      },
    });
  }

  getEventosPendentes() {
    return this.eventos.filter((evento) => evento.status === "aguardando")
      .length;
  }

  renderDetalhesItensAlugados() {
    const dataSelecionada = this.selectedDate;

    const eventosDoDia = this.eventos.filter((evento) => {
      const dataEvento = this.parseDataLocal(evento.dataInicio);
      return (
        this.isSameDay(dataEvento, dataSelecionada) &&
        evento.status !== "finalizado"
      );
    });

    return eventosDoDia
      .map((evento) => {
        const cliente = this.clientes.find((c) => c.id === evento.clienteId);
        const statusClass = this.getStatusClass(evento.status);
        const statusText = this.getStatusText(evento.status);

        return evento.itens
          .map((itemEvento) => {
            const item = this.itens.find((i) => i.id === itemEvento.id);
            if (!item) return "";

            return `
              <tr>
                <td>${item.nome}</td>
                <td>${cliente ? cliente.nome : "Cliente não encontrado"}</td>
                <td>${DateUtils.formatDate(
                  this.parseDataLocal(evento.dataInicio)
                )}</td>
                <td>${evento.horaInicio} - ${evento.horaFim}</td>
                <td>${itemEvento.quantidade}</td>
                <td><span class="badge ${statusClass}">${statusText}</span></td>
                <td>R$ ${(item.valorDiaria * itemEvento.quantidade).toFixed(
                  2
                )}</td>
              </tr>
            `;
          })
          .join("");
      })
      .join("");
  }

  parseDataLocal(isoDateStr) {
    const [ano, mes, dia] = isoDateStr.split("-").map(Number);
    return new Date(ano, mes - 1, dia);
  }

  isSameDay(date1, date2) {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  renderEventosPorStatus(status) {
    const dataSelecionada = this.selectedDate;

    const eventos = this.eventos
      .filter((evento) => {
        const dataEvento = this.parseDataLocal(evento.dataInicio);
        return (
          this.isSameDay(dataEvento, dataSelecionada) &&
          evento.status === status
        );
      })
      .sort((a, b) => new Date(a.dataInicio) - new Date(b.dataInicio));

    return eventos
      .map((evento) => {
        const cliente = this.clientes.find((c) => c.id === evento.clienteId);
        const dataEvento = this.parseDataLocal(evento.dataInicio);
        const itens = evento.itens
          .map((item) => {
            const itemObj = this.itens.find((i) => i.id === item.id);
            return itemObj
              ? `${itemObj.nome} (${item.quantidade})`
              : "Item não encontrado";
          })
          .join(", ");

        return `
            <tr>
                <td><i class="bi bi-person me-2"></i>${
                  cliente ? cliente.nome : "Cliente não encontrado"
                }</td>
                <td>${DateUtils.formatDate(dataEvento)}</td>
                <td>${evento.horaInicio} - ${evento.horaFim}</td>
                <td><small>${itens}</small></td>
            </tr>
        `;
      })
      .join("");
  }

  getItensDisponiveisHoje() {
    const dataSelecionada = this.selectedDate;
    const agora = new Date();
    const BUFFER_LOGISTICA_MS = 40 * 60 * 1000; // 40 minutos

    // Filtrar eventos do dia selecionado que ainda ocupam itens
    const eventosDoDia = this.eventos.filter((evento) => {
      const dataEvento = this.parseDataLocal(evento.dataInicio);
      if (!this.isSameDay(dataEvento, dataSelecionada)) return false;
      if (evento.status === "finalizado") return false;
      
      // Verificar se ainda está no período de ocupação (incluindo buffer)
      const [horaFim, minFim] = evento.horaFim.split(':').map(Number);
      const fimEvento = new Date(dataEvento);
      fimEvento.setHours(horaFim, minFim, 0);
      const fimComBuffer = new Date(fimEvento.getTime() + BUFFER_LOGISTICA_MS);
      
      return agora < fimComBuffer || evento.status === 'aguardando';
    });

    // Calcular quantidade alugada para cada item no dia selecionado
    const itensAlugados = {};
    eventosDoDia.forEach((evento) => {
      evento.itens.forEach((itemEvento) => {
        if (!itensAlugados[itemEvento.id]) {
          itensAlugados[itemEvento.id] = 0;
        }
        itensAlugados[itemEvento.id] += itemEvento.quantidade;
      });
    });

    // Filtrar itens disponíveis
    return this.itens
      .filter((item) => {
        const quantidadeAlugada = itensAlugados[item.id] || 0;
        return item.quantidadeTotal > quantidadeAlugada;
      })
      .map((item) => ({
        ...item,
        quantidadeAlugada: itensAlugados[item.id] || 0,
      }));
  }

  getItensAlugadosHoje() {
    const dataSelecionada = this.selectedDate;
    const agora = new Date();
    const BUFFER_LOGISTICA_MS = 40 * 60 * 1000; // 40 minutos

    // Filtrar eventos do dia selecionado que ainda ocupam itens
    const eventosDoDia = this.eventos.filter((evento) => {
      const dataEvento = this.parseDataLocal(evento.dataInicio);
      if (!this.isSameDay(dataEvento, dataSelecionada)) return false;
      if (evento.status === "finalizado") return false;
      
      // Verificar se ainda está no período de ocupação (incluindo buffer)
      const [horaFim, minFim] = evento.horaFim.split(':').map(Number);
      const fimEvento = new Date(dataEvento);
      fimEvento.setHours(horaFim, minFim, 0);
      const fimComBuffer = new Date(fimEvento.getTime() + BUFFER_LOGISTICA_MS);
      
      return agora < fimComBuffer || evento.status === 'aguardando';
    });

    // Calcular quantidade alugada para cada item no dia selecionado
    const itensAlugados = {};
    eventosDoDia.forEach((evento) => {
      evento.itens.forEach((itemEvento) => {
        if (!itensAlugados[itemEvento.id]) {
          itensAlugados[itemEvento.id] = 0;
        }
        itensAlugados[itemEvento.id] += itemEvento.quantidade;
      });
    });

    // Filtrar itens que têm aluguéis
    return this.itens
      .filter((item) => {
        const quantidadeAlugada = itensAlugados[item.id] || 0;
        return quantidadeAlugada > 0;
      })
      .map((item) => ({
        ...item,
        quantidadeAlugada: itensAlugados[item.id] || 0,
      }));
  }

  atualizarDashboard() {
    const dateInput = document.getElementById("dashboard-date");
    if (dateInput) {
      // Atualizar a data selecionada
      this.selectedDate = new Date(dateInput.value);

      // Recarregar dados do localStorage
      this.clientes = Storage.get("clientes") || [];
      this.itens = Storage.get("itens") || [];
      this.eventos = Storage.get("eventos") || [];

      // Atualizar a interface
      this.render();

      // Mostrar mensagem de sucesso
      UI.showAlert("Dashboard atualizado com sucesso!", "success");
    }
  }

  setupDatePicker() {
    const dateInput = document.getElementById("dashboard-date");
    if (dateInput) {
      // Ao mudar a data, atualizar o dashboard automaticamente
      dateInput.addEventListener("change", () => {
        this.atualizarDashboard();
      });

      // Ao clicar no input, pode selecionar a data
      dateInput.addEventListener("click", (e) => {
        e.preventDefault();
        dateInput.showPicker?.();
      });
    }
  }

  iniciarRelogio() {
    // Limpar intervalo anterior se existir
    if (this.relogioInterval) {
      clearInterval(this.relogioInterval);
    }

    // Atualizar relógio imediatamente
    this.atualizarRelogio();

    // Atualizar a cada segundo
    this.relogioInterval = setInterval(() => {
      this.atualizarRelogio();
    }, 1000);
  }

  atualizarRelogio() {
    const agora = new Date();
    const horas = String(agora.getHours()).padStart(2, '0');
    const minutos = String(agora.getMinutes()).padStart(2, '0');
    const segundos = String(agora.getSeconds()).padStart(2, '0');
    
    const relogioElement = document.getElementById('relogio-atual');
    if (relogioElement) {
      relogioElement.textContent = `${horas}:${minutos}:${segundos}`;
    }
  }

  atualizarDataAtual() {
    const dataElement = document.getElementById('data-atual');
    if (dataElement) {
      dataElement.textContent = this.selectedDate.toLocaleDateString("pt-BR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
  }

  iniciarAutoRefresh() {
    // Limpar intervalo anterior se existir
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
    }

    // Auto-refresh mais frequente (5s) para dados quase em tempo real
    this.autoRefreshInterval = setInterval(() => {
      this.refreshDados();
    }, 5000);
  }

  refreshDados() {
    // Não atualizar se o usuário não estiver no dashboard
    if (window.app && window.app.currentPage !== "dashboard") {
      return;
    }

    // Recarregar dados do localStorage sem recarregar a página
    this.clientes = Storage.get("clientes") || [];
    this.itens = Storage.get("itens") || [];
    this.eventos = Storage.get("eventos") || [];

    // Re-renderizar dashboard para refletir dados mais recentes
    this.reiniciarIntervalos();
    this.render();
  }

  atualizarElementosDinamicos() {
    // Atualizar contadores nos cards
    const elementos = {
      eventosHoje: this.getEventosDoDia(),
      aguardando: this.getEventosPorStatusHoje("aguardando"),
      andamento: this.getEventosPorStatusHoje("andamento"),
      finalizados: this.getEventosPorStatusHoje("finalizado")
    };

    // Atualizar apenas se os elementos existirem
    document.querySelectorAll('.card-body h2').forEach((el, index) => {
      const valores = Object.values(elementos);
      if (valores[index] !== undefined) {
        el.textContent = valores[index];
      }
    });
  }

  registrarStorageListener() {
    // Evitar múltiplos listeners duplicados
    if (this.storageHandler) {
      window.removeEventListener('storage', this.storageHandler);
    }

    this.storageHandler = () => this.refreshDados();
    window.addEventListener('storage', this.storageHandler);
  }

  removerStorageListener() {
    if (this.storageHandler) {
      window.removeEventListener('storage', this.storageHandler);
      this.storageHandler = null;
    }
  }

  reiniciarIntervalos() {
    if (this.relogioInterval) clearInterval(this.relogioInterval);
    if (this.autoRefreshInterval) clearInterval(this.autoRefreshInterval);
  }

  renderTimelineEventos() {
    const dataSelecionada = this.selectedDate;
    const eventosDoDia = this.eventos
      .filter((evento) => {
        const dataEvento = this.parseDataLocal(evento.dataInicio);
        return this.isSameDay(dataEvento, dataSelecionada);
      })
      .sort((a, b) => {
        // Ordenar por horário de início
        return a.horaInicio.localeCompare(b.horaInicio);
      });

    if (eventosDoDia.length === 0) {
      return `
        <div class="alert alert-info mb-0">
          <i class="bi bi-info-circle me-2"></i>
          Nenhum evento agendado para esta data.
        </div>
      `;
    }

    const agora = new Date();
    const horaAtual = `${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}`;
    const isHoje = this.isSameDay(agora, dataSelecionada);

    return `
      <div class="timeline-container">
        ${eventosDoDia.map((evento, index) => {
          const cliente = this.clientes.find((c) => c.id === evento.clienteId);
          const isAtivo = isHoje && evento.status === 'andamento';
          const isPendente = isHoje && evento.status === 'aguardando' && evento.horaInicio > horaAtual;
          const isFinalizado = evento.status === 'finalizado';
          
          let badgeClass = 'bg-secondary';
          let iconClass = 'bi-check-circle';
          let cardClass = '';
          
          if (isAtivo) {
            badgeClass = 'bg-success';
            iconClass = 'bi-play-circle-fill';
            cardClass = 'border-success shadow-lg';
          } else if (isPendente) {
            badgeClass = 'bg-warning';
            iconClass = 'bi-clock-fill';
            cardClass = 'border-warning';
          } else if (isFinalizado) {
            badgeClass = 'bg-secondary';
            iconClass = 'bi-check-circle-fill';
            cardClass = 'opacity-75';
          }
          
          // Calcular horário de liberação (término + 40 min)
          const [horaF, minF] = evento.horaFim.split(':').map(Number);
          const fimEvento = new Date();
          fimEvento.setHours(horaF, minF, 0);
          const fimComBuffer = new Date(fimEvento.getTime() + (40 * 60 * 1000));
          const horaLiberacao = `${String(fimComBuffer.getHours()).padStart(2, '0')}:${String(fimComBuffer.getMinutes()).padStart(2, '0')}`;

          return `
            <div class="timeline-item mb-3">
              <div class="card ${cardClass}">
                <div class="card-body">
                  <div class="row align-items-center">
                    <div class="col-md-2 text-center">
                      <div class="timeline-time">
                        <i class="bi ${iconClass} fs-3 ${badgeClass === 'bg-success' ? 'text-success' : badgeClass === 'bg-warning' ? 'text-warning' : 'text-secondary'}"></i>
                        <div class="mt-2">
                          <strong class="d-block">${evento.horaInicio}</strong>
                          <small class="text-muted">até ${evento.horaFim}</small>
                          ${!isFinalizado ? `<br><small class="text-info"><i class="bi bi-truck"></i> Liberação: ${horaLiberacao}</small>` : ''}
                        </div>
                        <span class="badge ${badgeClass} mt-2">${this.getStatusText(evento.status)}</span>
                      </div>
                    </div>
                    <div class="col-md-10">
                      <div class="d-flex justify-content-between align-items-start">
                        <div class="flex-grow-1">
                          <h5 class="mb-2">
                            <i class="bi bi-person-circle me-2"></i>
                            ${cliente ? cliente.nome : 'Cliente não encontrado'}
                          </h5>
                          <div class="row">
                            <div class="col-md-8">
                              <strong><i class="bi bi-box-seam me-2"></i>Itens:</strong>
                              <ul class="list-unstyled ms-4 mb-0">
                                ${evento.itens.map(itemEvento => {
                                  const item = this.itens.find(i => i.id === itemEvento.id);
                                  return item ? `
                                    <li>
                                      <i class="bi bi-check2 text-success me-1"></i>
                                      ${item.nome} <span class="badge bg-light text-dark">${itemEvento.quantidade}x</span>
                                    </li>
                                  ` : '';
                                }).join('')}
                              </ul>
                            </div>
                            <div class="col-md-4 text-end">
                              <div class="mb-2">
                                <strong>Valor Total:</strong><br>
                                <span class="fs-4 text-primary">R$ ${evento.valorTotal.toFixed(2)}</span>
                              </div>
                              ${evento.observacoes ? `
                                <small class="text-muted">
                                  <i class="bi bi-chat-left-text me-1"></i>
                                  ${evento.observacoes}
                                </small>
                              ` : ''}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  renderDisponibilidadeDetalhada() {
    const horarios = [];
    const agora = new Date();
    const isHoje = this.isSameDay(agora, this.selectedDate);
    
    // Gerar horários de 8h às 22h (intervalos de 2 horas)
    for (let hora = 8; hora <= 22; hora += 2) {
      const horaStr = `${String(hora).padStart(2, '0')}:00`;
      const horaFimStr = `${String(Math.min(hora + 2, 23)).padStart(2, '0')}:00`;
      
      const horaPassed = isHoje && hora < agora.getHours();
      
      horarios.push({
        inicio: horaStr,
        fim: horaFimStr,
        passou: horaPassed
      });
    }

    // HTML da tabela com coluna fixa
    let html = `
      <div class="table-responsive" style="overflow-x: auto;">
        <table class="table table-bordered table-hover mb-0" style="position: relative;">
          <thead class="table-dark sticky-top">
            <tr>
              <th style="min-width: 200px; position: sticky; left: 0; z-index: 10; background-color: #212529;" class="align-middle">
                <i class="bi bi-box-seam me-2"></i>Item
              </th>
              <th class="text-center align-middle" style="position: sticky; left: 200px; z-index: 10; background-color: #212529;">Total</th>
              ${horarios.map(h => `
                <th class="text-center align-middle ${h.passou ? 'bg-secondary bg-opacity-25' : ''}" style="min-width: 100px;">
                  <div class="small">${h.inicio}</div>
                  <div class="small text-muted">às ${h.fim}</div>
                  ${h.passou ? '<small class="badge bg-secondary">Passou</small>' : ''}
                </th>
              `).join('')}
            </tr>
          </thead>
          <tbody>
    `;

    // Para cada item, mostrar disponibilidade em cada horário
    this.itens.forEach(item => {
      html += `
        <tr>
          <td style="position: sticky; left: 0; z-index: 5; background-color: white;">
            <strong>${item.nome}</strong>
            <br>
            <small class="text-muted">
              <i class="bi bi-tag me-1"></i>${item.tipo}
              <span class="ms-2">R$ ${item.valorDiaria.toFixed(2)}/dia</span>
            </small>
          </td>
          <td class="text-center align-middle" style="position: sticky; left: 200px; z-index: 5; background-color: white;">
            <span class="badge bg-primary">${item.quantidadeTotal}</span>
          </td>
      `;

      // Para cada horário, calcular disponibilidade
      horarios.forEach(horario => {
        const dispInfo = this.getDisponibilidadeItemNoHorario(item.id, horario.inicio, horario.fim);
        
        let cellClass = '';
        let badgeClass = 'bg-success';
        let icon = 'bi-check-circle-fill';
        let textColor = 'text-success';
        
        if (dispInfo.disponivel === 0) {
          cellClass = 'table-danger';
          badgeClass = 'bg-danger';
          icon = 'bi-x-circle-fill';
          textColor = 'text-danger';
        } else if (dispInfo.disponivel < item.quantidadeTotal) {
          cellClass = 'table-warning';
          badgeClass = 'bg-warning text-dark';
          icon = 'bi-exclamation-circle-fill';
          textColor = 'text-warning';
        } else {
          cellClass = 'table-success';
        }

        if (horario.passou) {
          cellClass += ' bg-opacity-25';
        }

        html += `
          <td class="text-center align-middle ${cellClass}" style="position: relative;">
            <div class="d-flex flex-column align-items-center gap-1">
              <i class="bi ${icon} ${textColor}"></i>
              <span class="badge ${badgeClass}">${dispInfo.disponivel}/${item.quantidadeTotal}</span>
              ${dispInfo.alugado > 0 ? `
                <small class="text-muted" style="font-size: 0.7rem;">
                  ${dispInfo.alugado} alugado${dispInfo.alugado > 1 ? 's' : ''}
                </small>
              ` : ''}
              ${dispInfo.eventos.length > 0 ? `
                <button class="btn btn-sm btn-outline-info p-0 px-1" 
                        style="font-size: 0.7rem;"
                        onclick="app.modules.dashboard.mostrarDetalhesHorario('${item.nome}', '${horario.inicio}', '${horario.fim}', ${JSON.stringify(dispInfo.eventos).replace(/"/g, '&quot;')})">
                  <i class="bi bi-info-circle"></i> Ver
                </button>
              ` : ''}
            </div>
          </td>
        `;
      });

      html += '</tr>';
    });

    html += `
          </tbody>
        </table>
      </div>
      <div class="mt-3">
        <div class="d-flex gap-4 flex-wrap">
          <div class="d-flex align-items-center gap-2">
            <div class="bg-success border" style="width: 30px; height: 20px;"></div>
            <small>Totalmente Disponível</small>
          </div>
          <div class="d-flex align-items-center gap-2">
            <div class="bg-warning border" style="width: 30px; height: 20px;"></div>
            <small>Parcialmente Disponível</small>
          </div>
          <div class="d-flex align-items-center gap-2">
            <div class="bg-danger border" style="width: 30px; height: 20px;"></div>
            <small>Indisponível</small>
          </div>
          <div class="d-flex align-items-center gap-2">
            <div class="bg-secondary bg-opacity-25 border" style="width: 30px; height: 20px;"></div>
            <small>Horário Passado</small>
          </div>
        </div>
      </div>
    `;

    return html;
  }

  getDisponibilidadeItemNoHorario(itemId, horaInicio, horaFim) {
    const dataSelecionada = this.selectedDate;
    const item = this.itens.find(i => i.id === itemId);
    if (!item) return { disponivel: 0, alugado: 0, eventos: [] };
    
    // Converter horários para comparação
    const [horaInicioNum, minInicioNum] = horaInicio.split(':').map(Number);
    const [horaFimNum, minFimNum] = horaFim.split(':').map(Number);
    
    const inicioHorario = new Date(dataSelecionada);
    inicioHorario.setHours(horaInicioNum, minInicioNum, 0);
    
    const fimHorario = new Date(dataSelecionada);
    fimHorario.setHours(horaFimNum, minFimNum, 0);
    
    // Buffer de 40 minutos para logística
    const BUFFER_LOGISTICA_MS = 40 * 60 * 1000;
    const fimHorarioComBuffer = new Date(fimHorario.getTime() + BUFFER_LOGISTICA_MS);

    // Calcular quantidades alugadas neste horário para este item específico
    let quantidadeAlugada = 0;
    const eventosNoHorario = [];
    
    this.eventos.forEach(evento => {
      if (evento.status === 'finalizado') return;
      
      const dataEvento = this.parseDataLocal(evento.dataInicio);
      if (!this.isSameDay(dataEvento, dataSelecionada)) return;
      
      const [horaEventoInicio, minEventoInicio] = evento.horaInicio.split(':').map(Number);
      const [horaEventoFim, minEventoFim] = evento.horaFim.split(':').map(Number);
      
      const inicioEvento = new Date(dataSelecionada);
      inicioEvento.setHours(horaEventoInicio, minEventoInicio, 0);
      
      const fimEvento = new Date(dataSelecionada);
      fimEvento.setHours(horaEventoFim, minEventoFim, 0);
      
      // Adicionar buffer de 40 minutos ao fim do evento
      const fimEventoComBuffer = new Date(fimEvento.getTime() + BUFFER_LOGISTICA_MS);
      
      // Verificar sobreposição (considerando buffer logístico)
      if (inicioHorario < fimEventoComBuffer && fimHorarioComBuffer > inicioEvento) {
        const itemEvento = evento.itens.find(i => i.id === itemId);
        if (itemEvento) {
          quantidadeAlugada += itemEvento.quantidade;
          const cliente = this.clientes.find(c => c.id === evento.clienteId);
          eventosNoHorario.push({
            cliente: cliente ? cliente.nome : 'Desconhecido',
            horario: `${evento.horaInicio}-${evento.horaFim}`,
            quantidade: itemEvento.quantidade,
            status: evento.status
          });
        }
      }
    });

    return {
      disponivel: Math.max(0, item.quantidadeTotal - quantidadeAlugada),
      alugado: quantidadeAlugada,
      eventos: eventosNoHorario
    };
  }

  mostrarDetalhesHorario(nomeItem, horaInicio, horaFim, eventos) {
    const eventosHtml = eventos.map(e => `
      <div class="mb-2 p-2 border-start border-3 ${
        e.status === 'andamento' ? 'border-success bg-success bg-opacity-10' : 
        e.status === 'aguardando' ? 'border-warning bg-warning bg-opacity-10' : 
        'border-secondary bg-secondary bg-opacity-10'
      }">
        <div class="d-flex justify-content-between align-items-start">
          <div>
            <strong><i class="bi bi-person-circle me-1"></i>${e.cliente}</strong>
            <br>
            <small class="text-muted">
              <i class="bi bi-clock me-1"></i>${e.horario}
              <span class="ms-2"><i class="bi bi-box me-1"></i>${e.quantidade}x</span>
            </small>
          </div>
          <span class="badge ${
            e.status === 'andamento' ? 'bg-success' : 
            e.status === 'aguardando' ? 'bg-warning text-dark' : 
            'bg-secondary'
          }">${this.getStatusText(e.status)}</span>
        </div>
      </div>
    `).join('');

    const content = `
      <div class="p-2">
        <h6 class="border-bottom pb-2 mb-3">
          <i class="bi bi-box-seam me-2 text-primary"></i>${nomeItem}
        </h6>
        <p class="text-muted mb-3">
          <i class="bi bi-clock-history me-2"></i>
          <strong>Horário:</strong> ${horaInicio} - ${horaFim}
        </p>
        <h6 class="mb-2">Eventos neste horário:</h6>
        ${eventosHtml || '<p class="text-muted">Nenhum evento</p>'}
        <div class="alert alert-info mt-3 mb-0">
          <small>
            <i class="bi bi-info-circle me-2"></i>
            Os horários incluem 40 minutos de buffer para logística (retirada, limpeza, preparação).
          </small>
        </div>
      </div>
    `;

    UI.showModal(`Detalhes de Ocupação`, content);
  }

  renderDisponibilidadeHorarios() {
    const horarios = [];
    const agora = new Date();
    const isHoje = this.isSameDay(agora, this.selectedDate);
    
    // Gerar horários de 8h às 22h (intervalos de 2 horas)
    for (let hora = 8; hora <= 22; hora += 2) {
      const horaStr = `${String(hora).padStart(2, '0')}:00`;
      const horaFimStr = `${String(Math.min(hora + 2, 23)).padStart(2, '0')}:00`;
      
      // Verificar se o horário já passou (apenas para hoje)
      const horaPassed = isHoje && hora < agora.getHours();
      
      horarios.push({
        inicio: horaStr,
        fim: horaFimStr,
        passou: horaPassed
      });
    }

    return `
      <div class="row">
        ${horarios.map(horario => {
          const itensDisponiveis = this.getItensDisponiveisNoHorario(horario.inicio, horario.fim);
          const totalItens = this.itens.length;
          const percentualDisponivel = (itensDisponiveis.length / totalItens) * 100;
          
          let badgeClass = 'bg-success';
          let textClass = 'text-success';
          if (percentualDisponivel < 30) {
            badgeClass = 'bg-danger';
            textClass = 'text-danger';
          } else if (percentualDisponivel < 70) {
            badgeClass = 'bg-warning';
            textClass = 'text-warning';
          }

          return `
            <div class="col-md-3 mb-3">
              <div class="card ${horario.passou ? 'opacity-50' : 'border-' + (badgeClass.replace('bg-', ''))}">
                <div class="card-body text-center">
                  <div class="mb-2">
                    <i class="bi bi-clock fs-2 ${textClass}"></i>
                  </div>
                  <h5 class="mb-2">${horario.inicio} - ${horario.fim}</h5>
                  <div class="mb-3">
                    <span class="badge ${badgeClass} fs-6">
                      ${itensDisponiveis.length}/${totalItens} disponíveis
                    </span>
                  </div>
                  <div class="progress" style="height: 10px;">
                    <div class="progress-bar ${badgeClass}" role="progressbar" 
                         style="width: ${percentualDisponivel}%"
                         aria-valuenow="${percentualDisponivel}" aria-valuemin="0" aria-valuemax="100">
                    </div>
                  </div>
                  ${horario.passou ? '<small class="text-muted mt-2 d-block">Horário já passou</small>' : ''}
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  getItensDisponiveisNoHorario(horaInicio, horaFim) {
    const dataSelecionada = this.selectedDate;
    
    // Converter horários para comparação
    const [horaInicioNum, minInicioNum] = horaInicio.split(':').map(Number);
    const [horaFimNum, minFimNum] = horaFim.split(':').map(Number);
    
    const inicioHorario = new Date(dataSelecionada);
    inicioHorario.setHours(horaInicioNum, minInicioNum, 0);
    
    const fimHorario = new Date(dataSelecionada);
    fimHorario.setHours(horaFimNum, minFimNum, 0);
    
    // Buffer de 40 minutos para logística
    const BUFFER_LOGISTICA_MS = 40 * 60 * 1000;
    const fimHorarioComBuffer = new Date(fimHorario.getTime() + BUFFER_LOGISTICA_MS);

    // Calcular quantidades alugadas neste horário
    const quantidadesAlugadas = {};
    
    this.eventos.forEach(evento => {
      if (evento.status === 'finalizado') return;
      
      const dataEvento = this.parseDataLocal(evento.dataInicio);
      if (!this.isSameDay(dataEvento, dataSelecionada)) return;
      
      const [horaEventoInicio, minEventoInicio] = evento.horaInicio.split(':').map(Number);
      const [horaEventoFim, minEventoFim] = evento.horaFim.split(':').map(Number);
      
      const inicioEvento = new Date(dataSelecionada);
      inicioEvento.setHours(horaEventoInicio, minEventoInicio, 0);
      
      const fimEvento = new Date(dataSelecionada);
      fimEvento.setHours(horaEventoFim, minEventoFim, 0);
      
      // Adicionar buffer de 40 minutos ao fim do evento
      const fimEventoComBuffer = new Date(fimEvento.getTime() + BUFFER_LOGISTICA_MS);
      
      // Verificar sobreposição (considerando buffer logístico)
      if (inicioHorario < fimEventoComBuffer && fimHorarioComBuffer > inicioEvento) {
        evento.itens.forEach(itemEvento => {
          if (!quantidadesAlugadas[itemEvento.id]) {
            quantidadesAlugadas[itemEvento.id] = 0;
          }
          quantidadesAlugadas[itemEvento.id] += itemEvento.quantidade;
        });
      }
    });

    // Filtrar itens disponíveis
    return this.itens.filter(item => {
      const alugados = quantidadesAlugadas[item.id] || 0;
      return item.quantidadeTotal > alugados;
    });
  }

  getEventosPorStatusHoje(status) {
    const dataSelecionada = this.selectedDate;
    return this.eventos.filter((evento) => {
      const dataEvento = this.parseDataLocal(evento.dataInicio);
      return this.isSameDay(dataEvento, dataSelecionada) && evento.status === status;
    }).length;
  }
}

// Export Dashboard class
window.Dashboard = Dashboard;
