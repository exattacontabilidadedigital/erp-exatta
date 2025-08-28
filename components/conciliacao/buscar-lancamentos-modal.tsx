import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Search, Filter, X, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface Lancamento {
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

interface BuscarLancamentosModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLancamento?: (lancamento: Lancamento) => void;
  transacaoSelecionada?: any;
  filtrosIniciais?: {
    dataInicio?: string;
    dataFim?: string;
    valor?: number;
    toleranciaValor?: number;
  };
}

export default function BuscarLancamentosModal({
  isOpen,
  onClose,
  onSelectLancamento,
  transacaoSelecionada,
  filtrosIniciais
}: BuscarLancamentosModalProps) {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Estados dos filtros
  const [filtros, setFiltros] = useState({
    busca: '',
    dataInicio: filtrosIniciais?.dataInicio || '',
    dataFim: filtrosIniciais?.dataFim || '',
    valorMin: '',
    valorMax: '',
    tipo: '' as '' | 'receita' | 'despesa',
    status: 'pendente' as '' | 'pendente' | 'conciliado',
    planoContaId: '',
    centroCustoId: ''
  });

  // Estado para debug
  const [debugInfo, setDebugInfo] = useState<any>(null);

  // Função para resetar filtros
  const resetarFiltros = useCallback(() => {
    console.log('🔄 Resetando todos os filtros...');
    setFiltros({
      busca: '',
      dataInicio: '',
      dataFim: '',
      valorMin: '',
      valorMax: '',
      tipo: '',
      status: 'pendente', // Manter apenas pendente como padrão
      planoContaId: '',
      centroCustoId: ''
    });
    setCurrentPage(1);
  }, []);

  // Função principal de busca
  const buscarLancamentos = useCallback(async (page = 1, limparLista = false) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('🔍 BUSCAR LANÇAMENTOS - Iniciando busca...');
      console.log('📊 Parâmetros:', { page, filtros, transacaoSelecionada });

      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '20'); // Aumentei de 10 para 20

      // Aplicar filtros apenas se preenchidos
      if (filtros.busca.trim()) {
        params.append('busca', filtros.busca.trim());
      }
      
      if (filtros.dataInicio) {
        params.append('dataInicio', filtros.dataInicio);
      }
      
      if (filtros.dataFim) {
        params.append('dataFim', filtros.dataFim);
      }
      
      if (filtros.valorMin) {
        params.append('valorMin', filtros.valorMin);
      }
      
      if (filtros.valorMax) {
        params.append('valorMax', filtros.valorMax);
      }
      
      if (filtros.tipo) {
        params.append('tipo', filtros.tipo);
      }
      
      if (filtros.status) {
        params.append('status', filtros.status);
      }

      // Filtros inteligentes baseados na transação selecionada
      if (transacaoSelecionada && !filtros.busca && !filtros.valorMin && !filtros.valorMax) {
        const valorTransacao = Math.abs(parseFloat(transacaoSelecionada.valor));
        const tolerancia = filtrosIniciais?.toleranciaValor || 0.05; // 5% de tolerância
        
        const valorMin = valorTransacao * (1 - tolerancia);
        const valorMax = valorTransacao * (1 + tolerancia);
        
        params.append('valorMin', valorMin.toFixed(2));
        params.append('valorMax', valorMax.toFixed(2));
        
        console.log('💡 Filtro inteligente aplicado:', {
          valorTransacao,
          valorMin: valorMin.toFixed(2),
          valorMax: valorMax.toFixed(2),
          tolerancia: `${(tolerancia * 100)}%`
        });
      }

      const url = `/api/conciliacao/buscar-existentes?${params.toString()}`;
      console.log('🌐 URL da requisição:', url);

      const response = await fetch(url);
      console.log('📡 Resposta da API:', response.status, response.statusText);

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📦 Dados recebidos da API:', {
        lancamentos: data.lancamentos?.length || 0,
        total: data.total,
        page: data.page,
        hasMore: data.hasMore,
        estrutura: data.lancamentos?.[0] ? Object.keys(data.lancamentos[0]) : 'array vazio'
      });

      // Debug completo dos dados
      setDebugInfo({
        url,
        params: Object.fromEntries(params),
        response: {
          status: response.status,
          dataKeys: Object.keys(data),
          lancamentosCount: data.lancamentos?.length || 0,
          total: data.total,
          hasMore: data.hasMore
        },
        timestamp: new Date().toISOString()
      });

      const novosLancamentos = data.lancamentos || [];
      
      if (limparLista || page === 1) {
        console.log('🔄 Substituindo lista completa com', novosLancamentos.length, 'itens');
        setLancamentos(novosLancamentos);
      } else {
        console.log('➕ Adicionando', novosLancamentos.length, 'itens à lista existente');
        setLancamentos(prev => [...prev, ...novosLancamentos]);
      }

      setTotalCount(data.total || 0);
      setCurrentPage(page);
      setHasMore(data.hasMore || false);

      console.log('✅ Estado atualizado:', {
        lancamentosNoEstado: limparLista || page === 1 ? novosLancamentos.length : 'adicionados à lista',
        totalCount: data.total || 0,
        currentPage: page,
        hasMore: data.hasMore || false
      });

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('❌ Erro na busca:', err);
      setError(errorMsg);
      
      if (limparLista || page === 1) {
        setLancamentos([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [filtros, transacaoSelecionada, filtrosIniciais]);

  // Buscar ao abrir o modal
  useEffect(() => {
    if (isOpen) {
      console.log('🚪 Modal aberto - iniciando busca inicial');
      buscarLancamentos(1, true);
    } else {
      // Reset quando fechar
      setLancamentos([]);
      setCurrentPage(1);
      setError(null);
      setDebugInfo(null);
    }
  }, [isOpen, buscarLancamentos]);

  // Função para carregar mais resultados
  const carregarMais = useCallback(() => {
    if (!isLoading && hasMore) {
      console.log('📄 Carregando página', currentPage + 1);
      buscarLancamentos(currentPage + 1, false);
    }
  }, [isLoading, hasMore, currentPage, buscarLancamentos]);

  // Função para aplicar filtros
  const aplicarFiltros = useCallback(() => {
    console.log('🔍 Aplicando filtros:', filtros);
    buscarLancamentos(1, true);
  }, [buscarLancamentos, filtros]);

  // Formatação de valores
  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(Math.abs(valor));
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Buscar Lançamentos Existentes</DialogTitle>
          <DialogDescription>
            Encontre lançamentos para conciliar com a transação bancária
            {totalCount > 0 && ` • ${totalCount} lançamentos encontrados`}
          </DialogDescription>
        </DialogHeader>

        {/* Debug Info (só em desenvolvimento) */}
        {process.env.NODE_ENV === 'development' && debugInfo && (
          <div className="bg-gray-900 text-gray-100 p-3 rounded text-xs font-mono max-h-32 overflow-auto">
            <div className="text-yellow-400">🔍 DEBUG INFO:</div>
            <div>URL: {debugInfo.url}</div>
            <div>Params: {JSON.stringify(debugInfo.params)}</div>
            <div>Response: {JSON.stringify(debugInfo.response)}</div>
            <div>Timestamp: {debugInfo.timestamp}</div>
          </div>
        )}

        {/* Transação de Referência */}
        {transacaoSelecionada && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-700 mb-2">Transação Bancária de Referência</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Data:</span>
                <span className="ml-2 font-medium">{formatarData(transacaoSelecionada.data)}</span>
              </div>
              <div>
                <span className="text-gray-600">Valor:</span>
                <span className="ml-2 font-medium">{formatarMoeda(transacaoSelecionada.valor)}</span>
              </div>
              <div>
                <span className="text-gray-600">Descrição:</span>
                <span className="ml-2">{transacaoSelecionada.descricao}</span>
              </div>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="space-y-4 border-b pb-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Input
              placeholder="Buscar por descrição..."
              value={filtros.busca}
              onChange={(e) => setFiltros(prev => ({ ...prev, busca: e.target.value }))}
              className="col-span-2"
            />
            
            <Select 
              value={filtros.tipo} 
              onValueChange={(value) => setFiltros(prev => ({ ...prev, tipo: value as any }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os tipos</SelectItem>
                <SelectItem value="receita">Receita</SelectItem>
                <SelectItem value="despesa">Despesa</SelectItem>
              </SelectContent>
            </Select>

            <Select 
              value={filtros.status} 
              onValueChange={(value) => setFiltros(prev => ({ ...prev, status: value as any }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os status</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="conciliado">Conciliado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Input
              type="date"
              placeholder="Data inicial"
              value={filtros.dataInicio}
              onChange={(e) => setFiltros(prev => ({ ...prev, dataInicio: e.target.value }))}
            />
            
            <Input
              type="date"
              placeholder="Data final"
              value={filtros.dataFim}
              onChange={(e) => setFiltros(prev => ({ ...prev, dataFim: e.target.value }))}
            />
            
            <Input
              type="number"
              step="0.01"
              placeholder="Valor mínimo"
              value={filtros.valorMin}
              onChange={(e) => setFiltros(prev => ({ ...prev, valorMin: e.target.value }))}
            />
            
            <Input
              type="number"
              step="0.01"
              placeholder="Valor máximo"
              value={filtros.valorMax}
              onChange={(e) => setFiltros(prev => ({ ...prev, valorMax: e.target.value }))}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={aplicarFiltros} disabled={isLoading}>
              <Search className="h-4 w-4 mr-2" />
              {isLoading ? 'Buscando...' : 'Buscar'}
            </Button>
            
            <Button onClick={resetarFiltros} variant="outline">
              <X className="h-4 w-4 mr-2" />
              Limpar Filtros
            </Button>
            
            <Button onClick={() => buscarLancamentos(1, true)} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Conteúdo principal */}
        <div className="flex-1 overflow-auto">
          {error && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-4">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">Erro ao buscar lançamentos</span>
              </div>
              <p className="text-red-600 text-sm mt-1">{error}</p>
              <Button 
                onClick={() => buscarLancamentos(1, true)} 
                size="sm" 
                variant="outline"
                className="mt-2"
              >
                Tentar novamente
              </Button>
            </div>
          )}

          {isLoading && lancamentos.length === 0 && (
            <div className="text-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
              <p className="text-gray-600">Carregando lançamentos...</p>
            </div>
          )}

          {!isLoading && !error && lancamentos.length === 0 && (
            <div className="text-center py-12">
              <AlertCircle className="h-8 w-8 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">Nenhum lançamento encontrado</p>
              <p className="text-sm text-gray-500 mt-1">
                Tente ajustar os filtros ou verificar se há lançamentos cadastrados
              </p>
            </div>
          )}

          {lancamentos.length > 0 && (
            <div className="space-y-4">
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Plano de Contas</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lancamentos.map((lancamento) => (
                      <TableRow key={lancamento.id} className="hover:bg-gray-50">
                        <TableCell>{formatarData(lancamento.data_lancamento)}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {lancamento.descricao}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatarMoeda(lancamento.valor)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={lancamento.tipo === 'receita' ? 'default' : 'destructive'}>
                            {lancamento.tipo === 'receita' ? 'Receita' : 'Despesa'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={lancamento.status === 'pendente' ? 'secondary' : 'outline'}>
                            {lancamento.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {lancamento.plano_contas?.nome || '-'}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => onSelectLancamento?.(lancamento)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Selecionar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Paginação */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Mostrando {lancamentos.length} de {totalCount} lançamentos
                </p>
                
                {hasMore && (
                  <Button 
                    onClick={carregarMais} 
                    disabled={isLoading}
                    variant="outline"
                  >
                    {isLoading ? 'Carregando...' : 'Carregar mais'}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t pt-4 flex justify-end">
          <Button onClick={onClose} variant="outline">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
