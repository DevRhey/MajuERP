// Orcamentos Module

class Orcamentos {
  constructor() {
    this.sync();
    this.setupStorageListener();
  }

  setupStorageListener() {
    window.addEventListener('storageUpdate', (e) => {
      const { key } = e.detail;
      if (key === 'orcamentos' || key === 'clientes' || key === 'itens') {
        this.sync();
        if (app.currentPage === 'orcamentos') {
          this.render();
        }
      }
    });
  }

  sync() {
    this.orcamentos = Storage.get("orcamentos") || [];
    this.clientes = Storage.get("clientes") || [];
    this.itens = Storage.get("itens") || [];
  }

  render() {
    this.sync();
    const stats = this.getStats();
    const mainContent = document.getElementById("main-content");
    mainContent.innerHTML = `
      <div class="container">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h2>Orçamentos</h2>
          <button class="btn btn-primary" onclick="app.modules.orcamentos.showForm()">
            <i class="bi bi-plus-circle"></i> Novo Orçamento
          </button>
        </div>

        <div class="row g-3 mb-3">
          <div class="col-md-4">
            <div class="card shadow-sm h-100">
              <div class="card-body">
                <h6 class="text-muted">Total de Orçamentos</h6>
                <h4>${stats.total}</h4>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card shadow-sm h-100">
              <div class="card-body">
                <h6 class="text-muted">Aprovados</h6>
                <h4 class="text-success">${stats.aprovados}</h4>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card shadow-sm h-100">
              <div class="card-body">
                <h6 class="text-muted">Valor Potencial</h6>
                <h4>R$ ${stats.valorPotencial.toFixed(2)}</h4>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-hover">
                <thead>
                  <tr>
                    <th>Número</th>
                    <th>Cliente</th>
                    <th>Data do Evento</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  ${this.renderTableRows()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  getStats() {
    const aprovados = this.orcamentos.filter((o) => o.status === "aprovado");
    const valorPotencial = aprovados.reduce((sum, o) => sum + (o.totalGeral || 0), 0);
    return {
      total: this.orcamentos.length,
      aprovados: aprovados.length,
      valorPotencial,
    };
  }

  renderTableRows() {
    if (this.orcamentos.length === 0) {
      return `<tr><td colspan="6" class="text-center text-muted">Nenhum orçamento criado ainda.</td></tr>`;
    }

    return this.orcamentos
      .map((orcamento) => {
        const cliente = this.clientes.find((c) => c.id === orcamento.clienteId);
        const statusClass = this.getStatusClass(orcamento.status);
        const statusText = this.getStatusText(orcamento.status);

        return `
          <tr>
            <td>${orcamento.numero}</td>
            <td>${cliente ? cliente.nome : "Cliente removido"}</td>
            <td>${DateUtils.formatDate(orcamento.dataEvento)}</td>
            <td>R$ ${(orcamento.totalGeral || 0).toFixed(2)}</td>
            <td><span class="badge ${statusClass}">${statusText}</span></td>
            <td>
              <button class="btn btn-sm btn-secondary" onclick="app.modules.orcamentos.verDetalhes(${orcamento.id})">
                <i class="bi bi-eye"></i>
              </button>
              <button class="btn btn-sm btn-info" onclick="app.modules.orcamentos.showForm(app.modules.orcamentos.getById(${orcamento.id}))">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="btn btn-sm btn-success" onclick="app.modules.orcamentos.aprovar(${orcamento.id})">
                <i class="bi bi-check2-circle"></i>
              </button>
              <button class="btn btn-sm btn-warning" onclick="app.modules.orcamentos.enviar(${orcamento.id})">
                <i class="bi bi-send"></i>
              </button>
              <button class="btn btn-sm btn-danger" onclick="app.modules.orcamentos.recusar(${orcamento.id})">
                <i class="bi bi-x-circle"></i>
              </button>
            </td>
          </tr>
        `;
      })
      .join("");
  }

  getById(id) {
    return this.orcamentos.find((o) => o.id === id);
  }

  getStatusClass(status) {
    switch (status) {
      case "aprovado":
        return "bg-success";
      case "enviado":
        return "bg-info";
      case "recusado":
        return "bg-danger";
      default:
        return "bg-secondary";
    }
  }

  getStatusText(status) {
    switch (status) {
      case "aprovado":
        return "Aprovado";
      case "enviado":
        return "Enviado";
      case "recusado":
        return "Recusado";
      default:
        return "Rascunho";
    }
  }

  showForm(orcamento = null) {
    const isEdit = !!orcamento;
    const title = isEdit ? "Editar Orçamento" : "Novo Orçamento";
    const itensSelecionados = isEdit ? orcamento.itens : [];

    const formHtml = `
      <form id="orcamento-form" class="needs-validation" novalidate>
        <div class="mb-3">
          <label for="clienteId" class="form-label">Cliente</label>
          <select class="form-select" id="clienteId" name="clienteId" required>
            <option value="">Selecione...</option>
            ${this.clientes
              .map(
                (cliente) => `
                  <option value="${cliente.id}" ${
                    isEdit && cliente.id === orcamento.clienteId ? "selected" : ""
                  }>${cliente.nome}</option>
                `
              )
              .join("")}
          </select>
        </div>

        <div class="row">
          <div class="col-md-6">
            <div class="mb-3">
              <label for="dataEvento" class="form-label">Data do Evento</label>
              <input type="date" class="form-control" id="dataEvento" name="dataEvento" required value="${
                isEdit ? orcamento.dataEvento : ""
              }">
            </div>
          </div>
          <div class="col-md-6">
            <div class="mb-3">
              <label for="validade" class="form-label">Validade do Orçamento</label>
              <input type="date" class="form-control" id="validade" name="validade" required value="${
                isEdit ? orcamento.validade : ""
              }">
            </div>
          </div>
        </div>

        <div class="row">
          <div class="col-md-6">
            <div class="mb-3">
              <label for="horaInicio" class="form-label">Hora Início</label>
              <input type="time" class="form-control" id="horaInicio" name="horaInicio" required value="${
                isEdit ? orcamento.horaInicio : ""
              }">
            </div>
          </div>
          <div class="col-md-6">
            <div class="mb-3">
              <label for="horaFim" class="form-label">Hora Fim</label>
              <input type="time" class="form-control" id="horaFim" name="horaFim" required value="${
                isEdit ? orcamento.horaFim : ""
              }">
            </div>
          </div>
        </div>

        <div class="mb-3">
          <label class="form-label">Itens</label>
          <div id="itens-container">
            ${this.renderItensForm(itensSelecionados)}
          </div>
          <button type="button" class="btn btn-outline-primary btn-sm mt-2" onclick="app.modules.orcamentos.addItemField()">
            <i class="bi bi-plus-circle"></i> Adicionar Item
          </button>
        </div>

        <div class="row">
          <div class="col-md-6">
            <div class="mb-3">
              <label for="desconto" class="form-label">Desconto (%)</label>
              <input type="number" class="form-control" id="desconto" name="desconto" min="0" max="100" step="0.1" value="${
                isEdit ? orcamento.desconto : 0
              }">
            </div>
          </div>
          <div class="col-md-6">
            <div class="mb-3">
              <label for="acrescimos" class="form-label">Acréscimos (R$)</label>
              <input type="number" class="form-control" id="acrescimos" name="acrescimos" min="0" step="0.01" value="${
                isEdit ? orcamento.acrescimos : 0
              }">
            </div>
          </div>
        </div>

        <div class="mb-3">
          <label for="observacoes" class="form-label">Observações</label>
          <textarea class="form-control" id="observacoes" name="observacoes" rows="3">${
            isEdit ? orcamento.observacoes || "" : ""
          }</textarea>
        </div>

        <div class="text-end">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
          <button type="submit" class="btn btn-primary">Salvar</button>
        </div>
      </form>
    `;

    UI.showModal(title, formHtml, true);

    const form = document.getElementById("orcamento-form");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.classList.add("was-validated");
        return;
      }

      const itensSelecionadosForm = this.getItensFromForm();
      if (itensSelecionadosForm.length === 0) {
        UI.showAlert("Selecione ao menos um item", "danger");
        return;
      }

      const formData = new FormData(form);
      const desconto = parseFloat(formData.get("desconto") || 0);
      const acrescimos = parseFloat(formData.get("acrescimos") || 0);
      const totalItens = this.calcularTotalItens(itensSelecionadosForm);
      const totalGeral = this.calcularTotalGeral(totalItens, desconto, acrescimos);

      const payload = {
        id: isEdit ? orcamento.id : Date.now(),
        numero: isEdit ? orcamento.numero : `ORC-${Date.now()}`,
        clienteId: parseInt(formData.get("clienteId")),
        dataEvento: formData.get("dataEvento"),
        validade: formData.get("validade"),
        horaInicio: formData.get("horaInicio"),
        horaFim: formData.get("horaFim"),
        itens: itensSelecionadosForm,
        desconto,
        acrescimos,
        observacoes: formData.get("observacoes"),
        totalItens,
        totalGeral,
        status: isEdit ? orcamento.status : "rascunho",
        criadoEm: isEdit ? orcamento.criadoEm : new Date().toISOString(),
      };

      if (isEdit) {
        this.update(payload);
      } else {
        this.add(payload);
      }

      bootstrap.Modal.getInstance(document.getElementById("dynamicModal")).hide();
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
                    ${i.nome} (R$ ${i.valorDiaria.toFixed(2)}/dia)
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
          <button type="button" class="btn btn-danger btn-sm" onclick="app.modules.orcamentos.removeItemField(this)">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </div>
    `;
  }

  addItemField() {
    const container = document.getElementById("itens-container");
    const wrapper = document.createElement("div");
    wrapper.className = "item-row-wrapper";
    wrapper.innerHTML = this.buildItemRow();
    container.appendChild(wrapper.firstElementChild);
  }

  removeItemField(button) {
    button.closest(".item-row").remove();
  }

  getItensFromForm() {
    const itens = [];
    const selects = document.querySelectorAll(".item-select");
    const quantities = document.querySelectorAll(".item-quantity");

    selects.forEach((select, index) => {
      if (select.value) {
        const item = this.itens.find((i) => i.id === parseInt(select.value));
        itens.push({
          id: parseInt(select.value),
          quantidade: parseInt(quantities[index].value),
          valorUnitario: item ? item.valorDiaria : 0,
          subtotal: item ? item.valorDiaria * parseInt(quantities[index].value) : 0,
        });
      }
    });

    return itens;
  }

  calcularTotalItens(itens) {
    return itens.reduce((sum, item) => sum + (item.subtotal || 0), 0);
  }

  calcularTotalGeral(totalItens, desconto, acrescimos) {
    const descontoValor = (totalItens * (desconto || 0)) / 100;
    return totalItens - descontoValor + (acrescimos || 0);
  }

  add(orcamento) {
    this.orcamentos.push(orcamento);
    Storage.save("orcamentos", this.orcamentos);
    this.render();
    UI.showAlert("Orçamento criado com sucesso!");
  }

  update(orcamento) {
    const index = this.orcamentos.findIndex((o) => o.id === orcamento.id);
    if (index !== -1) {
      this.orcamentos[index] = orcamento;
      Storage.save("orcamentos", this.orcamentos);
      this.render();
      UI.showAlert("Orçamento atualizado!");
    }
  }

  enviar(id) {
    const orcamento = this.getById(id);
    if (!orcamento) return;
    orcamento.status = "enviado";
    Storage.save("orcamentos", this.orcamentos);
    this.render();
    UI.showAlert("Orçamento marcado como enviado.");
  }

  aprovar(id) {
    const orcamento = this.getById(id);
    if (!orcamento) return;
    orcamento.status = "aprovado";
    Storage.save("orcamentos", this.orcamentos);
    this.registrarFinanceiro(orcamento);
    this.render();
    UI.showAlert("Orçamento aprovado e enviado ao financeiro.");
  }

  recusar(id) {
    const orcamento = this.getById(id);
    if (!orcamento) return;
    orcamento.status = "recusado";
    Storage.save("orcamentos", this.orcamentos);
    this.render();
    UI.showAlert("Orçamento recusado.", "warning");
  }

  verDetalhes(id) {
    const orcamento = this.getById(id);
    if (!orcamento) return;
    const cliente = this.clientes.find((c) => c.id === orcamento.clienteId);

    const itensHtml = orcamento.itens
      .map((item) => {
        const ref = this.itens.find((i) => i.id === item.id);
        return `<li class="list-group-item d-flex justify-content-between">
            <span>${ref ? ref.nome : "Item removido"} (${item.quantidade}x)</span>
            <strong>R$ ${(item.subtotal || 0).toFixed(2)}</strong>
          </li>`;
      })
      .join("");

    const content = `
      <div class="mb-3">
        <strong>Cliente:</strong> ${cliente ? cliente.nome : "Cliente removido"}<br>
        <strong>Data do Evento:</strong> ${DateUtils.formatDate(orcamento.dataEvento)} ${orcamento.horaInicio} - ${orcamento.horaFim}<br>
        <strong>Validade:</strong> ${DateUtils.formatDate(orcamento.validade)}<br>
        <strong>Status:</strong> ${this.getStatusText(orcamento.status)}
      </div>
      <div class="mb-3">
        <h6>Itens</h6>
        <ul class="list-group list-group-flush">
          ${itensHtml}
        </ul>
      </div>
      <div class="mb-3">
        <div class="d-flex justify-content-between">
          <span>Subtotal</span>
          <strong>R$ ${(orcamento.totalItens || 0).toFixed(2)}</strong>
        </div>
        <div class="d-flex justify-content-between">
          <span>Desconto</span>
          <strong>${orcamento.desconto || 0}%</strong>
        </div>
        <div class="d-flex justify-content-between">
          <span>Acréscimos</span>
          <strong>R$ ${(orcamento.acrescimos || 0).toFixed(2)}</strong>
        </div>
        <div class="d-flex justify-content-between border-top pt-2">
          <span>Total</span>
          <strong>R$ ${(orcamento.totalGeral || 0).toFixed(2)}</strong>
        </div>
      </div>
      <div>
        <h6>Observações</h6>
        <p class="text-muted">${orcamento.observacoes || "-"}</p>
      </div>
    `;

    UI.showModal(`Orçamento ${orcamento.numero}`, content, true);
  }

  registrarFinanceiro(orcamento) {
    const transacoes = Storage.get("financeiroTransacoes") || [];
    const jaCriada = transacoes.some(
      (t) => t.origem === "orcamento" && t.referenciaId === orcamento.id
    );

    if (jaCriada) return;

    transacoes.push({
      id: Date.now(),
      tipo: "receita",
      origem: "orcamento",
      referenciaId: orcamento.id,
      descricao: `Orçamento ${orcamento.numero}`,
      valor: orcamento.totalGeral || 0,
      formaPagamentoId: null,
      data: new Date().toISOString().slice(0, 10),
      status: "pendente",
      criadoEm: new Date().toISOString(),
    });

    Storage.save("financeiroTransacoes", transacoes);
  }
}

window.Orcamentos = Orcamentos;
