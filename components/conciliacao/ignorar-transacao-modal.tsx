'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { X, AlertCircle, Trash2 } from 'lucide-react';

interface BankTransaction {
  id: string;
  data: string;
  descricao: string;
  valor: number;
  tipo: 'credito' | 'debito';
}

interface IgnorarTransacaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  bankTransaction: BankTransaction | null;
  onConfirm: (transactionId: string, reason: string) => void;
}

export default function IgnorarTransacaoModal({
  isOpen,
  onClose,
  bankTransaction,
  onConfirm
}: IgnorarTransacaoModalProps) {
  const [reason, setReason] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('');

  const presetReasons = [
    'Transação duplicada no extrato bancário',
    'Erro de processamento bancário',
    'Movimentação interna entre contas próprias',
    'Taxa bancária já registrada em outro lugar',
    'Transação cancelada pelo banco',
    'Ajuste de saldo automático',
    'Estorno de transação anterior'
  ];

  const handlePresetSelect = (preset: string) => {
    setSelectedPreset(preset);
    setReason(preset);
  };

  const handleConfirm = () => {
    if (!reason.trim()) {
      alert('Por favor, informe o motivo para ignorar esta transação');
      return;
    }

    if (bankTransaction) {
      onConfirm(bankTransaction.id, reason.trim());
      handleClose();
    }
  };

  const handleClose = () => {
    setReason('');
    setSelectedPreset('');
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
      <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Trash2 className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Ignorar Transação
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Esta transação não aparecerá mais nas sugestões
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Detalhes da Transação */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">TRANSAÇÃO A SER IGNORADA</h3>
            <div className="bg-gray-50 rounded-lg p-4 border">
              <div className="grid grid-cols-2 gap-4">
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
              </div>
              <div className="mt-3">
                <div className="text-xs text-gray-500">Descrição</div>
                <div className="font-medium">{bankTransaction.descricao}</div>
              </div>
            </div>
          </div>

          {/* Aviso */}
          <div className="bg-red-100 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-700">
                <div className="font-medium mb-1">Atenção!</div>
                <div>
                  Ao ignorar esta transação, ela será marcada como "ignorada" e não aparecerá 
                  mais nas sugestões de conciliação. Esta ação pode ser desfeita posteriormente 
                  através do gerenciamento de transações ignoradas.
                </div>
              </div>
            </div>
          </div>

          {/* Motivos Pré-definidos */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Motivos Comuns</h4>
            <div className="space-y-2">
              {presetReasons.map((preset, index) => (
                <label key={index} className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="preset"
                    value={preset}
                    checked={selectedPreset === preset}
                    onChange={() => handlePresetSelect(preset)}
                    className="mt-0.5 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">{preset}</span>
                </label>
              ))}
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="preset"
                  value="custom"
                  checked={selectedPreset === 'custom' || (reason.length > 0 && !presetReasons.includes(reason))}
                  onChange={() => {
                    setSelectedPreset('custom');
                    if (presetReasons.includes(reason)) {
                      setReason('');
                    }
                  }}
                  className="mt-0.5 text-blue-600"
                />
                <span className="text-sm text-gray-700">Outro motivo (especificar abaixo)</span>
              </label>
            </div>
          </div>

          {/* Campo de Motivo Personalizado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Motivo para ignorar *
            </label>
            <Textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (!presetReasons.includes(e.target.value)) {
                  setSelectedPreset('custom');
                }
              }}
              placeholder="Descreva o motivo para ignorar esta transação..."
              rows={4}
              className="w-full"
            />
            <div className="text-xs text-gray-500 mt-1">
              Este motivo será registrado no histórico da transação
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!reason.trim()}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Ignorar Transação
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
