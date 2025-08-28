import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Clock, AlertCircle, TrendingUp, Activity } from 'lucide-react';

interface ConciliationProgressProps {
  bancoId?: string;
  refreshInterval?: number; // em segundos
  onStatusChange?: (status: any) => void;
}

interface StatusConciliacao {
  totalTransacoes: number;
  conciliadas: number;
  pendentes: number;
  ignoradas: number;
  percentualConciliacao: number;
  ultimaAtualizacao: string;
  metasEstatisticas: {
    metaDiaria: number;
    conciliadoHoje: number;
    diasRestantes: number;
    projecaoFinal: number;
  };
}

export default function ConciliationProgress({ 
  bancoId, 
  refreshInterval = 30,
  onStatusChange 
}: ConciliationProgressProps) {
  const [status, setStatus] = useState<StatusConciliacao | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const buscarStatus = async () => {
    if (!bancoId) return;

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append('bancoId', bancoId);
      params.append('periodo', '30'); // Últimos 30 dias

      const response = await fetch(`/api/conciliacao/estatisticas?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Erro ao buscar status de conciliação');
      }

      const data = await response.json();
      
      // Transformar dados da API para o formato esperado
      const statusFormatado: StatusConciliacao = {
        totalTransacoes: data.geral.totalTransacoes,
        conciliadas: data.geral.totalConciliadas,
        pendentes: data.geral.totalNaoConciliadas,
        ignoradas: 0, // Adicionar se disponível na API
        percentualConciliacao: parseFloat(data.geral.percentualConciliacao),
        ultimaAtualizacao: data.metadata.dataConsulta,
        metasEstatisticas: {
          metaDiaria: 20, // Meta configurável
          conciliadoHoje: data.evolucaoDiaria?.[0]?.conciliadas || 0,
          diasRestantes: 30,
          projecaoFinal: data.geral.totalConciliadas + (data.geral.totalNaoConciliadas * 0.8) // Estimativa
        }
      };

      setStatus(statusFormatado);
      setLastUpdate(new Date());
      onStatusChange?.(statusFormatado);

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMsg);
      console.error('❌ Erro ao buscar status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    if (bancoId) {
      buscarStatus();
    }
  }, [bancoId]);

  // Atualização automática
  useEffect(() => {
    if (!bancoId || !refreshInterval) return;

    const interval = setInterval(() => {
      buscarStatus();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [bancoId, refreshInterval]);

  const getProgressColor = (percentual: number) => {
    if (percentual >= 90) return 'bg-green-500';
    if (percentual >= 70) return 'bg-blue-500';
    if (percentual >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusIcon = (percentual: number) => {
    if (percentual >= 90) return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (percentual >= 50) return <TrendingUp className="h-5 w-5 text-blue-500" />;
    return <AlertCircle className="h-5 w-5 text-yellow-500" />;
  };

  const formatarTempo = (data: string) => {
    return new Date(data).toLocaleString('pt-BR');
  };

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm">{error}</span>
            <Button 
              onClick={buscarStatus} 
              variant="outline" 
              size="sm"
              className="ml-auto"
            >
              Tentar Novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!bancoId) {
    return (
      <Card className="border-gray-200">
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">
            <Activity className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">Selecione um banco para visualizar o progresso</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading && !status) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <Activity className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-500" />
            <p className="text-sm text-gray-600">Carregando progresso...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!status) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Card Principal de Progresso */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(status.percentualConciliacao)}
              Progresso da Conciliação
            </CardTitle>
            <div className="flex items-center gap-2">
              {isLoading && <Activity className="h-4 w-4 animate-spin text-blue-500" />}
              <Badge variant="outline" className="text-xs">
                {status.percentualConciliacao.toFixed(1)}%
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Barra de Progresso Principal */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Conciliação Geral</span>
              <span className="font-medium">{status.conciliadas} de {status.totalTransacoes}</span>
            </div>
            <div className="relative">
              <Progress value={status.percentualConciliacao} className="h-3" />
              <div 
                className={`absolute top-0 left-0 h-3 rounded-full transition-all duration-500 ${getProgressColor(status.percentualConciliacao)}`}
                style={{ width: `${status.percentualConciliacao}%` }}
              />
            </div>
          </div>

          {/* Estatísticas Detalhadas */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-lg font-bold text-green-600">{status.conciliadas}</div>
              <div className="text-xs text-gray-600">Conciliadas</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-lg font-bold text-yellow-600">{status.pendentes}</div>
              <div className="text-xs text-gray-600">Pendentes</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-bold text-gray-600">{status.ignoradas}</div>
              <div className="text-xs text-gray-600">Ignoradas</div>
            </div>
          </div>

          {/* Meta Diária */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Meta Diária</span>
              <Badge 
                variant={status.metasEstatisticas.conciliadoHoje >= status.metasEstatisticas.metaDiaria ? "default" : "secondary"}
              >
                {status.metasEstatisticas.conciliadoHoje}/{status.metasEstatisticas.metaDiaria}
              </Badge>
            </div>
            <Progress 
              value={(status.metasEstatisticas.conciliadoHoje / status.metasEstatisticas.metaDiaria) * 100}
              className="h-2"
            />
          </div>

          {/* Informações de Tempo */}
          <div className="flex items-center justify-between text-xs text-gray-500 border-t pt-3">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Última atualização: {lastUpdate ? lastUpdate.toLocaleTimeString('pt-BR') : 'Nunca'}</span>
            </div>
            <Button 
              onClick={buscarStatus} 
              variant="ghost" 
              size="sm"
              disabled={isLoading}
              className="h-6 px-2"
            >
              Atualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Card de Projeções e Insights */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-sm mb-2">Projeção</h4>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Estimativa final:</span>
                  <span className="font-medium">{status.metasEstatisticas.projecaoFinal.toFixed(0)} transações</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Taxa estimada:</span>
                  <span className="font-medium">
                    {((status.metasEstatisticas.projecaoFinal / status.totalTransacoes) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-sm mb-2">Velocidade</h4>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Hoje:</span>
                  <span className="font-medium">{status.metasEstatisticas.conciliadoHoje} transações</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Média diária:</span>
                  <span className="font-medium">
                    {(status.conciliadas / Math.max(status.metasEstatisticas.diasRestantes, 1)).toFixed(1)} transações
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
