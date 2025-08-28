'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { X, Plus, FileText, Calendar, DollarSign, AlertCircle } from 'lucide-react';

interface BankTransaction {
  id: string;
  data: string;
  descricao: string;
  valor: number;
  tipo: 'credito' | 'debito';
}

interface NoMatchAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  bankTransaction: BankTransaction;
  onCreateLancamento: (lancamentoData: any) => void;
  onIgnoreTransaction: (reason: string) => void;
}

export default function NoMatchAssistant({
  isOpen,
  onClose,
  bankTransaction,
  onCreateLancamento,
  onIgnoreTransaction
}: NoMatchAssistantProps) {
  const [activeTab, setActiveTab] = useState<'create' | 'ignore'>('create');
  const [ignoreReason, setIgnoreReason] = useState('');
  
  const [formData, setFormData] = useState({
    tipo: bankTransaction?.tipo === 'credito' ? 'receita' : 'despesa',
    descricao: bankTransaction?.descricao || '',
    valor: bankTransaction?.valor?.toString() || '',
    data_lancamento: bankTransaction?.data || '',
    numero_documento: '',
    observacoes: '',
    plano_conta_id: '',
    centro_custo_id: '',
    cliente_fornecedor_id: '',
    forma_pagamento_id: ''
  });

  const handleCreateLancamento = () => {
    const lancamentoData = {
      ...formData,
      valor: parseFloat(formData.valor),
      data_lancamento: formData.data_lancamento
    };

    onCreateLancamento(lancamentoData);
    onClose();
  };

  const handleIgnore = () => {
    if (!ignoreReason.trim()) {
      alert('Por favor, informe o motivo para ignorar esta transação');
      return;
    }
    
    onIgnoreTransaction(ignoreReason);
    onClose();
  };

  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const formatarData = (data: string) => {
    try {
      return new Date(data + 'T12:00:00').toLocaleDateString('pt-BR');
    } catch (error) {
      return data;
    }
  };

  if (!isOpen || !bankTransaction) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Transação Sem Correspondência
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Esta transação bancária não possui correspondência no sistema
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

        {/* Detalhes da Transação Bancária */}
        <div className="p-6 border-b bg-gray-50">
          <h3 className="text-sm font-medium text-gray-700 mb-3">TRANSAÇÃO BANCÁRIA</h3>
          <div className="bg-white rounded-lg p-4 border">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-gray-500">Data</div>
                <div className="font-medium">{formatarData(bankTransaction.data)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Valor</div>
                <div className={`font-medium ${
                  bankTransaction.tipo === 'credito' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatarValor(bankTransaction.valor)}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Tipo</div>
                <div className="font-medium capitalize">{bankTransaction.tipo}</div>
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xs text-gray-500">Descrição</div>
              <div className="font-medium">{bankTransaction.descricao}</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <div className="flex">
            <button
              onClick={() => setActiveTab('create')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'create'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Plus className="h-4 w-4 inline-block mr-2" />
              Criar Lançamento
            </button>
            <button
              onClick={() => setActiveTab('ignore')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'ignore'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <AlertCircle className="h-4 w-4 inline-block mr-2" />
              Ignorar Transação
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'create' ? (
            /* Formulário de Criação */
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo *
                  </label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="receita">Receita</option>
                    <option value="despesa">Despesa</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor *
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.valor}
                    onChange={(e) => setFormData(prev => ({ ...prev, valor: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data *
                  </label>
                  <Input
                    type="date"
                    value={formData.data_lancamento}
                    onChange={(e) => setFormData(prev => ({ ...prev, data_lancamento: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número do Documento
                  </label>
                  <Input
                    value={formData.numero_documento}
                    onChange={(e) => setFormData(prev => ({ ...prev, numero_documento: e.target.value }))}
                    placeholder="Ex: 001, NF-123"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição *
                </label>
                <Input
                  value={formData.descricao}
                  onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                  placeholder="Descrição do lançamento"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observações
                </label>
                <Textarea
                  value={formData.observacoes}
                  onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                  placeholder="Observações adicionais..."
                  rows={3}
                />
              </div>

              <div className="bg-yellow-100 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <div className="text-sm text-yellow-800">
                    <strong>Nota:</strong> Após criar o lançamento, ele será automaticamente 
                    conciliado com esta transação bancária.
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Formulário de Ignorar */
            <div className="space-y-4">
              <div className="bg-red-100 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <h4 className="font-medium text-red-800">Ignorar Transação</h4>
                </div>
                <p className="text-sm text-red-700">
                  Esta transação será marcada como ignorada e não aparecerá mais nas 
                  sugestões de conciliação. Esta ação pode ser desfeita posteriormente.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motivo para ignorar *
                </label>
                <Textarea
                  value={ignoreReason}
                  onChange={(e) => setIgnoreReason(e.target.value)}
                  placeholder="Ex: Transação duplicada, erro bancário, etc..."
                  rows={4}
                />
              </div>

              <div className="text-sm text-gray-600">
                <strong>Exemplos de motivos válidos:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Transação duplicada no extrato</li>
                  <li>Erro de processamento bancário</li>
                  <li>Transação interna do banco</li>
                  <li>Movimentação entre contas próprias</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={onClose}
            >
              Cancelar
            </Button>
            {activeTab === 'create' ? (
              <Button
                onClick={handleCreateLancamento}
                disabled={!formData.descricao.trim() || !formData.valor || !formData.data_lancamento}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar e Conciliar
              </Button>
            ) : (
              <Button
                onClick={handleIgnore}
                disabled={!ignoreReason.trim()}
                className="bg-red-600 hover:bg-red-700"
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                Ignorar Transação
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
