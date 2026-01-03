# Guia: Implementando Banco de Dados no Sistema ERP

## Opções Disponíveis

### 📊 Comparação Rápida

| Opção | Complexidade | Setup | Performance | Escalabilidade | Custo | Tempo |
|-------|--------------|-------|-------------|-----------------|-------|-------|
| **IndexedDB** | ⭐ Baixa | 10min | ⭐⭐⭐ Ótima | até 50MB | Grátis | 1-2h |
| **SQLite + Tauri** | ⭐⭐ Média | 30min | ⭐⭐⭐ Ótima | até 1GB | Grátis | 3-4h |
| **Backend Node.js + DB** | ⭐⭐⭐ Alta | 2-4h | ⭐⭐⭐ Ótima | Ilimitada | $0-20/mês | 2-3 dias |

---

## Opção 1: IndexedDB (Recomendado para MVP) ⭐

### O que é?
- Banco de dados **no browser** (como localStorage turbinado)
- Até **50MB de dados** (vs 5-10MB do localStorage)
- Transações ACID
- Índices para buscas rápidas

### Pros ✅
- Zero infraestrutura
- Sem latência de rede
- Dados persistem offline
- API simples
- Implementação em 1-2 horas

### Contras ❌
- Apenas no browser (sem sincronização entre devices)
- Limite de 50MB
- Precisa de sincronização manual se tiver backend depois

### Quando usar?
- MVP/Prototipagem
- Dados do usuário individual
- Sem múltiplos usuários simultâneos

---

## Opção 2: SQLite + Tauri (Desktop) ⭐⭐

### O que é?
- **Electron/Tauri** com SQLite nativo
- Aplicação desktop distribuível
- Banco de dados real com SQL completo

### Pros ✅
- Banda ilimitada
- Busca SQL completa
- Relatórios avançados
- Aplicação desktop profissional

### Contras ❌
- Requer refatoração para Tauri/Electron
- Maior tamanho da aplicação (50-100MB)
- Não funciona no browser puro

### Quando usar?
- Aplicação desktop corporativa
- Dados sensíveis (sem enviar para servidor)
- Acesso offline completo

---

## Opção 3: Backend Node.js + PostgreSQL/MySQL (Escalável) ⭐⭐⭐

### O que é?
- API REST com backend
- Banco de dados na nuvem
- Múltiplos usuários
- Sincronização em tempo real

### Pros ✅
- Escalável para milhões de registros
- Múltiplos usuários simultâneos
- Relatórios e analytics
- Segurança de dados
- Sincronização automática

### Contras ❌
- Setup mais complexo
- Custo de servidor ($5-50/mês)
- Latência de rede
- Mais código para manter

### Quando usar?
- Produção com múltiplos usuários
- Dados compartilhados entre usuários
- SaaS/Aplicação escalável

---

# 🚀 Implementação Prática: IndexedDB

## Passo 1: Criar Wrapper para IndexedDB

```javascript
// assets/js/db.js
class SimpleDB {
  constructor(dbName = 'ERP_DB', version = 1) {
    this.dbName = dbName;
    this.version = version;
    this.db = null;
    this.stores = ['clientes', 'itens', 'eventos', 'orcamentos', 'transacoes'];
  }

  // Inicializar banco
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ IndexedDB inicializado');
        resolve(this.db);
      };

      // Criar stores na primeira execução
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        this.stores.forEach(store => {
          if (!db.objectStoreNames.contains(store)) {
            const objectStore = db.createObjectStore(store, { keyPath: 'id', autoIncrement: true });
            // Criar índices para busca rápida
            objectStore.createIndex('data', 'dataInicio', { unique: false });
            objectStore.createIndex('cliente', 'clienteId', { unique: false });
            objectStore.createIndex('status', 'status', { unique: false });
            console.log(`📦 Store criado: ${store}`);
          }
        });
      };
    });
  }

  // Salvar documento
  async save(storeName, data) {
    const tx = this.db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      const request = data.id 
        ? store.put(data)  // Atualizar
        : store.add(data); // Inserir

      request.onsuccess = () => {
        console.log(`✅ Salvo em ${storeName}:`, data.id);
        resolve(data);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Buscar todos
  async getAll(storeName) {
    const tx = this.db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Buscar por ID
  async get(storeName, id) {
    const tx = this.db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Buscar por índice
  async getByIndex(storeName, indexName, value) {
    const tx = this.db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const index = store.index(indexName);

    return new Promise((resolve, reject) => {
      const request = index.getAll(value);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Deletar
  async delete(storeName, id) {
    const tx = this.db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Sincronizar com localStorage (backup)
  async exportToStorage() {
    for (const store of this.stores) {
      const data = await this.getAll(store);
      localStorage.setItem(store, JSON.stringify(data));
    }
    console.log('✅ Dados exportados para localStorage');
  }

  // Restaurar do localStorage
  async importFromStorage() {
    for (const store of this.stores) {
      const data = JSON.parse(localStorage.getItem(store)) || [];
      for (const item of data) {
        await this.save(store, item);
      }
    }
    console.log('✅ Dados importados do localStorage');
  }
}

// Inicializar globalmente
const simpleDB = new SimpleDB();
```

---

## Passo 2: Atualizar Storage.js para usar IndexedDB

```javascript
// Modificar assets/js/utils.js (seção Storage)

const Storage = {
  // Usar IndexedDB se disponível, senão localStorage
  save: async (key, data) => {
    // Salvar em IndexedDB
    if (simpleDB && simpleDB.db) {
      try {
        await simpleDB.save(key, data);
      } catch (error) {
        console.warn('Erro IndexedDB, usando localStorage:', error);
        localStorage.setItem(key, JSON.stringify(data));
      }
    } else {
      localStorage.setItem(key, JSON.stringify(data));
    }

    // Disparar evento de atualização
    window.dispatchEvent(new CustomEvent('storageUpdate', { 
      detail: { key, data } 
    }));
  },

  get: async (key) => {
    // Tentar IndexedDB primeiro
    if (simpleDB && simpleDB.db) {
      try {
        const data = await simpleDB.getAll(key);
        return data || null;
      } catch (error) {
        console.warn('Erro IndexedDB, usando localStorage:', error);
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
      }
    }

    // Fallback para localStorage
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  },

  remove: async (key) => {
    if (simpleDB && simpleDB.db) {
      try {
        // Limpar tudo no store
        const tx = simpleDB.db.transaction(key, 'readwrite');
        const store = tx.objectStore(key);
        store.clear();
      } catch (error) {
        localStorage.removeItem(key);
      }
    } else {
      localStorage.removeItem(key);
    }
  },

  clear: async () => {
    if (simpleDB && simpleDB.db) {
      for (const store of simpleDB.stores) {
        const tx = simpleDB.db.transaction(store, 'readwrite');
        tx.objectStore(store).clear();
      }
    }
    localStorage.clear();
  },

  // Novo: Buscar eventos por data
  getEventsByDate: async (dateString) => {
    if (simpleDB && simpleDB.db) {
      return await simpleDB.getByIndex('eventos', 'data', dateString);
    }
    const eventos = JSON.parse(localStorage.getItem('eventos')) || [];
    return eventos.filter(e => e.dataInicio === dateString);
  }
};
```

---

## Passo 3: Inicializar no App Startup

No `index.html`, adicione **antes** de `app.js`:

```html
<!-- IndexedDB -->
<script src="assets/js/db.js"></script>

<!-- Inicializar DB antes de tudo -->
<script>
  // Inicializar IndexedDB e restaurar dados
  (async () => {
    try {
      await simpleDB.init();
      console.log('✅ Sistema pronto com IndexedDB');
    } catch (error) {
      console.warn('⚠️ IndexedDB não disponível, usando localStorage:', error);
    }
  })();
</script>

<!-- Resto dos scripts... -->
<script src="assets/js/config.js"></script>
<script src="assets/js/utils.js"></script>
<!-- ... -->
```

---

## Passo 4: Adicionar Migrations (Evolução do Schema)

```javascript
// assets/js/db-migrations.js
class DBMigrations {
  static async run() {
    const version = localStorage.getItem('db_version') || '0';
    
    if (version < '1') {
      console.log('Executando migration v1...');
      // Adicionar índice de status
      // Adicionar campo de timestamps
      localStorage.setItem('db_version', '1');
    }

    if (version < '2') {
      console.log('Executando migration v2...');
      // Adicionar tabela de auditoria
      localStorage.setItem('db_version', '2');
    }
  }
}

// Chamar no app.js
await DBMigrations.run();
```

---

## Passo 5: Adicionar Backup & Restore

```javascript
// Backup manual
async function backupDatabase() {
  const backup = {};
  for (const store of simpleDB.stores) {
    backup[store] = await simpleDB.getAll(store);
  }
  
  // Download JSON
  const dataStr = JSON.stringify(backup, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `backup-${new Date().toISOString()}.json`;
  link.click();
  
  console.log('✅ Backup realizado');
}

// Restaurar do backup
async function restoreFromBackup(jsonFile) {
  const text = await jsonFile.text();
  const backup = JSON.parse(text);
  
  for (const [storeName, items] of Object.entries(backup)) {
    for (const item of items) {
      await simpleDB.save(storeName, item);
    }
  }
  
  console.log('✅ Backup restaurado');
}
```

---

## Comparação: localStorage vs IndexedDB

```javascript
// localStorage (atual) - Simple mas limitado
localStorage.setItem('eventos', JSON.stringify(arrayGrande)); // ⚠️ ~5MB max

// IndexedDB (novo) - Poderoso e eficiente
await simpleDB.save('eventos', objetoGrande); // ✅ ~50MB max
await simpleDB.getByIndex('eventos', 'data', '2025-01-03'); // ✅ Rápido!
```

---

## Próximos Passos

### ✅ Agora (IndexedDB)
1. Implementar `db.js`
2. Atualizar `Storage` em `utils.js`
3. Testar com dados grandes
4. Adicionar backup/restore

### 🔄 Depois (se crescer)
1. Migrar para Tauri (desktop app)
2. Implementar sincronização com servidor
3. Adicionar relatórios SQL complexos

### 🚀 Futuro (escala empresarial)
1. Backend Node.js + Express
2. PostgreSQL/MySQL
3. API REST com autenticação
4. Múltiplos usuários
5. Analytics e reporting

---

## Testes Rápidos no Console

```javascript
// Testar IndexedDB
await simpleDB.init();
await simpleDB.save('eventos', { id: 1, nome: 'Teste', dataInicio: '2025-01-03' });
const todos = await simpleDB.getAll('eventos');
const porData = await simpleDB.getByIndex('eventos', 'data', '2025-01-03');
console.log(todos);
console.log(porData);
```

---

## Custo-Benefício

| Métrica | localStorage | IndexedDB | Backend |
|---------|--------------|-----------|---------|
| Setup | 0 min | 30 min | 4-8h |
| Capacidade | 5MB | 50MB | Ilimitado |
| Performance | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Buscas | Linear | Índices | SQL |
| Custo | Grátis | Grátis | $5-50/mês |

