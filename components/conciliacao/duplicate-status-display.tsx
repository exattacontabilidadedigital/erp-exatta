// =========================================================
// COMPONENTE PARA EXIBIR STATUS DE DUPLICIDADE E CONCILIAÇÃO
// Mostra informações sobre transações duplicadas/conciliadas e estatísticas
// =========================================================

import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  FileX, 
  Clock, 
  XCircle, 
  TrendingUp, 
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { 
  getStatusBadge, 
  shouldShowFaded, 
  formatReconciliationRate,
  getReconciliationStats,
  markTransactionAsIgnored,
  resetTransactionStatus,
  type ReconciliationStats 
} from '@/lib/duplicate-control-utils';
import { useToast } from '@/contexts/toast-context';

export interface DuplicateInfo {
  hasPartialDuplicates: boolean;
  duplicateTransactions: {
    fit_id: string;
    memo: string;
    amount: number;
    posted_at: string;
  }[];
  alreadyConciliated: {
    fit_id: string;
    memo: string;
    amount: number;
    posted_at: string;
  }[];
}

export interface ImportSummary {
  fileName: string;
  fileHash: string;
  period: {
    start: string;
    end: string;
  };
  transactions: {
    total: number;
    imported: number;
    skipped: number;
    duplicates: number;
    alreadyConciliated: number;
  };
  account: {
    bankId: string;
    accountId: string;
    balance: number;
  };
}

interface DuplicateStatusDisplayProps {
  summary: ImportSummary;
  duplicateInfo: DuplicateInfo;
  showDetails?: boolean;
}

export function DuplicateStatusDisplay({
  summary,
  duplicateInfo,
  showDetails = true
}: DuplicateStatusDisplayProps) {
  const { transactions } = summary;
  const hasSkipped = transactions.skipped > 0;
  const hasImported = transactions.imported > 0;

  // Status geral da importação
  const getImportStatus = () => {
    if (transactions.imported === 0) {
      return {
        type: 'warning' as const,
        icon: FileX,
        title: 'Nenhuma Transação Nova',
        message: 'Todas as transações já foram importadas anteriormente'
      };
    }

    if (hasSkipped) {
      return {
        type: 'info' as const,
        icon: AlertTriangle,
        title: 'Importação Parcial',
        message: `${transactions.imported} transações importadas, ${transactions.skipped} ignoradas (duplicatas)`
      };
    }

    return {
      type: 'success' as const,
      icon: CheckCircle,
      title: 'Importação Completa',
      message: `Todas as ${transactions.imported} transações foram importadas com sucesso`
    };
  };

  const status = getImportStatus();
  const StatusIcon = status.icon;

  return (
    <div className="space-y-4">
      {/* Alert Principal */}
      <Alert className={`border-l-4 ${
        status.type === 'success' ? 'border-l-green-500 bg-green-50' :
        status.type === 'warning' ? 'border-l-yellow-500 bg-yellow-50' :
        'border-l-blue-500 bg-blue-50'
      }`}>
        <StatusIcon className={`h-4 w-4 ${
          status.type === 'success' ? 'text-green-600' :
          status.type === 'warning' ? 'text-yellow-600' :
          'text-blue-600'
        }`} />
        <AlertDescription>
          <div className="font-medium">{status.title}</div>
          <div className="text-sm mt-1">{status.message}</div>
        </AlertDescription>
      </Alert>

      {/* Resumo Estatístico */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Resumo da Importação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {transactions.total}
              </div>
              <div className="text-sm text-gray-500">Total no Arquivo</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {transactions.imported}
              </div>
              <div className="text-sm text-gray-500">Importadas</div>
            </div>
            
            {transactions.duplicates > 0 && (
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {transactions.duplicates}
                </div>
                <div className="text-sm text-gray-500">Duplicadas</div>
              </div>
            )}
            
            {transactions.alreadyConciliated > 0 && (
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {transactions.alreadyConciliated}
                </div>
                <div className="text-sm text-gray-500">Já Conciliadas</div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t">
            <div className="text-sm text-gray-600 space-y-1">
              <div><strong>Arquivo:</strong> {summary.fileName}</div>
              <div><strong>Período:</strong> {summary.period.start} até {summary.period.end}</div>
              <div><strong>Conta:</strong> {summary.account.bankId} - {summary.account.accountId}</div>
              <div><strong>Hash:</strong> <code className="text-xs bg-gray-100 px-1 rounded">{summary.fileHash.substring(0, 16)}...</code></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detalhes das Transações (se solicitado) */}
      {showDetails && duplicateInfo.hasPartialDuplicates && (
        <div className="space-y-3">
          {/* Transações Duplicadas */}
          {duplicateInfo.duplicateTransactions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-700">
                  <AlertTriangle className="h-5 w-5" />
                  Transações Duplicadas ({duplicateInfo.duplicateTransactions.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600 mb-3">
                  Estas transações já existem no sistema, mas ainda não foram conciliadas:
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {duplicateInfo.duplicateTransactions.map((transaction, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-yellow-50 rounded border">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{transaction.memo}</div>
                        <div className="text-xs text-gray-500">
                          {transaction.posted_at} • FIT_ID: {transaction.fit_id.substring(0, 12)}...
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-medium ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.amount >= 0 ? '+' : ''}R$ {Math.abs(transaction.amount).toFixed(2)}
                        </div>
                        <Badge variant="secondary" className="text-xs">Duplicada</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Transações Já Conciliadas */}
          {duplicateInfo.alreadyConciliated.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700">
                  <CheckCircle className="h-5 w-5" />
                  Transações Já Conciliadas ({duplicateInfo.alreadyConciliated.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600 mb-3">
                  Estas transações já foram conciliadas anteriormente:
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {duplicateInfo.alreadyConciliated.map((transaction, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-blue-50 rounded border">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{transaction.memo}</div>
                        <div className="text-xs text-gray-500">
                          {transaction.posted_at} • FIT_ID: {transaction.fit_id.substring(0, 12)}...
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-medium ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.amount >= 0 ? '+' : ''}R$ {Math.abs(transaction.amount).toFixed(2)}
                        </div>
                        <Badge variant="default" className="text-xs bg-blue-600">Conciliada</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

// Componente para exibir erro de arquivo completamente duplicado
export function FileDuplicateError({
  fileName,
  existingImport
}: {
  fileName: string;
  existingImport?: {
    id: string;
    date: string;
  };
}) {
  return (
    <Alert className="border-l-4 border-l-red-500 bg-red-50">
      <FileX className="h-4 w-4 text-red-600" />
      <AlertDescription>
        <div className="font-medium text-red-800">Arquivo Já Importado</div>
        <div className="text-sm mt-1 text-red-700">
          O arquivo <strong>{fileName}</strong> já foi importado anteriormente.
          {existingImport && (
            <div className="mt-2 text-xs">
              <strong>Importação anterior:</strong> {new Date(existingImport.date).toLocaleString('pt-BR')}
              <br />
              <strong>ID:</strong> <code>{existingImport.id}</code>
            </div>
          )}
        </div>
        <div className="mt-2 text-sm text-red-600">
          💡 <strong>Dica:</strong> Se você deseja reimportar, primeiro remova a importação anterior ou use um arquivo OFX mais recente.
        </div>
      </AlertDescription>
    </Alert>
  );
}

// =========================================================
// NOVOS COMPONENTES PARA CONTROLE DE DUPLICIDADE
// =========================================================

interface TransactionStatusProps {
  transactionId: string;
  status: 'pendente' | 'conciliado' | 'ignorado';
  showActions?: boolean;
  onStatusChange?: (newStatus: 'pendente' | 'conciliado' | 'ignorado') => void;
}

// Componente para exibir o status de uma transação individual
export function TransactionStatusBadge({ 
  transactionId, 
  status, 
  showActions = true,
  onStatusChange 
}: TransactionStatusProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const statusInfo = getStatusBadge(status);
  const isFaded = shouldShowFaded(status);

  const handleIgnore = async () => {
    setLoading(true);
    try {
      const success = await markTransactionAsIgnored(transactionId);
      if (success) {
        toast({ 
          title: 'Transação marcada como ignorada',
          variant: 'success'
        });
        onStatusChange?.('ignorado');
      } else {
        toast({ 
          title: 'Erro ao marcar como ignorada',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({ 
        title: 'Erro ao marcar como ignorada',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setLoading(true);
    try {
      const success = await resetTransactionStatus(transactionId);
      if (success) {
        toast({ 
          title: 'Status resetado para pendente',
          variant: 'success'
        });
        onStatusChange?.('pendente');
      } else {
        toast({ 
          title: 'Erro ao resetar status',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({ 
        title: 'Erro ao resetar status',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex items-center gap-2 ${isFaded ? 'opacity-50' : ''}`}>
      <Badge 
        variant={statusInfo.variant}
        className={statusInfo.color}
      >
        <span className="mr-1">{statusInfo.icon}</span>
        {statusInfo.label}
      </Badge>

      {showActions && (
        <div className="flex gap-1">
          {status !== 'ignorado' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleIgnore}
              disabled={loading}
              className="h-6 w-6 p-0"
              title="Marcar como ignorada"
            >
              <EyeOff className="h-3 w-3" />
            </Button>
          )}
          
          {status !== 'pendente' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              disabled={loading}
              className="h-6 w-6 p-0"
              title="Resetar para pendente"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

interface ReconciliationStatsDisplayProps {
  bankAccountId?: string;
  dateStart?: string;
  dateEnd?: string;
  showActions?: boolean;
}

// Componente para exibir estatísticas de conciliação
export function ReconciliationStatsDisplay({ 
  bankAccountId, 
  dateStart, 
  dateEnd,
  showActions = true 
}: ReconciliationStatsDisplayProps) {
  const [stats, setStats] = useState<ReconciliationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadStats = async () => {
    if (!bankAccountId || !dateStart || !dateEnd) return;

    setLoading(true);
    try {
      const data = await getReconciliationStats(bankAccountId, dateStart, dateEnd);
      setStats(data);
    } catch (error) {
      toast({ 
        title: 'Erro ao carregar estatísticas',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [bankAccountId, dateStart, dateEnd]);

  if (!stats && !loading) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5" />
          Estatísticas de Conciliação
          {showActions && (
            <Button
              variant="ghost"
              size="sm"
              onClick={loadStats}
              disabled={loading}
              className="ml-auto"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center p-4">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        ) : stats ? (
          <>
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Taxa de Conciliação</span>
                <span className="font-semibold">
                  {formatReconciliationRate(stats.reconciliation_rate)}
                </span>
              </div>
              <Progress 
                value={stats.reconciliation_rate} 
                className="w-full h-2"
              />
            </div>

            {/* Estatísticas Detalhadas */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-center mb-1">
                  <FileX className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {stats.total_transactions}
                </div>
                <div className="text-xs text-blue-600">Total</div>
              </div>

              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="flex items-center justify-center mb-1">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {stats.reconciled_transactions}
                </div>
                <div className="text-xs text-green-600">Conciliadas</div>
              </div>

              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center justify-center mb-1">
                  <Clock className="h-4 w-4 text-yellow-600" />
                </div>
                <div className="text-2xl font-bold text-yellow-600">
                  {stats.pending_transactions}
                </div>
                <div className="text-xs text-yellow-600">Pendentes</div>
              </div>
            </div>

            {/* Indicadores de Status */}
            <div className="flex flex-wrap gap-2 pt-2">
              <Badge variant="default" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Sistema Anti-Duplicidade Ativo
              </Badge>
              
              {stats.reconciliation_rate >= 80 && (
                <Badge variant="default" className="bg-blue-100 text-blue-800">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Alta Taxa de Conciliação
                </Badge>
              )}

              {stats.reconciliation_rate < 50 && (
                <Badge variant="destructive" className="bg-red-100 text-red-800">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Requer Atenção
                </Badge>
              )}
            </div>
          </>
        ) : (
          <div className="text-center p-4 text-gray-500">
            Nenhuma estatística disponível
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Hook para usar o status de duplicidade
export function useDuplicateStatus(transactionId: string) {
  const [status, setStatus] = useState<'pendente' | 'conciliado' | 'ignorado'>('pendente');
  const [loading, setLoading] = useState(false);

  const updateStatus = async (newStatus: 'pendente' | 'conciliado' | 'ignorado') => {
    setLoading(true);
    try {
      let success = false;
      
      if (newStatus === 'ignorado') {
        success = await markTransactionAsIgnored(transactionId);
      } else if (newStatus === 'pendente') {
        success = await resetTransactionStatus(transactionId);
      }

      if (success) {
        setStatus(newStatus);
      }
      
      return success;
    } catch (error) {
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    status,
    setStatus,
    updateStatus,
    loading,
    isFaded: shouldShowFaded(status),
    statusInfo: getStatusBadge(status)
  };
}
