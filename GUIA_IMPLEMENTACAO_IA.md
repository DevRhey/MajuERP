# 🔧 Guia de Implementação - Integrando IA nos Formulários Existentes

## 1. INTEGRAÇÃO NA CRIAÇÃO DE EVENTOS

### Exemplo: Validação ao Salvar Evento

Adicione isso ao método `saveEvento()` em **eventos.js**:

```javascript
saveEvento() {
  const evento = {
    id: this.formState.id || Date.now(),
    cliente: this.formState.cliente,
    dataInicio: this.formState.dataInicio,
    dataFim: this.formState.dataFim,
    itensAlugados: this.formState.itensAlugados,
    valorTotal: this.formState.valorTotal,
    status: this.formState.status || "pendente",
    clienteId: this.formState.clienteId,
  };

  // ✨ USAR IA PARA VALIDAR
  if (calendarioAssistente) {
    const validacao = calendarioAssistente.validarAgendamento(evento);
    
    if (!validacao.valido) {
      calendarioAssistente.mostrarAvisoConflito(validacao);
      return; // Não salva se há conflitos
    }
    
    // Mostrar sugestões
    if (validacao.sugestoes.length > 0) {
      console.log("💡 Sugestões para este evento:", validacao.sugestoes);
      this.mostrarSugestoesInteligentes(validacao.sugestoes);
    }
  }

  // Salvar evento normalmente
  this.eventos.push(evento);
  Storage.save("eventos", this.eventos);
  UI.showAlert("✅ Evento agendado com sucesso!", "success");
  this.render();
}

// Novo método para mostrar sugestões
mostrarSugestoesInteligentes(sugestoes) {
  sugestoes.forEach((sug) => {
    if (sug.tipo === "itens_recomendados") {
      let html = "<strong>Itens frequentemente alugados:</strong><ul>";
      sug.itens.forEach((item) => {
        html += `<li>${item.nome} (${item.frequencia} vezes)</li>`;
      });
      html += "</ul>";
      UI.showAlert(html, "info");
    }
  });
}
```

---

## 2. INTEGRAÇÃO NA SELEÇÃO DE DATA

### Exemplo: Sugerir Horários Disponíveis

Adicione um novo campo no formulário de eventos:

```html
<div class="col-md-6">
  <label class="form-label">Data do Evento</label>
  <input type="date" class="form-control" id="evento-data" 
         onchange="mostrarHorariosDisponiveis(this.value)">
  <div id="horarios-disponiveis" class="mt-2"></div>
</div>
```

JavaScript para mostrar sugestões:

```javascript
function mostrarHorariosDisponiveis(data) {
  if (!calendarioAssistente || !data) return;
  
  const dataObj = new Date(data + "T00:00:00");
  const horarios = calendarioAssistente.encontrarMelhorHorario(dataObj);
  
  let html = '<small class="text-muted d-block mb-2">Horários disponíveis:</small>';
  
  if (horarios.length === 0) {
    html += '<span class="badge bg-danger">Nenhum horário disponível nesta data</span>';
  } else {
    horarios.forEach((h) => {
      html += `<span class="badge bg-success me-2">${h.descricao}</span>`;
    });
  }
  
  document.getElementById("horarios-disponiveis").innerHTML = html;
}
```

---

## 3. INTEGRAÇÃO NA SELEÇÃO DE ITENS

### Exemplo: Sugerir Itens Complementares

```javascript
// No formulário de seleção de itens do evento
function sugerirItensComplementares() {
  const tipoEvento = document.getElementById("evento-tipo").value;
  const quantidade = parseInt(document.getElementById("quantidade-pessoas").value) || 10;
  
  if (!recommendationEngine) return;
  
  const recomendacoes = recommendationEngine.recomendarItens(
    tipoEvento,
    quantidade,
    "salão"
  );
  
  let html = '<div class="alert alert-info"><strong>Itens Recomendados:</strong><ul class="mb-0">';
  
  recomendacoes.forEach((item) => {
    html += `
      <li>
        ${item.nome} - R$ ${item.preco.toFixed(2)}/dia
        <br><small>Frequência: ${item.frequencia} eventos</small>
      </li>
    `;
  });
  
  html += '</ul></div>';
  
  document.getElementById("recomendacoes-itens").innerHTML = html;
}
```

---

## 4. INTEGRAÇÃO NO DASHBOARD

### Exemplo: Card com Análise Financeira

```javascript
// Adicione ao Dashboard:
renderFinancialAnalysis() {
  if (!assistenteFinanceiro) return "";
  
  const dashboard = assistenteFinanceiro.obterDashboardFinanceiro();
  
  return `
    <div class="row mb-4">
      <div class="col-md-12">
        <div class="card border-start border-success border-4">
          <div class="card-body">
            <h6 class="text-muted mb-3">📊 Análise Financeira IA</h6>
            <div class="row">
              <div class="col-md-4">
                <small class="text-muted">Receita (Este Mês)</small>
                <h4 class="text-success">${dashboard.mes_atual.receita_formatada}</h4>
              </div>
              <div class="col-md-4">
                <small class="text-muted">Clientes em Risco</small>
                <h4 class="text-danger">${dashboard.analise_clientes_risco.length}</h4>
              </div>
              <div class="col-md-4">
                <small class="text-muted">Ticket Médio</small>
                <h4 class="text-primary">R$ ${Math.round(dashboard.mes_atual.ticket_medio)}</h4>
              </div>
            </div>
            ${dashboard.alertas.length > 0 ? `
              <hr>
              <div class="alert alert-warning mb-0">
                ⚠️ ${dashboard.alertas[0].mensagem}
              </div>
            ` : ""}
          </div>
        </div>
      </div>
    </div>
  `;
}
```

---

## 5. INTEGRAÇÃO NA LISTA DE CLIENTES

### Exemplo: Mostrar Score de Risco

```javascript
// Em clientes.js, adicione coluna ao renderizar
renderClientesTable() {
  // ... código existente ...
  
  return clientes.map(cliente => {
    const risco = assistenteFinanceiro?.financialPredictor
      .analisarRiscoInadimplencia(cliente.id) || { score: 0, nivel: "Desconhecido" };
    
    const riscoBadge = `<span class="badge bg-${
      risco.nivel === "Alto" ? "danger" : 
      risco.nivel === "Médio" ? "warning" : 
      "success"
    }">${risco.nivel}</span>`;
    
    return `
      <tr>
        <td>${cliente.nome}</td>
        <td>${cliente.telefone}</td>
        <td>${riscoBadge}</td>
        <td>
          <button class="btn btn-sm btn-outline-primary" 
                  onclick="mostrarAnaliseCliente('${cliente.id}')">
            Ver Análise
          </button>
        </td>
      </tr>
    `;
  });
}

function mostrarAnaliseCliente(clienteId) {
  const analise = assistenteFinanceiro.analisarCliente(clienteId);
  
  UI.showModal("Análise de Cliente", `
    <p><strong>Total Gasto:</strong> R$ ${analise.total_gasto.toFixed(2)}</p>
    <p><strong>Total Pago:</strong> R$ ${analise.total_pago.toFixed(2)}</p>
    <p><strong>Pendente:</strong> R$ ${analise.pendente.toFixed(2)}</p>
    <p><strong>Risco de Inadimplência:</strong> 
       <span class="badge bg-${analise.risco_inadimplencia === "Alto" ? "danger" : "warning"}">
         ${analise.risco_inadimplencia}
       </span>
    </p>
    <hr>
    <h6>Recomendações:</h6>
    <ul>
      ${analise.recomendacoes.map(r => `<li>${r}</li>`).join("")}
    </ul>
  `);
}
```

---

## 6. INTEGRAÇÃO NO CALENDÁRIO

### Exemplo: Mostrar Disponibilidade e Sugestões

```javascript
// Em calendario.js, no método render:
renderCalendarWithIA() {
  // ... código existente ...
  
  // Adicionar informação sobre disponibilidade de cada dia
  const relatorioMes = calendarioAssistente?.gerarRelatorioOcupacaoMes(
    this.currentMonth + 1,
    this.currentYear
  );
  
  if (relatorioMes) {
    const infoDiv = document.createElement("div");
    infoDiv.className = "alert alert-info mt-3";
    infoDiv.innerHTML = `
      <strong>📅 Disponibilidade do Mês:</strong><br>
      Dias livres: ${relatorioMes.diasDisponiveis} de ${relatorioMes.diasTotais}
      (${relatorioMes.percentualDisponibilidade}%)<br>
      <small>${relatorioMes.recomendacao}</small>
    `;
    
    document.getElementById("calendar-info")?.appendChild(infoDiv);
  }
}
```

---

## 7. SISTEMA DE ALERTAS AUTOMÁTICOS

### Exemplo: Alertas no Dashboard

```javascript
// Adicionar ao dashboard.js
renderAlertasIA() {
  if (!iaEngine) return "";
  
  const alertas = iaEngine.notificationSystem.verificarAlertasPendentes();
  
  if (alertas.length === 0) return "";
  
  return `
    <div class="alert alert-warning" role="alert">
      <h6 class="alert-heading">🔔 Alertas do Sistema IA</h6>
      <ul class="mb-0">
        ${alertas.map(a => `<li>${a.mensagem}</li>`).join("")}
      </ul>
    </div>
  `;
}
```

---

## 8. CHAT/VALIDAÇÃO RÁPIDA

### Exemplo: Validador Inteligente ao Digitar

```javascript
// Validação em tempo real ao digitar datas
document.getElementById("evento-data").addEventListener("change", function() {
  const data = new Date(this.value + "T00:00:00");
  
  if (!calendarioAssistente) return;
  
  const disponibilidade = calendarioAssistente.analisarDisponibilidadePeriodo(
    data,
    data
  );
  
  const statusDiv = document.getElementById("status-data");
  if (disponibilidade.detalhes[0].status === "disponível") {
    statusDiv.innerHTML = '✅ Data disponível!';
    statusDiv.className = "alert alert-success mt-2";
  } else {
    statusDiv.innerHTML = '❌ Data indisponível. Sugerir alternativa?';
    statusDiv.className = "alert alert-danger mt-2";
  }
});
```

---

## 9. RELATÓRIOS COM IA

### Exemplo: Botão para Gerar Relatório Inteligente

```javascript
// Adicionar botão no Dashboard
<button class="btn btn-primary" onclick="gerarRelatorioIA()">
  <i class="bi bi-graph-up"></i> Relatório Inteligente
</button>

// Função
function gerarRelatorioIA() {
  if (!assistenteFinanceiro) {
    UI.showAlert("Sistema IA não iniciado", "warning");
    return;
  }
  
  const html = assistenteFinanceiro.exibirRelatorioFinanceiro();
  const mainContent = document.getElementById("main-content");
  mainContent.innerHTML = html;
}
```

---

## 10. CONSOLE DO DESENVOLVEDOR PARA DEBUG

Para testar a IA no console do navegador:

```javascript
// Verificar disponibilidade de uma data
calendarioAssistente.analisarDisponibilidadePeriodo(
  new Date("2026-01-15"),
  new Date("2026-01-15")
);

// Analisar cliente
assistenteFinanceiro.analisarCliente("cliente-id");

// Verificar conflitos de um evento
iaEngine.conflictDetector.verificarConflitos(evento, eventos);

// Ver previsão financeira
iaEngine.financialPredictor.preverReceita({ mes: 1, ano: 2026 });

// Sugerir datas alternativas
calendarioAssistente.conflictDetector.sugerirDatasAlternativas(new Date());
```

---

## 🎯 Próximas Etapas

1. **Copiar os exemplos acima** em seus arquivos JS existentes
2. **Testar cada integração** no navegador
3. **Ajustar estilos CSS** conforme necessário
4. **Coletar feedback** dos usuários sobre as recomendações
5. **Refinar os algoritmos** com mais dados reais

---

## ⚠️ Notas Importantes

- ✅ A IA funciona 100% offline (sem API externa)
- ✅ Usa apenas dados já existentes no LocalStorage
- ✅ Sem dependências externas adicionais
- ⚠️ Teste bem antes de usar em produção
- 💡 Use o console para debug e validar respostas

