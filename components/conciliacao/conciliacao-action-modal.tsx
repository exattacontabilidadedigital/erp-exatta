import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, DollarSign, FileText, CheckCircle, XCircle, Pause } from 'lucide-react';

interface TransacaoBancaria {
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

interface ConciliacaoActionModalProps {
  transacao?: TransacaoBancaria;
  lancamento?: Lancamento;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (action: 'conciliar' | 'ignorar' | 'criar', data?: any) => void;
  onError?: (error: string) => void;
}

export default function ConciliacaoActionModal({
  transacao,
  lancamento,
  isOpen,
  onClose,
  onConfirm,
  onError
}: ConciliacaoActionModalProps) {
  const [selectedAction, setSelectedAction] = useState<'conciliar' | 'ignorar' | 'criar' | null>(null);
  const [observacoes, setObservacoes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [novoLancamento, setNovoLancamento] = useState({
    descricao: '',
    valor: 0,
    tipo: 'receita' as 'receita' | 'despesa',
    data_lancamento: '',
    plano_conta_id: '',
    centro_custo_id: ''
  });

  const resetModal = () => {
    setSelectedAction(null);
    setObservacoes('');
    setNovoLancamento({
      descricao: '',
      valor: 0,
      tipo: 'receita',
      data_lancamento: '',
      plano_conta_id: '',
      centro_custo_id: ''
    });
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const handleConfirm = async () => {
    if (!selectedAction) return;

    setIsLoading(true);
    
    try {
      if (selectedAction === 'conciliar') {
        if (!transacao || !lancamento) {
          throw new Error('Transação e lançamento são obrigatórios para conciliação');
        }
        
        await onConfirm('conciliar', {
          transacaoBancariaId: transacao.id,
          lancamentoId: lancamento.id,
          observacoes
        });
      } else if (selectedAction === 'ignorar') {
        if (!transacao) {
          throw new Error('Transação é obrigatória para ignorar');
        }
        
        await onConfirm('ignorar', {
          transacaoId: transacao.id,
          motivo: observacoes || 'Ignorado pelo usuário'
        });
      } else if (selectedAction === 'criar') {
        if (!transacao) {
          throw new Error('Transação é obrigatória para criar lançamento');
        }
        
        const dadosLancamento = {
          ...novoLancamento,
          valor: transacao.valor,
          tipo: transacao.valor >= 0 ? 'receita' : 'despesa',
          data_lancamento: transacao.data,
          descricao: novoLancamento.descricao || transacao.descricao
        };
        
        await onConfirm('criar', dadosLancamento);
      }
      
      handleClose();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      onError?.(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(Math.abs(valor));
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Ações de Conciliação</CardTitle>
          <CardDescription>
            Escolha a ação apropriada para esta transação
          </CardDescription>
          <Button
            onClick={handleClose}
            variant="outline"
            size="sm"
            className="absolute top-4 right-4"
          >
            Fechar
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Informações da Transação */}
          {transacao && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-700 mb-3">Transação Bancária</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">Data: {formatarData(transacao.data)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">Valor: {formatarMoeda(transacao.valor)}</span>
                    <Badge variant={transacao.valor >= 0 ? "default" : "destructive"}>
                      {transacao.valor >= 0 ? 'Crédito' : 'Débito'}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">Descrição: {transacao.descricao}</span>
                  </div>
                  {transacao.conta_bancaria && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">Banco: {transacao.conta_bancaria.nome}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Informações do Lançamento */}
          {lancamento && (
            <div className="p-4 bg-purple-50 rounded-lg">
              <h3 className="font-medium text-purple-700 mb-3">Lançamento Correspondente</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">Data: {formatarData(lancamento.data_lancamento)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">Valor: {formatarMoeda(lancamento.valor)}</span>
                    <Badge variant={lancamento.tipo === 'receita' ? "default" : "destructive"}>
                      {lancamento.tipo === 'receita' ? 'Receita' : 'Despesa'}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">Descrição: {lancamento.descricao}</span>
                  </div>
                  {lancamento.plano_contas && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">Plano: {lancamento.plano_contas.nome}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Seleção de Ação */}
          <div className="space-y-4">
            <h3 className="font-medium">Selecione uma ação:</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Conciliar */}
              {transacao && lancamento && (
                <Card 
                  className={`cursor-pointer transition-all ${
                    selectedAction === 'conciliar' ? 'ring-2 ring-green-500 bg-green-50' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedAction('conciliar')}
                >
                  <CardContent className="p-4 text-center">
                    <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <h4 className="font-medium text-green-700">Conciliar</h4>
                    <p className="text-sm text-gray-600">Parear transação bancária com lançamento</p>
                  </CardContent>
                </Card>
              )}

              {/* Ignorar */}
              {transacao && (
                <Card 
                  className={`cursor-pointer transition-all ${
                    selectedAction === 'ignorar' ? 'ring-2 ring-yellow-500 bg-yellow-50' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedAction('ignorar')}
                >
                  <CardContent className="p-4 text-center">
                    <Pause className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                    <h4 className="font-medium text-yellow-700">Ignorar</h4>
                    <p className="text-sm text-gray-600">Marcar transação para ser ignorada</p>
                  </CardContent>
                </Card>
              )}

              {/* Criar Lançamento */}
              {transacao && !lancamento && (
                <Card 
                  className={`cursor-pointer transition-all ${
                    selectedAction === 'criar' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedAction('criar')}
                >
                  <CardContent className="p-4 text-center">
                    <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <h4 className="font-medium text-blue-700">Criar Lançamento</h4>
                    <p className="text-sm text-gray-600">Criar novo lançamento baseado na transação</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Formulário baseado na ação selecionada */}
          {selectedAction && (
            <div className="space-y-4 border-t pt-4">
              {selectedAction === 'conciliar' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Observações (opcional)</label>
                  <textarea
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    placeholder="Adicione observações sobre esta conciliação..."
                    className="w-full p-3 border rounded-md"
                    rows={3}
                  />
                </div>
              )}

              {selectedAction === 'ignorar' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Motivo para ignorar</label>
                  <textarea
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    placeholder="Explique por que esta transação deve ser ignorada..."
                    className="w-full p-3 border rounded-md"
                    rows={3}
                  />
                </div>
              )}

              {selectedAction === 'criar' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Descrição do Lançamento</label>
                    <input
                      type="text"
                      value={novoLancamento.descricao}
                      onChange={(e) => setNovoLancamento(prev => ({ ...prev, descricao: e.target.value }))}
                      placeholder={transacao?.descricao || "Descrição do lançamento..."}
                      className="w-full p-3 border rounded-md"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Plano de Contas</label>
                      <select
                        value={novoLancamento.plano_conta_id}
                        onChange={(e) => setNovoLancamento(prev => ({ ...prev, plano_conta_id: e.target.value }))}
                        className="w-full p-3 border rounded-md"
                      >
                        <option value="">Selecione...</option>
                        {/* Opções de plano de contas seriam carregadas aqui */}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Centro de Custos</label>
                      <select
                        value={novoLancamento.centro_custo_id}
                        onChange={(e) => setNovoLancamento(prev => ({ ...prev, centro_custo_id: e.target.value }))}
                        className="w-full p-3 border rounded-md"
                      >
                        <option value="">Selecione...</option>
                        {/* Opções de centro de custos seriam carregadas aqui */}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex justify-end gap-3 border-t pt-4">
            <Button onClick={handleClose} variant="outline" disabled={isLoading}>
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirm} 
              disabled={!selectedAction || isLoading}
              className={
                selectedAction === 'conciliar' ? 'bg-green-600 hover:bg-green-700' :
                selectedAction === 'ignorar' ? 'bg-yellow-600 hover:bg-yellow-700' :
                selectedAction === 'criar' ? 'bg-blue-600 hover:bg-blue-700' :
                ''
              }
            >
              {isLoading ? 'Processando...' : 
               selectedAction === 'conciliar' ? 'Conciliar' :
               selectedAction === 'ignorar' ? 'Ignorar' :
               selectedAction === 'criar' ? 'Criar Lançamento' : 'Confirmar'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
