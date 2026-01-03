// Script para Popular o Sistema com Dados de Teste

async function popularSistema() {
  const confirmado = await ConfirmDialog.show(
    "Popular Sistema",
    "Isso irá adicionar dados de teste ao sistema. Deseja continuar?"
  );
  
  if (!confirmado) {
    return;
  }

  // Limpar dados existentes
  Storage.resetAll();

  // Garantir formas de pagamento padrão
  Storage.save("formasPagamento", [
    { id: "pix", nome: "PIX" },
    { id: "debito", nome: "Debito" },
    { id: "credito", nome: "Credito" },
    { id: "dinheiro", nome: "Dinheiro" }
  ]);

  // 1. POPULAR CLIENTES
  const clientes = [
    {
      id: 1735150800000,
      nome: "Maria Silva Santos",
      cpf: "123.456.789-09",
      telefone: "(11) 98765-4321",
      email: "maria.silva@email.com",
      endereco: "Rua das Flores, 123, Jardim Primavera, São Paulo - SP"
    },
    {
      id: 1735150801000,
      nome: "João Pedro Oliveira",
      cpf: "987.654.321-00",
      telefone: "(11) 97654-3210",
      email: "joao.pedro@email.com",
      endereco: "Av. Paulista, 1000, Bela Vista, São Paulo - SP"
    },
    {
      id: 1735150802000,
      nome: "Ana Carolina Souza",
      cpf: "456.789.123-45",
      telefone: "(11) 96543-2109",
      email: "ana.souza@email.com",
      endereco: "Rua do Comércio, 456, Centro, São Paulo - SP"
    },
    {
      id: 1735150803000,
      nome: "Carlos Eduardo Lima",
      cpf: "321.654.987-21",
      telefone: "(11) 95432-1098",
      email: "carlos.lima@email.com",
      endereco: "Av. Ipiranga, 789, República, São Paulo - SP"
    },
    {
      id: 1735150804000,
      nome: "Juliana Fernandes Costa",
      cpf: "789.123.456-78",
      telefone: "(11) 94321-0987",
      email: "juliana.costa@email.com",
      endereco: "Rua Augusta, 321, Consolação, São Paulo - SP"
    },
    {
      id: 1735150805000,
      nome: "Ricardo Alves Pereira",
      cpf: "654.321.789-65",
      telefone: "(11) 93210-9876",
      email: "ricardo.pereira@email.com",
      endereco: "Rua da Paz, 654, Vila Mariana, São Paulo - SP"
    },
    {
      id: 1735150806000,
      nome: "Patricia Rodrigues",
      cpf: "147.258.369-14",
      telefone: "(11) 92109-8765",
      email: "patricia.rodrigues@email.com",
      endereco: "Av. Rebouças, 987, Pinheiros, São Paulo - SP"
    },
    {
      id: 1735150807000,
      nome: "Fernando Henrique Dias",
      cpf: "258.369.147-25",
      telefone: "(11) 91098-7654",
      email: "fernando.dias@email.com",
      endereco: "Rua Oscar Freire, 147, Jardins, São Paulo - SP"
    }
  ];

  Storage.save("clientes", clientes);
  console.log("✅ Clientes populados:", clientes.length);

  // 2. POPULAR ITENS
  const itens = [
    {
      id: 1735150900000,
      nome: "Pula-Pula Castelo Encantado",
      tipo: "brinquedo",
      quantidadeTotal: 3,
      descricao: "Pula-pula inflável temático de castelo, capacidade para 8 crianças",
      valorDiaria: 150.00,
      imagem: "https://via.placeholder.com/300x200?text=Pula-Pula"
    },
    {
      id: 1735150901000,
      nome: "Tobogã Gigante",
      tipo: "brinquedo",
      quantidadeTotal: 2,
      descricao: "Tobogã inflável com 5 metros de altura",
      valorDiaria: 200.00,
      imagem: "https://via.placeholder.com/300x200?text=Tobogã"
    },
    {
      id: 1735150902000,
      nome: "Cama Elástica",
      tipo: "brinquedo",
      quantidadeTotal: 4,
      descricao: "Cama elástica profissional com rede de proteção",
      valorDiaria: 120.00,
      imagem: "https://via.placeholder.com/300x200?text=Cama+Elástica"
    },
    {
      id: 1735150903000,
      nome: "Piscina de Bolinhas",
      tipo: "brinquedo",
      quantidadeTotal: 5,
      descricao: "Piscina inflável com 1000 bolinhas coloridas",
      valorDiaria: 100.00,
      imagem: "https://via.placeholder.com/300x200?text=Piscina"
    },
    {
      id: 1735150904000,
      nome: "Mesa de Pebolim",
      tipo: "brinquedo",
      quantidadeTotal: 3,
      descricao: "Mesa de pebolim profissional para 4 jogadores",
      valorDiaria: 80.00,
      imagem: "https://via.placeholder.com/300x200?text=Pebolim"
    },
    {
      id: 1735150905000,
      nome: "Carrinho Elétrico Infantil",
      tipo: "brinquedo",
      quantidadeTotal: 6,
      descricao: "Carrinho elétrico com controle remoto para pais",
      valorDiaria: 90.00,
      imagem: "https://via.placeholder.com/300x200?text=Carrinho"
    },
    {
      id: 1735150906000,
      nome: "Recreação Infantil",
      tipo: "servico",
      quantidadeTotal: 10,
      descricao: "Serviço de recreação com monitores qualificados (4 horas)",
      valorDiaria: 250.00,
      imagem: "https://via.placeholder.com/300x200?text=Recreação"
    },
    {
      id: 1735150907000,
      nome: "Decoração Temática Frozen",
      tipo: "servico",
      quantidadeTotal: 5,
      descricao: "Decoração completa tema Frozen incluindo painel, balões e mesa",
      valorDiaria: 400.00,
      imagem: "https://via.placeholder.com/300x200?text=Decoração"
    },
    {
      id: 1735150908000,
      nome: "Máquina de Algodão Doce",
      tipo: "brinquedo",
      quantidadeTotal: 4,
      descricao: "Máquina profissional de algodão doce com insumos para 50 porções",
      valorDiaria: 130.00,
      imagem: "https://via.placeholder.com/300x200?text=Algodão+Doce"
    },
    {
      id: 1735150909000,
      nome: "Pipoca Gourmet",
      tipo: "servico",
      quantidadeTotal: 4,
      descricao: "Carrinho de pipoca gourmet com 3 sabores (100 porções)",
      valorDiaria: 180.00,
      imagem: "https://via.placeholder.com/300x200?text=Pipoca"
    },
    {
      id: 1735150910000,
      nome: "Pintura Facial",
      tipo: "servico",
      quantidadeTotal: 8,
      descricao: "Serviço de pintura facial com pintor profissional (4 horas)",
      valorDiaria: 200.00,
      imagem: "https://via.placeholder.com/300x200?text=Pintura+Facial"
    },
    {
      id: 1735150911000,
      nome: "Show de Mágica",
      tipo: "servico",
      quantidadeTotal: 3,
      descricao: "Show de mágica com mágico profissional (1 hora)",
      valorDiaria: 500.00,
      imagem: "https://via.placeholder.com/300x200?text=Mágica"
    }
  ];

  Storage.save("itens", itens);
  console.log("✅ Itens populados:", itens.length);

  // 2.1 POPULAR OPERADORES / MONITORES
  const operadores = [
    { id: 501, nome: "Bruna Almeida", telefone: "(11) 98989-1111", email: "bruna@monitores.com", diaria_valor: 180, tipo_contrato: "pj", disponivel: true, especialidades: ["pula-pula", "recreacao"], total_diarias_trabalhadas: 0, total_ganho: 0, total_pago: 0, total_pendente: 0 },
    { id: 502, nome: "Diego Martins", telefone: "(11) 97777-2222", email: "diego@monitores.com", diaria_valor: 220, tipo_contrato: "pj", disponivel: true, especialidades: ["toboga", "pintura"], total_diarias_trabalhadas: 0, total_ganho: 0, total_pago: 0, total_pendente: 0 },
    { id: 503, nome: "Fernanda Lopes", telefone: "(11) 96666-3333", email: "fernanda@monitores.com", diaria_valor: 200, tipo_contrato: "clt", disponivel: true, especialidades: ["decoracao", "pula-pula"], total_diarias_trabalhadas: 0, total_ganho: 0, total_pago: 0, total_pendente: 0 },
    { id: 504, nome: "Gustavo Silva", telefone: "(11) 95555-4444", email: "gustavo@monitores.com", diaria_valor: 150, tipo_contrato: "pj", disponivel: true, especialidades: ["algodao", "pipoca"], total_diarias_trabalhadas: 0, total_ganho: 0, total_pago: 0, total_pendente: 0 }
  ];
  Storage.save("operadores", operadores);
  console.log("✅ Operadores populados:", operadores.length);

  // 3. POPULAR EVENTOS (dinâmicos em torno da data atual)
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  const toDateStr = (d) => {
    const ano = d.getFullYear();
    const mes = `${d.getMonth() + 1}`.padStart(2, '0');
    const dia = `${d.getDate()}`.padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  };
  const addDays = (n) => {
    const d = new Date(base);
    d.setDate(d.getDate() + n);
    return d;
  };

  const eventos = [];

  // Passado recente: finalizado ontem
  eventos.push({
    id: Date.now() - 10_000,
    clienteId: clientes[0].id,
    dataInicio: toDateStr(addDays(-1)),
    horaInicio: "08:00",
    horaFim: "12:00",
    itens: [
      { id: itens[0].id, quantidade: 1 },
      { id: itens[6].id, quantidade: 1 }
    ],
    observacoes: "Festa escolar encerrada ontem",
    status: "finalizado",
    valorTotal: 520.00,
    monitorId: operadores[0].id,
    monitorPagamento: 180
  });

  // Em andamento agora (largura longa para testar buffers)
  eventos.push({
    id: Date.now() - 9_000,
    clienteId: clientes[2].id,
    dataInicio: toDateStr(base),
    horaInicio: "07:00",
    horaFim: "19:00",
    itens: [
      { id: itens[1].id, quantidade: 1 },
      { id: itens[3].id, quantidade: 1 },
      { id: itens[6].id, quantidade: 2 },
      { id: itens[9].id, quantidade: 1 }
    ],
    observacoes: "Evento de dia inteiro - teste de ocupacao",
    status: "andamento",
    valorTotal: 1450.00,
    monitorId: operadores[1].id,
    monitorPagamento: 220
  });

  // Sobreposição no dia (para conflito/ocupação)
  eventos.push({
    id: Date.now() - 8_000,
    clienteId: clientes[3].id,
    dataInicio: toDateStr(base),
    horaInicio: "12:30",
    horaFim: "16:30",
    itens: [
      { id: itens[1].id, quantidade: 1 },
      { id: itens[2].id, quantidade: 2 },
      { id: itens[7].id, quantidade: 1 }
    ],
    observacoes: "Aniversario com possivel conflito de itens",
    status: "aguardando",
    valorTotal: 980.00,
    monitorId: operadores[2].id,
    monitorPagamento: 200
  });

  // Aguardando hoje à noite
  eventos.push({
    id: Date.now() - 7_000,
    clienteId: clientes[4].id,
    dataInicio: toDateStr(base),
    horaInicio: "19:00",
    horaFim: "23:00",
    itens: [
      { id: itens[0].id, quantidade: 1 },
      { id: itens[5].id, quantidade: 2 },
      { id: itens[11].id, quantidade: 1 }
    ],
    observacoes: "Evento noturno aguardando confirmacao",
    status: "aguardando",
    valorTotal: 1240.00,
    monitorId: operadores[2].id,
    monitorPagamento: 200
  });

  // Amanhã cedo (aguardando)
  eventos.push({
    id: Date.now() - 6_000,
    clienteId: clientes[5].id,
    dataInicio: toDateStr(addDays(1)),
    horaInicio: "08:30",
    horaFim: "12:30",
    itens: [
      { id: itens[2].id, quantidade: 1 },
      { id: itens[4].id, quantidade: 1 },
      { id: itens[10].id, quantidade: 1 }
    ],
    observacoes: "Manha seguinte - teste de agenda",
    status: "aguardando",
    valorTotal: 690.00,
    monitorId: operadores[0].id,
    monitorPagamento: 180
  });

  // Depois de amanhã (aguardando) com muitos itens para stress de estoque
  eventos.push({
    id: Date.now() - 5_000,
    clienteId: clientes[6].id,
    dataInicio: toDateStr(addDays(2)),
    horaInicio: "10:00",
    horaFim: "15:00",
    itens: [
      { id: itens[0].id, quantidade: 2 },
      { id: itens[1].id, quantidade: 1 },
      { id: itens[3].id, quantidade: 2 },
      { id: itens[5].id, quantidade: 2 },
      { id: itens[6].id, quantidade: 3 }
    ],
    observacoes: "Grande evento escolar - carga alta",
    status: "aguardando",
    valorTotal: 1980.00,
    monitorId: operadores[3].id,
    monitorPagamento: 150
  });

  // Cancelado para testar exclusões
  eventos.push({
    id: Date.now() - 4_000,
    clienteId: clientes[7].id,
    dataInicio: toDateStr(addDays(3)),
    horaInicio: "09:00",
    horaFim: "11:00",
    itens: [
      { id: itens[8].id, quantidade: 1 },
      { id: itens[9].id, quantidade: 1 }
    ],
    observacoes: "Evento cancelado - manter para historico",
    status: "cancelado",
    valorTotal: 310.00,
    monitorId: operadores[2].id,
    monitorPagamento: 200
  });

  // Finalizado há 3 dias para relatório
  eventos.push({
    id: Date.now() - 3_000,
    clienteId: clientes[1].id,
    dataInicio: toDateStr(addDays(-3)),
    horaInicio: "13:00",
    horaFim: "17:00",
    itens: [
      { id: itens[2].id, quantidade: 1 },
      { id: itens[8].id, quantidade: 1 },
      { id: itens[10].id, quantidade: 1 }
    ],
    observacoes: "Passado recente para dashboards",
    status: "finalizado",
    valorTotal: 840.00,
    monitorId: operadores[0].id,
    monitorPagamento: 180
  });

  Storage.save("eventos", eventos);
  console.log("✅ Eventos populados:", eventos.length);

  // Exibir resumo
  const resumo = [
    "SISTEMA POPULADO COM SUCESSO",
    `Clientes cadastrados: ${clientes.length}`,
    `Itens cadastrados: ${itens.length}`,
    `Operadores cadastrados: ${operadores.length}`,
    `Eventos cadastrados: ${eventos.length}`,
    `Status - Finalizados: ${eventos.filter(e => e.status === 'finalizado').length}, Em Andamento: ${eventos.filter(e => e.status === 'andamento').length}, Aguardando: ${eventos.filter(e => e.status === 'aguardando').length}`,
    `Faturamento total: R$ ${eventos.reduce((sum, e) => sum + e.valorTotal, 0).toFixed(2)}`
  ].join('\n');

  console.log(resumo);
  
  UI.showAlert("Sistema populado com sucesso! Recarregando pagina...", "success");
  
  setTimeout(() => {
    location.reload();
  }, 2000);
}

// Exportar função
window.popularSistema = popularSistema;
