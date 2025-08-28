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

interface BuscarExistenteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMatch?: (lancamentoId: string) => void;
  valorExtrato?: number;
  dataExtrato?: string;
}

export default function BuscarExistenteModal({
  isOpen,
  onClose,
  onMatch,
  valorExtrato,
  dataExtrato
}: BuscarExistenteModalProps) {
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
      console.log('🎯 Modal de busca aberto - carregando lançamentos');
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

      console.log('🔍 Buscando lançamentos com parâmetros:', {
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
      
      console.log('📄 Resposta da API:', {
        status: response.status,
        total: data.total,
        lancamentos: data.lancamentos?.length || 0,
        currentPage,
        data
      });

      if (data.success) {
        console.log('✅ Atualizando estado com lançamentos:', data.lancamentos);
        setLancamentos(data.lancamentos || []);
        setTotalLancamentos(data.total || 0);
      } else {
        console.error('❌ Erro na resposta da API:', data.error);
        setLancamentos([]);
        setTotalLancamentos(0);
      }
    } catch (error) {
      console.error('❌ Erro ao buscar lançamentos:', error);
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
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Buscar Lançamento Existente
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Selecione um lançamento para conciliar
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buscar
              </label>
              <Input
                placeholder="Descrição ou documento..."
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
          </div>
          
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={limparFiltros}
              disabled={loading}
            >
              Limpar Filtros
            </Button>
            <Button
              onClick={buscarLancamentos}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Search className="h-4 w-4 mr-2" />
              {loading ? 'Buscando...' : 'Buscar'}
            </Button>
          </div>
        </div>

        {/* Resultados */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-gray-500">Carregando...</div>
            </div>
          ) : (
            <div className="flex-1 overflow-auto px-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium text-gray-700">Data</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-700">Descrição</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-700">Valor</th>
                    <th className="text-center py-3 px-2 font-medium text-gray-700">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {lancamentos.map((lancamento) => (
                    <tr key={lancamento.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-2 text-sm">
                        {formatarData(lancamento.data_lancamento)}
                      </td>
                      <td className="py-3 px-2">
                        <div className="font-medium text-sm">
                          {lancamento.descricao || '-'}
                        </div>
                        <div className="text-xs text-gray-500">
                          Status: {lancamento.status}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-sm font-medium">
                        <span className={lancamento.tipo === 'receita' ? 'text-green-600' : 'text-red-600'}>
                          {formatarValor(lancamento.valor)}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center">
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
                  ))}
                </tbody>
              </table>

              {lancamentos.length === 0 && !loading && (
                <div className="text-center py-8 text-gray-500">
                  Nenhum lançamento encontrado
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
                
                <span className="text-sm text-gray-700">
                  Página {currentPage} de {totalPages}
                </span>
                
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
