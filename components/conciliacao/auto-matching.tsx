import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, Eye, Trash2 } from 'lucide-react';

interface BankTransaction {
  id: string;
  data: string;
  descricao: string;
  valor: number;
  tipo: 'credito' | 'debito';
  conta_bancaria?: {
    nome: string;
    banco: string;
  };
}

interface SystemTransaction {
  id: string;
  data_lancamento: string;
  descricao: string;
  valor: number;
  tipo: 'receita' | 'despesa';
  status: string;
  plano_contas?: {
    nome: string;
  };
  centro_custos?: {
    nome: string;
  };
}

interface MatchSuggestion {
  transacao_bancaria: BankTransaction;
  lancamento: SystemTransaction;
  confianca: number;
  pontuacao: number;
  motivos: string[];
  detalhes: {
    diferencaValor: string;
    percentualDiferenca: string;
    diferencaDias: string;
    valorTransacao: string;
    valorLancamento: string;
  };
}

interface AutoMatchingProps {
  bancoId?: string;
  dataInicio?: string;
  dataFim?: string;
  status?: string;
  onMatchConfirmed?: (transacaoBancariaId: string, lancamentoId: string) => void;
  onError?: (error: string) => void;
}

export default function AutoMatching({ 
  bancoId, 
  dataInicio, 
  dataFim, 
  status = 'pendente',
  onMatchConfirmed,
  onError 
}: AutoMatchingProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [sugestoes, setSugestoes] = useState<MatchSuggestion[]>([]);
  const [estatisticas, setEstatisticas] = useState<any>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<MatchSuggestion | null>(null);
  const [confirmedMatches, setConfirmedMatches] = useState<Set<string>>(new Set());

  const buscarSugestoes = useCallback(async () => {
    if (!bancoId) {
      onError?.('Selecione uma conta bancária para buscar sugestões');
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('🔍 Buscando sugestões de pareamento...');
      
      const response = await fetch('/api/conciliacao/sugerir-pareamento', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bancoId,
          dataInicio,
          dataFim,
          status
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar sugestões de pareamento');
      }

      const data = await response.json();
      
      console.log('✅ Sugestões encontradas:', data.estatisticas);
      
      setSugestoes(data.sugestoes || []);
      setEstatisticas(data.estatisticas);
      
    } catch (error) {
      console.error('❌ Erro ao buscar sugestões:', error);
      onError?.(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  }, [bancoId, dataInicio, dataFim, status, onError]);

  const confirmarPareamento = useCallback(async (sugestao: MatchSuggestion) => {
    try {
      console.log('✅ Confirmando pareamento:', {
        transacao: sugestao.transacao_bancaria.id,
        lancamento: sugestao.lancamento.id
      });

      const response = await fetch('/api/conciliacao/confirmar-pareamento', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transacaoBancariaId: sugestao.transacao_bancaria.id,
          lancamentoId: sugestao.lancamento.id,
          observacoes: `Pareamento automático - Confiança: ${(sugestao.confianca * 100).toFixed(1)}%`
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao confirmar pareamento');
      }

      // Marcar como confirmado
      setConfirmedMatches(prev => new Set([...prev, sugestao.transacao_bancaria.id]));
      
      // Remover da lista de sugestões
      setSugestoes(prev => prev.filter(s => s.transacao_bancaria.id !== sugestao.transacao_bancaria.id));
      
      onMatchConfirmed?.(sugestao.transacao_bancaria.id, sugestao.lancamento.id);
      
      console.log('✅ Pareamento confirmado com sucesso');
      
    } catch (error) {
      console.error('❌ Erro ao confirmar pareamento:', error);
      onError?.(error instanceof Error ? error.message : 'Erro ao confirmar pareamento');
    }
  }, [onMatchConfirmed, onError]);

  const rejeitarSugestao = useCallback((sugestaoId: string) => {
    setSugestoes(prev => prev.filter(s => s.transacao_bancaria.id !== sugestaoId));
  }, []);

  const getConfidenceColor = (confianca: number) => {
    if (confianca >= 0.8) return 'bg-green-100 text-green-800 border-green-200';
    if (confianca >= 0.6) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getConfidenceIcon = (confianca: number) => {
    if (confianca >= 0.8) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (confianca >= 0.6) return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    return <XCircle className="h-4 w-4 text-red-600" />;
  };

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Pareamento Automático
            <Button 
              onClick={buscarSugestoes} 
              disabled={isLoading || !bancoId}
              className="ml-auto"
            >
              {isLoading ? 'Buscando...' : 'Buscar Sugestões'}
            </Button>
          </CardTitle>
          <CardDescription>
            Sistema inteligente de pareamento entre transações bancárias e lançamentos
          </CardDescription>
        </CardHeader>
        
        {estatisticas && (
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{estatisticas.transacoesBanco}</div>
                <div className="text-sm text-gray-600">Transações Bancárias</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{estatisticas.lancamentos}</div>
                <div className="text-sm text-gray-600">Lançamentos</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{estatisticas.sugestoes}</div>
                <div className="text-sm text-gray-600">Sugestões</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{estatisticas.altaConfianca}</div>
                <div className="text-sm text-gray-600">Alta Confiança</div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Lista de sugestões */}
      {sugestoes.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Sugestões de Pareamento</h3>
          
          {sugestoes.map((sugestao, index) => (
            <Card key={sugestao.transacao_bancaria.id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  {/* Informações da sugestão */}
                  <div className="flex-1 space-y-4">
                    {/* Header com confiança */}
                    <div className="flex items-center gap-3">
                      {getConfidenceIcon(sugestao.confianca)}
                      <Badge className={getConfidenceColor(sugestao.confianca)}>
                        {(sugestao.confianca * 100).toFixed(1)}% de confiança
                      </Badge>
                      <span className="text-sm text-gray-500">
                        Sugestão #{index + 1}
                      </span>
                    </div>

                    {/* Comparação lado a lado */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Transação Bancária */}
                      <div className="space-y-2">
                        <h4 className="font-medium text-blue-600">Transação Bancária</h4>
                        <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                          <div>
                            <span className="text-sm text-gray-600">Data:</span>
                            <span className="ml-2 font-medium">{sugestao.transacao_bancaria.data}</span>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600">Descrição:</span>
                            <span className="ml-2">{sugestao.transacao_bancaria.descricao}</span>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600">Valor:</span>
                            <span className="ml-2 font-medium">
                              R$ {Math.abs(sugestao.transacao_bancaria.valor).toFixed(2)}
                            </span>
                            <Badge variant="outline" className="ml-2">
                              {sugestao.transacao_bancaria.valor >= 0 ? 'Crédito' : 'Débito'}
                            </Badge>
                          </div>
                          {sugestao.transacao_bancaria.conta_bancaria && (
                            <div>
                              <span className="text-sm text-gray-600">Banco:</span>
                              <span className="ml-2">{sugestao.transacao_bancaria.conta_bancaria.nome}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Lançamento */}
                      <div className="space-y-2">
                        <h4 className="font-medium text-purple-600">Lançamento</h4>
                        <div className="bg-purple-50 p-4 rounded-lg space-y-2">
                          <div>
                            <span className="text-sm text-gray-600">Data:</span>
                            <span className="ml-2 font-medium">{sugestao.lancamento.data_lancamento}</span>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600">Descrição:</span>
                            <span className="ml-2">{sugestao.lancamento.descricao}</span>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600">Valor:</span>
                            <span className="ml-2 font-medium">
                              R$ {Math.abs(sugestao.lancamento.valor).toFixed(2)}
                            </span>
                            <Badge variant="outline" className="ml-2">
                              {sugestao.lancamento.tipo === 'receita' ? 'Receita' : 'Despesa'}
                            </Badge>
                          </div>
                          {sugestao.lancamento.plano_contas && (
                            <div>
                              <span className="text-sm text-gray-600">Plano de Contas:</span>
                              <span className="ml-2">{sugestao.lancamento.plano_contas.nome}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Motivos do pareamento */}
                    <div className="space-y-2">
                      <h4 className="font-medium">Motivos do Pareamento</h4>
                      <div className="flex flex-wrap gap-2">
                        {sugestao.motivos.map((motivo, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {motivo}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Detalhes técnicos */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Diferença Valor:</span>
                        <div className="font-medium">R$ {sugestao.detalhes.diferencaValor}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">% Diferença:</span>
                        <div className="font-medium">{sugestao.detalhes.percentualDiferenca}%</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Diferença Dias:</span>
                        <div className="font-medium">{sugestao.detalhes.diferencaDias} dias</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Pontuação:</span>
                        <div className="font-medium">{sugestao.pontuacao}/100</div>
                      </div>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex flex-col gap-2 ml-6">
                    <Button
                      onClick={() => setSelectedSuggestion(sugestao)}
                      variant="outline"
                      size="sm"
                      className="whitespace-nowrap"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Detalhar
                    </Button>
                    <Button
                      onClick={() => confirmarPareamento(sugestao)}
                      size="sm"
                      className="whitespace-nowrap bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Confirmar
                    </Button>
                    <Button
                      onClick={() => rejeitarSugestao(sugestao.transacao_bancaria.id)}
                      variant="outline"
                      size="sm"
                      className="whitespace-nowrap border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Rejeitar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Estado vazio */}
      {!isLoading && sugestoes.length === 0 && estatisticas && (
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma sugestão encontrada
            </h3>
            <p className="text-gray-600 mb-4">
              Não foram encontradas correspondências automáticas para os critérios selecionados.
            </p>
            <Button variant="outline" onClick={buscarSugestoes}>
              Buscar Novamente
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Modal de detalhes */}
      {selectedSuggestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Detalhes da Sugestão</CardTitle>
              <Button
                onClick={() => setSelectedSuggestion(null)}
                variant="outline"
                size="sm"
                className="absolute top-4 right-4"
              >
                Fechar
              </Button>
            </CardHeader>
            <CardContent>
              {/* Conteúdo detalhado da sugestão */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  {getConfidenceIcon(selectedSuggestion.confianca)}
                  <Badge className={getConfidenceColor(selectedSuggestion.confianca)}>
                    {(selectedSuggestion.confianca * 100).toFixed(1)}% de confiança
                  </Badge>
                </div>

                {/* Mais detalhes podem ser adicionados aqui */}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
