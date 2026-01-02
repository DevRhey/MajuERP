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

  // 3. POPULAR EVENTOS
  const hoje = new Date(2025, 11, 25); // 25 de dezembro de 2025
  const eventos = [];

  // Eventos finalizados (passados)
  eventos.push({
    id: 1735100000000,
    clienteId: clientes[0].id,
    dataInicio: "2025-12-20",
    horaInicio: "14:00",
    horaFim: "18:00",
    itens: [
      { id: itens[0].id, quantidade: 1 }, // Pula-Pula
      { id: itens[2].id, quantidade: 1 }, // Cama Elástica
      { id: itens[6].id, quantidade: 2 }  // Recreação
    ],
    observacoes: "Festa de aniversário de 6 anos - Tema Princesas",
    status: "finalizado",
    valorTotal: 770.00
  });

  eventos.push({
    id: 1735100001000,
    clienteId: clientes[1].id,
    dataInicio: "2025-12-22",
    horaInicio: "10:00",
    horaFim: "14:00",
    itens: [
      { id: itens[1].id, quantidade: 1 }, // Tobogã
      { id: itens[3].id, quantidade: 2 }, // Piscina de Bolinhas
      { id: itens[8].id, quantidade: 1 }  // Máquina de Algodão Doce
    ],
    observacoes: "Evento corporativo - Dia das Crianças dos funcionários",
    status: "finalizado",
    valorTotal: 530.00
  });

  // Eventos em andamento (hoje)
  eventos.push({
    id: 1735150000000,
    clienteId: clientes[2].id,
    dataInicio: "2025-12-25",
    horaInicio: "09:00",
    horaFim: "13:00",
    itens: [
      { id: itens[0].id, quantidade: 1 }, // Pula-Pula
      { id: itens[4].id, quantidade: 2 }, // Mesa de Pebolim
      { id: itens[6].id, quantidade: 1 }, // Recreação
      { id: itens[10].id, quantidade: 1 } // Pintura Facial
    ],
    observacoes: "Festa de Natal da família - 30 crianças",
    status: "andamento",
    valorTotal: 660.00
  });

  eventos.push({
    id: 1735150001000,
    clienteId: clientes[3].id,
    dataInicio: "2025-12-25",
    horaInicio: "15:00",
    horaFim: "19:00",
    itens: [
      { id: itens[1].id, quantidade: 1 }, // Tobogã
      { id: itens[2].id, quantidade: 2 }, // Cama Elástica
      { id: itens[7].id, quantidade: 1 }, // Decoração Frozen
      { id: itens[9].id, quantidade: 1 }  // Pipoca
    ],
    observacoes: "Aniversário de 8 anos - Tema Frozen",
    status: "aguardando",
    valorTotal: 1020.00
  });

  // Eventos aguardando (futuros)
  eventos.push({
    id: 1735236000000,
    clienteId: clientes[4].id,
    dataInicio: "2025-12-26",
    horaInicio: "10:00",
    horaFim: "14:00",
    itens: [
      { id: itens[0].id, quantidade: 2 }, // Pula-Pula
      { id: itens[3].id, quantidade: 1 }, // Piscina de Bolinhas
      { id: itens[5].id, quantidade: 3 }, // Carrinho Elétrico
      { id: itens[11].id, quantidade: 1 } // Show de Mágica
    ],
    observacoes: "Festa de confraternização da escola",
    status: "aguardando",
    valorTotal: 1170.00
  });

  eventos.push({
    id: 1735322400000,
    clienteId: clientes[5].id,
    dataInicio: "2025-12-27",
    horaInicio: "14:00",
    horaFim: "18:00",
    itens: [
      { id: itens[2].id, quantidade: 1 }, // Cama Elástica
      { id: itens[4].id, quantidade: 1 }, // Mesa de Pebolim
      { id: itens[6].id, quantidade: 2 }, // Recreação
      { id: itens[8].id, quantidade: 1 }  // Algodão Doce
    ],
    observacoes: "Aniversário de 10 anos - Tema Esportes",
    status: "aguardando",
    valorTotal: 830.00
  });

  eventos.push({
    id: 1735408800000,
    clienteId: clientes[6].id,
    dataInicio: "2025-12-28",
    horaInicio: "16:00",
    horaFim: "20:00",
    itens: [
      { id: itens[0].id, quantidade: 1 }, // Pula-Pula
      { id: itens[1].id, quantidade: 1 }, // Tobogã
      { id: itens[7].id, quantidade: 1 }, // Decoração
      { id: itens[9].id, quantidade: 1 }, // Pipoca
      { id: itens[10].id, quantidade: 1 } // Pintura Facial
    ],
    observacoes: "Festa de aniversário de 7 anos - Tema Super-Heróis",
    status: "aguardando",
    valorTotal: 1130.00
  });

  eventos.push({
    id: 1735495200000,
    clienteId: clientes[7].id,
    dataInicio: "2025-12-29",
    horaInicio: "10:00",
    horaFim: "15:00",
    itens: [
      { id: itens[2].id, quantidade: 2 }, // Cama Elástica
      { id: itens[3].id, quantidade: 2 }, // Piscina de Bolinhas
      { id: itens[5].id, quantidade: 2 }, // Carrinho Elétrico
      { id: itens[6].id, quantidade: 3 }  // Recreação
    ],
    observacoes: "Evento corporativo de fim de ano - 50 crianças",
    status: "aguardando",
    valorTotal: 1330.00
  });

  // Mais eventos para janeiro de 2026
  eventos.push({
    id: 1735668000000,
    clienteId: clientes[0].id,
    dataInicio: "2025-12-31",
    horaInicio: "18:00",
    horaFim: "22:00",
    itens: [
      { id: itens[0].id, quantidade: 1 }, // Pula-Pula
      { id: itens[4].id, quantidade: 2 }, // Mesa de Pebolim
      { id: itens[8].id, quantidade: 2 }, // Algodão Doce
      { id: itens[9].id, quantidade: 2 }, // Pipoca
      { id: itens[11].id, quantidade: 1 } // Show de Mágica
    ],
    observacoes: "Festa de Réveillon para crianças",
    status: "aguardando",
    valorTotal: 1270.00
  });

  eventos.push({
    id: 1736100000000,
    clienteId: clientes[1].id,
    dataInicio: "2026-01-05",
    horaInicio: "14:00",
    horaFim: "18:00",
    itens: [
      { id: itens[1].id, quantidade: 1 }, // Tobogã
      { id: itens[2].id, quantidade: 1 }, // Cama Elástica
      { id: itens[6].id, quantidade: 1 }, // Recreação
      { id: itens[10].id, quantidade: 1 } // Pintura Facial
    ],
    observacoes: "Aniversário de 5 anos - Tema Patrulha Canina",
    status: "aguardando",
    valorTotal: 770.00
  });

  Storage.save("eventos", eventos);
  console.log("✅ Eventos populados:", eventos.length);

  // Exibir resumo
  const resumo = `
╔════════════════════════════════════════════════════╗
║     SISTEMA POPULADO COM SUCESSO! 🎉              ║
╠════════════════════════════════════════════════════╣
║  👥 Clientes cadastrados: ${clientes.length.toString().padStart(2, ' ')}                      ║
║  🎪 Itens cadastrados: ${itens.length.toString().padStart(2, ' ')}                         ║
║  📅 Eventos cadastrados: ${eventos.length.toString().padStart(2, ' ')}                      ║
╠════════════════════════════════════════════════════╣
║  📊 STATUS DOS EVENTOS:                            ║
║     • Finalizados: ${eventos.filter(e => e.status === 'finalizado').length}                              ║
║     • Em Andamento: ${eventos.filter(e => e.status === 'andamento').length}                            ║
║     • Aguardando: ${eventos.filter(e => e.status === 'aguardando').length}                             ║
╠════════════════════════════════════════════════════╣
║  💰 FATURAMENTO TOTAL: R$ ${eventos.reduce((sum, e) => sum + e.valorTotal, 0).toFixed(2).padStart(8, ' ')}       ║
╚════════════════════════════════════════════════════╝

✅ Dados de teste carregados com sucesso!
🔍 Navegue pelas páginas para testar todas as funcionalidades:
   - Dashboard: Veja estatísticas e gráficos
   - Clientes: Gerencie os clientes cadastrados
   - Itens: Visualize o estoque disponível
   - Eventos: Acompanhe todos os eventos
   - Calendário: Veja os eventos no calendário
  `;

  console.log(resumo);
  
  UI.showAlert("Sistema populado com sucesso! Recarregando página...", "success");
  
  setTimeout(() => {
    location.reload();
  }, 2000);
}

// Exportar função
window.popularSistema = popularSistema;
