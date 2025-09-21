// Validações Zod para funcionalidade de Importação de Lançamentos
// Arquivo: lib/validations/import-schemas.ts

import { z } from "zod";

// Schema para ModeloImportacao
export const modeloImportacaoSchema = z.object({
  nome: z
    .string()
    .min(1, "Nome é obrigatório")
    .max(255, "Nome deve ter no máximo 255 caracteres")
    .trim(),
  
  padraoDescricao: z
    .string()
    .min(1, "Padrão de descrição é obrigatório")
    .max(500, "Padrão de descrição deve ter no máximo 500 caracteres")
    .trim(),
  
  padraoRegex: z
    .string()
    .max(500, "Padrão regex deve ter no máximo 500 caracteres")
    .optional()
    .refine((val) => {
      if (!val) return true;
      try {
        new RegExp(val);
        return true;
      } catch {
        return false;
      }
    }, "Padrão regex inválido"),
  
  contaId: z
    .number()
    .int()
    .min(1, "Conta é obrigatória"),
  
  centroCustoId: z
    .number()
    .int()
    .positive()
    .optional(),
  
  clienteId: z
    .number()
    .int()
    .positive()
    .optional(),
  
  fornecedorId: z
    .number()
    .int()
    .positive()
    .optional(),
  
  contaBancariaId: z
    .number()
    .int()
    .positive()
    .optional(),
  
  categoria: z
    .string()
    .max(100, "Categoria deve ter no máximo 100 caracteres")
    .optional(),
  
  limiteConfianca: z
    .number()
    .min(0, "Limite de confiança deve ser entre 0 e 1")
    .max(1, "Limite de confiança deve ser entre 0 e 1")
    .default(0.8),
  
  autoConfirmar: z
    .boolean()
    .default(false),
});

// Schema para criar/atualizar PreLancamento
export const preLancamentoSchema = z.object({
  contaFinalId: z
    .number()
    .int()
    .min(1, "Conta é obrigatória"),
  
  centroCustoFinalId: z
    .number()
    .int()
    .positive()
    .optional(),
  
  clienteFinalId: z
    .number()
    .int()
    .positive()
    .optional(),
  
  fornecedorFinalId: z
    .number()
    .int()
    .positive()
    .optional(),
  
  contaBancariaFinalId: z
    .number()
    .int()
    .positive()
    .optional(),
  
  categoriaFinal: z
    .string()
    .max(100, "Categoria deve ter no máximo 100 caracteres")
    .optional(),
  
  observacoes: z
    .string()
    .max(1000, "Observações devem ter no máximo 1000 caracteres")
    .optional(),
});

// Schema para configuração de processamento em lote
export const configuracaoProcessamentoSchema = z.object({
  limiteAutoConfirmacao: z
    .number()
    .min(0, "Limite deve ser entre 0 e 1")
    .max(1, "Limite deve ser entre 0 e 1")
    .default(0.95),
  
  permitirRevisaoManual: z
    .boolean()
    .default(true),
  
  pularDuplicatas: z
    .boolean()
    .default(true),
  
  criarModelos: z
    .boolean()
    .default(false),
  
  limiteConfiancaMinima: z
    .number()
    .min(0, "Limite deve ser entre 0 e 1")
    .max(1, "Limite deve ser entre 0 e 1")
    .default(0.7),
});

// Schema para validação de arquivo
export const arquivoImportacaoSchema = z.object({
  arquivo: z
    .instanceof(File)
    .refine((file) => file.size <= 10 * 1024 * 1024, "Arquivo deve ter no máximo 10MB")
    .refine(
      (file) => {
        const extensao = file.name.toLowerCase().split('.').pop();
        return extensao === 'ofx' || extensao === 'csv';
      },
      "Apenas arquivos OFX e CSV são aceitos"
    ),
});

// Schema para DadosTransacao (parsing)
export const dadosTransacaoSchema = z.object({
  descricao: z
    .string()
    .min(1, "Descrição é obrigatória")
    .max(500, "Descrição deve ter no máximo 500 caracteres"),
  
  valor: z
    .number()
    .finite("Valor deve ser um número válido"),
  
  data: z
    .date()
    .max(new Date(), "Data não pode ser futura"),
  
  numeroDocumento: z
    .string()
    .max(100, "Número do documento deve ter no máximo 100 caracteres")
    .optional(),
  
  referenciaBancaria: z
    .string()
    .max(100, "Referência bancária deve ter no máximo 100 caracteres")
    .optional(),
  
  saldo: z
    .number()
    .finite()
    .optional(),
  
  tipoTransacao: z
    .string()
    .max(50, "Tipo de transação deve ter no máximo 50 caracteres")
    .optional(),
  
  categoria: z
    .string()
    .max(100, "Categoria deve ter no máximo 100 caracteres")
    .optional(),
});

// Schema para filtros de PreLancamentos
export const filtrosPreLancamentosSchema = z.object({
  loteId: z
    .number()
    .int()
    .positive()
    .optional(),
  
  status: z
    .array(z.enum(['pendente', 'sugerido', 'confirmado', 'editado', 'rejeitado']))
    .optional(),
  
  dataInicio: z
    .date()
    .optional(),
  
  dataFim: z
    .date()
    .optional(),
  
  valorMinimo: z
    .number()
    .finite()
    .optional(),
  
  valorMaximo: z
    .number()
    .finite()
    .optional(),
  
  descricao: z
    .string()
    .max(500, "Descrição deve ter no máximo 500 caracteres")
    .optional(),
  
  modeloId: z
    .number()
    .int()
    .positive()
    .optional(),
}).refine(
  (data) => {
    if (data.dataInicio && data.dataFim) {
      return data.dataInicio <= data.dataFim;
    }
    return true;
  },
  {
    message: "Data inicial deve ser anterior ou igual à data final",
    path: ["dataFim"],
  }
).refine(
  (data) => {
    if (data.valorMinimo && data.valorMaximo) {
      return data.valorMinimo <= data.valorMaximo;
    }
    return true;
  },
  {
    message: "Valor mínimo deve ser menor ou igual ao valor máximo",
    path: ["valorMaximo"],
  }
);

// Schema para filtros de Lotes
export const filtrosLotesSchema = z.object({
  status: z
    .array(z.enum(['processando', 'concluido', 'erro']))
    .optional(),
  
  dataInicio: z
    .date()
    .optional(),
  
  dataFim: z
    .date()
    .optional(),
  
  tipoArquivo: z
    .array(z.enum(['OFX', 'CSV']))
    .optional(),
  
  usuarioId: z
    .number()
    .int()
    .positive()
    .optional(),
}).refine(
  (data) => {
    if (data.dataInicio && data.dataFim) {
      return data.dataInicio <= data.dataFim;
    }
    return true;
  },
  {
    message: "Data inicial deve ser anterior ou igual à data final",
    path: ["dataFim"],
  }
);

// Schema para filtros de Modelos
export const filtrosModelosSchema = z.object({
  ativo: z
    .boolean()
    .optional(),
  
  categoria: z
    .string()
    .max(100, "Categoria deve ter no máximo 100 caracteres")
    .optional(),
  
  limiteConfiancaMinima: z
    .number()
    .min(0, "Limite deve ser entre 0 e 1")
    .max(1, "Limite deve ser entre 0 e 1")
    .optional(),
});

// Schema para paginação
export const paginacaoSchema = z.object({
  pagina: z
    .number()
    .int()
    .min(1, "Página deve ser maior que 0")
    .default(1),
  
  itensPorPagina: z
    .number()
    .int()
    .min(1, "Itens por página deve ser maior que 0")
    .max(100, "Máximo 100 itens por página")
    .default(20),
  
  ordenacao: z
    .string()
    .max(50, "Campo de ordenação deve ter no máximo 50 caracteres")
    .optional(),
  
  direcao: z
    .enum(['asc', 'desc'])
    .default('desc'),
});

// Schema para confirmação em massa
export const confirmacaoMassaSchema = z.object({
  preLancamentoIds: z
    .array(z.number().int().positive())
    .min(1, "Pelo menos um pré-lançamento deve ser selecionado")
    .max(100, "Máximo 100 pré-lançamentos por vez"),
  
  acao: z
    .enum(['confirmar', 'rejeitar']),
  
  observacoes: z
    .string()
    .max(500, "Observações devem ter no máximo 500 caracteres")
    .optional(),
});

// Schema para busca/pesquisa
export const buscaSchema = z.object({
  termo: z
    .string()
    .min(1, "Termo de busca é obrigatório")
    .max(100, "Termo de busca deve ter no máximo 100 caracteres")
    .trim(),
  
  campos: z
    .array(z.enum(['descricao', 'numeroDocumento', 'referenciaBancaria', 'categoria']))
    .min(1, "Pelo menos um campo deve ser selecionado")
    .default(['descricao']),
  
  exato: z
    .boolean()
    .default(false),
});

// Schema para feedback de aprendizagem
export const feedbackAprendizagemSchema = z.object({
  preLancamentoId: z
    .number()
    .int()
    .positive(),
  
  tipoFeedback: z
    .enum(['positivo', 'negativo', 'modificado']),
  
  detalhes: z
    .string()
    .max(1000, "Detalhes devem ter no máximo 1000 caracteres")
    .optional(),
  
  criarNovoModelo: z
    .boolean()
    .default(false),
  
  nomeNovoModelo: z
    .string()
    .max(255, "Nome do modelo deve ter no máximo 255 caracteres")
    .optional(),
}).refine(
  (data) => {
    if (data.criarNovoModelo && !data.nomeNovoModelo) {
      return false;
    }
    return true;
  },
  {
    message: "Nome do novo modelo é obrigatório quando criar novo modelo está ativado",
    path: ["nomeNovoModelo"],
  }
);

// Schema para estatísticas
export const estatisticasSchema = z.object({
  dataInicio: z
    .date()
    .optional(),
  
  dataFim: z
    .date()
    .optional(),
  
  empresaId: z
    .number()
    .int()
    .positive()
    .optional(),
  
  usuarioId: z
    .number()
    .int()
    .positive()
    .optional(),
}).refine(
  (data) => {
    if (data.dataInicio && data.dataFim) {
      return data.dataInicio <= data.dataFim;
    }
    return true;
  },
  {
    message: "Data inicial deve ser anterior ou igual à data final",
    path: ["dataFim"],
  }
);

// Tipos inferidos dos schemas
export type ModeloImportacaoFormData = z.infer<typeof modeloImportacaoSchema>;
export type PreLancamentoFormData = z.infer<typeof preLancamentoSchema>;
export type ConfiguracaoProcessamentoFormData = z.infer<typeof configuracaoProcessamentoSchema>;
export type FiltrosPreLancamentosFormData = z.infer<typeof filtrosPreLancamentosSchema>;
export type FiltrosLotesFormData = z.infer<typeof filtrosLotesSchema>;
export type FiltrosModelosFormData = z.infer<typeof filtrosModelosSchema>;
export type PaginacaoFormData = z.infer<typeof paginacaoSchema>;
export type ConfirmacaoMassaFormData = z.infer<typeof confirmacaoMassaSchema>;
export type BuscaFormData = z.infer<typeof buscaSchema>;
export type FeedbackAprendizagemFormData = z.infer<typeof feedbackAprendizagemSchema>;
export type EstatisticasFormData = z.infer<typeof estatisticasSchema>;

// Schema de resposta de API
export const respostaAPISchema = z.object({
  sucesso: z.boolean(),
  dados: z.any().optional(),
  erro: z.string().optional(),
  mensagem: z.string().optional(),
});

export const respostaAPIListaSchema = respostaAPISchema.extend({
  total: z.number().int().min(0),
  pagina: z.number().int().min(1),
  totalPaginas: z.number().int().min(0),
});

// Função utilitária para validação
export function validarDados<T>(schema: z.ZodSchema<T>, dados: unknown): { sucesso: boolean; dados?: T; erros?: string[] } {
  try {
    const dadosValidados = schema.parse(dados);
    return { sucesso: true, dados: dadosValidados };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const erros = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return { sucesso: false, erros };
    }
    return { sucesso: false, erros: ['Erro de validação desconhecido'] };
  }
}

// Função para sanitizar dados de entrada
export function sanitizarString(texto: string): string {
  return texto
    .trim()
    .replace(/\s+/g, ' ') // Substituir múltiplos espaços por um único espaço
    .replace(/[<>]/g, ''); // Remover caracteres potencialmente perigosos
}

// Função para validar arquivo antes do upload
export function validarArquivoImportacao(arquivo: File): { valido: boolean; erro?: string } {
  if (!arquivo) {
    return { valido: false, erro: 'Nenhum arquivo selecionado' };
  }

  if (arquivo.size > 10 * 1024 * 1024) {
    return { valido: false, erro: 'Arquivo deve ter no máximo 10MB' };
  }

  const extensao = arquivo.name.toLowerCase().split('.').pop();
  if (extensao !== 'ofx' && extensao !== 'csv') {
    return { valido: false, erro: 'Apenas arquivos OFX e CSV são aceitos' };
  }

  return { valido: true };
}