// Sistema de Cache para IA
// Evita recalcular análises repetidamente

class IACache {
  constructor() {
    this.cache = new Map();
    this.TTL = 5 * 60 * 1000; // 5 minutos
    this.startCleanupInterval();
  }

  /**
   * Gera chave única para cache
   * @param {string} tipo - Tipo de análise (conflitos, risco, recomendacoes)
   * @param {any} dados - Dados para gerar hash
   * @returns {string} Chave única
   */
  generateKey(tipo, dados) {
    const dataStr = JSON.stringify(dados);
    return `${tipo}_${this.simpleHash(dataStr)}`;
  }

  /**
   * Hash simples para gerar chave
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Armazena no cache
   * @param {string} tipo - Tipo de análise
   * @param {any} dados - Dados de entrada
   * @param {any} resultado - Resultado a cachear
   */
  set(tipo, dados, resultado) {
    const key = this.generateKey(tipo, dados);
    this.cache.set(key, {
      resultado,
      timestamp: Date.now(),
      hits: 0
    });
  }

  /**
   * Recupera do cache
   * @param {string} tipo - Tipo de análise
   * @param {any} dados - Dados de entrada
   * @returns {any|null} Resultado cacheado ou null
   */
  get(tipo, dados) {
    const key = this.generateKey(tipo, dados);
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    // Verificar TTL
    const idade = Date.now() - cached.timestamp;
    if (idade > this.TTL) {
      this.cache.delete(key);
      return null;
    }
    
    // Incrementar hits
    cached.hits++;
    
    return cached.resultado;
  }

  /**
   * Verifica se existe no cache e está válido
   */
  has(tipo, dados) {
    return this.get(tipo, dados) !== null;
  }

  /**
   * Limpa cache por tipo
   */
  clearByType(tipo) {
    for (const [key] of this.cache) {
      if (key.startsWith(tipo + '_')) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Limpa todo o cache
   */
  clearAll() {
    this.cache.clear();
  }

  /**
   * Remove itens expirados
   */
  cleanup() {
    const now = Date.now();
    for (const [key, value] of this.cache) {
      if (now - value.timestamp > this.TTL) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Inicia limpeza automática
   */
  startCleanupInterval() {
    setInterval(() => this.cleanup(), CONFIG.CACHE.CLEANUP_INTERVAL);
  }

  /**
   * Retorna estatísticas do cache
   */
  getStats() {
    let totalHits = 0;
    const stats = {
      tamanho: this.cache.size,
      porTipo: {}
    };

    for (const [key, value] of this.cache) {
      const tipo = key.split('_')[0];
      if (!stats.porTipo[tipo]) {
        stats.porTipo[tipo] = { count: 0, hits: 0 };
      }
      stats.porTipo[tipo].count++;
      stats.porTipo[tipo].hits += value.hits;
      totalHits += value.hits;
    }

    stats.totalHits = totalHits;
    stats.taxaAcerto = this.cache.size > 0 ? (totalHits / this.cache.size).toFixed(2) : 0;

    return stats;
  }

  /**
   * Invalida cache quando dados mudam
   */
  invalidateOnChange(tipo) {
    // Limpa cache relacionado quando dados são modificados
    this.clearByType(tipo);
    console.log(`🗑️ Cache invalidado para: ${tipo}`);
  }
}

// Instância global
const iaCache = new IACache();

// Export
window.IACache = IACache;
window.iaCache = iaCache;
