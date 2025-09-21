// Tipos para funcionalidade de Importação de Lançamentos
// Arquivo: types/import.ts

export interface ModeloImportacao {
  id: number;
  empresaId: number;
  nome: string;
  padraoDescricao: string;
  padraoRegex?: string;
  contaId?: number;
  centroCustoId?: number;
  clienteId?: number;
  fornecedorId?: number;
  contaBancariaId?: number;
  categoria?: string;
  limiteConfianca: number;
  autoConfirmar: boolean;
  ativo: boolean;
  contadorUso: number;
  taxaSucesso: number;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface LoteImportacao {
  id: number;
  empresaId: number;
  usuarioId: number;
  nomeArquivo: string;
  tipoArquivo: 'OFX' | 'CSV';
  hashArquivo: string;
  totalRegistros: number;
  registrosProcessados: number;
  registrosConfirmados: number;
  registrosRejeitados: number;
  registrosAutoConfirmados: number;
  status: 'processando' | 'concluido' | 'erro';
  tempoProcessamento?: number;
  mensagemErro?: string;
  importadoEm: Date;
}

export interface PreLancamento {
  id: number;
  loteId: number;
  empresaId: number;
  
  // Dados originais do arquivo
  descricaoOriginal: string;
  descricaoNormalizada: string;
  valor: number;
  dataLancamento: Date;
  numeroDocumento?: string;
  referenciaBancaria?: string;
  saldo?: number;
  
  // Matching aplicado
  modeloId?: number;
  pontuacaoConfianca: number;
  tipoCorrespondencia: 'exato' | 'regex' | 'fuzzy' | 'manual';
  
  // Sugestões do sistema
  contaSugeridaId?: number;
  centroCustoSugeridoId?: number;
  clienteSugeridoId?: number;
  fornecedorSugeridoId?: number;
  contaBancariaSugeridaId?: number;
  categoriaSugerida?: string;
  
  // Valores finais (após revisão)
  contaFinalId?: number;
  centroCustoFinalId?: number;
  clienteFinalId?: number;
  fornecedorFinalId?: number;
  contaBancariaFinalId?: number;
  categoriaFinal?: string;
  observacoes?: string;
  
  // Controle de status
  status: 'pendente' | 'sugerido' | 'confirmado' | 'editado' | 'rejeitado';
  lancamentoFinalId?: number;
  revisadoPor?: number;
  revisadoEm?: Date;
  autoConfirmado: boolean;
  feedbackUsuario?: 'positivo' | 'negativo' | 'modificado';
  criadoEm: Date;
}

export interface AprendizadoModelo {
  id: number;
  modeloId?: number;
  descricao: string;
  tipoFeedback: 'positivo' | 'negativo' | 'criacao' | 'atualizacao';
  confiancaAntes?: number;
  confiancaDepois?: number;
  acaoUsuario: 'confirmou' | 'rejeitou' | 'editou' | 'criou_novo';
  detalhesMudanca?: Record<string, any>;
  criadoEm: Date;
}

export interface DadosTransacao {
  descricao: string;
  valor: number;
  data: Date;
  numeroDocumento?: string;
  referenciaBancaria?: string;
  saldo?: number;
  tipoTransacao?: string;
  categoria?: string;
}

export interface ResultadoCorrespondencia {
  modelo: ModeloImportacao | null;
  pontuacao: number;
  tipo: 'exato' | 'regex' | 'fuzzy' | 'manual';
  sugestoes?: Array<{
    modelo: ModeloImportacao;
    pontuacao: number;
    motivo: string;
  }>;
}

export interface ConfiguracaoProcessamento {
  limiteAutoConfirmacao: number;
  permitirRevisaoManual: boolean;
  pularDuplicatas: boolean;
  criarModelos: boolean;
  limiteConfiancaMinima: number;
}

export interface EstatisticasImportacao {
  totalLotes: number;
  pendentesRevisao: number;
  confirmadosHoje: number;
  rejeitadosHoje: number;
  confiancaMedia: number;
  tempoProcessamentoMedio: number;
  taxaSucessoGeral: number;
}

export interface ResultadoProcessamento {
  lote: LoteImportacao;
  totalRegistros: number;
  registrosComCorrespondencia: number;
  registrosNovos: number;
  registrosAutoConfirmados: number;
  registrosPendentes: number;
  tempoProcessamento: number;
  erros: string[];
}

// Form data types para formulários
export interface FormularioModeloImportacao {
  nome: string;
  padraoDescricao: string;
  padraoRegex?: string;
  contaId: number;
  centroCustoId?: number;
  clienteId?: number;
  fornecedorId?: number;
  contaBancariaId?: number;
  categoria?: string;
  limiteConfianca: number;
  autoConfirmar: boolean;
}

export interface FormularioPreLancamento {
  contaFinalId: number;
  centroCustoFinalId?: number;
  clienteFinalId?: number;
  fornecedorFinalId?: number;
  contaBancariaFinalId?: number;
  categoriaFinal?: string;
  observacoes?: string;
}

export interface FormularioConfiguracaoLote {
  limiteAutoConfirmacao: number;
  permitirRevisaoManual: boolean;
  pularDuplicatas: boolean;
  criarModelos: boolean;
}

// Status e tipos para UI
export type StatusUpload = 'idle' | 'uploading' | 'parsing' | 'processing' | 'completed' | 'error';

export type StatusBatch = 'processando' | 'concluido' | 'erro';

export type StatusPreLancamento = 'pendente' | 'sugerido' | 'confirmado' | 'editado' | 'rejeitado';

export type TipoCorrespondencia = 'exato' | 'regex' | 'fuzzy' | 'manual';

export type TipoArquivo = 'OFX' | 'CSV';

export type FeedbackUsuario = 'positivo' | 'negativo' | 'modificado';

// Enums para consistência
export enum StatusUploadEnum {
  IDLE = 'idle',
  UPLOADING = 'uploading',
  PARSING = 'parsing',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  ERROR = 'error'
}

export enum StatusBatchEnum {
  PROCESSANDO = 'processando',
  CONCLUIDO = 'concluido',
  ERRO = 'erro'
}

export enum StatusPreLancamentoEnum {
  PENDENTE = 'pendente',
  SUGERIDO = 'sugerido',
  CONFIRMADO = 'confirmado',
  EDITADO = 'editado',
  REJEITADO = 'rejeitado'
}

export enum TipoCorrespondenciaEnum {
  EXATO = 'exato',
  REGEX = 'regex',
  FUZZY = 'fuzzy',
  MANUAL = 'manual'
}

// Interfaces para componentes
export interface PropsComponenteUpload {
  onUploadComplete?: (resultado: ResultadoProcessamento) => void;
  onError?: (erro: string) => void;
}

export interface PropsComponentePreLancamentos {
  loteId?: number;
  status?: StatusPreLancamento[];
  onStatusChange?: (preLancamentoId: number, novoStatus: StatusPreLancamento) => void;
}

export interface PropsComponenteModelos {
  empresaId: number;
  onModeloSalvo?: (modelo: ModeloImportacao) => void;
  onModeloExcluido?: (modeloId: number) => void;
}

// Tipos para API responses
export interface RespostaAPI<T = any> {
  sucesso: boolean;
  dados?: T;
  erro?: string;
  mensagem?: string;
}

export interface RespostaAPILista<T = any> extends RespostaAPI<T[]> {
  total: number;
  pagina: number;
  totalPaginas: number;
}

// Tipos para filtros e paginação
export interface FiltrosPreLancamentos {
  loteId?: number;
  status?: StatusPreLancamento[];
  dataInicio?: Date;
  dataFim?: Date;
  valorMinimo?: number;
  valorMaximo?: number;
  descricao?: string;
  modeloId?: number;
}

export interface FiltrosLotes {
  status?: StatusBatch[];
  dataInicio?: Date;
  dataFim?: Date;
  tipoArquivo?: TipoArquivo[];
  usuarioId?: number;
}

export interface FiltrosModelos {
  ativo?: boolean;
  categoria?: string;
  limiteConfiancaMinima?: number;
}

export interface Paginacao {
  pagina: number;
  itensPorPagina: number;
  ordenacao?: string;
  direcao?: 'asc' | 'desc';
}

// Tipos para auditoria e logs
export interface LogAuditoria {
  id: number;
  empresaId: number;
  usuarioId: number;
  acao: string;
  entidade: string;
  entidadeId: number;
  dadosAnteriores?: Record<string, any>;
  dadosNovos?: Record<string, any>;
  ip?: string;
  userAgent?: string;
  criadoEm: Date;
}

export interface LogProcessamento {
  loteId: number;
  etapa: string;
  status: 'iniciado' | 'concluido' | 'erro';
  detalhes?: string;
  tempoExecucao?: number;
  criadoEm: Date;
}

// Todos os tipos estão exportados individualmente acima