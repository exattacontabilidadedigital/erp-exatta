# Diretrizes para Notificações (Toast)

## ✅ **Quando usar notificações:**

### **Ações do usuário que modificam dados:**
- ✅ Salvar/editar registros
- ✅ Excluir itens
- ✅ Importar/exportar dados
- ✅ Confirmar operações importantes

### **Erros e problemas:**
- ✅ Falhas de conexão
- ✅ Erros de validação
- ✅ Timeouts de operações
- ✅ Problemas de permissão

### **Operações críticas:**
- ✅ Backup/restore
- ✅ Mudanças de configuração
- ✅ Operações financeiras importantes
- ✅ Logs de auditoria

## ❌ **Quando NÃO usar notificações:**

### **Carregamento de páginas:**
- ❌ "Página carregada"
- ❌ "Dados carregados com sucesso"
- ❌ "Dashboard atualizado"
- ❌ "Lista atualizada"

### **Navegação normal:**
- ❌ Mudança de abas
- ❌ Filtros aplicados
- ❌ Ordenação de tabelas
- ❌ Paginação

### **Estados temporários:**
- ❌ Loading automático
- ❌ Refresh de dados
- ❌ Sincronização em background
- ❌ Cache hits

## 📋 **Boas práticas implementadas:**

### **Sistema de Loading:**
```tsx
// ✅ Carregamento silencioso por padrão
<TablePageLoadingWrapper
  pageKey="minha-pagina"
  loadData={loadData}
  onError={handleError} // Apenas erros!
>
  <MeuConteudo />
</TablePageLoadingWrapper>

// ❌ Evitar notificações desnecessárias
onLoadComplete={() => {
  toast({ title: "Carregado!" }) // NÃO fazer isso
}}
```

### **Refresh de dados:**
```tsx
// ✅ Atualização silenciosa
const refreshData = async () => {
  try {
    await loadData()
    // Sem toast - dados aparecem automaticamente
  } catch (error) {
    toast({ title: "Erro ao atualizar", variant: "destructive" })
  }
}

// ❌ Evitar confirmação desnecessária
const refreshData = async () => {
  await loadData()
  toast({ title: "Dados atualizados!" }) // NÃO fazer isso
}
```

### **Ações importantes:**
```tsx
// ✅ Confirmar ações significativas
const handleSave = async () => {
  try {
    await saveData()
    toast({ title: "Registro salvo com sucesso!" })
  } catch (error) {
    toast({ title: "Erro ao salvar", variant: "destructive" })
  }
}

// ✅ Operações críticas
const handleDelete = async () => {
  try {
    await deleteData()
    toast({ title: "Item excluído permanentemente" })
  } catch (error) {
    toast({ title: "Erro ao excluir", variant: "destructive" })
  }
}
```

## 🎯 **Resultado esperado:**

### **Experiência melhorada:**
- 🔄 Carregamentos suaves e silenciosos
- 📱 Interface responsiva sem interrupções
- ⚡ Feedback apenas quando necessário
- 🎯 Notificações relevantes e úteis

### **Menos ruído:**
- 🚫 Sem toasts de carregamento
- 🚫 Sem confirmações óbvias
- 🚫 Sem spam de notificações
- 🚫 Sem interrupções desnecessárias

### **Melhores indicações visuais:**
- 💫 Skeletons durante carregamento
- 🎨 Estados visuais claros
- 📊 Dados aparecem automaticamente
- 🔄 Spinners contextuais

## 📝 **Configuração no sistema:**

```tsx
// Por padrão, loading wrappers são silenciosos
showSuccessToast: false // Padrão

// Apenas se realmente necessário
showSuccessToast: true // Usar com parcimônia
```

Esta abordagem torna a experiência do usuário mais fluida e profissional! 🚀