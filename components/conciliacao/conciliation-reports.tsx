import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { BarChart, LineChart, PieChart, TrendingUp, TrendingDown, Activity, DollarSign, Calendar, Building } from 'lucide-react';

interface RelatorioProps {
  bancoId?: string;
  onBancoChange?: (bancoId: string) => void;
}

interface EstatisticasGerais {
  totalTransacoes: number;
  totalConciliadas: number;
  totalNaoConciliadas: number;
  percentualConciliacao: string;
  lancamentosPendentes: number;
}

interface Valores {
  totalCreditos: number;
  totalDebitos: number;
  creditosConciliados: number;
  debitosConciliados: number;
  creditosNaoConciliados: number;
  debitosNaoConciliados: number;
}

interface DadosRelatorio {
  periodo: {
    dias: number;
    dataInicio: string;
    dataFim: string;
  };
  geral: EstatisticasGerais;
  valores: Valores;
  porBanco: any[];
  evolucaoDiaria: any[];
}

export default function ConciliationReports({ bancoId, onBancoChange }: RelatorioProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [dadosRelatorio, setDadosRelatorio] = useState<DadosRelatorio | null>(null);
  const [bancos, setBancos] = useState<any[]>([]);
  const [periodo, setPeriodo] = useState('30');
  const [tipoVisualizacao, setTipoVisualizacao] = useState('resumo');
  const [dataInicio, setDataInicio] = useState<Date | undefined>();
  const [dataFim, setDataFim] = useState<Date | undefined>();

  // Carregar bancos
  useEffect(() => {
    carregarBancos();
  }, []);

  // Carregar dados quando parâmetros mudarem
  useEffect(() => {
    if (bancoId) {
      carregarEstatisticas();
    }
  }, [bancoId, periodo, dataInicio, dataFim]);

  const carregarBancos = async () => {
    try {
      const response = await fetch('/api/contas-bancarias');
      if (response.ok) {
        const data = await response.json();
        setBancos(data.contas || []);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar bancos:', error);
    }
  };

  const carregarEstatisticas = async () => {
    setIsLoading(true);
    
    try {
      const params = new URLSearchParams();
      if (bancoId) params.append('bancoId', bancoId);
      if (periodo) params.append('periodo', periodo);

      const response = await fetch(`/api/conciliacao/estatisticas?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar estatísticas');
      }

      const data = await response.json();
      setDadosRelatorio(data);
      
    } catch (error) {
      console.error('❌ Erro ao carregar estatísticas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportarRelatorio = async (formato: 'csv' | 'excel' | 'json') => {
    try {
      const response = await fetch('/api/conciliacao/relatorio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bancoId,
          dataInicio: dataInicio?.toISOString().split('T')[0],
          dataFim: dataFim?.toISOString().split('T')[0],
          formato,
          incluirDetalhes: true
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio-conciliacao-${new Date().toISOString().split('T')[0]}.${formato}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('❌ Erro ao exportar relatório:', error);
    }
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const formatarPercentual = (valor: string | number) => {
    const num = typeof valor === 'string' ? parseFloat(valor) : valor;
    return `${num.toFixed(2)}%`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center h-48">
            <div className="text-center">
              <Activity className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-600" />
              <p className="text-gray-600">Carregando relatórios...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Relatórios de Conciliação</CardTitle>
          <CardDescription>
            Visualize estatísticas e insights sobre o processo de conciliação bancária
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Banco</label>
              <Select value={bancoId || ''} onValueChange={onBancoChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um banco" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os bancos</SelectItem>
                  {bancos.map((banco) => (
                    <SelectItem key={banco.id} value={banco.id}>
                      {banco.nome} - {banco.banco}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Período</label>
              <Select value={periodo} onValueChange={setPeriodo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Últimos 7 dias</SelectItem>
                  <SelectItem value="30">Últimos 30 dias</SelectItem>
                  <SelectItem value="90">Últimos 90 dias</SelectItem>
                  <SelectItem value="365">Último ano</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Visualização</label>
              <Select value={tipoVisualizacao} onValueChange={setTipoVisualizacao}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="resumo">Resumo Geral</SelectItem>
                  <SelectItem value="evolucao">Evolução Temporal</SelectItem>
                  <SelectItem value="valores">Análise de Valores</SelectItem>
                  <SelectItem value="bancos">Por Banco</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-2">
              <Button onClick={carregarEstatisticas} className="flex-1">
                Atualizar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo Geral */}
      {dadosRelatorio && tipoVisualizacao === 'resumo' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total de Transações</p>
                    <p className="text-2xl font-bold">{dadosRelatorio.geral.totalTransacoes}</p>
                  </div>
                  <Activity className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Conciliadas</p>
                    <p className="text-2xl font-bold text-green-600">{dadosRelatorio.geral.totalConciliadas}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Não Conciliadas</p>
                    <p className="text-2xl font-bold text-red-600">{dadosRelatorio.geral.totalNaoConciliadas}</p>
                  </div>
                  <TrendingDown className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Taxa de Conciliação</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatarPercentual(dadosRelatorio.geral.percentualConciliacao)}
                    </p>
                  </div>
                  <BarChart className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Análise de Valores */}
          <Card>
            <CardHeader>
              <CardTitle>Análise de Valores</CardTitle>
              <CardDescription>Breakdown dos valores por tipo e status de conciliação</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Créditos */}
                <div className="space-y-4">
                  <h4 className="font-medium text-green-600">Créditos</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="text-sm">Total</span>
                      <span className="font-medium">{formatarMoeda(dadosRelatorio.valores.totalCreditos)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-100 rounded-lg">
                      <span className="text-sm">Conciliados</span>
                      <span className="font-medium">{formatarMoeda(dadosRelatorio.valores.creditosConciliados)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                      <span className="text-sm">Não Conciliados</span>
                      <span className="font-medium">{formatarMoeda(dadosRelatorio.valores.creditosNaoConciliados)}</span>
                    </div>
                  </div>
                </div>

                {/* Débitos */}
                <div className="space-y-4">
                  <h4 className="font-medium text-red-600">Débitos</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                      <span className="text-sm">Total</span>
                      <span className="font-medium">{formatarMoeda(dadosRelatorio.valores.totalDebitos)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-100 rounded-lg">
                      <span className="text-sm">Conciliados</span>
                      <span className="font-medium">{formatarMoeda(dadosRelatorio.valores.debitosConciliados)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-red-100 rounded-lg">
                      <span className="text-sm">Não Conciliados</span>
                      <span className="font-medium">{formatarMoeda(dadosRelatorio.valores.debitosNaoConciliados)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Evolução Temporal */}
      {dadosRelatorio && tipoVisualizacao === 'evolucao' && (
        <Card>
          <CardHeader>
            <CardTitle>Evolução Diária</CardTitle>
            <CardDescription>Tendência de conciliação nos últimos dias</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dadosRelatorio.evolucaoDiaria.map((dia: any, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-gray-500" />
                    <span className="font-medium">{new Date(dia.data).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-sm text-gray-600">Total</div>
                      <div className="font-medium">{dia.total}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-600">Conciliadas</div>
                      <div className="font-medium text-green-600">{dia.conciliadas}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-600">Taxa</div>
                      <Badge className={
                        parseFloat(dia.percentual) >= 80 ? 'bg-green-100 text-green-800' :
                        parseFloat(dia.percentual) >= 60 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }>
                        {dia.percentual}%
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Por Banco */}
      {dadosRelatorio && tipoVisualizacao === 'bancos' && dadosRelatorio.porBanco.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Análise por Banco</CardTitle>
            <CardDescription>Performance de conciliação por instituição bancária</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dadosRelatorio.porBanco.map((banco: any, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Building className="h-5 w-5 text-gray-500" />
                      <div>
                        <h4 className="font-medium">{banco.banco.nome}</h4>
                        <p className="text-sm text-gray-600">{banco.banco.banco}</p>
                      </div>
                    </div>
                    <Badge className={
                      parseFloat(banco.percentualConciliacao) >= 80 ? 'bg-green-100 text-green-800' :
                      parseFloat(banco.percentualConciliacao) >= 60 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }>
                      {banco.percentualConciliacao}% conciliado
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className="text-lg font-bold">{banco.total}</div>
                      <div className="text-xs text-gray-600">Total</div>
                    </div>
                    <div className="text-center p-2 bg-green-50 rounded">
                      <div className="text-lg font-bold text-green-600">{banco.conciliadas}</div>
                      <div className="text-xs text-gray-600">Conciliadas</div>
                    </div>
                    <div className="text-center p-2 bg-red-50 rounded">
                      <div className="text-lg font-bold text-red-600">{banco.naoConciliadas}</div>
                      <div className="text-xs text-gray-600">Pendentes</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ações de Exportação */}
      <Card>
        <CardHeader>
          <CardTitle>Exportação</CardTitle>
          <CardDescription>Baixe os relatórios em diferentes formatos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button 
              onClick={() => exportarRelatorio('csv')}
              variant="outline"
            >
              Exportar CSV
            </Button>
            <Button 
              onClick={() => exportarRelatorio('excel')}
              variant="outline"
            >
              Exportar Excel
            </Button>
            <Button 
              onClick={() => exportarRelatorio('json')}
              variant="outline"
            >
              Exportar JSON
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
