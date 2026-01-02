// Eventos Module

class Eventos {
  constructor() {
    this.sync();
    this.selectedDate = new Date();
    this.atualizarStatusEventos();
    this.statusInterval = setInterval(() => this.atualizarStatusEventos(), CONFIG.EVENTOS.STATUS_UPDATE_INTERVAL);
    this.setupStorageListener();
  }

  setupStorageListener() {
    window.addEventListener("storageUpdate", (e) => {
      const { key } = e.detail;
      if (key === "eventos" || key === "clientes" || key === "itens" || key === "financeiroTransacoes") {
        this.sync();
        if (app.currentPage === "eventos") {
          this.render();
        }
      }
    });
  }

  sync() {
    this.eventos = Storage.get("eventos") || [];
    this.clientes = Storage.get("clientes") || [];
    this.itens = Storage.get("itens") || [];
  }

  // ------- Renderização -------
  render() {
    this.atualizarStatusEventos();
    const mainContent = document.getElementById("main-content");
    mainContent.innerHTML = `
      <div class="container-fluid">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h2><i class="bi bi-calendar-event me-2"></i>Gerenciamento de Eventos</h2>
          <div class="d-flex gap-3 align-items-center">
            <div style="min-width: 150px;">
              <label class="form-label mb-2"><small>Filtrar por data:</small></label>
              <input type="date" class="form-control" id="eventos-date" 
                     value="${this.selectedDate.toISOString().split("T")[0]}">
            </div>
            <button class="btn btn-primary" onclick="app.modules.eventos.showForm()">
              <i class="bi bi-plus-circle"></i> Novo Evento
            </button>
          </div>
        </div>
        
        <div id="eventos-container" class="row">
          ${this.renderEventosCards()}
        </div>
      </div>
    `;
    this.setupDatePicker();
  }

  setupDatePicker() {
    const dateInput = document.getElementById("eventos-date");
    if (dateInput) {
      dateInput.addEventListener("change", () => {
        const dateValue = dateInput.value; // formato: YYYY-MM-DD
        if (dateValue) {
          this.selectedDate = this.parseDataLocal(dateValue);
        }
        this.render();
      });
    }
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

  renderEventosCards() {
    const eventos = this.eventos.filter(evento => {
      const dataEvento = this.parseDataLocal(evento.dataInicio);
      return this.isSameDay(dataEvento, this.selectedDate);
    });

    if (eventos.length === 0) {
      return `<div class="col-12"><div class="alert alert-info text-center"><i class="bi bi-info-circle me-2"></i>Nenhum evento nesta data. <a href="#" onclick="app.modules.eventos.showForm()" class="alert-link">Criar novo evento</a></div></div>`;
    }

    return eventos.map((evento) => {
      const cliente = this.clientes.find((c) => c.id === evento.clienteId);
      const statusClass = this.getStatusClass(evento.status);
      const statusText = this.getStatusText(evento.status);
      const pagamentoInfo = this.getPagamentoInfo(evento);
      const dataEvento = this.converterDataLocal(evento.dataInicio);

      return `
        <div class="col-md-6 col-lg-4 mb-4">
          <div class="card h-100 shadow-sm border-0 transition-hover">
            <div class="card-header bg-primary text-white">
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <h5 class="card-title mb-1 text-white">${evento.nome || "Evento sem nome"}</h5>
                  <small class="text-white opacity-75">${cliente ? cliente.nome : "Cliente não encontrado"}</small>
                </div>
                <span class="badge ${statusClass}">${statusText}</span>
              </div>
            </div>
            
            <div class="card-body">
              <!-- Data e Hora -->
              <div class="mb-3 pb-3 border-bottom">
                <div class="d-flex align-items-center gap-2 mb-2">
                  <i class="bi bi-calendar3 text-primary"></i>
                  <span>${DateUtils.formatDate(dataEvento)}</span>
                </div>
                <div class="d-flex align-items-center gap-2">
                  <i class="bi bi-clock text-primary"></i>
                  <span>${evento.horaInicio} - ${evento.horaFim}</span>
                </div>
              </div>

              <!-- Itens/Brinquedos -->
              <div class="mb-3 pb-3 border-bottom">
                <h6 class="mb-2"><i class="bi bi-box-seam me-2 text-success"></i>Itens Contratados</h6>
                <div class="d-flex flex-wrap gap-2">
                  ${evento.itens.map(itemEvento => {
                    const item = this.itens.find(i => i.id === itemEvento.id);
                    return item ? `
                      <div class="badge bg-success bg-opacity-10 text-success border border-success p-2">
                        <i class="bi bi-tag"></i> ${item.nome}
                        <span class="ms-2 fw-bold">×${itemEvento.quantidade}</span>
                      </div>
                    ` : '';
                  }).join('')}
                </div>
              </div>

              <!-- Valores -->
              <div class="mb-3 pb-3 border-bottom">
                <div class="row text-center">
                  <div class="col-6">
                    <small class="text-muted d-block">Total</small>
                    <strong class="fs-6 text-primary">R$ ${evento.valorTotal.toFixed(2)}</strong>
                  </div>
                  <div class="col-6">
                    <small class="text-muted d-block">Pago</small>
                    <strong class="fs-6 ${pagamentoInfo.restante > 0 ? 'text-warning' : 'text-success'}">
                      R$ ${pagamentoInfo.totalPago.toFixed(2)}
                    </strong>
                  </div>
                </div>
                ${pagamentoInfo.restante > 0 ? `
                  <div class="mt-2 alert alert-warning mb-0 py-2">
                    <small><i class="bi bi-exclamation-triangle me-2"></i>Falta: <strong>R$ ${pagamentoInfo.restante.toFixed(2)}</strong></small>
                  </div>
                ` : `
                  <div class="mt-2 alert alert-success mb-0 py-2">
                    <small><i class="bi bi-check-circle me-2"></i>Pagamento completo</small>
                  </div>
                `}
              </div>

              <!-- Observações (se existirem) -->
              ${evento.observacoes ? `
                <div class="mb-3 pb-3 border-bottom">
                  <small class="text-muted d-block mb-1"><i class="bi bi-chat-left-text me-1"></i>Observações</small>
                  <small class="text-dark">${evento.observacoes}</small>
                </div>
              ` : ''}

              <!-- Recomendações IA (se existirem) -->
              ${evento._recomendacoes_ia && evento._recomendacoes_ia.length > 0 ? `
                <div class="mb-3 pb-3 border-bottom">
                  <div class="alert alert-info mb-0 py-2">
                    <div class="d-flex align-items-start gap-2">
                      <i class="bi bi-lightbulb text-info fs-6"></i>
                      <div>
                        <small class="fw-bold d-block mb-1">💡 SUGESTÕES IA:</small>
                        <small class="d-block">${evento._recomendacoes_ia.map(rec => `• ${rec}`).join('<br>')}</small>
                      </div>
                    </div>
                  </div>
                </div>
              ` : ''}
            </div>

            <div class="card-footer bg-light">
              <div class="d-flex gap-2">
                <button class="btn btn-sm btn-success flex-grow-1" onclick="app.modules.eventos.registrarPagamento(${evento.id})" title="Registrar Pagamento">
                  <i class="bi bi-cash-coin me-1"></i>Pagamento
                </button>
                <button class="btn btn-sm btn-info" onclick="app.modules.eventos.editEvento(${evento.id})" title="Editar">
                  <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="app.modules.eventos.deleteEvento(${evento.id})" title="Deletar">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join("");
  }

  renderTableRows() {
    if (this.eventos.length === 0) {
      return `<tr><td colspan="9" class="text-center text-muted">Nenhum evento cadastrado.</td></tr>`;
    }

    return this.eventos.filter(evento => {
      const dataEvento = this.parseDataLocal(evento.dataInicio);
      return this.isSameDay(dataEvento, this.selectedDate);
    })
      .map((evento) => {
        const cliente = this.clientes.find((c) => c.id === evento.clienteId);
        const statusClass = this.getStatusClass(evento.status);
        const statusText = this.getStatusText(evento.status);
        const dataEvento = this.converterDataLocal(evento.dataInicio);
        const pagamentoInfo = this.getPagamentoInfo(evento);

        return `
          <tr>
            <td>${DateUtils.formatDate(dataEvento)}</td>
            <td>${evento.nome || "-"}</td>
            <td>${cliente ? cliente.nome : "Cliente não encontrado"}</td>
            <td>${evento.horaInicio} - ${evento.horaFim}</td>
            <td>${this.renderItensList(evento.itens)}</td>
            <td>R$ ${evento.valorTotal.toFixed(2)}</td>
            <td>
              <span class="badge ${pagamentoInfo.badgeClass}">R$ ${pagamentoInfo.totalPago.toFixed(2)}</span>
              ${pagamentoInfo.restante > 0 ? `<br><small class="text-danger">Falta: R$ ${pagamentoInfo.restante.toFixed(2)}</small>` : ""}
            </td>
            <td><span class="badge ${statusClass}">${statusText}</span></td>
            <td>
              <button class="btn btn-sm btn-success" onclick="app.modules.eventos.registrarPagamento(${evento.id})" title="Registrar Pagamento">
                <i class="bi bi-cash-coin"></i>
              </button>
              <button class="btn btn-sm btn-info" onclick="app.modules.eventos.editEvento(${evento.id})">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="btn btn-sm btn-danger" onclick="app.modules.eventos.deleteEvento(${evento.id})">
                <i class="bi bi-trash"></i>
              </button>
            </td>
          </tr>
        `;
      })
      .join("");
  }

  renderItensList(itens) {
    return itens
      .map((itemEvento) => {
        const item = this.itens.find((i) => i.id === itemEvento.id);
        return item ? `${item.nome} (${itemEvento.quantidade})` : "Item não encontrado";
      })
      .join(", ");
  }

  // ------- Formulário -------
  showForm(evento = null, dataPreSelecionada = null) {
    const isEdit = !!evento;
    const title = isEdit ? "Editar Evento" : "Novo Evento";

    const formHtml = `
      <form id="evento-form" class="needs-validation" novalidate>
        <div class="mb-3">
          <label for="nomeEvento" class="form-label">Nome do Evento</label>
          <input type="text" class="form-control" id="nomeEvento" name="nomeEvento"
                 placeholder="Ex.: Festa infantil, Casamento, Corporativo" value="${
                   isEdit && evento.nome ? evento.nome : ""
                 }">
        </div>

        <div class="mb-3">
          <label for="clienteId" class="form-label">Cliente</label>
          <select class="form-select" id="clienteId" name="clienteId" required>
            <option value="">Selecione...</option>
            ${this.clientes
              .map(
                (cliente) => `
                  <option value="${cliente.id}" ${
                    isEdit && evento.clienteId === cliente.id ? "selected" : ""
                  }>${cliente.nome}</option>
                `
              )
              .join("")}
          </select>
        </div>

        <div class="mb-3">
          <label for="dataInicio" class="form-label">Data do Evento</label>
          <div class="input-group">
            <input type="date" class="form-control" id="dataInicio" name="dataInicio" required
                   value="${isEdit ? evento.dataInicio : dataPreSelecionada || ""}">
            <button class="btn btn-outline-primary" type="button" onclick="app.modules.eventos.preencherDataHoje()">Hoje</button>
            <button class="btn btn-outline-primary" type="button" onclick="app.modules.eventos.preencherDataAmanha()">Amanhã</button>
          </div>
          <small class="text-muted">Use os atalhos para preencher rapidamente.</small>
        </div>

        <div class="row">
          <div class="col-md-6">
            <div class="mb-3">
              <label for="horaInicio" class="form-label">Horário de Início</label>
              <input type="time" class="form-control" id="horaInicio" name="horaInicio" required
                     value="${isEdit ? evento.horaInicio : ""}">
              <div class="btn-group btn-group-sm mt-2 flex-wrap" role="group">
                <button type="button" class="btn btn-outline-primary" onclick="app.modules.eventos.setHorario('08:00', 4)">08:00 (4h)</button>
                <button type="button" class="btn btn-outline-primary" onclick="app.modules.eventos.setHorario('09:00', 4)">09:00 (4h)</button>
                <button type="button" class="btn btn-outline-primary" onclick="app.modules.eventos.setHorario('10:00', 4)">10:00 (4h)</button>
                <button type="button" class="btn btn-outline-primary" onclick="app.modules.eventos.setHorario('14:00', 4)">14:00 (4h)</button>
                <button type="button" class="btn btn-outline-primary" onclick="app.modules.eventos.setHorario('15:00', 4)">15:00 (4h)</button>
                <button type="button" class="btn btn-outline-primary" onclick="app.modules.eventos.setHorario('16:00', 4)">16:00 (4h)</button>
              </div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="mb-3">
              <label for="horaFim" class="form-label">Horário de Término</label>
              <input type="time" class="form-control" id="horaFim" name="horaFim" required
                     value="${isEdit ? evento.horaFim : ""}">
              <div class="btn-group btn-group-sm mt-2" role="group">
                <button type="button" class="btn btn-outline-success" onclick="app.modules.eventos.addDuracao(2)">+2h</button>
                <button type="button" class="btn btn-outline-success" onclick="app.modules.eventos.addDuracao(3)">+3h</button>
                <button type="button" class="btn btn-outline-success" onclick="app.modules.eventos.addDuracao(4)">+4h</button>
                <button type="button" class="btn btn-outline-success" onclick="app.modules.eventos.addDuracao(5)">+5h</button>
                <button type="button" class="btn btn-outline-success" onclick="app.modules.eventos.addDuracao(6)">+6h</button>
              </div>
              <small class="text-muted d-block mt-2">
                <i class="bi bi-info-circle"></i>
                Os itens ficam reservados até 40 minutos após o término (tempo de logística)
              </small>
            </div>
          </div>
        </div>

        <div class="mb-3">
          <label class="form-label">Itens</label>
          <div id="itens-container">
            ${this.renderItensForm(isEdit ? evento.itens : [])}
          </div>
          <button type="button" class="btn btn-outline-primary btn-sm mt-2" onclick="app.modules.eventos.addItemField()">
            <i class="bi bi-plus-circle"></i> Adicionar Item
          </button>
        </div>

        <div class="mb-3">
          <label for="observacoes" class="form-label">Observações</label>
          <textarea class="form-control" id="observacoes" name="observacoes" rows="3">${isEdit ? evento.observacoes || "" : ""}</textarea>
        </div>

        <div class="card bg-light mb-3">
          <div class="card-header"><strong>Pagamento</strong></div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-4">
                <div class="mb-3">
                  <label for="valorEntrada" class="form-label">Valor de Entrada (R$)</label>
                  <input type="number" class="form-control" id="valorEntrada" name="valorEntrada" min="0" step="0.01"
                         value="${isEdit && evento.valorEntrada ? evento.valorEntrada : 0}">
                  <small class="text-muted">Sinal/entrada pago no momento da reserva</small>
                </div>
              </div>
              <div class="col-md-4">
                <div class="mb-3">
                  <label for="taxaDeslocamento" class="form-label">Taxa de Deslocamento (R$)</label>
                  <input type="number" class="form-control" id="taxaDeslocamento" name="taxaDeslocamento" min="0" step="0.01"
                         value="${isEdit && evento.taxaDeslocamento ? evento.taxaDeslocamento : 0}">
                  <small class="text-muted">Custo de deslocamento até o local</small>
                </div>
              </div>
              <div class="col-md-4">
                <div class="mb-3">
                  <label for="formaPagamentoId" class="form-label">Forma de Pagamento</label>
                  <select class="form-select" id="formaPagamentoId" name="formaPagamentoId">
                    <option value="">Não informado</option>
                    ${this.getFormasPagamento()
                      .map(
                        (fp) => `
                          <option value="${fp.id}" ${isEdit && evento.formaPagamentoId === fp.id ? "selected" : ""}>${fp.nome}</option>
                        `
                      )
                      .join("")}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="text-end">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
          <button type="submit" class="btn btn-primary">Salvar</button>
        </div>
      </form>
    `;

    UI.showModal(title, formHtml, true);

    const form = document.getElementById("evento-form");
    if (isEdit) {
      form.dataset.eventoId = evento.id;
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (this.validateForm(form)) {
        const formData = new FormData(form);
        const itensSelecionados = this.getItensFromForm();
        const valorItens = this.calcularValorTotal(itensSelecionados);
        const taxaDeslocamento = parseFloat(formData.get("taxaDeslocamento")) || 0;
        const valorTotal = valorItens + taxaDeslocamento;
        const valorEntrada = parseFloat(formData.get("valorEntrada")) || 0;

        const eventoData = {
          id: isEdit ? evento.id : Date.now(),
          nome: formData.get("nomeEvento") || "",
          clienteId: parseInt(formData.get("clienteId")),
          dataInicio: formData.get("dataInicio"),
          horaInicio: formData.get("horaInicio"),
          horaFim: formData.get("horaFim"),
          itens: itensSelecionados,
          observacoes: formData.get("observacoes"),
          status: isEdit ? evento.status : "aguardando",
          valorTotal,
          taxaDeslocamento,
          valorEntrada,
          formaPagamentoId: formData.get("formaPagamentoId") || null,
          pagamentos: isEdit ? evento.pagamentos || [] : [],
        };

        // ===== INTEGRAÇÃO IA: Detector de Conflitos =====
        if (typeof iaEngine !== 'undefined' && iaEngine.conflictDetector) {
          const loadingToast = toast.loading('Analisando conflitos...');
          
          const eventosExistentes = this.eventos.filter(e => !isEdit || e.id !== evento.id);
          const conflitos = iaEngine.conflictDetector.verificarConflitos(eventoData, eventosExistentes);
          
          toast.resolveLoading(loadingToast, 'success', 'Análise concluída');
          
          if (conflitos.length > 0) {
            const conflitosTexto = conflitos.map((c, i) => `${i + 1}. ${c.descricao}`).join('\n');
            const sugestoes = iaEngine.conflictDetector.sugerirDatasAlternativas(eventoData, eventosExistentes);
            let mensagem = `⚠️ CONFLITOS DETECTADOS:\n\n${conflitosTexto}\n\n`;
            
            if (sugestoes.length > 0) {
              mensagem += `💡 DATAS ALTERNATIVAS:\n${sugestoes.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\n`;
            }
            mensagem += `Deseja continuar mesmo com conflitos?`;
            
            const confirmado = await ConfirmDialog.show('Conflitos Detectados', mensagem);
            if (!confirmado) {
              return; // Usuário cancelou
            }
          }
        }
        // ===== FIM INTEGRAÇÃO IA =====

        // ===== INTEGRAÇÃO IA: Análise de Risco Financeiro =====
        if (typeof assistenteFinanceiro !== 'undefined' && assistenteFinanceiro.analisarCliente) {
          const cliente = this.clientes.find(c => c.id === eventoData.clienteId);
          if (cliente) {
            const loadingToast = toast.loading('Analisando risco financeiro...');
            const analise = assistenteFinanceiro.analisarCliente(cliente, this.eventos);
            toast.resolveLoading(loadingToast, 'success', 'Análise concluída');
            
            if (analise && analise.risco_inadimplencia === "Alto") {
              const aviso = `⚠️ CLIENTE COM ALTO RISCO:\n\n${analise.descricao}\n\nDeseja continuar?`;
              const confirmado = await ConfirmDialog.show('Alerta de Risco', aviso);
              if (!confirmado) {
                return; // Usuário cancelou
              }
            }
          }
        }
        // ===== FIM INTEGRAÇÃO IA =====

        if (isEdit) {
          this.updateEvento(eventoData);
        } else {
          this.addEvento(eventoData);
        }

        bootstrap.Modal.getInstance(document.getElementById("dynamicModal")).hide();
      }
    });
  }

  renderItensForm(itens) {
    if (!itens || itens.length === 0) {
      return this.buildItemRow();
    }
    return itens.map((item) => this.buildItemRow(item)).join("");
  }

  buildItemRow(item = null) {
    const selectedId = item ? item.id : "";
    const selectedQuantidade = item ? item.quantidade : 1;
    return `
      <div class="row mb-2 item-row">
        <div class="col-md-6">
          <select class="form-select item-select" name="itemId[]" required>
            <option value="">Selecione...</option>
            ${this.itens
              .map(
                (i) => `
                  <option value="${i.id}" ${selectedId === i.id ? "selected" : ""}>
                    ${i.nome} (${i.quantidadeTotal} total)
                  </option>
                `
              )
              .join("")}
          </select>
        </div>
        <div class="col-md-4">
          <input type="number" class="form-control item-quantity" name="itemQuantidade[]" min="1" required value="${selectedQuantidade}">
        </div>
        <div class="col-md-2">
          <button type="button" class="btn btn-danger btn-sm" onclick="app.modules.eventos.removeItemField(this)">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </div>
    `;
  }

  addItemField() {
    const container = document.getElementById("itens-container");
    const wrapper = document.createElement("div");
    wrapper.innerHTML = this.buildItemRow();
    container.appendChild(wrapper.firstElementChild);
  }

  removeItemField(button) {
    button.closest(".item-row").remove();
  }

  // ------- Helpers de horário/data -------
  setHorario(hora, duracao) {
    const horaInicio = document.getElementById("horaInicio");
    const horaFim = document.getElementById("horaFim");
    if (!horaInicio || !horaFim) return;
    horaInicio.value = hora;
    const [h, m] = hora.split(":").map(Number);
    const fimHora = h + duracao;
    horaFim.value = `${String(fimHora).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }

  addDuracao(horas) {
    const horaInicio = document.getElementById("horaInicio");
    const horaFim = document.getElementById("horaFim");
    if (!horaInicio || !horaInicio.value) {
      toast.warning("Selecione o horário de início primeiro");
      return;
    }
    const [h, m] = horaInicio.value.split(":").map(Number);
    const fimHora = h + horas;
    horaFim.value = `${String(fimHora).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }

  preencherDataHoje() {
    const input = document.getElementById("dataInicio");
    if (!input) return;
    input.value = new Date().toISOString().split("T")[0];
  }

  preencherDataAmanha() {
    const input = document.getElementById("dataInicio");
    if (!input) return;
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    input.value = amanha.toISOString().split("T")[0];
  }

  // ------- Validação -------
  validateForm(form) {
    if (!form.checkValidity()) {
      form.classList.add("was-validated");
      return false;
    }

    const dataInicio = form.querySelector("#dataInicio").value;
    const horaInicio = form.querySelector("#horaInicio").value;
    const horaFim = form.querySelector("#horaFim").value;
    const itens = this.getItensFromForm();
    const eventoIdExcluir = form.dataset.eventoId ? parseInt(form.dataset.eventoId) : null;

    if (horaInicio >= horaFim) {
      toast.error("O horário de início deve ser anterior ao término");
      return false;
    }

    const dataEvento = this.converterDataLocal(dataInicio);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    dataEvento.setHours(0, 0, 0, 0);
    if (dataEvento < hoje) {
      toast.error("A data do evento não pode ser no passado");
      return false;
    }

    if (itens.length === 0) {
      toast.error("Adicione pelo menos um item ao evento");
      return false;
    }

    if (!this.verificarDisponibilidadeItens(dataInicio, horaInicio, horaFim, itens, eventoIdExcluir)) {
      return false;
    }

    return true;
  }

  getItensFromForm() {
    const itens = [];
    const selects = document.querySelectorAll(".item-select");
    const quantities = document.querySelectorAll(".item-quantity");

    selects.forEach((select, index) => {
      if (select.value) {
        itens.push({
          id: parseInt(select.value),
          quantidade: parseInt(quantities[index].value),
        });
      }
    });

    return itens;
  }

  // ------- Lógica de disponibilidade -------
  verificarDisponibilidadeItens(dataInicio, horaInicio, horaFim, itensSolicitados, eventoIdExcluir = null) {
    const dataEvento = this.converterDataLocal(dataInicio);
    const [horaInicioEvento, minutoInicioEvento] = horaInicio.split(":").map(Number);
    const [horaFimEvento, minutoFimEvento] = horaFim.split(":").map(Number);

    const inicioEvento = new Date(dataEvento);
    inicioEvento.setHours(horaInicioEvento, minutoInicioEvento, 0, 0);

    const fimEvento = new Date(dataEvento);
    fimEvento.setHours(horaFimEvento, minutoFimEvento, 0, 0);

    // Buffer de 40 minutos pós-evento
    const BUFFER_MS = 40 * 60 * 1000;
    const fimComBuffer = new Date(fimEvento.getTime() + BUFFER_MS);

    for (const itemSolicitado of itensSolicitados) {
      const item = this.itens.find((i) => i.id === itemSolicitado.id);
      if (!item) {
        toast.error("Item não encontrado");
        return false;
      }

      let totalEmUso = 0;

      this.eventos.forEach((evento) => {
        if (eventoIdExcluir && evento.id === eventoIdExcluir) return;

        const dataEvt = this.converterDataLocal(evento.dataInicio);
        const [hIni, mIni] = evento.horaInicio.split(":").map(Number);
        const [hFim, mFim] = evento.horaFim.split(":").map(Number);

        const ini = new Date(dataEvt);
        ini.setHours(hIni, mIni, 0, 0);

        const fim = new Date(dataEvt);
        fim.setHours(hFim, mFim, 0, 0);
        const fimBuffer = new Date(fim.getTime() + BUFFER_MS);

        const sobrepoe =
          (inicioEvento >= ini && inicioEvento < fimBuffer) ||
          (fimComBuffer > ini && fimComBuffer <= fimBuffer) ||
          (inicioEvento <= ini && fimComBuffer >= fimBuffer);

        if (sobrepoe) {
          const itemEvento = evento.itens.find((i) => i.id === itemSolicitado.id);
          if (itemEvento) {
            totalEmUso += itemEvento.quantidade;
          }
        }
      });

      const disponiveis = item.quantidadeTotal - totalEmUso;
      if (itemSolicitado.quantidade > disponiveis) {
        toast.error(
          `Item ${item.nome} não disponível na quantidade solicitada. Disponíveis: ${disponiveis}`
        );
        return false;
      }
    }

    return true;
  }

  // ------- CRUD -------
  addEvento(evento) {
    const loadingToast = toast.loading('Salvando evento...');
    
    this.eventos.push(evento);
    Storage.save("eventos", this.eventos);
    this.criarTransacoesFinanceirasEvento(evento);
    
    // ===== INTEGRAÇÃO IA: Recomendações de Itens =====
    if (typeof iaEngine !== 'undefined' && iaEngine.recommendationEngine) {
      const cliente = this.clientes.find(c => c.id === evento.clienteId);
      if (cliente) {
        const historico = this.eventos.filter(e => e.clienteId === evento.clienteId && e.id !== evento.id);
        const recomendacoes = iaEngine.recommendationEngine.recomendarItens(evento, historico, this.itens);
        
        if (recomendacoes.length > 0) {
          // Armazenar recomendações para exibição
          evento._recomendacoes_ia = recomendacoes;
          Storage.save("eventos", this.eventos);
          
          // Log para debug
          debugLog('IA', '🎯 Recomendações IA:', recomendacoes);
        }
      }
    }
    // ===== FIM INTEGRAÇÃO IA =====
    
    toast.resolveLoading(loadingToast, 'success', 'Evento cadastrado com sucesso!');
    this.render();
  }

  updateEvento(evento) {
    const loadingToast = toast.loading('Atualizando evento...');
    
    const index = this.eventos.findIndex((e) => e.id === evento.id);
    if (index !== -1) {
      this.eventos[index] = evento;
      Storage.save("eventos", this.eventos);
      // Recriar pendências financeiras: remover anteriores do mesmo evento e recriar
      this.recriarTransacoesFinanceiras(evento);
      
      // ===== INTEGRAÇÃO IA: Recomendações de Itens =====
      if (typeof iaEngine !== 'undefined' && iaEngine.recommendationEngine) {
        const cliente = this.clientes.find(c => c.id === evento.clienteId);
        if (cliente) {
          const historico = this.eventos.filter(e => e.clienteId === evento.clienteId && e.id !== evento.id);
          const recomendacoes = iaEngine.recommendationEngine.recomendarItens(evento, historico, this.itens);
          
          if (recomendacoes.length > 0) {
            this.eventos[index]._recomendacoes_ia = recomendacoes;
            Storage.save("eventos", this.eventos);
          }
        }
      }
      // ===== FIM INTEGRAÇÃO IA =====
      
      toast.resolveLoading(loadingToast, 'success', 'Evento atualizado com sucesso!');
      this.render();
    }
  }

  async deleteEvento(id) {
    const confirmado = await ConfirmDialog.show(
      "Excluir Evento",
      "Tem certeza que deseja excluir este evento? Esta ação não pode ser desfeita."
    );
    
    if (!confirmado) return;
    
    this.eventos = this.eventos.filter((e) => e.id !== id);
    Storage.save("eventos", this.eventos);
    this.removerTransacoesDoEvento(id);
    this.render();
    toast.success("Evento excluído com sucesso!");
  }

  editEvento(id) {
    const evento = this.eventos.find((e) => e.id === id);
    if (evento) {
      this.showForm(evento);
    }
  }

  // ------- Status -------
  atualizarStatusEventos() {
    const agora = new Date();
    let houveMudanca = false;

    this.eventos.forEach((evento) => {
      const dataEvento = this.converterDataLocal(evento.dataInicio);
      const [horaInicio, minutoInicio] = evento.horaInicio.split(":").map(Number);
      const [horaFim, minutoFim] = evento.horaFim.split(":").map(Number);

      const dataInicio = new Date(dataEvento);
      dataInicio.setHours(horaInicio, minutoInicio, 0, 0);

      const dataFim = new Date(dataEvento);
      dataFim.setHours(horaFim, minutoFim, 0, 0);

      let novoStatus = evento.status;

      if (agora > dataFim) {
        novoStatus = "finalizado";
      } else if (agora >= dataInicio && agora <= dataFim) {
        novoStatus = "andamento";
      } else {
        novoStatus = "aguardando";
      }

      if (novoStatus !== evento.status) {
        evento.status = novoStatus;
        houveMudanca = true;
      }
    });

    if (houveMudanca) {
      Storage.save("eventos", this.eventos);
      if (app.currentPage === "eventos") {
        this.render();
      }
    }
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

  // ------- Pagamentos -------
  getFormasPagamento() {
    return Storage.get("formasPagamento") || [];
  }

  getPagamentoInfo(evento) {
    const valorEntrada = evento.valorEntrada || 0;
    const pagamentos = evento.pagamentos || [];
    const totalPagamentos = pagamentos.reduce((sum, p) => sum + (p.valor || 0), 0);
    const totalPago = valorEntrada + totalPagamentos;
    const restante = evento.valorTotal - totalPago;

    let badgeClass = "bg-danger";
    if (restante <= 0) {
      badgeClass = "bg-success";
    } else if (totalPago > 0) {
      badgeClass = "bg-warning text-dark";
    }

    return {
      totalPago,
      restante: restante > 0 ? restante : 0,
      badgeClass,
    };
  }

  registrarPagamento(eventoId) {
    const evento = this.eventos.find((e) => e.id === eventoId);
    if (!evento) return;

    const pagamentoInfo = this.getPagamentoInfo(evento);
    const restante = pagamentoInfo.restante;

    const formHtml = `
      <form id="pagamento-form" class="needs-validation" novalidate>
        <div class="alert alert-info">
          <strong>Valor Total:</strong> R$ ${evento.valorTotal.toFixed(2)}<br>
          <strong>Total Pago:</strong> R$ ${pagamentoInfo.totalPago.toFixed(2)}<br>
          <strong>Restante:</strong> R$ ${restante.toFixed(2)}
        </div>
        <div class="mb-3">
          <label for="valorPagamento" class="form-label">Valor do Pagamento (R$)</label>
          <input type="number" class="form-control" id="valorPagamento" name="valorPagamento" min="0.01" max="${restante}" step="0.01" required value="${restante}">
        </div>
        <div class="mb-3">
          <label for="formaPagamento" class="form-label">Forma de Pagamento</label>
          <select class="form-select" id="formaPagamento" name="formaPagamento" required>
            <option value="">Selecione...</option>
            ${this.getFormasPagamento()
              .map((fp) => `<option value="${fp.id}">${fp.nome}</option>`)
              .join("")}
          </select>
        </div>
        <div class="mb-3">
          <label for="dataPagamento" class="form-label">Data do Pagamento</label>
          <input type="date" class="form-control" id="dataPagamento" name="dataPagamento" required value="${new Date()
            .toISOString()
            .slice(0, 10)}">
        </div>
        <div class="mb-3">
          <label for="observacaoPagamento" class="form-label">Observação</label>
          <textarea class="form-control" id="observacaoPagamento" name="observacaoPagamento" rows="2"></textarea>
        </div>
        <div class="text-end">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
          <button type="submit" class="btn btn-primary">Registrar Pagamento</button>
        </div>
      </form>
    `;

    UI.showModal("Registrar Pagamento", formHtml);

    const form = document.getElementById("pagamento-form");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.classList.add("was-validated");
        return;
      }

      const formData = new FormData(form);
      const valorPagamento = parseFloat(formData.get("valorPagamento"));
      if (valorPagamento > restante) {
        UI.showAlert("O valor do pagamento não pode ser maior que o restante", "danger");
        return;
      }

      const pagamento = {
        id: Date.now(),
        valor: valorPagamento,
        formaPagamentoId: formData.get("formaPagamento"),
        data: formData.get("dataPagamento"),
        observacao: formData.get("observacaoPagamento"),
        criadoEm: new Date().toISOString(),
      };

      if (!evento.pagamentos) {
        evento.pagamentos = [];
      }
      evento.pagamentos.push(pagamento);

      Storage.save("eventos", this.eventos);
      this.criarTransacaoFinanceira(evento, pagamento);
      this.render();
      UI.showAlert("Pagamento registrado com sucesso!");
      bootstrap.Modal.getInstance(document.getElementById("dynamicModal")).hide();
    });
  }

  // ------- Financeiro -------
  criarTransacoesFinanceirasEvento(evento) {
    const transacoes = Storage.get("financeiroTransacoes") || [];
    const valorEntrada = evento.valorEntrada || 0;
    const valorPendente = evento.valorTotal - valorEntrada;

    // Remove transações antigas deste evento para recriar limpas
    const idxEntrada = transacoes.findIndex(
      (t) => t.origem === "evento" && t.referenciaId === evento.id && t.descricao.includes("Entrada")
    );
    const idxPendente = transacoes.findIndex(
      (t) => t.origem === "evento" && t.referenciaId === evento.id && t.descricao.includes("Saldo Pendente")
    );

    if (idxEntrada !== -1) transacoes.splice(idxEntrada, 1);
    if (idxPendente !== -1) transacoes.splice(idxPendente, 1);

    // Cria transação de ENTRADA (status PAGO, contabiliza no saldo)
    if (valorEntrada > 0) {
      transacoes.push({
        id: Date.now(),
        tipo: "receita",
        origem: "evento",
        referenciaId: evento.id,
        descricao: `Entrada - ${evento.nome || "Evento"}`,
        valor: valorEntrada,
        formaPagamentoId: evento.formaPagamentoId,
        data: new Date().toISOString().slice(0, 10),
        status: "pago",
        criadoEm: new Date().toISOString(),
      });
    }

    // Cria transação de SALDO PENDENTE (status PENDENTE, aguardando pagamento)
    if (valorPendente > 0) {
      transacoes.push({
        id: Date.now() + 1,
        tipo: "receita",
        origem: "evento",
        referenciaId: evento.id,
        descricao: `Saldo Pendente - ${evento.nome || "Evento"}`,
        valor: valorPendente,
        formaPagamentoId: null,
        data: evento.dataInicio,
        status: "pendente",
        criadoEm: new Date().toISOString(),
      });
    }

    Storage.save("financeiroTransacoes", transacoes);
  }

  recriarTransacoesFinanceiras(evento) {
    // Remove TODAS as transações anteriores do evento
    this.removerTransacoesDoEvento(evento.id);
    // Recria entrada e saldo pendente
    this.criarTransacoesFinanceirasEvento(evento);
    // Recria cada pagamento registrado
    (evento.pagamentos || []).forEach((pg) => {
      this.criarTransacaoFinanceira(evento, pg);
    });
  }

  removerTransacoesDoEvento(eventoId) {
    const transacoes = Storage.get("financeiroTransacoes") || [];
    const filtradas = transacoes.filter((t) => !(t.origem === "evento" && t.referenciaId === eventoId));
    Storage.save("financeiroTransacoes", filtradas);
  }

  criarTransacaoFinanceira(evento, pagamento) {
    const transacoes = Storage.get("financeiroTransacoes") || [];

    // Cria transação de PAGAMENTO (status PAGO, contabiliza no saldo)
    transacoes.push({
      id: pagamento.id || Date.now(),
      tipo: "receita",
      origem: "evento",
      referenciaId: evento.id,
      descricao: `Pagamento - ${evento.nome || "Evento"}`,
      valor: pagamento.valor,
      formaPagamentoId: pagamento.formaPagamentoId,
      data: pagamento.data,
      status: "pago",
      observacao: pagamento.observacao,
      criadoEm: pagamento.criadoEm || new Date().toISOString(),
    });

    // Encontra e reduz a transação de Saldo Pendente
    const transacaoPendente = transacoes.find(
      (t) => t.origem === "evento" && t.referenciaId === evento.id && t.descricao.includes("Saldo Pendente")
    );

    if (transacaoPendente) {
      transacaoPendente.valor -= pagamento.valor;
      // Se saldo pendente ficar <= 0, marca como pago
      if (transacaoPendente.valor <= 0) {
        transacaoPendente.valor = 0;
        transacaoPendente.status = "pago";
      }
    }

    Storage.save("financeiroTransacoes", transacoes);
  }

  // ------- Utilitários -------
  converterDataLocal(dataStr) {
    const [ano, mes, dia] = dataStr.split("-").map(Number);
    return new Date(ano, mes - 1, dia);
  }

  calcularValorTotal(itens) {
    return itens.reduce((total, item) => {
      const itemObj = this.itens.find((i) => i.id === item.id);
      return total + (itemObj ? itemObj.valorDiaria * item.quantidade : 0);
    }, 0);
  }

  registrarPagamentoDirecto(eventoId, pagamentoData) {
    const evento = this.eventos.find((e) => e.id === eventoId);
    if (!evento) return;

    const pagamento = {
      id: Date.now(),
      valor: pagamentoData.valor,
      formaPagamentoId: pagamentoData.formaPagamentoId,
      data: pagamentoData.data,
      observacao: pagamentoData.observacao || "",
      criadoEm: new Date().toISOString(),
    };

    if (!evento.pagamentos) {
      evento.pagamentos = [];
    }
    evento.pagamentos.push(pagamento);

    Storage.save("eventos", this.eventos);
    this.criarTransacaoFinanceira(evento, pagamento);
  }
}

window.Eventos = Eventos;
