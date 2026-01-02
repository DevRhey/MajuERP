// Itens Module

class Itens {
  constructor() {
    this.itens = Storage.get("itens") || [];
    this.selectedDate = new Date();
    this.searchTerm = '';
    this.setupStorageListener();
  }

  setupStorageListener() {
    window.addEventListener('storageUpdate', (e) => {
      const { key } = e.detail;
      if (key === 'itens' || key === 'eventos') {
        this.sync();
        if (app.currentPage === 'itens') {
          this.render();
        }
      }
    });
  }

  sync() {
    this.itens = Storage.get("itens") || [];
  }

  render() {
    const mainContent = document.getElementById("main-content");
    mainContent.innerHTML = `
            <div class="container">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h2>Gerenciamento de Itens</h2>
                    <div class="d-flex gap-3 align-items-center">
                        <div style="min-width: 150px;">
                            <label class="form-label mb-2"><small>Filtrar por data:</small></label>
                            <input type="date" class="form-control" id="itens-date" 
                                   value="${this.selectedDate.toISOString().split("T")[0]}">
                        </div>
                        <div>
                            <button class="btn btn-primary" onclick="app.modules.itens.showForm()">
                                <i class="bi bi-plus-circle"></i> Novo Item
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-body">
                        <div class="mb-3">
                            <input type="text" class="form-control" id="search-itens" 
                                   placeholder="🔍 Buscar por nome ou tipo...">
                        </div>
                        <div class="table-responsive">
                            <table class="table table-hover">
                                <thead>
                                    <tr>
                                        <th>Nome</th>
                                        <th>Tipo</th>
                                        <th>Quantidade Total</th>
                                        <th>Disponíveis</th>
                                        <th>Alugados</th>
                                        <th>Valor Diária</th>
                                        <th>Status</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody id="itens-table-body">
                                    ${this.renderTableRows()}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;
    this.setupDatePicker();
    this.setupSearch();
  }

  setupDatePicker() {
    const dateInput = document.getElementById("itens-date");
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

  renderTableRows() {
    // Calcular quantidades alugadas baseadas nos eventos da data selecionada
    const eventos = Storage.get("eventos") || [];
    const quantidadesAlugadas = {};
    const agora = new Date();
    const BUFFER_LOGISTICA_MS = 40 * 60 * 1000; // 40 minutos
    
    eventos.forEach((evento) => {
      if (evento.status === "finalizado") return;
      
      // Verificar se o evento é do dia selecionado
      const dataEvento = this.parseDataLocal(evento.dataInicio);
      if (!this.isSameDay(dataEvento, this.selectedDate)) return;
      
      // Verificar se o evento ainda está em uso (incluindo buffer de 40 min)
      const [ano, mes, dia] = evento.dataInicio.split('-').map(Number);
      const [horaFim, minFim] = evento.horaFim.split(':').map(Number);
      const fimEvento = new Date(ano, mes - 1, dia, horaFim, minFim, 0);
      const fimComBuffer = new Date(fimEvento.getTime() + BUFFER_LOGISTICA_MS);
      
      // Só considera alugado se ainda não passou o horário (com buffer)
      if (agora < fimComBuffer) {
        evento.itens.forEach((itemEvento) => {
          if (!quantidadesAlugadas[itemEvento.id]) {
            quantidadesAlugadas[itemEvento.id] = 0;
          }
          quantidadesAlugadas[itemEvento.id] += itemEvento.quantidade;
        });
      }
    });

    return this.itens
      .map((item) => {
        const quantidadeAlugada = quantidadesAlugadas[item.id] || 0;
        const disponiveis = item.quantidadeTotal - quantidadeAlugada;
        const statusClass = disponiveis > 0 ? "bg-success" : "bg-danger";
        const statusText = disponiveis > 0 ? "Disponível" : "Indisponível";
        const proximaDisponibilidade = this.verificarProximaDisponibilidade(
          item.id
        );

        return `
                <tr data-item-id="${item.id}">
                    <td>${item.nome}</td>
                    <td>${item.tipo}</td>
                    <td>${item.quantidadeTotal}</td>
                    <td>${disponiveis}</td>
                    <td>${quantidadeAlugada}</td>
                    <td>R$ ${item.valorDiaria.toFixed(2)}</td>
                    <td>
                        <span class="badge ${statusClass}">${statusText}</span>
                        ${
                          disponiveis === 0
                            ? `<br><small class="text-muted">${proximaDisponibilidade}</small>`
                            : ""
                        }
                    </td>
                    <td>
                        <button class="btn btn-sm btn-info" onclick="app.modules.itens.editItem(${
                          item.id
                        })">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="app.modules.itens.deleteItem(${
                          item.id
                        })">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
      })
      .join("");
  }

  setupSearch() {
    const searchInput = document.getElementById('search-itens');
    if (searchInput) {
      searchInput.value = this.searchTerm;
      searchInput.addEventListener('input', debounce((e) => {
        this.searchTerm = e.target.value;
        this.updateTable();
      }, 300));
    }
  }

  updateTable() {
    const tbody = document.getElementById('itens-table-body');
    if (tbody) {
      tbody.innerHTML = this.renderTableRows();
    }
  }

  showForm(item = null) {
    const isEdit = item !== null;
    const title = isEdit ? "Editar Item" : "Novo Item";

    const formHtml = `
            <form id="item-form" class="needs-validation" novalidate>
                <div class="mb-3">
                    <label for="nome" class="form-label">Nome</label>
                    <input type="text" class="form-control" id="nome" name="nome" required
                           value="${isEdit ? item.nome : ""}">
                </div>
                
                <div class="mb-3">
                    <label for="tipo" class="form-label">Tipo</label>
                    <select class="form-select" id="tipo" name="tipo" required>
                        <option value="">Selecione...</option>
                        <option value="brinquedo" ${
                          isEdit && item.tipo === "brinquedo" ? "selected" : ""
                        }>Brinquedo</option>
                        <option value="servico" ${
                          isEdit && item.tipo === "servico" ? "selected" : ""
                        }>Serviço</option>
                    </select>
                </div>
                
                <div class="mb-3">
                    <label for="quantidadeTotal" class="form-label">Quantidade Total</label>
                    <input type="number" class="form-control" id="quantidadeTotal" name="quantidadeTotal" 
                           min="1" required value="${
                             isEdit ? item.quantidadeTotal : "1"
                           }">
                </div>
                
                <div class="mb-3">
                    <label for="descricao" class="form-label">Descrição</label>
                    <textarea class="form-control" id="descricao" name="descricao" required>${
                      isEdit ? item.descricao : ""
                    }</textarea>
                </div>
                
                <div class="mb-3">
                    <label for="valorDiaria" class="form-label">Valor da Diária (R$)</label>
                    <input type="number" class="form-control" id="valorDiaria" name="valorDiaria" 
                           step="0.01" min="0" required value="${
                             isEdit ? item.valorDiaria : ""
                           }">
                </div>
                
                <div class="mb-3">
                    <label for="imagem" class="form-label">URL da Imagem</label>
                    <input type="url" class="form-control" id="imagem" name="imagem"
                           value="${isEdit ? item.imagem : ""}">
                </div>
                
                <div class="text-end">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                    <button type="submit" class="btn btn-primary">Salvar</button>
                </div>
            </form>
        `;

    UI.showModal(title, formHtml);

    // Form validation and submission
    const form = document.getElementById("item-form");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (this.validateForm(form)) {
        const formData = new FormData(form);
        const itemData = {
          id: isEdit ? item.id : Date.now(),
          nome: formData.get("nome"),
          tipo: formData.get("tipo"),
          quantidadeTotal: parseInt(formData.get("quantidadeTotal")),
          descricao: formData.get("descricao"),
          valorDiaria: parseFloat(formData.get("valorDiaria")),
          imagem: formData.get("imagem"),
        };

        if (isEdit) {
          this.updateItem(itemData);
        } else {
          this.addItem(itemData);
        }

        bootstrap.Modal.getInstance(
          document.getElementById("dynamicModal")
        ).hide();
      }
    });
  }

  validateForm(form) {
    if (!form.checkValidity()) {
      form.classList.add("was-validated");
      return false;
    }

    const valorDiaria = parseFloat(form.querySelector("#valorDiaria").value);
    const quantidadeTotal = parseInt(
      form.querySelector("#quantidadeTotal").value
    );

    if (valorDiaria <= 0) {
      toast.error("O valor da diária deve ser maior que zero");
      return false;
    }

    if (quantidadeTotal <= 0) {
      toast.error("A quantidade total deve ser maior que zero");
      return false;
    }

    return true;
  }

  addItem(item) {
    // Remover a propriedade quantidadeAlugada se existir (será calculada dinamicamente)
    delete item.quantidadeAlugada;
    
    this.itens.push(item);
    Storage.save("itens", this.itens);
    this.render();
    toast.success("Item cadastrado com sucesso!");
  }

  updateItem(item) {
    const index = this.itens.findIndex((i) => i.id === item.id);
    if (index !== -1) {
      // Remover a propriedade quantidadeAlugada se existir (será calculada dinamicamente)
      delete item.quantidadeAlugada;
      
      this.itens[index] = item;
      Storage.save("itens", this.itens);
      this.render();
      toast.success("Item atualizado com sucesso!");
    }
  }

  async deleteItem(id) {
    console.log("Tentando excluir item com ID:", id);
    console.log("Itens antes da exclusão:", this.itens);

    const confirmado = await ConfirmDialog.show(
      "Excluir Item",
      "Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita."
    );
    
    if (confirmado) {
      const itemToDelete = this.itens.find((i) => i.id === id);
      if (!itemToDelete) {
        toast.error("Item não encontrado!");
        return;
      }

      this.itens = this.itens.filter((i) => i.id !== id);
      Storage.save("itens", this.itens);
      console.log("Itens após a exclusão:", this.itens);
      this.render();
      toast.success("Item excluído com sucesso!");
    }
  }

  editItem(id) {
    const item = this.itens.find((i) => i.id === id);
    if (item) {
      this.showForm(item);
    }
  }

  verificarDisponibilidade(itemId, quantidade) {
    const item = this.itens.find((i) => i.id === itemId);
    if (!item) return false;

    // Calcular quantidade alugada baseada nos eventos ativos
    const eventos = Storage.get("eventos") || [];
    const agora = new Date();
    const BUFFER_LOGISTICA_MS = 40 * 60 * 1000; // 40 minutos
    let quantidadeAlugada = 0;
    
    eventos.forEach((evento) => {
      if (evento.status === "finalizado") return;
      
      // Verificar se ainda está ocupado (incluindo buffer)
      const [ano, mes, dia] = evento.dataInicio.split('-').map(Number);
      const [horaFim, minFim] = evento.horaFim.split(':').map(Number);
      const fimEvento = new Date(ano, mes - 1, dia, horaFim, minFim, 0);
      const fimComBuffer = new Date(fimEvento.getTime() + BUFFER_LOGISTICA_MS);
      
      if (agora < fimComBuffer || evento.status === 'aguardando' || evento.status === 'andamento') {
        evento.itens.forEach((itemEvento) => {
          if (itemEvento.id === itemId) {
            quantidadeAlugada += itemEvento.quantidade;
          }
        });
      }
    });

    const disponiveis = item.quantidadeTotal - quantidadeAlugada;
    return disponiveis >= quantidade;
  }

  verificarProximaDisponibilidade(itemId) {
    const item = this.itens.find((i) => i.id === itemId);
    if (!item) return null;

    const eventos = Storage.get("eventos") || [];
    const agora = new Date();
    const BUFFER_LOGISTICA_MS = 40 * 60 * 1000; // 40 minutos

    // Filtrar eventos que usam este item ESPECIFICAMENTE e ainda estão ativos
    const eventosAtivos = eventos.filter((evento) => {
      if (evento.status === "finalizado") return false;
      
      // Verificar se o item está sendo usado neste evento
      const usaEsteItem = evento.itens.some(ei => ei.id === itemId);
      if (!usaEsteItem) return false;

      // Verificar se o evento está ativo (não passou ainda, considerando buffer)
      const [ano, mes, dia] = evento.dataInicio.split('-').map(Number);
      const [horaFim, minFim] = evento.horaFim.split(':').map(Number);
      const fimEvento = new Date(ano, mes - 1, dia, horaFim, minFim, 0);
      const fimComBuffer = new Date(fimEvento.getTime() + BUFFER_LOGISTICA_MS);
      
      return agora < fimComBuffer;
    });

    if (eventosAtivos.length === 0) {
      return "Disponível agora";
    }

    // Ordenar eventos por data e hora de fim
    eventosAtivos.sort((a, b) => {
      const [anoA, mesA, diaA] = a.dataInicio.split('-').map(Number);
      const [horaFimA, minFimA] = a.horaFim.split(':').map(Number);
      const fimA = new Date(anoA, mesA - 1, diaA, horaFimA, minFimA, 0);
      
      const [anoB, mesB, diaB] = b.dataInicio.split('-').map(Number);
      const [horaFimB, minFimB] = b.horaFim.split(':').map(Number);
      const fimB = new Date(anoB, mesB - 1, diaB, horaFimB, minFimB, 0);
      
      return fimB - fimA; // Ordenar do mais tardio para o mais cedo
    });

    // Pegar o evento que termina por último
    const ultimoEvento = eventosAtivos[0];
    const [ano, mes, dia] = ultimoEvento.dataInicio.split('-').map(Number);
    const [horaFim, minFim] = ultimoEvento.horaFim.split(':').map(Number);
    const fimEvento = new Date(ano, mes - 1, dia, horaFim, minFim, 0);
    const fimComBuffer = new Date(fimEvento.getTime() + BUFFER_LOGISTICA_MS);

    // Formatar data de disponibilidade
    const dataDisponibilidade = new Date(fimComBuffer);
    const horaDisp = `${String(dataDisponibilidade.getHours()).padStart(2, '0')}:${String(dataDisponibilidade.getMinutes()).padStart(2, '0')}`;
    
    // Se for hoje, mostrar apenas a hora
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataEvt = new Date(dataDisponibilidade);
    dataEvt.setHours(0, 0, 0, 0);
    
    if (dataEvt.getTime() === hoje.getTime()) {
      return `Disponível às ${horaDisp}`;
    } else {
      return `Disponível em ${DateUtils.formatDate(dataDisponibilidade)} às ${horaDisp}`;
    }
  }
}

// Export Itens class
window.Itens = Itens;
