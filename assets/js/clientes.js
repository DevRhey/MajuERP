// Clientes Module

class Clientes {
  constructor() {
    this.clientes = Storage.get("clientes") || [];
    this.searchTerm = '';
    this.setupStorageListener();
  }

  setupStorageListener() {
    window.addEventListener('storageUpdate', (e) => {
      const { key } = e.detail;
      if (key === 'clientes') {
        this.sync();
        if (window.app && app.currentPage === 'clientes') {
          this.render();
        }
      }
    });
  }

  sync() {
    this.clientes = Storage.get("clientes") || [];
  }

  render() {
    const mainContent = document.getElementById("main-content");
    mainContent.innerHTML = `
            <div class="container">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h2>Gerenciamento de Clientes</h2>
                    <button class="btn btn-primary" onclick="app.modules.clientes.showForm()">
                        <i class="bi bi-plus-circle"></i> Novo Cliente
                    </button>
                </div>
                
                <div class="card">
                    <div class="card-body">
                        <div class="mb-3">
                            <input type="text" class="form-control" id="search-clientes" 
                                   placeholder="🔍 Buscar por nome, CPF ou telefone...">
                        </div>
                        <div class="table-responsive">
                            <table class="table table-hover">
                                <thead>
                                    <tr>
                                        <th>Nome</th>
                                        <th>CPF</th>
                                        <th>Telefone</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody id="clientes-table-body">
                                    ${this.renderTableRows()}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;
    this.setupSearch();
  }

  renderTableRows() {
    let clientesFiltrados = this.clientes;
    
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      clientesFiltrados = this.clientes.filter(cliente => 
        cliente.nome.toLowerCase().includes(term) ||
        cliente.cpf.includes(term) ||
        cliente.telefone.includes(term)
      );
    }
    
    return clientesFiltrados
      .map(
        (cliente) => {
          const riscoIA = cliente._analise_ia?.risco || 'N/A';
          const badgeClass = riscoIA === 'Alto' ? 'danger' : riscoIA === 'Médio' ? 'warning' : 'success';
          const riscoBadge = riscoIA !== 'N/A' ? `<span class="badge bg-${badgeClass}">${riscoIA}</span>` : '';
          
          return `
            <tr>
                <td>
                  <div>${cliente.nome}</div>
                  ${riscoBadge}
                </td>
                <td>${cliente.cpf}</td>
                <td>${cliente.telefone}</td>
                <td>
                    <button class="btn btn-sm btn-success" onclick="app.modules.clientes.abrirWhatsApp('${cliente.telefone}')" title="Conversar no WhatsApp">
                        <i class="bi bi-whatsapp"></i>
                    </button>
                    <button class="btn btn-sm btn-info" onclick="app.modules.clientes.editCliente(${cliente.id})">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="app.modules.clientes.deleteCliente(${cliente.id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `
        }
      )
      .join("");
  }

  setupSearch() {
    const searchInput = document.getElementById('search-clientes');
    if (searchInput) {
      searchInput.value = this.searchTerm;
      searchInput.addEventListener('input', debounce((e) => {
        this.searchTerm = e.target.value;
        this.updateTable();
      }, 300));
    }
  }

  updateTable() {
    const tbody = document.getElementById('clientes-table-body');
    if (tbody) {
      tbody.innerHTML = this.renderTableRows();
    }
  }

  showForm(cliente = null) {
    const isEdit = cliente !== null;
    const title = isEdit ? "Editar Cliente" : "Novo Cliente";

    const formHtml = `
            <form id="cliente-form" class="needs-validation" novalidate>
                <div class="mb-3">
                    <label for="nome" class="form-label">Nome Completo</label>
                    <input type="text" class="form-control" id="nome" name="nome" required
                           value="${isEdit ? cliente.nome : ""}">
                </div>
                
                <div class="mb-3">
                    <label for="cpf" class="form-label">CPF</label>
                    <input type="text" class="form-control" id="cpf" name="cpf" required
                           value="${isEdit ? cliente.cpf : ""}">
                </div>
                
                <div class="mb-3">
                    <label for="telefone" class="form-label">Telefone</label>
                    <input type="text" class="form-control" id="telefone" name="telefone" required
                           value="${isEdit ? cliente.telefone : ""}">
                </div>
                
                <div class="mb-3">
                    <label for="endereco" class="form-label">Endereço</label>
                    <textarea class="form-control" id="endereco" name="endereco" required>${
                      isEdit ? cliente.endereco : ""
                    }</textarea>
                </div>
                
                <div class="text-end">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                    <button type="submit" class="btn btn-primary">Salvar</button>
                </div>
            </form>
        `;

    UI.showModal(title, formHtml);

    // Form validation and submission
    const form = document.getElementById("cliente-form");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (this.validateForm(form)) {
        const formData = new FormData(form);
        const clienteData = {
          id: isEdit ? cliente.id : Date.now(),
          nome: formData.get("nome"),
          cpf: formData.get("cpf"),
          telefone: formData.get("telefone"),
          endereco: formData.get("endereco"),
        };

        if (isEdit) {
          await this.updateCliente(clienteData);
        } else {
          await this.addCliente(clienteData);
        }

        bootstrap.Modal.getInstance(
          document.getElementById("dynamicModal")
        ).hide();
      }
    });

    // Initialize form validation
    this.initializeFormValidation(form);
  }

  validateForm(form) {
    if (!form.checkValidity()) {
      form.classList.add("was-validated");
      return false;
    }

    const cpf = form.querySelector("#cpf").value;
    const telefone = form.querySelector("#telefone").value;

    // Validar CPF apenas se tiver 11 dígitos
    const cpfDigits = cpf.replace(/\D/g, "");
    if (cpfDigits.length === 11 && !Validation.isValidCPF(cpf)) {
      UI.showAlert("CPF inválido", "danger");
      return false;
    } else if (cpfDigits.length !== 11) {
      UI.showAlert("CPF deve conter 11 dígitos", "danger");
      return false;
    }

    // Validar telefone apenas se tiver pelo menos 10 dígitos
    const phoneDigits = telefone.replace(/\D/g, "");
    if (phoneDigits.length < 10 || phoneDigits.length > 11) {
      UI.showAlert("Telefone deve conter 10 ou 11 dígitos", "danger");
      return false;
    }

    return true;
  }

  initializeFormValidation(form) {
    // Add input masks
    const cpfInput = form.querySelector("#cpf");
    const telefoneInput = form.querySelector("#telefone");

    cpfInput.addEventListener("input", (e) => {
      let value = e.target.value.replace(/\D/g, "");
      if (value.length <= 11) {
        value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
        e.target.value = value;
      }
    });

    telefoneInput.addEventListener("input", (e) => {
      let value = e.target.value.replace(/\D/g, "");
      if (value.length <= 11) {
        value = value.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
        e.target.value = value;
      }
    });
  }

  async addCliente(cliente) {
    this.clientes.push(cliente);
    Storage.save("clientes", this.clientes);
    await this.analisarClienteIA(cliente);
    this.render();
    UI.showAlert("Cliente cadastrado com sucesso!");
  }

  async updateCliente(cliente) {
    const index = this.clientes.findIndex((c) => c.id === cliente.id);
    if (index !== -1) {
      this.clientes[index] = cliente;
      Storage.save("clientes", this.clientes);
      await this.analisarClienteIA(cliente, index);
      this.render();
      UI.showAlert("Cliente atualizado com sucesso!");
    }
  }

  async analisarClienteIA(cliente, existingIndex = null) {
    try {
      const eventos = Storage.get("eventos") || [];
      const transacoes = Storage.get("financeiroTransacoes") || [];
      let analise = null;

      if (typeof iaOrchestrator !== 'undefined' && iaOrchestrator.analisarClienteFinanceiro) {
        analise = await iaOrchestrator.analisarClienteFinanceiro(cliente, eventos, transacoes, this.clientes);
      } else if (typeof assistenteFinanceiro !== 'undefined' && assistenteFinanceiro?.analisarCliente) {
        analise = assistenteFinanceiro.analisarCliente(cliente.id);
      }

      if (analise) {
        const targetIndex = existingIndex !== null ? existingIndex : this.clientes.findIndex((c) => c.id === cliente.id);
        if (targetIndex !== -1) {
          this.clientes[targetIndex]._analise_ia = {
            risco: analise.risco_inadimplencia,
            pontuacao: analise.score,
            timestamp: new Date().toISOString(),
          };
          Storage.save("clientes", this.clientes);
        }

        if (analise.risco_inadimplencia === "Alto") {
          UI.showAlert(`⚠️ Cliente com risco financeiro ALTO! ${analise.descricao || ''}`.trim(), "warning");
        }
      }
    } catch (error) {
      console.error('Erro ao analisar cliente via IA', error);
    }
  }

  async deleteCliente(id) {
    const confirmado = await ConfirmDialog.show(
      "Excluir Cliente",
      "Tem certeza que deseja excluir este cliente?"
    );
    
    if (confirmado) {
      this.clientes = this.clientes.filter((c) => c.id !== id);
      Storage.save("clientes", this.clientes);
      this.render();
      toast.success("Cliente excluído com sucesso!");
    }
  }

  editCliente(id) {
    const cliente = this.clientes.find((c) => c.id === id);
    if (cliente) {
      this.showForm(cliente);
    }
  }

  abrirWhatsApp(telefone) {
    // Remove caracteres especiais e pega apenas dígitos
    const telefoneNumeros = telefone.replace(/\D/g, "");
    // Se não tiver código de país, adiciona 55 (Brasil)
    const telefoneFinal = telefoneNumeros.length === 11 ? "55" + telefoneNumeros : "55" + telefoneNumeros.slice(-11);
    // Abre WhatsApp Web
    const url = `https://wa.me/${telefoneFinal}`;
    window.open(url, "_blank");
  }
}

// Export Clientes class
window.Clientes = Clientes;
