'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Search, Filter, Calendar } from 'lucide-react';

interface Lancamento {
  id: string;
  tipo: 'receita' | 'despesa';
  data_lancamento: string;
  descricao: string;
  valor: number;
  status: string;
  numero_documento?: string;
  plano_conta?: {
    nome: string;
    codigo: string;
  };
  cliente_fornecedor?: {
    nome: string;
  };
  conta_bancaria?: {
    nome: string;
  };
}

interface BuscarExistenteFullscreenProps {
  isOpen: boolean;
  onClose: () => void;
  onMatch?: (lancamentoId: string) => void;
  valorExtrato?: number;
  dataExtrato?: string;
}

export default function BuscarExistenteFullscreen({
  isOpen,
  onClose,
  onMatch,
  valorExtrato,
  dataExtrato
}: BuscarExistenteFullscreenProps) {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalLancamentos, setTotalLancamentos] = useState(0);
  const itemsPerPage = 10;

  const [filtros, setFiltros] = useState({
    termoBusca: '',
    dataInicio: '',
    dataFim: '',
    contasBancarias: [] as string[]
  });

  useEffect(() => {
    if (isOpen) {
      console.log('🎯 Modal fullscreen aberto - carregando todos os lançamentos');
      buscarLancamentos();
    }
  }, [isOpen, currentPage]);

  const buscarLancamentos = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (filtros.termoBusca) {
        params.append('termoBusca', filtros.termoBusca);
      }
      
      if (filtros.dataInicio) {
        const dataFormatada = new Date(filtros.dataInicio).toISOString().split('T')[0];
        params.append('dataInicio', dataFormatada);
      }
      
      if (filtros.dataFim) {
        const dataFormatada = new Date(filtros.dataFim).toISOString().split('T')[0];
        params.append('dataFim', dataFormatada);
      }

      filtros.contasBancarias.forEach(conta => {
        params.append('contasBancarias', conta);
      });

      params.append('page', currentPage.toString());
      params.append('limit', itemsPerPage.toString());

      console.log('🔍 Buscando lançamentos fullscreen com parâmetros:', {
        url: `/api/conciliacao/buscar-existentes?${params.toString()}`,
        filtros,
        page: currentPage,
        limit: itemsPerPage
      });

      const response = await fetch(`/api/conciliacao/buscar-existentes?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }

      const data = await response.json();
      
      console.log('📄 Resposta da API fullscreen:', {
        status: response.status,
        total: data.total,
        lancamentos: data.lancamentos?.length || 0,
        currentPage,
        data
      });

      if (data.success) {
        console.log('✅ Atualizando estado fullscreen com lançamentos:', data.lancamentos);
        setLancamentos(data.lancamentos || []);
        setTotalLancamentos(data.total || 0);
      } else {
        console.error('❌ Erro na resposta da API fullscreen:', data.error);
        setLancamentos([]);
        setTotalLancamentos(0);
      }
    } catch (error) {
      console.error('❌ Erro ao buscar lançamentos fullscreen:', error);
      setLancamentos([]);
      setTotalLancamentos(0);
    } finally {
      setLoading(false);
    }
  };

  const limparFiltros = () => {
    setFiltros({
      termoBusca: '',
      dataInicio: '',
      dataFim: '',
      contasBancarias: []
    });
    setCurrentPage(1);
  };

  const formatarData = (data: string) => {
    try {
      return new Date(data + 'T12:00:00').toLocaleDateString('pt-BR');
    } catch (error) {
      return data;
    }
  };

  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const totalPages = Math.ceil(totalLancamentos / itemsPerPage);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg w-full h-full max-w-7xl max-h-screen flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Buscar Lançamento Existente
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Selecione um lançamento para conciliar com a transação bancária
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Filtros */}
        <div className="p-6 border-b bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buscar por descrição
              </label>
              <Input
                placeholder="Digite para buscar..."
                value={filtros.termoBusca}
                onChange={(e) => setFiltros(prev => ({ ...prev, termoBusca: e.target.value }))}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Início
              </label>
              <Input
                type="date"
                value={filtros.dataInicio}
                onChange={(e) => setFiltros(prev => ({ ...prev, dataInicio: e.target.value }))}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Fim
              </label>
              <Input
                type="date"
                value={filtros.dataFim}
                onChange={(e) => setFiltros(prev => ({ ...prev, dataFim: e.target.value }))}
                className="w-full"
              />
            </div>
            
            <div className="flex items-end gap-2">
              <Button
                onClick={buscarLancamentos}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Search className="h-4 w-4 mr-2" />
                {loading ? 'Buscando...' : 'Buscar'}
              </Button>
              <Button
                variant="outline"
                onClick={limparFiltros}
                disabled={loading}
              >
                <Filter className="h-4 w-4 mr-2" />
                Limpar
              </Button>
            </div>
          </div>
        </div>

        {/* Área de Resultados */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500">Carregando lançamentos...</div>
            </div>
          ) : (
            <div className="h-full overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Data</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Documento</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Descrição</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Plano de Contas</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Conta Bancária</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Valor</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-700">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {lancamentos.map((lancamento) => {
                    console.log('🎨 Renderizando linha fullscreen:', {
                      id: lancamento.id.substring(0, 8),
                      valor: lancamento.valor,
                      data: lancamento.data_lancamento,
                      descricao: lancamento.descricao
                    });
                    
                    return (
                      <tr key={lancamento.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm">
                          {formatarData(lancamento.data_lancamento)}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {lancamento.numero_documento || '-'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-sm">
                            {lancamento.descricao || '-'}
                          </div>
                          <div className="text-xs text-gray-500">
                            ID: {lancamento.id.substring(0, 8)}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {lancamento.plano_conta ? (
                            <div>
                              <div className="font-medium">
                                {lancamento.plano_conta.nome}
                              </div>
                              <div className="text-xs text-gray-500">
                                Cód: {lancamento.plano_conta.codigo}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {lancamento.conta_bancaria?.nome || '-'}
                        </td>
                        <td className="py-3 px-4 text-sm font-medium">
                          <span className={lancamento.tipo === 'receita' ? 'text-green-600' : 'text-red-600'}>
                            {formatarValor(lancamento.valor)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            lancamento.status === 'pago' 
                              ? 'bg-green-100 text-green-800'
                              : lancamento.status === 'pendente'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {lancamento.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Button
                            size="sm"
                            onClick={() => {
                              if (onMatch) {
                                onMatch(lancamento.id);
                              }
                              onClose();
                            }}
                            className="bg-gray-800 hover:bg-gray-900 text-white text-xs px-3 py-1.5 rounded"
                          >
                            ✓ Conciliar
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {lancamentos.length === 0 && !loading && (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-lg font-medium mb-2">Nenhum lançamento encontrado</div>
                  <div className="text-sm">Tente ajustar os filtros para encontrar mais resultados</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Paginação */}
        {totalLancamentos > 0 && (
          <div className="p-6 border-t bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalLancamentos)} de {totalLancamentos} resultados
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1 || loading}
                >
                  Anterior
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNumber = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                    if (pageNumber > totalPages) return null;
                    
                    return (
                      <Button
                        key={pageNumber}
                        variant={currentPage === pageNumber ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNumber)}
                        disabled={loading}
                        className="w-8 h-8 p-0"
                      >
                        {pageNumber}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || loading}
                >
                  Próxima
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
