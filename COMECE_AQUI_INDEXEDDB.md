# Como Usar o IndexedDB - Guia Rápido

## O que foi implementado?

✅ **IndexedDB** - Banco de dados local no browser (50MB de capacidade)
✅ **Wrapper simples** - API fácil de usar (`db.js`)
✅ **Admin panel** - Ferramentas para gerenciar o banco (`db-admin.js`)
✅ **Exemplos** - 50+ exemplos de uso (`EXEMPLOS_INDEXEDDB.md`)

---

## Quick Start (5 minutos)

### 1. Abra o Sistema
- Abra `index.html` no navegador
- Abra o **Console** (F12 → Console)

### 2. Veja as Estatísticas
```javascript
// No console, digite:
admin
```

Isso mostra um painel com:
- Total de documentos em cada tabela
- Comandos disponíveis
- Status do banco

### 3. Teste Básico
```javascript
// Adicionar um evento
await simpleDB.save('eventos', {
  nome: 'Teste',
  clienteId: 1,
  dataInicio: '2025-01-20',
  status: 'aguardando'
});

// Ver tudo
const todos = await simpleDB.getAll('eventos');
console.log(todos);
```

---

## Comandos do Admin Panel

### Fazer Backup
```javascript
DatabaseAdmin.backup()
// ↓ Salva arquivo "backup-erp-2025-01-03.json"
```

### Restaurar de Backup
```javascript
// 1. Selecione um arquivo
// 2. No console:
DatabaseAdmin.restore(fileInput.files[0])
```

### Ver Dados de uma Tabela
```javascript
DatabaseAdmin.view('eventos')
DatabaseAdmin.view('clientes')
DatabaseAdmin.view('itens')
```

### Buscar um Documento
```javascript
DatabaseAdmin.find('eventos', 1)  // ID 1
```

### Filtrar com Critério
```javascript
DatabaseAdmin.query('eventos', e => e.status === 'aguardando')
DatabaseAdmin.query('eventos', e => e.valorTotal > 1000)
```

### Exportar para CSV
```javascript
DatabaseAdmin.export('eventos')  // Exporta um store
DatabaseAdmin.export()            // Exporta tudo
```

### Monitorar Alterações
```javascript
DatabaseAdmin.monitor()           // Todas as alterações
DatabaseAdmin.monitor('eventos')  // Apenas eventos
// Aparece um log cada vez que algo muda
```

### Testar Performance
```javascript
DatabaseAdmin.performance()
// Testa leitura/escrita/busca
```

### Reparar Inconsistências
```javascript
DatabaseAdmin.repair()
// Encontra e corrige problemas (eventos órfãos, etc)
```

### Sincronizar com localStorage
```javascript
DatabaseAdmin.sync()
// Backup em localStorage (em caso de problema com IndexedDB)
```

### Limpar um Store
```javascript
DatabaseAdmin.clear('eventos')
// ⚠️ Pede confirmação antes de deletar
```

---

## Diferenças: localStorage vs IndexedDB

| Aspecto | localStorage | IndexedDB |
|---------|--------------|-----------|
| **Capacidade** | 5-10 MB | 50+ MB |
| **API** | Simples (chave-valor) | Poderosa (banco relacional) |
| **Índices** | ❌ | ✅ Busca rápida |
| **Transações** | ❌ | ✅ ACID |
| **Performance** | Boa para poucos dados | Ótima para muitos dados |

### Exemplo de Diferença

**localStorage:**
```javascript
// Lento com dados grandes
const eventos = JSON.parse(localStorage.getItem('eventos'));
const filtrados = eventos.filter(e => e.clienteId === 1);  // ❌ Varre tudo
```

**IndexedDB:**
```javascript
// Rápido com índices
const filtrados = await simpleDB.getByIndex('eventos', 'clienteId', 1);  // ✅ Direto
```

---

## Migrations (Evoluir o Schema)

Se precisar adicionar novos campos ou tabelas:

```javascript
// Em db.js, aumentar version
const db = new SimpleDB('ERP_DB', 2);  // Era 1, agora 2

// IndexedDB automaticamente roda onupgradeneeded
```

---

## Casos de Uso Comuns

### Caso 1: Adicionar Evento
```javascript
await simpleDB.save('eventos', {
  nome: 'Festa de 5 anos',
  clienteId: 3,
  dataInicio: '2025-02-15',
  horaInicio: '14:00',
  horaFim: '18:00',
  status: 'aguardando',
  valorTotal: 800
});
```

### Caso 2: Buscar Eventos de um Cliente
```javascript
const eventos = await simpleDB.getByIndex('eventos', 'clienteId', 3);
console.log(`Cliente 3 tem ${eventos.length} eventos`);
```

### Caso 3: Atualizar um Evento
```javascript
const evento = await simpleDB.get('eventos', 5);
evento.status = 'andamento';
evento.observacoes = 'Em preparação';
await simpleDB.save('eventos', evento);
```

### Caso 4: Dashboard - Estatísticas
```javascript
async function relatorio() {
  const eventos = await simpleDB.getAll('eventos');
  const aguardando = eventos.filter(e => e.status === 'aguardando').length;
  const andamento = eventos.filter(e => e.status === 'andamento').length;
  const finalizado = eventos.filter(e => e.status === 'finalizado').length;
  
  console.log(`Aguardando: ${aguardando}`);
  console.log(`Em andamento: ${andamento}`);
  console.log(`Finalizados: ${finalizado}`);
}
relatorio();
```

### Caso 5: Filtro Avançado
```javascript
// Eventos caros acima de R$ 1000
const caros = await simpleDB.query('eventos', e => e.valorTotal > 1000);

// Eventos em janeiro
const janeiro = await simpleDB.getRange('eventos', 'dataInicio', '2025-01-01', '2025-01-31');

// Eventos de um cliente que estão em andamento
const emAndamento = await simpleDB.query('eventos', e => 
  e.clienteId === 3 && e.status === 'andamento'
);
```

---

## Troubleshooting

### Problema: "DB não está inicializado"
```javascript
// Espere a inicialização
await simpleDB.init();
// Ou já carregou automaticamente no HTML?
```

### Problema: Dados não aparecem
```javascript
// 1. Verificar se estão no IndexedDB
const stats = await simpleDB.getStats();
console.log(stats);

// 2. Se vazio, restaurar do localStorage
await simpleDB.syncFromLocalStorage();

// 3. Ver dados
DatabaseAdmin.view('eventos');
```

### Problema: Querô voltar para localStorage
```javascript
// Comentar a linha de script em index.html
// <script src="assets/js/db.js"></script>
```

---

## Próximas Melhorias

### 🔄 Sincronização com Backend
Se implementar um backend:
```javascript
// Sincronizar IndexedDB ↔ Servidor
await simpleDB.sync('http://api.example.com/sync');
```

### 📊 Relatórios SQL
Se migrar para SQL (Tauri/Backend):
```javascript
// Query SQL poderosa
SELECT * FROM eventos 
WHERE dataInicio BETWEEN '2025-01-01' AND '2025-01-31' 
AND status = 'finalizado'
ORDER BY valorTotal DESC
```

### 📱 Múltiplos Usuários
Sem backend agora, cada browser tem seu próprio banco.
Com backend + autenticação:
```javascript
// Dados compartilhados entre usuários
await api.saveEvento(evento);
```

---

## Checklists

### ✅ Setup Completado
- [x] IndexedDB implementado
- [x] Wrapper criado (db.js)
- [x] Admin panel (db-admin.js)
- [x] Exemplos documentados
- [x] Carregado em index.html

### ✅ Próximos Passos
- [ ] Testar com dados reais
- [ ] Criar backups regulares
- [ ] Monitorar performance
- [ ] Documentar queries customizadas
- [ ] Treinar equipe nos comandos

### 📈 Futuro
- [ ] Migrar para Backend + PostgreSQL
- [ ] Implementar sincronização em tempo real
- [ ] API REST para múltiplos usuários
- [ ] TypeScript para type-safety
- [ ] Testes automatizados

---

## Dúvidas Frequentes

**P: Perco dados se fechar o navegador?**
R: Não! IndexedDB persiste dados no disco. localStorage também.

**P: Posso usar em múltiplos abas?**
R: Sim! Cada aba vê os mesmos dados (compartilhado).

**P: E em outro computador?**
R: Não automaticamente. Use backup/restore ou implemente backend.

**P: Quanto dados posso armazenar?**
R: ~50MB por browser. localStorage é ~5-10MB.

**P: É seguro guardar dados sensíveis?**
R: Sim, é local. Nenhum dado sai do seu computador.

**P: Preciso de internet?**
R: Não! Funciona completamente offline.

---

## Recursos

- [MDN - IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Exemplos Completos](EXEMPLOS_INDEXEDDB.md)
- [Guia Banco de Dados](GUIA_BANCO_DE_DADOS.md)
- [Análise de Performance](ANALISE_PERFORMANCE_E_RECOMENDACOES.md)

