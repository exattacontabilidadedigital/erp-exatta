'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { X, Check, AlertCircle } from 'lucide-react';

interface BankTransaction {
  id: string;
  data: string;
  descricao: string;
  valor: number;
  tipo: 'credito' | 'debito';
}

interface SystemTransaction {
  id: string;
  data_lancamento: string;
  descricao: string;
  valor: number;
  tipo: 'receita' | 'despesa';
  status: string;
}

interface TempPairCardProps {
  bankTransaction: BankTransaction;
  systemTransaction: SystemTransaction;
  onConfirm: () => void;
  onCancel: () => void;
  confidence?: number;
}

export default function TempPairCard({
  bankTransaction,
  systemTransaction,
  onConfirm,
  onCancel,
  confidence = 0
}: TempPairCardProps) {
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

  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.8) return 'text-green-600 bg-green-100';
    if (conf >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getConfidenceText = (conf: number) => {
    if (conf >= 0.8) return 'Alta';
    if (conf >= 0.6) return 'Média';
    return 'Baixa';
  };

  const valorDiferente = Math.abs(bankTransaction.valor - systemTransaction.valor) > 0.01;

  return (
    <div className="border border-blue-200 bg-blue-50 rounded-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-blue-600" />
          <h3 className="font-medium text-blue-900">Pareamento Sugerido</h3>
          {confidence > 0 && (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(confidence)}`}>
              Confiança: {getConfidenceText(confidence)} ({Math.round(confidence * 100)}%)
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Comparação */}
      <div className="grid grid-cols-2 gap-4">
        {/* Transação Bancária */}
        <div className="bg-white rounded-lg p-3 border">
          <div className="text-xs font-medium text-gray-500 mb-2">TRANSAÇÃO BANCÁRIA</div>
          <div className="space-y-2">
            <div>
              <div className="text-sm font-medium">{bankTransaction.descricao}</div>
              <div className="text-xs text-gray-500">
                {formatarData(bankTransaction.data)}
              </div>
            </div>
            <div className={`text-sm font-medium ${
              bankTransaction.tipo === 'credito' ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatarValor(bankTransaction.valor)}
            </div>
          </div>
        </div>

        {/* Lançamento do Sistema */}
        <div className="bg-white rounded-lg p-3 border">
          <div className="text-xs font-medium text-gray-500 mb-2">LANÇAMENTO DO SISTEMA</div>
          <div className="space-y-2">
            <div>
              <div className="text-sm font-medium">{systemTransaction.descricao}</div>
              <div className="text-xs text-gray-500">
                {formatarData(systemTransaction.data_lancamento)}
              </div>
            </div>
            <div className={`text-sm font-medium ${
              systemTransaction.tipo === 'receita' ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatarValor(systemTransaction.valor)}
            </div>
            <div className="text-xs">
              <span className={`px-2 py-1 rounded-full ${
                systemTransaction.status === 'pago' 
                  ? 'bg-green-100 text-green-800'
                  : systemTransaction.status === 'pendente'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {systemTransaction.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Alertas */}
      {valorDiferente && (
        <div className="bg-yellow-100 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <div className="text-sm text-yellow-800">
              <strong>Atenção:</strong> Os valores são diferentes. 
              Diferença: {formatarValor(Math.abs(bankTransaction.valor - systemTransaction.valor))}
            </div>
          </div>
        </div>
      )}

      {/* Ações */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-blue-200">
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          className="text-gray-600"
        >
          Cancelar
        </Button>
        <Button
          size="sm"
          onClick={onConfirm}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Check className="h-4 w-4 mr-2" />
          Confirmar Pareamento
        </Button>
      </div>
    </div>
  );
}
