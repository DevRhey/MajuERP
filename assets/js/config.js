// Constantes do Sistema
// Centraliza magic numbers e configurações

const CONFIG = {
  // ===== PERFORMANCE =====
  CACHE: {
    TTL: 5 * 60 * 1000, // 5 minutos
    CLEANUP_INTERVAL: 60 * 1000, // 1 minuto
  },

  // ===== UI/UX =====
  NOTIFICATIONS: {
    DURATION_SUCCESS: 4000,
    DURATION_ERROR: 5000,
    DURATION_WARNING: 5000,
    DURATION_INFO: 4000,
  },

  ANIMATIONS: {
    FADE_DURATION: 300,
    TOAST_DELAY: 100,
  },

  // ===== EVENTOS =====
  EVENTOS: {
    STATUS_UPDATE_INTERVAL: 10000, // 10 segundos
    BUFFER_MONTAGEM: 40, // minutos antes do evento
    BUFFER_DESMONTAGEM: 40, // minutos após o evento
  },

  // ===== IA =====
  IA: {
    // Thresholds de risco
    RISCO_INADIMPLENCIA_ALTO: 0.7, // 70%
    RISCO_INADIMPLENCIA_MEDIO: 0.4, // 40%
    
    // Disponibilidade
    DISPONIBILIDADE_CRITICA: 0.8, // 80% em uso
    DISPONIBILIDADE_ALERTA: 0.6, // 60% em uso
    
    // Conflitos
    MIN_SEPARACAO_EVENTOS: 30, // minutos mínimos entre eventos
    
    // Recomendações
    MAX_RECOMENDACOES: 5,
    MIN_CONFIANCA_RECOMENDACAO: 0.5, // 50%
    
    // Análise
    DIAS_HISTORICO: 90, // dias a considerar no histórico
    DIAS_SUGESTAO_ALTERNATIVA: 30, // dias à frente para sugerir
  },

  // ===== VALIDAÇÃO =====
  VALIDATION: {
    CPF_LENGTH: 11,
    TELEFONE_MIN: 10,
    TELEFONE_MAX: 11,
    SENHA_MIN_LENGTH: 6,
  },

  // ===== FINANCEIRO =====
  FINANCEIRO: {
    VALOR_MINIMO_ENTRADA: 0,
    PERCENTUAL_ENTRADA_RECOMENDADO: 0.3, // 30%
    DIAS_VENCIMENTO_PADRAO: 7,
  },

  // ===== STORAGE =====
  STORAGE: {
    KEYS: {
      EVENTOS: 'eventos',
      CLIENTES: 'clientes',
      ITENS: 'itens',
      ORCAMENTOS: 'orcamentos',
      TRANSACOES: 'financeiroTransacoes',
      FORMAS_PAGAMENTO: 'formasPagamento',
    },
  },

  // ===== DASHBOARD =====
  DASHBOARD: {
    AUTO_REFRESH_INTERVAL: 30000, // 30 segundos
    MAX_EVENTOS_TIMELINE: 50,
  },

  // ===== REGEX PATTERNS =====
  PATTERNS: {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    TELEFONE: /^\(\d{2}\)\s?\d{4,5}-?\d{4}$/,
    CPF: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
    HORA: /^([01]\d|2[0-3]):([0-5]\d)$/,
    DATA: /^\d{4}-\d{2}-\d{2}$/,
  },

  // ===== STATUS =====
  STATUS: {
    EVENTO: {
      AGUARDANDO: 'aguardando',
      ANDAMENTO: 'andamento',
      FINALIZADO: 'finalizado',
      CANCELADO: 'cancelado',
    },
    PAGAMENTO: {
      PAGO: 'pago',
      PENDENTE: 'pendente',
      ATRASADO: 'atrasado',
    },
  },

  // ===== CORES =====
  COLORS: {
    SUCCESS: '#198754',
    ERROR: '#dc3545',
    WARNING: '#ffc107',
    INFO: '#0dcaf0',
    PRIMARY: '#0d6efd',
  },

  // ===== LIMITES =====
  LIMITS: {
    MAX_ITEMS_PER_EVENT: 20,
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    MAX_UPLOAD_FILES: 5,
  },

  // ===== DEBUG =====
  DEBUG: {
    ENABLED: false, // mudar para true em desenvolvimento
    LOG_IA: true,
    LOG_CACHE: false,
    LOG_PERFORMANCE: false,
  },

  // ===== ASSISTENTE / ORQUESTRADOR =====
  ASSISTENTE: {
    CHECK_INTERVAL: 60 * 1000, // 1 minuto
    HORAS_LIMIAR_MONTAGEM: 24,
    HORAS_LIMIAR_RETIRADA: 2,
    HORAS_LIMIAR_COBRANCA: 24,
    LIMIAR_OCUPACAO_ALERTA: 0.8,
    LIMITE_REPETICAO_ITEM: 3,
    WHATSAPP: {
      ENABLED: false,
      WEBHOOK_URL: null, // informe aqui seu endpoint do provedor
      TOKEN: null,
    },
  },
};

/**
 * Helper para acessar configurações aninhadas
 */
const getConfig = (path, defaultValue = null) => {
  const keys = path.split('.');
  let value = CONFIG;
  
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return defaultValue;
    }
  }
  
  return value;
};

/**
 * Helper para logging condicional
 */
const debugLog = (category, ...args) => {
  if (CONFIG.DEBUG.ENABLED) {
    const prefix = `[${category.toUpperCase()}]`;
    console.log(prefix, ...args);
  }
};

// Export
window.CONFIG = CONFIG;
window.getConfig = getConfig;
window.debugLog = debugLog;
