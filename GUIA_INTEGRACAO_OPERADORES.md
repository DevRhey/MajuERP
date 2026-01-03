# 📌 GUIA DE INTEGRAÇÃO: OPERADORES NO SISTEMA

## Passo 1: Atualizar index.html

Abra `index.html` e adicione os scripts na seguinte ordem (procure pela seção `<script>`):

```html
<!-- Após o script db-admin.js, adicione: -->
<script src="assets/js/operadores.js"></script>
<script src="assets/js/ia-modules/eventos-operadores-extensao.js"></script>
```

**Local exato no arquivo:**

```html
<!-- ... scripts anteriores ... -->
<script src="assets/js/db-admin.js"></script>

<!-- ADICIONAR ESTAS LINHAS: -->
<script src="assets/js/operadores.js"></script>
<script src="assets/js/ia-modules/eventos-operadores-extensao.js"></script>

<!-- Antes de: -->
<script src="assets/js/app.js"></script>
```

---

## Passo 2: Adicionar Menu de Operadores

No arquivo `index.html`, procure pela seção de navegação/menu (geralmente entre `<nav>` ou `<aside>`).

Adicione um novo item de menu:

```html
<!-- ADICIONAR NO MENU PRINCIPAL: -->
<li class="nav-item">
  <a class="nav-link" href="#" onclick="app.goToPage('operadores')">
    <i class="bi bi-people"></i>
    <span>Operadores</span>
  </a>
</li>
```

---

## Passo 3: Adicionar Section de Operadores no Modal de Eventos

No formulário de criar/editar evento (em `index.html`), procure por:

```html
<div id="modalCriarEvento" class="modal fade" tabindex="-1">
```

Dentro deste modal, após a seção de **itens**, adicione:

```html
<!-- APÓS A SEÇÃO DE ITENS, ADICIONAR: -->

<div id="operadores-section">
  <!-- Será preenchido dinamicamente pelo JavaScript -->
</div>
```

E no JavaScript que abre o modal, adicione esta linha:

```javascript
// Após showForm() em eventos.js, adicionar:

setTimeout(() => {
  const eventoData = evento || {};
  const operadoresHTML = app.modules.eventos.getOperadoresFormHTML(eventoData);
  const section = document.getElementById('operadores-section');
  if (section) {
    section.innerHTML = operadoresHTML;
  }
}, 100);
```

---

## Passo 4: Atualizar Coleta de Dados do Formulário

No arquivo `eventos.js`, procure pela função `showForm()` e localize onde os dados são coletados:

```javascript
// Dentro de showForm(), onde cria eventoData:

const eventoData = {
  id: isEdit ? evento.id : Date.now(),
  nome: formData.get("nomeEvento"),
  clienteId: parseInt(formData.get("clienteId")),
  dataInicio: formData.get("dataInicio"),
  horaInicio: formData.get("horaInicio"),
  horaFim: formData.get("horaFim"),
  itens: itensSelecionados,
  observacoes: formData.get("observacoes"),
  
  // ADICIONAR ESTAS LINHAS:
  operadores_necessarios: app.modules.eventos.coletarOperadoresFormulario(),
  
  status: isEdit ? evento.status : "aguardando",
  valorTotal,
  taxaDeslocamento,
  valorEntrada,
  formaPagamentoId: formData.get("formaPagamentoId") || null,
  pagamentos: isEdit ? evento.pagamentos || [] : [],
};
```

---

## Passo 5: Renderizar Operadores na Exibição de Eventos

Localize a função `renderEventosCards()` em `eventos.js` e adicione a exibição de operadores:

```javascript
// Dentro do card de evento, após exibir itens, adicione:

${app.modules.eventos.renderOperadoresEvento(evento.id)}
```

Exemplo completo:

```javascript
// No template do evento card:
<div class="card-body">
  <!-- Itens existentes -->
  <strong>Itens:</strong>
  <p>${this.renderItensList(evento.itens)}</p>
  
  <!-- ADICIONAR OPERADORES: -->
  ${app.modules.eventos.renderOperadoresEvento(evento.id)}
  
  <!-- Resto do card -->
</div>
```

---

## Passo 6: Criar Página de Operadores

Crie um novo arquivo `assets/html/operadores.html`:

```html
<!-- assets/html/operadores.html -->
<div class="container-fluid">
  <div class="d-flex justify-content-between align-items-center mb-3">
    <h2><i class="bi bi-people"></i> Operadores/Monitores</h2>
    <button class="btn btn-primary" onclick="operadoresUI.novoOperador()">
      <i class="bi bi-plus"></i> Novo Operador
    </button>
  </div>

  <!-- Abas -->
  <ul class="nav nav-tabs mb-3" role="tablist">
    <li class="nav-item" role="presentation">
      <button class="nav-link active" id="tab-lista" data-bs-toggle="tab" data-bs-target="#aba-lista" type="button">
        <i class="bi bi-list"></i> Listagem
      </button>
    </li>
    <li class="nav-item" role="presentation">
      <button class="nav-link" id="tab-diarias" data-bs-toggle="tab" data-bs-target="#aba-diarias" type="button">
        <i class="bi bi-cash-coin"></i> Diárias (${window.operadoresService?.obterDiariasAtraso?.()?.length || 0})
      </button>
    </li>
    <li class="nav-item" role="presentation">
      <button class="nav-link" id="tab-relatorio" data-bs-toggle="tab" data-bs-target="#aba-relatorio" type="button">
        <i class="bi bi-graph-up"></i> Relatórios
      </button>
    </li>
  </ul>

  <!-- Conteúdo das abas -->
  <div class="tab-content">
    <!-- ABA 1: LISTAGEM -->
    <div class="tab-pane fade show active" id="aba-lista" role="tabpanel">
      <div id="operadores-lista">
        <!-- Preenchido por JavaScript -->
      </div>
    </div>

    <!-- ABA 2: DIÁRIAS PENDENTES -->
    <div class="tab-pane fade" id="aba-diarias" role="tabpanel">
      <div id="diarias-pendentes">
        <!-- Preenchido por JavaScript -->
      </div>
    </div>

    <!-- ABA 3: RELATÓRIOS -->
    <div class="tab-pane fade" id="aba-relatorio" role="tabpanel">
      <div id="relatorio-operadores">
        <!-- Preenchido por JavaScript -->
      </div>
    </div>
  </div>
</div>

<style>
.operador-card {
  border-left: 4px solid #0d6efd;
  transition: transform 0.2s;
}
.operador-card:hover {
  transform: translateX(5px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
</style>

<script>
// Objeto global para UI de operadores
const operadoresUI = {
  novoOperador() {
    showFormOperador(null);
  },
  
  async renderLista() {
    const container = document.getElementById('operadores-lista');
    const operadores = operadoresService.listar();
    
    if (operadores.length === 0) {
      container.innerHTML = '<div class="alert alert-info">Nenhum operador cadastrado</div>';
      return;
    }
    
    const html = operadores.map(op => `
      <div class="card operador-card mb-2">
        <div class="card-body">
          <div class="row">
            <div class="col-md-6">
              <h6>${op.nome}</h6>
              <small class="text-muted">
                ${op.cpf ? op.cpf + ' | ' : ''}
                ${op.telefone || ''}
              </small>
              <div class="mt-2">
                <span class="badge bg-info">${op.tipo_contrato.toUpperCase()}</span>
                ${op.disponivel ? '<span class="badge bg-success">Disponível</span>' : '<span class="badge bg-secondary">Indisponível</span>'}
              </div>
            </div>
            <div class="col-md-6 text-end">
              <div class="mb-2">
                <strong>Diária:</strong> R$ ${op.diaria_valor.toFixed(2)}
              </div>
              <div class="mb-2">
                <strong>Trabalhos:</strong> ${op.total_diarias_trabalhadas}
              </div>
              <div class="mb-2">
                <strong>Pendente:</strong> 
                <span class="text-danger">R$ ${op.total_pendente.toFixed(2)}</span>
              </div>
              <div class="btn-group btn-group-sm" role="group">
                <button class="btn btn-outline-primary" onclick="operadoresUI.editar(${op.id})">
                  Editar
                </button>
                <button class="btn btn-outline-danger" onclick="operadoresUI.deletar(${op.id})">
                  Deletar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `).join('');
    
    container.innerHTML = html;
  },
  
  async renderDiarias() {
    const container = document.getElementById('diarias-pendentes');
    const diarias = operadoresService.obterDiariasAtraso();
    
    if (diarias.length === 0) {
      container.innerHTML = '<div class="alert alert-success">Todas as diárias estão pagas!</div>';
      return;
    }
    
    const agrupadas = {};
    diarias.forEach(d => {
      if (!agrupadas[d.operador_id]) agrupadas[d.operador_id] = [];
      agrupadas[d.operador_id].push(d);
    });
    
    let html = '<div class="row">';
    
    for (const [operador_id, diariasList] of Object.entries(agrupadas)) {
      const op = operadoresService.obter(parseInt(operador_id));
      const total = diariasList.reduce((sum, d) => sum + d.valor_diaria, 0);
      
      html += `
        <div class="col-md-6 mb-3">
          <div class="card border-danger">
            <div class="card-header bg-danger text-white">
              <strong>${op.nome}</strong>
              <span class="float-end badge bg-light text-danger">${diariasList.length} diária(s)</span>
            </div>
            <div class="card-body">
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th class="text-end">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  ${diariasList.map(d => `
                    <tr>
                      <td>${new Date(d.data).toLocaleDateString()}</td>
                      <td class="text-end">R$ ${d.valor_diaria.toFixed(2)}</td>
                    </tr>
                  `).join('')}
                </tbody>
                <tfoot>
                  <tr class="fw-bold">
                    <td>Total</td>
                    <td class="text-end text-danger">R$ ${total.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
              <button class="btn btn-sm btn-success w-100 mt-2" onclick="operadoresUI.pagarOperador(${op.id})">
                Pagar R$ ${total.toFixed(2)}
              </button>
            </div>
          </div>
        </div>
      `;
    }
    
    html += '</div>';
    container.innerHTML = html;
  },
  
  async renderRelatorio() {
    const container = document.getElementById('relatorio-operadores');
    const relatorio = operadoresService.gerarRelatorio();
    
    const html = `
      <div class="row">
        <div class="col-md-12">
          <div class="card mb-3">
            <div class="card-header bg-info text-white">
              Resumo Geral
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-3 text-center">
                  <h4>${relatorio.total_operadores}</h4>
                  <small>Operadores</small>
                </div>
                <div class="col-md-3 text-center">
                  <h4>R$ ${relatorio.total_pago_geral.toFixed(2)}</h4>
                  <small>Total Pago</small>
                </div>
                <div class="col-md-3 text-center">
                  <h4 class="text-danger">R$ ${relatorio.total_pendente_geral.toFixed(2)}</h4>
                  <small>Pendente</small>
                </div>
                <div class="col-md-3">
                  <button class="btn btn-sm btn-primary w-100" onclick="operadoresUI.exportarCSV()">
                    📊 Exportar CSV
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <table class="table table-hover">
        <thead class="table-light">
          <tr>
            <th>Nome</th>
            <th>Diária</th>
            <th>Trabalhos</th>
            <th>Total Ganho</th>
            <th>Total Pago</th>
            <th>Pendente</th>
            <th>% Pago</th>
          </tr>
        </thead>
        <tbody>
          ${relatorio.detalhes.map(op => `
            <tr>
              <td>${op.nome}</td>
              <td>R$ ${op.diaria_valor.toFixed(2)}</td>
              <td>${op.total_diarias}</td>
              <td>R$ ${op.total_ganho.toFixed(2)}</td>
              <td class="text-success">R$ ${op.total_pago.toFixed(2)}</td>
              <td class="text-danger">R$ ${op.total_pendente.toFixed(2)}</td>
              <td>${op.percentual_pago}%</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    
    container.innerHTML = html;
  },
  
  editar(id) {
    const op = operadoresService.obter(id);
    showFormOperador(op);
  },
  
  async deletar(id) {
    const op = operadoresService.obter(id);
    const confirmado = confirm(`Deletar operador ${op.nome}?`);
    if (!confirmado) return;
    
    try {
      await operadoresService.deletar(id);
      this.renderLista();
      toast.success('Operador removido');
    } catch (error) {
      toast.error('Erro: ' + error.message);
    }
  },
  
  async pagarOperador(operador_id) {
    const op = operadoresService.obter(operador_id);
    const metodo = prompt(`Escolha o método de pagamento para ${op.nome}:\n1 - Dinheiro\n2 - Transferência\n3 - Cheque`, '2');
    
    if (!metodo) return;
    
    const metodos = { '1': 'dinheiro', '2': 'transferencia', '3': 'cheque' };
    const metodo_selecionado = metodos[metodo] || 'transferencia';
    
    try {
      const resultado = await operadoresService.pagarEmLote(operador_id, metodo_selecionado);
      toast.success(`${resultado.sucesso} diária(s) pagas!`);
      this.renderDiarias();
      this.renderRelatorio();
    } catch (error) {
      toast.error('Erro: ' + error.message);
    }
  },
  
  exportarCSV() {
    const csv = operadoresService.exportarCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `operadores_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  }
};

// Carregar ao abrir a página
setTimeout(() => {
  operadoresUI.renderLista();
  operadoresUI.renderDiarias();
  operadoresUI.renderRelatorio();
}, 100);

function showFormOperador(operador = null) {
  const isEdit = !!operador;
  const title = isEdit ? 'Editar Operador' : 'Novo Operador';
  
  const html = `
    <form id="form-operador">
      <div class="mb-3">
        <label class="form-label">Nome</label>
        <input type="text" class="form-control" id="nome" value="${operador?.nome || ''}" required>
      </div>
      <div class="mb-3">
        <label class="form-label">CPF</label>
        <input type="text" class="form-control" id="cpf" value="${operador?.cpf || ''}">
      </div>
      <div class="mb-3">
        <label class="form-label">Telefone</label>
        <input type="tel" class="form-control" id="telefone" value="${operador?.telefone || ''}">
      </div>
      <div class="mb-3">
        <label class="form-label">Email</label>
        <input type="email" class="form-control" id="email" value="${operador?.email || ''}">
      </div>
      <div class="mb-3">
        <label class="form-label">Diária (R$)</label>
        <input type="number" class="form-control" id="diaria" value="${operador?.diaria_valor || ''}" step="0.01" required>
      </div>
      <div class="mb-3">
        <label class="form-label">Tipo de Contrato</label>
        <select class="form-select" id="tipo_contrato">
          <option value="pj" ${operador?.tipo_contrato === 'pj' ? 'selected' : ''}>PJ</option>
          <option value="clt" ${operador?.tipo_contrato === 'clt' ? 'selected' : ''}>CLT</option>
        </select>
      </div>
      <div class="mb-3">
        <label class="form-label">Anotações</label>
        <textarea class="form-control" id="nota" rows="2">${operador?.nota_interna || ''}</textarea>
      </div>
    </form>
  `;
  
  // Usar modal dinâmica
  showModal(title, html, [
    { text: 'Cancelar', onclick: 'bootstrapModal.hide()' },
    { text: 'Salvar', onclick: 'salvarOperadorFormulario(' + (operador?.id || 'null') + ')', class: 'btn-success' }
  ]);
}

async function salvarOperadorFormulario(operadorId) {
  const dados = {
    nome: document.getElementById('nome').value,
    cpf: document.getElementById('cpf').value,
    telefone: document.getElementById('telefone').value,
    email: document.getElementById('email').value,
    diaria_valor: parseFloat(document.getElementById('diaria').value),
    tipo_contrato: document.getElementById('tipo_contrato').value,
    nota_interna: document.getElementById('nota').value
  };
  
  try {
    if (operadorId) {
      await operadoresService.atualizar(operadorId, dados);
      toast.success('Operador atualizado!');
    } else {
      await operadoresService.criar(dados);
      toast.success('Operador criado!');
    }
    
    bootstrapModal.hide();
    operadoresUI.renderLista();
    operadoresUI.renderDiarias();
  } catch (error) {
    toast.error('Erro: ' + error.message);
  }
}
</script>
```

---

## Passo 7: Adicionar ao app.js

Localize a função que carrega páginas (geralmente `goToPage()`) e adicione:

```javascript
// Em app.js, adicionar à função goToPage():

case 'operadores':
  app.loadPage('assets/html/operadores.html');
  break;
```

---

## Passo 8: Testar

1. Abra a aplicação
2. Vá para **Operadores** (novo menu)
3. Clique em **+ Novo Operador**
4. Preencha os dados:
   - Nome: João Silva
   - Diária: 150.00
   - Tipo: PJ
5. Clique em **Salvar**
6. Crie um novo evento e veja a seção de **Operadores**
7. Finalize o evento e veja as diárias em **Diárias Pendentes**
8. Pague a diária e veja atualizar

---

## PRÓXIMOS PASSOS

Com o sistema operacional funcionando, você pode:

1. **Integrar com Eventos** - Mostrar operadores no dashboard de eventos
2. **Gerar Recibos** - Criar comprovantes de pagamento
3. **Enviar Lembretes** - WhatsApp quando há diárias pendentes
4. **Exportar Relatórios** - Gerar Excel com histórico de pagamentos
5. **Foto de Identificação** - Armazenar CPF e documentos dos operadores

Tudo já está codificado, só falta integrar a UI!
