// Financeiro Module

class Financeiro {
  constructor() {
    this.sync();
    this.setupStorageListener();
  }

  setupStorageListener() {
    window.addEventListener('storageUpdate', (e) => {
      const { key } = e.detail;
      if (key === 'financeiroTransacoes' || key === 'eventos' || key === 'clientes') {
        this.sync();
        if (app.currentPage === 'financeiro') {
          this.render();
        }
      }
    });
  }

  sync() {
    this.transacoes = Storage.get("financeiroTransacoes") || [];
    this.clientes = Storage.get("clientes") || [];
    this.eventos = Storage.get("eventos") || [];
  }

  render() {
    this.sync();
    const mainContent = document.getElementById("main-content");
    const resumoGeral = this.getResumoGeral();
    
    mainContent.innerHTML = `
      <div class="container">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h2>Financeiro</h2>
        </div>

        <!-- Cards de Resumo Geral -->
        <div class="row g-3 mb-4">
          <div class="col-md-3">
            <div class="card shadow-sm h-100">
              <div class="card-body">
                <h6 class="text-muted">Total Contratado</h6>
                <h4 class="text-primary">R$ ${resumoGeral.totalContratado.toFixed(2)}</h4>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card shadow-sm h-100">
              <div class="card-body">
                <h6 class="text-muted">Total Recebido</h6>
                <h4 class="text-success">R$ ${resumoGeral.totalRecebido.toFixed(2)}</h4>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card shadow-sm h-100">
              <div class="card-body">
                <h6 class="text-muted">A Receber</h6>
                <h4 class="text-warning">R$ ${resumoGeral.aReceber.toFixed(2)}</h4>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card shadow-sm h-100">
              <div class="card-body">
                <h6 class="text-muted">Inadimplência</h6>
                <h4 class="${resumoGeral.inadimplencia > 0 ? 'text-danger' : 'text-success'}">R$ ${resumoGeral.inadimplencia.toFixed(2)}</h4>
              </div>
            </div>
          </div>
        </div>

        <!-- Tabela de Eventos -->
        <div class="card">
          <div class="card-header">
            <h5>Eventos e Movimentações</h5>
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-hover">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Evento</th>
                    <th>Cliente</th>
                    <th>Total</th>
                    <th>Recebido</th>
                    <th>A Receber</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  ${this.renderEventosFinanceiros()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  getResumoGeral() {
    let totalContratado = 0;
    let totalRecebido = 0;

    this.eventos.forEach((evento) => {
      const resumo = this.getResumoEvento(evento.id);
      totalContratado += resumo.valorTotal;
      totalRecebido += resumo.valorRecebido;
    });

    const aReceber = totalContratado - totalRecebido;
    const inadimplencia = Math.max(0, aReceber); // Se houver saldo vencido

    return {
      totalContratado,
      totalRecebido,
      aReceber,
      inadimplencia,
    };
  }

  getResumoEvento(eventoId) {
    const evento = this.eventos.find((e) => e.id === eventoId);
    if (!evento) return { valorTotal: 0, valorRecebido: 0, saldoPendente: 0 };

    const transacoesEvento = this.transacoes.filter(
      (t) => t.origem === "evento" && t.referenciaId === eventoId && t.tipo === "receita"
    );

    const valorTotal = evento.valorTotal || 0;
    let valorRecebido = 0;

    transacoesEvento.forEach((t) => {
      if (t.status === "pago") {
        valorRecebido += t.valor || 0;
      }
    });

    const saldoPendente = Math.max(0, valorTotal - valorRecebido);

    return {
      valorTotal,
      valorRecebido,
      saldoPendente,
    };
  }

  getStatusEvento(eventoId) {
    const resumo = this.getResumoEvento(eventoId);
    const { valorTotal, valorRecebido } = resumo;

    if (valorRecebido >= valorTotal) {
      return { status: "Totalmente Pago", classe: "bg-success", icone: "✓" };
    } else if (valorRecebido > 0) {
      return { status: "Parcialmente Pago", classe: "bg-info", icone: "◐" };
    } else {
      return { status: "Aguardando", classe: "bg-warning text-dark", icone: "○" };
    }
  }

  renderEventosFinanceiros() {
    if (this.eventos.length === 0) {
      return `<tr><td colspan="8" class="text-center text-muted">Nenhum evento registrado.</td></tr>`;
    }

    return this.eventos
      .sort((a, b) => new Date(b.dataInicio) - new Date(a.dataInicio))
      .map((evento) => {
        const cliente = this.clientes.find((c) => c.id === evento.clienteId);
        const clienteNome = cliente ? cliente.nome : "Cliente";
        const resumo = this.getResumoEvento(evento.id);
        const statusInfo = this.getStatusEvento(evento.id);
        const titulo = evento.nome && evento.nome.trim() ? evento.nome : `Evento em ${DateUtils.formatDate(evento.dataInicio)}`;
        const percentual = resumo.valorTotal > 0 ? ((resumo.valorRecebido / resumo.valorTotal) * 100).toFixed(0) : 0;

        return `
          <tr>
            <td><small>${DateUtils.formatDate(evento.dataInicio)}</small></td>
            <td><strong>${titulo}</strong></td>
            <td>${clienteNome}</td>
            <td>R$ ${resumo.valorTotal.toFixed(2)}</td>
            <td class="text-success"><strong>R$ ${resumo.valorRecebido.toFixed(2)}</strong></td>
            <td class="text-warning"><strong>R$ ${resumo.saldoPendente.toFixed(2)}</strong></td>
            <td>
              <span class="badge ${statusInfo.classe}">
                ${statusInfo.status} (${percentual}%)
              </span>
            </td>
            <td>
              <button class="btn btn-sm btn-success" onclick="app.modules.financeiro.abrirRegistroPagamento(${evento.id})" title="Registrar pagamento">
                <i class="bi bi-plus-circle"></i>
              </button>
              <button class="btn btn-sm btn-primary" onclick="app.modules.financeiro.mostrarDetalhes(${evento.id})" title="Ver movimentações">
                <i class="bi bi-eye"></i>
              </button>
            </td>
          </tr>
        `;
      })
      .join("");
  }

  mostrarDetalhes(eventoId) {
    const evento = this.eventos.find((e) => e.id === eventoId);
    if (!evento) return;

    const cliente = this.clientes.find((c) => c.id === evento.clienteId);
    const clienteNome = cliente ? cliente.nome : "Cliente";
    const resumo = this.getResumoEvento(eventoId);
    const transacoesEvento = this.transacoes
      .filter((t) => t.origem === "evento" && t.referenciaId === eventoId && t.tipo === "receita")
      .sort((a, b) => new Date(b.data) - new Date(a.data));

    const titulo = evento.nome && evento.nome.trim() ? evento.nome : `Evento em ${DateUtils.formatDate(evento.dataInicio)}`;
    const historico = transacoesEvento
      .map((t) => {
        const tipo = t.descricao.split(" - ")[0].trim();
        const statusBadge = t.status === "pago" 
          ? `<span class="badge bg-success">Pago</span>` 
          : `<span class="badge bg-warning text-dark">Pendente</span>`;
        
        // Botão de comprovante apenas para transações pagas (Entrada e Pagamentos)
        const botaoComprovante = t.status === "pago" && (tipo === "Entrada" || tipo === "Pagamento")
          ? `<button class="btn btn-sm btn-warning" onclick="app.modules.financeiro.gerarComprovantePagamento(${evento.id}, ${t.id})" title="Gerar comprovante">
               <i class="bi bi-receipt"></i>
             </button>`
          : "";

        return `
          <tr>
            <td><small>${DateUtils.formatDate(t.data)}</small></td>
            <td>${tipo}</td>
            <td class="text-end"><strong>R$ ${(t.valor || 0).toFixed(2)}</strong></td>
            <td>${statusBadge}</td>
            <td>${botaoComprovante}</td>
          </tr>
        `;
      })
      .join("");

    const content = `
      <div class="mb-3">
        <h5>${titulo}</h5>
        <p class="text-muted mb-2"><i class="bi bi-person"></i> <strong>${clienteNome}</strong></p>
        <p class="text-muted"><i class="bi bi-calendar"></i> ${DateUtils.formatDate(evento.dataInicio)}</p>
      </div>

      <div class="row g-2 mb-4">
        <div class="col-md-3">
          <div class="border rounded p-2 bg-light">
            <small class="text-muted d-block">Total Contratado</small>
            <h6 class="text-primary">R$ ${resumo.valorTotal.toFixed(2)}</h6>
          </div>
        </div>
        <div class="col-md-3">
          <div class="border rounded p-2 bg-light">
            <small class="text-muted d-block">Total Recebido</small>
            <h6 class="text-success">R$ ${resumo.valorRecebido.toFixed(2)}</h6>
          </div>
        </div>
        <div class="col-md-3">
          <div class="border rounded p-2 bg-light">
            <small class="text-muted d-block">A Receber</small>
            <h6 class="text-warning">R$ ${resumo.saldoPendente.toFixed(2)}</h6>
          </div>
        </div>
        <div class="col-md-3">
          <div class="border rounded p-2 bg-light">
            <small class="text-muted d-block">Percentual</small>
            <h6>${(resumo.valorTotal > 0 ? ((resumo.valorRecebido / resumo.valorTotal) * 100).toFixed(0) : 0)}%</h6>
          </div>
        </div>
      </div>

      <h6>Movimentações Financeiras</h6>
      <div class="d-flex justify-content-between align-items-center mb-2">
        <small></small>
        <button class="btn btn-sm btn-success" onclick="app.modules.financeiro.gerarComprovanteTotalPagamentos(${eventoId})">
          <i class="bi bi-receipt"></i> Comprovante Total
        </button>
      </div>
      <div class="table-responsive">
        <table class="table table-sm">
          <thead>
            <tr>
              <th style="width: 20%">Data</th>
              <th style="width: 30%">Tipo</th>
              <th style="width: 30%" class="text-end">Valor</th>
              <th style="width: 20%">Status</th>
              <th style="width: 10%">Ação</th>
            </tr>
          </thead>
          <tbody>
            ${historico.length > 0 ? historico : '<tr><td colspan="4" class="text-center text-muted">Nenhuma movimentação registrada.</td></tr>'}
          </tbody>
        </table>
      </div>

      <div class="alert alert-info mt-3 mb-0">
        <small><strong>Nota:</strong> Os valores são atualizados automaticamente quando pagamentos são registrados no evento.</small>
      </div>
    `;

    UI.showModal(`Detalhes Financeiros - ${titulo}`, content, true);
  }

  abrirRegistroPagamento(eventoId) {
    const evento = this.eventos.find((e) => e.id === eventoId);
    if (!evento) return;

    const cliente = this.clientes.find((c) => c.id === evento.clienteId);
    const clienteNome = cliente ? cliente.nome : "Cliente";
    const resumo = this.getResumoEvento(eventoId);
    const titulo = evento.nome && evento.nome.trim() ? evento.nome : `Evento em ${DateUtils.formatDate(evento.dataInicio)}`;

    const formHtml = `
      <form id="pagamento-form" class="needs-validation" novalidate>
        <div class="mb-3">
          <p class="text-muted mb-2"><small><strong>Evento:</strong> ${titulo}</small></p>
          <p class="text-muted mb-3"><small><strong>Cliente:</strong> ${clienteNome}</small></p>
        </div>

        <div class="row">
          <div class="col-md-6">
            <div class="mb-3">
              <label class="form-label">Valor a Receber</label>
              <input type="text" class="form-control" value="R$ ${resumo.saldoPendente.toFixed(2)}" disabled>
            </div>
          </div>
          <div class="col-md-6">
            <div class="mb-3">
              <label class="form-label">Valor do Pagamento (R$)</label>
              <input type="number" class="form-control" id="valor" name="valor" min="0.01" step="0.01" max="${resumo.saldoPendente}" required placeholder="0,00">
            </div>
          </div>
        </div>

        <div class="row">
          <div class="col-md-6">
            <div class="mb-3">
              <label class="form-label">Data do Pagamento</label>
              <input type="date" class="form-control" id="data" name="data" required value="${new Date().toISOString().slice(0, 10)}">
            </div>
          </div>
          <div class="col-md-6">
            <div class="mb-3">
              <label class="form-label">Forma de Pagamento</label>
              <select class="form-select" id="formaPagamentoId" name="formaPagamentoId" required>
                <option value="">Selecione...</option>
              </select>
            </div>
          </div>
        </div>

        <div class="mb-3">
          <label class="form-label">Observação (opcional)</label>
          <textarea class="form-control" id="observacao" name="observacao" rows="2"></textarea>
        </div>

        <div class="text-end">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
          <button type="submit" class="btn btn-success">Registrar Pagamento</button>
        </div>
      </form>
    `;

    UI.showModal(`Registrar Pagamento - ${titulo}`, formHtml, true);

    // Preencher formas de pagamento
    const formaSelect = document.getElementById("formaPagamentoId");
    const formasPagamento = Storage.get("formasPagamento") || [];
    formasPagamento.forEach((f) => {
      const option = document.createElement("option");
      option.value = f.id;
      option.textContent = f.nome;
      formaSelect.appendChild(option);
    });

    // Submeter formulário
    const form = document.getElementById("pagamento-form");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.classList.add("was-validated");
        return;
      }

      const formData = new FormData(form);
      const valor = parseFloat(formData.get("valor"));

      if (valor <= 0) {
        UI.showAlert("Informe um valor maior que zero", "danger");
        return;
      }

      if (valor > resumo.saldoPendente) {
        UI.showAlert(`Valor não pode exceder R$ ${resumo.saldoPendente.toFixed(2)}`, "danger");
        return;
      }

      // Chamar o método de eventos para registrar pagamento
      if (app.modules && app.modules.eventos) {
        app.modules.eventos.registrarPagamentoDirecto(eventoId, {
          valor,
          data: formData.get("data"),
          formaPagamentoId: formData.get("formaPagamentoId"),
          observacao: formData.get("observacao"),
        });

        bootstrap.Modal.getInstance(document.getElementById("dynamicModal")).hide();
        this.render();
        UI.showAlert("Pagamento registrado com sucesso!");
      }
    });
  }

  gerarComprovantePagamento(eventoId, transacaoId) {
    const evento = this.eventos.find((e) => e.id === eventoId);
    const transacao = this.transacoes.find((t) => t.id === transacaoId);
    
    if (!evento || !transacao) return;

    const cliente = this.clientes.find((c) => c.id === evento.clienteId);
    const clienteNome = cliente ? cliente.nome : "Cliente";
    const clienteTelefone = cliente ? cliente.telefone : "-";
    const clienteCPF = cliente ? cliente.cpf : "-";
    const clienteEndereco = cliente ? cliente.endereco : "-";

    const titulo = evento.nome && evento.nome.trim() ? evento.nome : `Evento em ${DateUtils.formatDate(evento.dataInicio)}`;
    const tipo = transacao.descricao.split(" - ")[0].trim();
    const dataAtual = new Date().toLocaleString("pt-BR");
    const numeroComprovante = `CMP-${transacao.id}`;

    const content = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <!-- Cabeçalho da Empresa -->
        <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 15px; margin-bottom: 20px;">
          <h2 style="margin: 5px 0; color: #333;">MAJU KIDS</h2>
          <p style="margin: 3px 0; font-size: 12px; color: #666;">Eventos e Serviços</p>
          <p style="margin: 3px 0; font-size: 11px; color: #999;">www.majukids.com.br</p>
        </div>

        <!-- Tipo de Comprovante -->
        <div style="text-align: center; margin-bottom: 20px;">
          <h4 style="margin: 5px 0; color: #333;">COMPROVANTE DE PAGAMENTO</h4>
          <p style="margin: 3px 0; font-size: 12px; color: #666;">Nº ${numeroComprovante}</p>
          <p style="margin: 3px 0; font-size: 11px; color: #999;">Emitido em ${dataAtual}</p>
        </div>

        <!-- Informações do Pagador -->
        <div style="margin-bottom: 20px; border-left: 3px solid #007bff; padding-left: 15px;">
          <h5 style="margin: 0 0 10px 0; color: #333;">PAGADOR</h5>
          <p style="margin: 3px 0; font-size: 13px;"><strong>${clienteNome}</strong></p>
          <p style="margin: 3px 0; font-size: 12px; color: #666;">CPF: ${clienteCPF}</p>
          <p style="margin: 3px 0; font-size: 12px; color: #666;">Telefone: ${clienteTelefone}</p>
          <p style="margin: 3px 0; font-size: 12px; color: #666;">Endereço: ${clienteEndereco}</p>
        </div>

        <!-- Informações da Empresa Recebedora -->
        <div style="margin-bottom: 20px; border-left: 3px solid #28a745; padding-left: 15px;">
          <h5 style="margin: 0 0 10px 0; color: #333;">RECEBEDOR</h5>
          <p style="margin: 3px 0; font-size: 13px;"><strong>MAJU KIDS - Eventos e Serviços</strong></p>
          <p style="margin: 3px 0; font-size: 12px; color: #666;">Serviços de Eventos Infantis</p>
        </div>

        <!-- Detalhes do Pagamento -->
        <div style="margin-bottom: 20px; background-color: #f8f9fa; padding: 15px; border-radius: 5px;">
          <h5 style="margin: 0 0 10px 0; color: #333;">DETALHES DO PAGAMENTO</h5>
          <div style="display: flex; justify-content: space-between; margin: 8px 0; border-bottom: 1px solid #ddd; padding-bottom: 8px;">
            <span style="font-size: 12px; color: #666;">Evento:</span>
            <strong style="font-size: 12px;">${titulo}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin: 8px 0; border-bottom: 1px solid #ddd; padding-bottom: 8px;">
            <span style="font-size: 12px; color: #666;">Data do Evento:</span>
            <strong style="font-size: 12px;">${DateUtils.formatDate(evento.dataInicio)}</strong>
          </div>
          ${evento.taxaDeslocamento > 0 ? `
          <div style="display: flex; justify-content: space-between; margin: 8px 0; border-bottom: 1px solid #ddd; padding-bottom: 8px;">
            <span style="font-size: 12px; color: #666;">Taxa de Deslocamento:</span>
            <strong style="font-size: 12px;">R$ ${(evento.taxaDeslocamento || 0).toFixed(2)}</strong>
          </div>` : ""}
          <div style="display: flex; justify-content: space-between; margin: 8px 0; border-bottom: 1px solid #ddd; padding-bottom: 8px;">
            <span style="font-size: 12px; color: #666;">Tipo de Transação:</span>
            <strong style="font-size: 12px;">${tipo}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin: 8px 0; border-bottom: 1px solid #ddd; padding-bottom: 8px;">
            <span style="font-size: 12px; color: #666;">Data do Pagamento:</span>
            <strong style="font-size: 12px;">${DateUtils.formatDate(transacao.data)}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin: 8px 0; padding-bottom: 8px;">
            <span style="font-size: 12px; color: #666;">Valor Pago:</span>
            <strong style="font-size: 14px; color: #28a745;">R$ ${(transacao.valor || 0).toFixed(2)}</strong>
          </div>
        </div>

        <!-- Observações -->
        <div style="margin-bottom: 20px; padding: 10px; background-color: #fff3cd; border-left: 3px solid #ffc107; font-size: 11px;">
          <strong>Observação:</strong> Este é um comprovante de pagamento válido. Guarde-o como comprovação da transação realizada.
        </div>

        <!-- Rodapé -->
        <div style="text-align: center; border-top: 2px solid #333; padding-top: 15px; margin-top: 20px; font-size: 10px; color: #999;">
          <p style="margin: 3px 0;">Comprovante gerado automaticamente pelo sistema</p>
          <p style="margin: 3px 0;">Maju Kids © 2025 - Todos os direitos reservados</p>
        </div>
      </div>
    `;

    // Criar modal para exibir e permitir impressão/download
    const modal = document.createElement("div");
    modal.className = "modal fade";
    modal.id = "comprovante-modal-" + Date.now();
    modal.tabIndex = -1;
    modal.innerHTML = `
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Comprovante de Pagamento</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body" id="comprovante-content-${Date.now()}">
            ${content}
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
            <button type="button" class="btn btn-primary" onclick="window.print()">
              <i class="bi bi-printer"></i> Imprimir / Salvar como PDF
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    const bootstrapModal = new bootstrap.Modal(modal);
    bootstrapModal.show();

    // Remover modal do DOM quando fechado
    modal.addEventListener("hidden.bs.modal", () => {
      modal.remove();
    });
  }

  gerarComprovanteTotalPagamentos(eventoId) {
    const evento = this.eventos.find((e) => e.id === eventoId);
    if (!evento) return;

    const cliente = this.clientes.find((c) => c.id === evento.clienteId);
    const clienteNome = cliente ? cliente.nome : "Cliente";
    const clienteTelefone = cliente ? cliente.telefone : "-";
    const clienteCPF = cliente ? cliente.cpf : "-";
    const clienteEndereco = cliente ? cliente.endereco : "-";

    const titulo = evento.nome && evento.nome.trim() ? evento.nome : `Evento em ${DateUtils.formatDate(evento.dataInicio)}`;
    const resumo = this.getResumoEvento(eventoId);
    
    // Buscar todos os pagamentos (Entrada + Pagamentos)
    const transacoesEvento = this.transacoes
      .filter((t) => t.origem === "evento" && t.referenciaId === eventoId && t.tipo === "receita" && t.status === "pago")
      .sort((a, b) => new Date(a.data) - new Date(b.data));

    const dataAtual = new Date().toLocaleString("pt-BR");
    const numeroComprovante = `CMP-TOTAL-${evento.id}`;

    // Gerar linhas de pagamentos
    let linhasPagamentos = transacoesEvento
      .map((t, index) => {
        const tipo = t.descricao.split(" - ")[0].trim();
        return `
          <tr>
            <td style="font-size: 12px;">${index + 1}</td>
            <td style="font-size: 12px;">${DateUtils.formatDate(t.data)}</td>
            <td style="font-size: 12px;">${tipo}</td>
            <td style="font-size: 12px; text-align: right;">R$ ${(t.valor || 0).toFixed(2)}</td>
          </tr>
        `;
      })
      .join("");

    const content = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <!-- Cabeçalho da Empresa -->
        <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 15px; margin-bottom: 20px;">
          <h2 style="margin: 5px 0; color: #333;">MAJU KIDS</h2>
          <p style="margin: 3px 0; font-size: 12px; color: #666;">Eventos e Serviços</p>
          <p style="margin: 3px 0; font-size: 11px; color: #999;">www.majukids.com.br</p>
        </div>

        <!-- Tipo de Comprovante -->
        <div style="text-align: center; margin-bottom: 20px;">
          <h4 style="margin: 5px 0; color: #333;">COMPROVANTE CONSOLIDADO DE PAGAMENTOS</h4>
          <p style="margin: 3px 0; font-size: 12px; color: #666;">Nº ${numeroComprovante}</p>
          <p style="margin: 3px 0; font-size: 11px; color: #999;">Emitido em ${dataAtual}</p>
        </div>

        <!-- Informações do Pagador -->
        <div style="margin-bottom: 20px; border-left: 3px solid #007bff; padding-left: 15px;">
          <h5 style="margin: 0 0 10px 0; color: #333;">PAGADOR</h5>
          <p style="margin: 3px 0; font-size: 13px;"><strong>${clienteNome}</strong></p>
          <p style="margin: 3px 0; font-size: 12px; color: #666;">CPF: ${clienteCPF}</p>
          <p style="margin: 3px 0; font-size: 12px; color: #666;">Telefone: ${clienteTelefone}</p>
          <p style="margin: 3px 0; font-size: 12px; color: #666;">Endereço: ${clienteEndereco}</p>
        </div>

        <!-- Informações da Empresa Recebedora -->
        <div style="margin-bottom: 20px; border-left: 3px solid #28a745; padding-left: 15px;">
          <h5 style="margin: 0 0 10px 0; color: #333;">RECEBEDOR</h5>
          <p style="margin: 3px 0; font-size: 13px;"><strong>MAJU KIDS - Eventos e Serviços</strong></p>
          <p style="margin: 3px 0; font-size: 12px; color: #666;">Serviços de Eventos Infantis</p>
        </div>

        <!-- Informações do Evento -->
        <div style="margin-bottom: 20px; background-color: #f0f8ff; padding: 15px; border-radius: 5px; border-left: 3px solid #0066cc;">
          <h5 style="margin: 0 0 10px 0; color: #333;">INFORMAÇÕES DO EVENTO</h5>
          <div style="display: flex; justify-content: space-between; margin: 5px 0; font-size: 12px;">
            <span style="color: #666;">Evento:</span>
            <strong>${titulo}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin: 5px 0; font-size: 12px;">
            <span style="color: #666;">Data do Evento:</span>
            <strong>${DateUtils.formatDate(evento.dataInicio)}</strong>
          </div>
          ${evento.taxaDeslocamento > 0 ? `
          <div style="display: flex; justify-content: space-between; margin: 5px 0; font-size: 12px;">
            <span style="color: #666;">Taxa de Deslocamento:</span>
            <strong>R$ ${(evento.taxaDeslocamento || 0).toFixed(2)}</strong>
          </div>` : ""}
          <div style="display: flex; justify-content: space-between; margin: 5px 0; font-size: 12px;">
            <span style="color: #666;">Valor Total Contratado:</span>
            <strong>R$ ${resumo.valorTotal.toFixed(2)}</strong>
          </div>
        </div>

        <!-- Histórico de Pagamentos -->
        <div style="margin-bottom: 20px;">
          <h5 style="margin: 0 0 10px 0; color: #333;">HISTÓRICO DE PAGAMENTOS</h5>
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: #f8f9fa; border-bottom: 2px solid #333;">
                  <th style="padding: 8px; text-align: left; font-size: 12px; font-weight: bold; width: 8%;">#</th>
                  <th style="padding: 8px; text-align: left; font-size: 12px; font-weight: bold; width: 24%;">Data</th>
                  <th style="padding: 8px; text-align: left; font-size: 12px; font-weight: bold; width: 40%;">Tipo</th>
                  <th style="padding: 8px; text-align: right; font-size: 12px; font-weight: bold; width: 28%;">Valor</th>
                </tr>
              </thead>
              <tbody>
                ${linhasPagamentos}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Resumo Final -->
        <div style="margin-bottom: 20px; background-color: #f0fff4; padding: 15px; border-radius: 5px; border: 2px solid #28a745;">
          <h5 style="margin: 0 0 15px 0; color: #333;">RESUMO FINANCEIRO</h5>
          <div style="display: flex; justify-content: space-between; margin: 10px 0; padding-bottom: 10px; border-bottom: 1px solid #ddd;">
            <span style="font-size: 13px; color: #666;">Total Contratado:</span>
            <strong style="font-size: 13px;">R$ ${resumo.valorTotal.toFixed(2)}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin: 10px 0; padding-bottom: 10px; border-bottom: 1px solid #ddd;">
            <span style="font-size: 13px; color: #666;">Total Recebido:</span>
            <strong style="font-size: 13px; color: #28a745;">R$ ${resumo.valorRecebido.toFixed(2)}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin: 10px 0; padding-top: 10px; border-top: 2px solid #28a745;">
            <span style="font-size: 14px; color: #333;"><strong>A Receber:</strong></span>
            <strong style="font-size: 14px; color: #ff9800;">R$ ${resumo.saldoPendente.toFixed(2)}</strong>
          </div>
        </div>

        <!-- Observações -->
        <div style="margin-bottom: 20px; padding: 10px; background-color: #fff3cd; border-left: 3px solid #ffc107; font-size: 11px;">
          <strong>Observação:</strong> Este comprovante consolidado registra todos os pagamentos realizados para este evento até a presente data. Guarde-o como comprovação das transações realizadas.
        </div>

        <!-- Rodapé -->
        <div style="text-align: center; border-top: 2px solid #333; padding-top: 15px; margin-top: 20px; font-size: 10px; color: #999;">
          <p style="margin: 3px 0;">Comprovante gerado automaticamente pelo sistema</p>
          <p style="margin: 3px 0;">Maju Kids © 2025 - Todos os direitos reservados</p>
        </div>
      </div>
    `;

    // Criar modal para exibir e permitir impressão/download
    const modal = document.createElement("div");
    modal.className = "modal fade";
    modal.id = "comprovante-modal-total-" + Date.now();
    modal.tabIndex = -1;
    modal.innerHTML = `
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Comprovante Consolidado de Pagamentos</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body" id="comprovante-content-${Date.now()}">
            ${content}
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
            <button type="button" class="btn btn-primary" onclick="window.print()">
              <i class="bi bi-printer"></i> Imprimir / Salvar como PDF
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    const bootstrapModal = new bootstrap.Modal(modal);
    bootstrapModal.show();

    // Remover modal do DOM quando fechado
    modal.addEventListener("hidden.bs.modal", () => {
      modal.remove();
    });
  }
}

window.Financeiro = Financeiro;
