/**
 * OperadoresService - Gestão de Operadores/Monitores de Eventos
 * 
 * Funcionalidades:
 * - CRUD de operadores (criar, editar, deletar, listar)
 * - Gestão de contratos e diárias
 * - Histórico de trabalhos realizados
 * - Cálculo de pagamentos (por diária trabalhada)
 * - Relatório de inadimplência
 * 
 * @author Sistema ERP
 * @version 1.0
 */

class OperadoresService {
  constructor() {
    this.operadores = [];
    this.inicializados = false;
    this.db = null;
    
    // Escutar eventos de storage
    window.addEventListener('storageUpdate', () => this.sincronizar());
  }

  /**
   * Inicializar o módulo com dados do localStorage/IndexedDB
   */
  async inicializar() {
    try {
      if (this.inicializados) return;

      // Tentar carregar do IndexedDB
      if (window.db) {
        this.db = window.db;
        const operadoresDB = await this.db.getAll('operadores');
        if (operadoresDB && operadoresDB.length > 0) {
          this.operadores = operadoresDB;
          console.log(`✅ ${operadoresDB.length} operadores carregados do IndexedDB`);
        }
      }

      // Fallback para localStorage
      if (this.operadores.length === 0) {
        const dados = localStorage.getItem('operadores');
        if (dados) {
          this.operadores = JSON.parse(dados);
          console.log(`✅ ${this.operadores.length} operadores carregados do localStorage`);
        }
      }

      this.inicializados = true;
      this.salvarLocalmente();
      return this.operadores;

    } catch (error) {
      console.error('Erro ao inicializar operadores:', error);
      return [];
    }
  }

  /**
   * CRUD - Criar novo operador
   */
  async criar(dados) {
    try {
      // Validação
      if (!dados.nome || !dados.diaria_valor) {
        throw new Error('Nome e valor de diária são obrigatórios');
      }

      const operador = {
        id: Date.now(),
        nome: dados.nome,
        cpf: dados.cpf || '',
        telefone: dados.telefone || '',
        email: dados.email || '',
        data_cadastro: new Date().toISOString(),
        
        // Contrato
        diaria_valor: parseFloat(dados.diaria_valor),
        tipo_contrato: dados.tipo_contrato || 'pj', // 'clt' ou 'pj'
        especialidades: dados.especialidades || [], // ['pula-pula', 'castelo', 'escorregador']
        disponivel: true,
        
        // Histórico
        total_diarias_trabalhadas: 0,
        total_ganho: 0,
        total_pago: 0,
        total_pendente: 0,
        
        // Metadata
        nota_interna: dados.nota_interna || '',
        documentos: [] // URLs de documentos (CPF, RG, contrato)
      };

      this.operadores.push(operador);
      await this.salvarNoDB(operador);
      this.salvarLocalmente();

      console.log(`✅ Operador criado: ${operador.nome} (ID: ${operador.id})`);
      return operador;

    } catch (error) {
      console.error('Erro ao criar operador:', error);
      throw error;
    }
  }

  /**
   * CRUD - Atualizar operador
   */
  async atualizar(id, dados) {
    try {
      const index = this.operadores.findIndex(o => o.id === id);
      if (index === -1) throw new Error('Operador não encontrado');

      this.operadores[index] = {
        ...this.operadores[index],
        ...dados,
        id: this.operadores[index].id, // não deixar trocar ID
        data_cadastro: this.operadores[index].data_cadastro
      };

      await this.salvarNoDB(this.operadores[index]);
      this.salvarLocalmente();
      return this.operadores[index];

    } catch (error) {
      console.error('Erro ao atualizar operador:', error);
      throw error;
    }
  }

  /**
   * CRUD - Deletar operador
   */
  async deletar(id) {
    try {
      const operador = this.operadores.find(o => o.id === id);
      if (!operador) throw new Error('Operador não encontrado');

      // Verificar se tem diárias pendentes de pagamento
      if (operador.total_pendente > 0) {
        throw new Error(`Operador tem R$ ${operador.total_pendente.toFixed(2)} pendente de pagamento`);
      }

      this.operadores = this.operadores.filter(o => o.id !== id);
      
      if (this.db) {
        await this.db.delete('operadores', id);
      }
      
      this.salvarLocalmente();
      console.log(`✅ Operador ${operador.nome} removido`);
      return true;

    } catch (error) {
      console.error('Erro ao deletar operador:', error);
      throw error;
    }
  }

  /**
   * CRUD - Obter operador por ID
   */
  obter(id) {
    return this.operadores.find(o => o.id === id);
  }

  /**
   * CRUD - Listar todos os operadores
   */
  listar() {
    return this.operadores;
  }

  /**
   * Filtrar operadores por critérios
   */
  filtrar(criterios = {}) {
    return this.operadores.filter(op => {
      if (criterios.disponivel !== undefined && op.disponivel !== criterios.disponivel) {
        return false;
      }
      if (criterios.especialidade && !op.especialidades.includes(criterios.especialidade)) {
        return false;
      }
      if (criterios.tipo_contrato && op.tipo_contrato !== criterios.tipo_contrato) {
        return false;
      }
      return true;
    });
  }

  /**
   * Registrar uma diária trabalhada (chamado ao finalizar evento)
   */
  async registrarDiaria(operador_id, evento_id, dados) {
    try {
      const operador = this.obter(operador_id);
      if (!operador) throw new Error('Operador não encontrado');

      const diaria = {
        id: Date.now(),
        operador_id,
        evento_id,
        data: new Date(dados.data || Date.now()).toISOString(),
        valor_diaria: operador.diaria_valor,
        itens_supervisionados: dados.itens_supervisionados || [], // quais brinquedos supervisionou
        horas_trabalhadas: dados.horas_trabalhadas || 1,
        valor_ajuste: dados.valor_ajuste || 0, // bônus ou desconto
        status: 'pendente', // 'pendente' ou 'pago'
        data_pagamento: null,
        metodo_pagamento: null, // 'dinheiro', 'transferencia', 'cheque'
        comprovante: null, // URL de comprovante de pagamento
        observacoes: dados.observacoes || ''
      };

      // Atualizar totalizadores do operador
      operador.total_diarias_trabalhadas += 1;
      operador.total_ganho += (diaria.valor_diaria + diaria.valor_ajuste);
      operador.total_pendente += (diaria.valor_diaria + diaria.valor_ajuste);

      // Salvar diária em uma nova tabela
      if (this.db) {
        await this.db.save('diarias', diaria);
      }

      // Salvar histórico em localStorage
      const diarias = JSON.parse(localStorage.getItem('diarias_historico') || '[]');
      diarias.push(diaria);
      localStorage.setItem('diarias_historico', JSON.stringify(diarias));

      // Atualizar operador
      await this.atualizar(operador_id, {
        total_diarias_trabalhadas: operador.total_diarias_trabalhadas,
        total_ganho: operador.total_ganho,
        total_pendente: operador.total_pendente
      });

      console.log(`✅ Diária registrada para ${operador.nome}: R$ ${diaria.valor_diaria}`);
      return diaria;

    } catch (error) {
      console.error('Erro ao registrar diária:', error);
      throw error;
    }
  }

  /**
   * Obter todas as diárias de um operador
   */
  obterDiarias(operador_id) {
    const diarias = JSON.parse(localStorage.getItem('diarias_historico') || '[]');
    return diarias.filter(d => d.operador_id === operador_id);
  }

  /**
   * Obter diárias pendentes de pagamento
   */
  obterDiariasAtraso() {
    const diarias = JSON.parse(localStorage.getItem('diarias_historico') || '[]');
    return diarias.filter(d => d.status === 'pendente');
  }

  /**
   * Pagar uma diária
   */
  async pagarDiaria(diaria_id, metodo_pagamento, comprovante_url = null) {
    try {
      const diarias = JSON.parse(localStorage.getItem('diarias_historico') || '[]');
      const diaria = diarias.find(d => d.id === diaria_id);
      
      if (!diaria) throw new Error('Diária não encontrada');
      if (diaria.status === 'pago') throw new Error('Diária já foi paga');

      // Marcar como pago
      diaria.status = 'pago';
      diaria.data_pagamento = new Date().toISOString();
      diaria.metodo_pagamento = metodo_pagamento;
      if (comprovante_url) diaria.comprovante = comprovante_url;

      // Atualizar operador
      const operador = this.obter(diaria.operador_id);
      operador.total_pago += (diaria.valor_diaria + diaria.valor_ajuste);
      operador.total_pendente -= (diaria.valor_diaria + diaria.valor_ajuste);

      await this.atualizar(diaria.operador_id, {
        total_pago: operador.total_pago,
        total_pendente: operador.total_pendente
      });

      // Salvar histórico atualizado
      localStorage.setItem('diarias_historico', JSON.stringify(diarias));

      if (this.db) {
        // Se usar IndexedDB, atualizar lá também
        const diariaDB = await this.db.get('diarias', diaria_id);
        if (diariaDB) {
          await this.db.save('diarias', { ...diariaDB, ...diaria });
        }
      }

      console.log(`✅ Diária paga: R$ ${diaria.valor_diaria}`);
      return diaria;

    } catch (error) {
      console.error('Erro ao pagar diária:', error);
      throw error;
    }
  }

  /**
   * Pagar múltiplas diárias de uma vez
   */
  async pagarEmLote(operador_id, metodo_pagamento) {
    try {
      const operador = this.obter(operador_id);
      if (!operador) throw new Error('Operador não encontrado');

      const diarias = this.obterDiarias(operador_id).filter(d => d.status === 'pendente');
      
      if (diarias.length === 0) {
        console.log('Nenhuma diária pendente para este operador');
        return { sucesso: 0, falhadas: 0 };
      }

      let sucesso = 0, falhadas = 0;

      for (const diaria of diarias) {
        try {
          await this.pagarDiaria(diaria.id, metodo_pagamento);
          sucesso++;
        } catch (err) {
          console.error(`Erro ao pagar diária ${diaria.id}:`, err);
          falhadas++;
        }
      }

      console.log(`✅ Pagamento em lote: ${sucesso} sucesso, ${falhadas} falhas`);
      return { sucesso, falhadas, total_pago: operador.total_pago };

    } catch (error) {
      console.error('Erro ao fazer pagamento em lote:', error);
      throw error;
    }
  }

  /**
   * Gerar relatório de operadores
   */
  gerarRelatorio(filtros = {}) {
    const operadores = this.filtrar(filtros);
    
    return {
      total_operadores: operadores.length,
      total_pendente_geral: operadores.reduce((sum, op) => sum + op.total_pendente, 0),
      total_pago_geral: operadores.reduce((sum, op) => sum + op.total_pago, 0),
      detalhes: operadores.map(op => ({
        id: op.id,
        nome: op.nome,
        diaria_valor: op.diaria_valor,
        total_diarias: op.total_diarias_trabalhadas,
        total_ganho: op.total_ganho,
        total_pago: op.total_pago,
        total_pendente: op.total_pendente,
        percentual_pago: ((op.total_pago / (op.total_ganho || 1)) * 100).toFixed(1),
        especialidades: op.especialidades.join(', '),
        tipo_contrato: op.tipo_contrato
      })),
      diariasPendentes: this.obterDiariasAtraso().map(d => ({
        operador: this.obter(d.operador_id)?.nome,
        valor: d.valor_diaria,
        data: d.data,
        evento_id: d.evento_id
      }))
    };
  }

  /**
   * Exportar dados para Excel/CSV
   */
  exportarCSV() {
    const relatorio = this.gerarRelatorio();
    
    let csv = 'Nome,Diária,Total Diárias,Total Ganho,Total Pago,Total Pendente,% Pago,Especialidades,Contrato\n';
    
    relatorio.detalhes.forEach(op => {
      csv += `"${op.nome}",${op.diaria_valor},${op.total_diarias},"R$ ${op.total_ganho.toFixed(2)}","R$ ${op.total_pago.toFixed(2)}","R$ ${op.total_pendente.toFixed(2)}",${op.percentual_pago}%,"${op.especialidades}",${op.tipo_contrato}\n`;
    });

    return csv;
  }

  /**
   * Salvar operador no IndexedDB
   */
  async salvarNoDB(operador) {
    if (!this.db) return;
    try {
      await this.db.save('operadores', operador);
    } catch (error) {
      console.error('Erro ao salvar no IndexedDB:', error);
    }
  }

  /**
   * Salvar no localStorage (backup)
   */
  salvarLocalmente() {
    try {
      localStorage.setItem('operadores', JSON.stringify(this.operadores));
    } catch (error) {
      console.error('Erro ao salvar em localStorage:', error);
    }
  }

  /**
   * Sincronizar dados (quando outro abrir modificou)
   */
  async sincronizar() {
    const dados = localStorage.getItem('operadores');
    if (dados) {
      try {
        this.operadores = JSON.parse(dados);
        console.log('✅ Operadores sincronizados');
      } catch (error) {
        console.error('Erro ao sincronizar:', error);
      }
    }
  }
}

// Criar instância global
const operadoresService = new OperadoresService();

// Auto-inicializar quando página carregar
document.addEventListener('DOMContentLoaded', async () => {
  setTimeout(() => {
    operadoresService.inicializar();
  }, 500);
});

// Expor globalmente
window.operadoresService = operadoresService;
