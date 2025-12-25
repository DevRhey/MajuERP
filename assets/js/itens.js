// Itens Module

class Itens {
  constructor() {
    this.itens = Storage.get("itens") || [];
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
                    <div>
                        <button class="btn btn-warning me-2" onclick="app.modules.itens.corrigirEstado()">
                            <i class="bi bi-tools"></i> Corrigir Estado
                        </button>
                        <button class="btn btn-primary" onclick="app.modules.itens.showForm()">
                            <i class="bi bi-plus-circle"></i> Novo Item
                        </button>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-body">
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
  }

  renderTableRows() {
    // Calcular quantidades alugadas baseadas nos eventos ativos
    const eventos = Storage.get("eventos") || [];
    const quantidadesAlugadas = {};
    const agora = new Date();
    const BUFFER_LOGISTICA_MS = 40 * 60 * 1000; // 40 minutos
    
    // Data de hoje (sem hora)
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    eventos.forEach((evento) => {
      if (evento.status === "finalizado") return;
      
      // Verificar se o evento ainda está em uso (incluindo buffer de 40 min)
      const [ano, mes, dia] = evento.dataInicio.split('-').map(Number);
      const [horaFim, minFim] = evento.horaFim.split(':').map(Number);
      const fimEvento = new Date(ano, mes - 1, dia, horaFim, minFim, 0);
      const fimComBuffer = new Date(fimEvento.getTime() + BUFFER_LOGISTICA_MS);
      
      // Data do evento (sem hora)
      const dataEvento = new Date(ano, mes - 1, dia, 0, 0, 0, 0);
      
      // Só considera alugado se:
      // 1. O evento é para hoje (ou antes) E ainda não passou (com buffer)
      if (dataEvento <= hoje && agora < fimComBuffer) {
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
      UI.showAlert("O valor da diária deve ser maior que zero", "danger");
      return false;
    }

    if (quantidadeTotal <= 0) {
      UI.showAlert("A quantidade total deve ser maior que zero", "danger");
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
    UI.showAlert("Item cadastrado com sucesso!");
  }

  updateItem(item) {
    const index = this.itens.findIndex((i) => i.id === item.id);
    if (index !== -1) {
      // Remover a propriedade quantidadeAlugada se existir (será calculada dinamicamente)
      delete item.quantidadeAlugada;
      
      this.itens[index] = item;
      Storage.save("itens", this.itens);
      this.render();
      UI.showAlert("Item atualizado com sucesso!");
    }
  }

  deleteItem(id) {
    console.log("Tentando excluir item com ID:", id);
    console.log("Itens antes da exclusão:", this.itens);

    if (
      confirm(
        "Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita."
      )
    ) {
      const itemToDelete = this.itens.find((i) => i.id === id);
      if (!itemToDelete) {
        UI.showAlert("Item não encontrado!", "danger");
        return;
      }

      this.itens = this.itens.filter((i) => i.id !== id);
      Storage.save("itens", this.itens);
      console.log("Itens após a exclusão:", this.itens);
      this.render();
      UI.showAlert("Item excluído com sucesso!");
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

  corrigirEstado() {
    // Remover a propriedade quantidadeAlugada de todos os itens
    // pois agora será calculada dinamicamente
    this.itens.forEach((item) => {
      delete item.quantidadeAlugada;
    });
    Storage.save("itens", this.itens);
    this.render();
    UI.showAlert("Estado dos itens corrigido com sucesso!");
  }

  verificarProximaDisponibilidade(itemId) {
    const item = this.itens.find((i) => i.id === itemId);
    if (!item) return null;

    const eventos = Storage.get("eventos") || [];
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    // Filtrar eventos futuros que usam este item ESPECIFICAMENTE
    const eventosFuturos = eventos.filter((evento) => {
      const dataEvento = new Date(evento.dataInicio);
      // Verificar se o item está sendo usado neste evento
      const usaEsteItem = evento.itens.some(ei => ei.id === itemId);
      return dataEvento >= hoje && evento.status !== "finalizado" && usaEsteItem;
    });

    if (eventosFuturos.length === 0) {
      return "Disponível agora";
    }

    // Ordenar eventos por data
    eventosFuturos.sort(
      (a, b) => new Date(a.dataInicio) - new Date(b.dataInicio)
    );

    // Encontrar o primeiro intervalo disponível
    let dataAtual = hoje;
    for (const evento of eventosFuturos) {
      const dataEvento = new Date(evento.dataInicio);
      const [horaFim] = evento.horaFim.split(":").map(Number);

      // Se houver um intervalo entre a data atual e o evento
      if (dataEvento > dataAtual) {
        return `Disponível em ${DateUtils.formatDate(dataAtual)}`;
      }

      // Atualizar a data atual para o fim do evento
      dataAtual = new Date(dataEvento);
      dataAtual.setHours(horaFim + 1, 0, 0, 0);
    }

    return `Disponível em ${DateUtils.formatDate(dataAtual)}`;
  }
}

// Export Itens class
window.Itens = Itens;
