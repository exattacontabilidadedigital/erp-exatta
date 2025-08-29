# Regra para Identificação de Contas Sintéticas vs Analíticas

## 📋 Resumo da Implementação

Foi implementada uma regra clara e objetiva para identificar contas sintéticas (que não recebem lançamentos) e contas analíticas (que recebem lançamentos) no plano de contas.

## 🎯 Objetivo

Distinguir visualmente as contas que podem receber lançamentos das que são apenas agrupadoras, facilitando a navegação e uso do sistema.

## ⚙️ Regra Implementada

### **Critério: Número de Segmentos no Código**

- **Contas Sintéticas**: Até 3 segmentos separados por ponto (.)
- **Contas Analíticas**: 4 ou mais segmentos separados por ponto (.)

### **Exemplos Práticos:**

#### ✅ **Contas Sintéticas** (Negrito - não recebem lançamentos):
- `1` - ATIVO
- `1.1` - ATIVO CIRCULANTE  
- `1.1.1` - DISPONÍVEL
- `2.1.1` - FORNECEDORES
- `3.1` - CAPITAL SOCIAL

#### ✅ **Contas Analíticas** (Normal - recebem lançamentos):
- `1.1.1.01` - CAIXA
- `1.1.1.02` - BANCOS CONTA MOVIMENTO
- `1.1.2.001` - DUPLICATAS A RECEBER
- `2.1.1.01` - DUPLICATAS A PAGAR
- `4.2.1.01` - SALÁRIOS E ORDENADOS

## 🛠️ Implementação Técnica

### Funções Utilitárias Criadas:

```typescript
// Função para determinar se uma conta é sintética
function isContaSintetica(codigo: string): boolean {
  const segmentos = codigo.split('.').length
  return segmentos <= 3
}

// Função para determinar se uma conta é analítica
function isContaAnalitica(codigo: string): boolean {
  return !isContaSintetica(codigo)
}
```

### Aplicação Visual:

```typescript
// Aplicação do negrito para contas sintéticas
<span className={`text-sm text-gray-600 ${isContaSintetica ? 'font-bold' : 'font-medium'}`}>
  {node.codigo}
</span>
```

## 📊 Benefícios

1. **Clareza Visual**: Fácil identificação de contas operacionais
2. **Consistência**: Regra objetiva baseada na estrutura do código
3. **Flexibilidade**: Funciona com qualquer estrutura de plano de contas
4. **Manutenibilidade**: Funções reutilizáveis e bem documentadas

## 🔍 Casos de Uso

- **Contas Sintéticas**: Usadas apenas para agrupamento e relatórios
- **Contas Analíticas**: Usadas em lançamentos contábeis
- **Filtros**: Sistema pode filtrar apenas contas analíticas em formulários
- **Relatórios**: Diferentes níveis de detalhamento conforme necessário

## 📝 Notas Importantes

- A regra é baseada na estrutura padrão brasileira de plano de contas
- Pode ser ajustada conforme necessidades específicas da empresa
- Mantém compatibilidade com diferentes níveis de detalhamento
- Facilita a implementação de validações em formulários
