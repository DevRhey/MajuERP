# 🧪 TESTE RÁPIDO DE 5 MINUTOS

## Como Validar que Tudo está Funcionando

---

## ⚡ Teste Rápido (5 min)

### 1. Abra a aplicação
```
1. Abra index.html no navegador
2. Verifique console (F12) - não deve ter erros vermelhos
```

### 2. Teste Conflito (2 min)
```
EVENTOS → Novo Evento
- Cliente: escolha qualquer um
- Data: hoje
- Hora: 10:00 - 12:00
- Itens: adicione 1 ou 2
- SALVAR

✅ Deve salvar sem conflitos

Agora OUTRO evento:
- MESMO cliente
- MESMA data
- Hora: 11:00 - 13:00 (sobrepõe)
- Mesmos itens
- SALVAR

⚠️ ESPERADO: Alert com "CONFLITOS DETECTADOS"
→ Clique "CANCELAR" para cancelar

✅ SUCESSO: Conflito foi detectado!
```

### 3. Teste Recomendação (1 min)
```
EVENTOS → Procure evento recém-criado
→ Procure por card com "💡 SUGESTÕES IA"
→ Se aparecer lista de itens recomendados

✅ SUCESSO: Recomendações funcionando!
```

### 4. Teste Dashboard (1 min)
```
DASHBOARD → Selecione data de hoje
→ Procure card com "🤖 Alertas e Recomendações IA"
→ Se houver alertas (conflitos, risco, etc)

✅ SUCESSO: Dashboard funciona!
```

### 5. Teste Clientes (1 min)
```
CLIENTES → Procure cliente com histórico
→ Verifique se tem badge de cor ao lado do nome:
  • Verde = Baixo risco
  • Amarelo = Médio risco
  • Vermelho = Alto risco

✅ SUCESSO: Score de risco funciona!
```

---

## ✅ Se tudo passou, está 100% funcionando!

---

## 🐛 Se algo não funcionar:

### Erro: "IA não aparece"
```
1. Abra Console (F12)
2. Digite: console.log(iaEngine)
3. Se der erro, verificar se index.html carrega os arquivos IA
4. Verificar pasta assets/js/ tem todos os arquivos
```

### Erro: "Conflito não detecta"
```
1. Verificar se os eventos realmente sobrepõem
2. Verificar se é MESMO cliente
3. Verificar console por erros
```

### Erro: "Recomendação não aparece"
```
1. Cliente precisa ter histórico de eventos anteriores
2. Adicionar mais eventos para mesmo cliente
3. Depois criar novo evento para ver recomendação
```

---

## 📱 Debug Rápido no Console

```javascript
// Ver se IA está carregada:
iaEngine.conflictDetector  // deve retornar um objeto

// Ver recomendações de um evento:
Storage.get('eventos')[0]._recomendacoes_ia

// Ver risco de um cliente:
Storage.get('clientes')[0]._analise_ia

// Ver todos os eventos com recomendações:
Storage.get('eventos').filter(e => e._recomendacoes_ia)
```

---

**Se todos os 5 testes passarem → IA está funcionando perfeitamente!** ✅
