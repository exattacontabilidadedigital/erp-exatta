export interface BankTransaction {
  id: string;
  fit_id?: string;
  memo?: string;
  payee?: string;
  amount: number;
  posted_at: string;
  reconciliation_status?: string;
  matched_lancamento_id?: string;
  transaction_type?: string;
}

export interface SystemTransaction {
  id: string;
  descricao: string;
  valor: number;
  data_lancamento: string;
  tipo: 'receita' | 'despesa' | 'transferencia';
  centro_custo?: string;
  plano_conta?: string;
  numero_documento?: string;
}

export interface ReconciliationPair {
  id: string;
  bankTransaction?: BankTransaction;
  systemTransaction?: SystemTransaction;
  systemTransactions?: SystemTransaction[];
  matchScore?: number;
  matchType?: string;
  status: 'matched' | 'suggested' | 'no_match' | 'transfer';
  matchReason?: string;
  confidenceLevel?: 'high' | 'medium' | 'low';
}

export interface ContaBancaria {
  id: string;
  nome: string;
  banco: string;
  agencia: string;
  conta: string;
  saldo_atual: number;
}

export interface ReconciliationSession {
  id: string;
  bank_account_id: string;
  created_at: string;
  updated_at: string;
  status: 'active' | 'completed' | 'cancelled';
}

export interface MatchRule {
  id: string;
  name: string;
  description: string;
  weight: number;
  enabled: boolean;
  rule_type: 'amount' | 'date' | 'memo' | 'combined';
  parameters: Record<string, any>;
}

export interface ReconciliationStats {
  total: number;
  matched: number;
  suggested: number;
  noMatch: number;
  transfer: number;
  percentageComplete: number;
}

export type ReconciliationAction = 
  | 'confirm' 
  | 'reject' 
  | 'confirm_transfer' 
  | 'create_lancamento' 
  | 'create_transferencia'
  | 'ignore';

export interface ConfirmActionPayload {
  reconciliation_id: string;
  bank_transaction_id: string;
  system_transaction_id?: string;
  action: ReconciliationAction;
}

export interface UploadResult {
  success: boolean;
  imported_count?: number;
  message?: string;
  error?: string;
}

export interface ReconciliationFilters {
  searchTerm: string;
  statusFilter: string;
  dateRange: {
    start: string;
    end: string;
  };
  amountRange: {
    min: number | null;
    max: number | null;
  };
}

export interface ReconciliationError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}
