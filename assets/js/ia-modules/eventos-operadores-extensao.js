/**
 * EXTENSÃO: Suporte a Operadores em Eventos
 * 
 * Este arquivo complementa eventos.js para gerenciar operadores/monitores
 * que trabalham em cada brinquedo durante um evento.
 * 
 * Adiciona os seguintes campos ao evento:
 * - operadores_necessarios: Array de operadores atribuídos aos itens
 * - custo_operadores: Total a pagar aos operadores
 * - custo_total: custo_aluguel + custo_operadores + custo_manutencao
 */

// ===== EXTENSION: Adicionar métodos ao Eventos =====

/**
 * Obter operadores atribuídos a um evento
 */
Eventos.prototype.obterOperadoresEvento = function(evento_id) {
  const evento = this.eventos.find(e => e.id === evento_id);
  if (!evento) return [];
  
  return (evento.operadores_necessarios || []).map(op => {
    const operadorCompleto = operadoresService.obter(op.operador_id);
    return {
      ...op,
      ...operadorCompleto
    };
  });
};

/**
 * Atribuir operador a um item do evento
 */
Eventos.prototype.atribuirOperadorAoItem = function(evento_id, item_id, operador_id, valor_ajuste = 0) {
  const evento = this.eventos.find(e => e.id === evento_id);
  if (!evento) throw new Error('Evento não encontrado');
  
  const operador = operadoresService.obter(operador_id);
  if (!operador) throw new Error('Operador não encontrado');
  
  const item = evento.itens.find(i => i.id === item_id);
  if (!item) throw new Error('Item não encontrado neste evento');
  
  // Inicializar array se não existir
  if (!evento.operadores_necessarios) {
    evento.operadores_necessarios = [];
  }
  
  // Verificar se já existe operador para este item
  const indexExistente = evento.operadores_necessarios.findIndex(op => op.item_id === item_id);
  
  const atribuicao = {
    item_id: item_id,
    item_nome: item.nome,
    operador_id: operador_id,
    operador_nome: operador.nome,
    diaria_valor: operador.diaria_valor,
    valor_ajuste: valor_ajuste,
    status_trabalho: 'pendente' // 'pendente', 'em_trabalho', 'concluido', 'pago'
  };
  
  if (indexExistente >= 0) {
    // Atualizar existente
    evento.operadores_necessarios[indexExistente] = atribuicao;
  } else {
    // Adicionar novo
    evento.operadores_necessarios.push(atribuicao);
  }
  
  // Atualizar custos
  this.atualizarCustosEvento(evento);
  
  // Salvar
  this.updateEvento(evento);
  
  console.log(`✅ Operador ${operador.nome} atribuído ao item ${item.nome}`);
  return atribuicao;
};

/**
 * Remover operador de um item
 */
Eventos.prototype.removerOperadorDoItem = function(evento_id, item_id) {
  const evento = this.eventos.find(e => e.id === evento_id);
  if (!evento) throw new Error('Evento não encontrado');
  
  if (!evento.operadores_necessarios) return;
  
  evento.operadores_necessarios = evento.operadores_necessarios.filter(op => op.item_id !== item_id);
  
  this.atualizarCustosEvento(evento);
  this.updateEvento(evento);
  
  console.log(`✅ Operador removido do item`);
};

/**
 * Calcular custos totais do evento incluindo operadores
 */
Eventos.prototype.atualizarCustosEvento = function(evento) {
  // Custo de operadores
  const custoOperadores = (evento.operadores_necessarios || [])
    .reduce((sum, op) => sum + (op.diaria_valor + (op.valor_ajuste || 0)), 0);
  
  // Custo de manutenção estimado (10% do valor de aluguel)
  const custoManutencao = evento.valorTotal * 0.1;
  
  // Custo total
  evento.custo_operadores = custoOperadores;
  evento.custo_manutencao = custoManutencao;
  evento.custo_total = custoOperadores + custoManutencao;
  
  // Margem líquida
  evento.margem_liquida = evento.valorTotal - evento.custo_total;
  evento.percentual_margem = ((evento.margem_liquida / evento.valorTotal) * 100).toFixed(1);
};

/**
 * Obter resumo de custos do evento
 */
Eventos.prototype.obterResumoCustos = function(evento_id) {
  const evento = this.eventos.find(e => e.id === evento_id);
  if (!evento) return null;
  
  return {
    valor_aluguel: evento.valorTotal || 0,
    custo_operadores: evento.custo_operadores || 0,
    custo_manutencao: evento.custo_manutencao || 0,
    custo_total: evento.custo_total || 0,
    margem_liquida: evento.margem_liquida || 0,
    percentual_margem: evento.percentual_margem || 0,
    numero_operadores: (evento.operadores_necessarios || []).length,
    operadores: (evento.operadores_necessarios || []).map(op => ({
      nome: op.operador_nome,
      diaria: op.diaria_valor,
      ajuste: op.valor_ajuste || 0,
      total: (op.diaria_valor + (op.valor_ajuste || 0))
    }))
  };
};

/**
 * Finalizar evento e registrar diárias dos operadores
 */
Eventos.prototype.finalizarEventoComOperadores = async function(evento_id) {
  const evento = this.eventos.find(e => e.id === evento_id);
  if (!evento) throw new Error('Evento não encontrado');
  
  if (!evento.operadores_necessarios || evento.operadores_necessarios.length === 0) {
    console.log('Evento sem operadores. Apenas finalizando...');
    evento.status = 'finalizado';
    this.updateEvento(evento);
    return { sucesso: 0, total: 0 };
  }
  
  let diariasCriadas = 0;
  
  for (const atribuicao of evento.operadores_necessarios) {
    if (atribuicao.status_trabalho === 'pago') {
      continue; // Já foi pago
    }
    
    try {
      // Registrar diária
      const diaria = await operadoresService.registrarDiaria(
        atribuicao.operador_id,
        evento_id,
        {
          data: evento.dataInicio,
          itens_supervisionados: [
            {
              item_id: atribuicao.item_id,
              item_nome: atribuicao.item_nome,
              inicio: evento.horaInicio,
              fim: evento.horaFim
            }
          ],
          horas_trabalhadas: 1,
          valor_ajuste: atribuicao.valor_ajuste || 0,
          observacoes: `Trabalhou no evento "${evento.nome}"`
        }
      );
      
      // Marcar como "concluído" (aguardando pagamento)
      atribuicao.status_trabalho = 'concluido';
      diariasCriadas++;
      
    } catch (error) {
      console.error(`Erro ao registrar diária para ${atribuicao.operador_nome}:`, error);
    }
  }
  
  // Finalizar evento
  evento.status = 'finalizado';
  this.updateEvento(evento);
  
  console.log(`✅ Evento finalizado. ${diariasCriadas} diárias registradas.`);
  return { sucesso: diariasCriadas, total: evento.operadores_necessarios.length };
};

/**
 * Pagar todas as diárias de um evento de uma vez
 */
Eventos.prototype.pagarOperadoresEvento = async function(evento_id, metodo_pagamento) {
  const evento = this.eventos.find(e => e.id === evento_id);
  if (!evento) throw new Error('Evento não encontrado');
  
  if (!evento.operadores_necessarios || evento.operadores_necessarios.length === 0) {
    return { sucesso: 0, total: 0 };
  }
  
  let pagamentos = 0;
  
  for (const atribuicao of evento.operadores_necessarios) {
    if (atribuicao.status_trabalho === 'pago') {
      continue; // Já foi pago
    }
    
    // Obter diárias deste operador para este evento
    const diarias = operadoresService.obterDiarias(atribuicao.operador_id)
      .filter(d => d.evento_id === evento_id && d.status === 'pendente');
    
    for (const diaria of diarias) {
      try {
        await operadoresService.pagarDiaria(diaria.id, metodo_pagamento);
        pagamentos++;
        atribuicao.status_trabalho = 'pago';
      } catch (error) {
        console.error(`Erro ao pagar diária:`, error);
      }
    }
  }
  
  this.updateEvento(evento);
  console.log(`✅ ${pagamentos} diárias pagas do evento "${evento.nome}"`);
  return { sucesso: pagamentos, total: evento.operadores_necessarios.length };
};

/**
 * Renderizar card de operadores de um evento (para exibição)
 */
Eventos.prototype.renderOperadoresEvento = function(evento_id) {
  const evento = this.eventos.find(e => e.id === evento_id);
  if (!evento || !evento.operadores_necessarios || evento.operadores_necessarios.length === 0) {
    return '<small class="text-muted">Sem operadores atribuídos</small>';
  }
  
  const html = evento.operadores_necessarios.map(op => `
    <div class="d-flex justify-content-between align-items-center small mb-1">
      <div>
        <strong>${op.operador_nome}</strong>
        <br>
        <small>${op.item_nome}</small>
      </div>
      <div class="text-end">
        <strong>R$ ${(op.diaria_valor + (op.valor_ajuste || 0)).toFixed(2)}</strong>
        <br>
        <span class="badge bg-${op.status_trabalho === 'pago' ? 'success' : 'warning'} font-sm">
          ${this.getStatusText(op.status_trabalho)}
        </span>
      </div>
    </div>
  `).join('');
  
  return `
    <div class="card mt-2 border-info">
      <div class="card-header bg-info text-white py-2">
        <small><i class="bi bi-people"></i> Operadores (${evento.operadores_necessarios.length})</small>
      </div>
      <div class="card-body py-2">
        ${html}
        <div class="border-top pt-2 mt-2">
          <strong class="text-info">Custo Total: R$ ${(evento.custo_operadores || 0).toFixed(2)}</strong>
        </div>
      </div>
    </div>
  `;
};

/**
 * Adicionar section de operadores no formulário de evento
 */
Eventos.prototype.getOperadoresFormHTML = function(evento = null) {
  const operadores = operadoresService.listar();
  const itensCurrent = evento ? evento.itens : [];
  
  let html = `
    <div class="card mt-3 border-info">
      <div class="card-header bg-info text-white">
        <h6 class="mb-0"><i class="bi bi-people"></i> Operadores/Monitores</h6>
      </div>
      <div class="card-body">
        <small class="text-muted d-block mb-3">
          Atribua um operador para supervisionar cada brinquedo durante o evento.
        </small>
        
        <div id="operadores-container">
  `;
  
  // Exibir linhas existentes
  if (evento && evento.operadores_necessarios) {
    html += evento.operadores_necessarios.map((op, idx) => `
      <div class="row mb-2 operador-linha">
        <div class="col-md-4">
          <label class="form-label small">Brinquedo</label>
          <select class="form-select form-select-sm item-operador" required>
            <option value="">Selecionar...</option>
            ${itensCurrent.map(item => `
              <option value="${item.id}" ${op.item_id === item.id ? 'selected' : ''}>
                ${item.nome}
              </option>
            `).join('')}
          </select>
        </div>
        <div class="col-md-4">
          <label class="form-label small">Operador</label>
          <select class="form-select form-select-sm operador-select" required onchange="app.modules.eventos.atualizarValorDiariaOperador(this)">
            <option value="">Selecionar...</option>
            ${operadores.map(op => `
              <option value="${op.id}" data-diaria="${op.diaria_valor}" ${op.operador_id === op.id ? 'selected' : ''}>
                ${op.nome} - R$ ${op.diaria_valor.toFixed(2)}/dia
              </option>
            `).join('')}
          </select>
        </div>
        <div class="col-md-3">
          <label class="form-label small">Diária (R$)</label>
          <input type="number" class="form-control form-control-sm diaria-operador" 
                 value="${op.diaria_valor.toFixed(2)}" readonly>
        </div>
        <div class="col-md-1 d-flex align-items-end">
          <button type="button" class="btn btn-sm btn-danger" onclick="app.modules.eventos.removerLinhaOperador(this)">
            ✕
          </button>
        </div>
      </div>
    `).join('');
  }
  
  html += `
        </div>
        
        <button type="button" class="btn btn-sm btn-info mt-2" onclick="app.modules.eventos.adicionarLinhaOperador()">
          <i class="bi bi-plus"></i> Adicionar Operador
        </button>
      </div>
    </div>
  `;
  
  return html;
};

/**
 * Adicionar linha de operador no formulário
 */
Eventos.prototype.adicionarLinhaOperador = function() {
  const operadores = operadoresService.listar();
  const container = document.getElementById('operadores-container');
  
  // Obter itens do formulário
  const formData = new FormData(document.getElementById('evento-form'));
  const itensSelecionados = [];
  const itemIds = formData.getAll('itemId[]');
  const itemQuantidades = formData.getAll('quantidade[]');
  
  // Recuperar itens
  itemIds.forEach((itemId, idx) => {
    const item = this.itens.find(i => i.id === parseInt(itemId));
    if (item) {
      itensSelecionados.push(item);
    }
  });
  
  const html = `
    <div class="row mb-2 operador-linha">
      <div class="col-md-4">
        <label class="form-label small">Brinquedo</label>
        <select class="form-select form-select-sm item-operador" required>
          <option value="">Selecionar...</option>
          ${itensSelecionados.map(item => `
            <option value="${item.id}">${item.nome}</option>
          `).join('')}
        </select>
      </div>
      <div class="col-md-4">
        <label class="form-label small">Operador</label>
        <select class="form-select form-select-sm operador-select" required onchange="app.modules.eventos.atualizarValorDiariaOperador(this)">
          <option value="">Selecionar...</option>
          ${operadores.map(op => `
            <option value="${op.id}" data-diaria="${op.diaria_valor}">
              ${op.nome} - R$ ${op.diaria_valor.toFixed(2)}/dia
            </option>
          `).join('')}
        </select>
      </div>
      <div class="col-md-3">
        <label class="form-label small">Diária (R$)</label>
        <input type="number" class="form-control form-control-sm diaria-operador" value="0.00" readonly>
      </div>
      <div class="col-md-1 d-flex align-items-end">
        <button type="button" class="btn btn-sm btn-danger" onclick="app.modules.eventos.removerLinhaOperador(this)">
          ✕
        </button>
      </div>
    </div>
  `;
  
  container.insertAdjacentHTML('beforeend', html);
};

/**
 * Remover linha de operador
 */
Eventos.prototype.removerLinhaOperador = function(btn) {
  btn.closest('.operador-linha').remove();
};

/**
 * Atualizar valor da diária quando operador é selecionado
 */
Eventos.prototype.atualizarValorDiariaOperador = function(select) {
  const diaria = select.options[select.selectedIndex].dataset.diaria || 0;
  const linha = select.closest('.operador-linha');
  const input = linha.querySelector('.diaria-operador');
  input.value = parseFloat(diaria).toFixed(2);
};

/**
 * Coletar dados de operadores do formulário
 */
Eventos.prototype.coletarOperadoresFormulario = function() {
  const operadores = [];
  
  document.querySelectorAll('.operador-linha').forEach(linha => {
    const itemId = parseInt(linha.querySelector('.item-operador').value);
    const operadorId = parseInt(linha.querySelector('.operador-select').value);
    const diaria = parseFloat(linha.querySelector('.diaria-operador').value);
    
    if (itemId && operadorId) {
      const item = this.itens.find(i => i.id === itemId);
      const operador = operadoresService.obter(operadorId);
      
      operadores.push({
        item_id: itemId,
        item_nome: item ? item.nome : '',
        operador_id: operadorId,
        operador_nome: operador ? operador.nome : '',
        diaria_valor: diaria,
        valor_ajuste: 0,
        status_trabalho: 'pendente'
      });
    }
  });
  
  return operadores;
};

/**
 * Status de trabalho do operador
 */
Eventos.prototype.getStatusText = function(status) {
  const statusMap = {
    'pendente': 'Pendente',
    'em_trabalho': 'Trabalhando',
    'concluido': 'Concluído',
    'pago': 'Pago'
  };
  return statusMap[status] || status;
};

console.log('✅ Extensão de operadores carregada');
