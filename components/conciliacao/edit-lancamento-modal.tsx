import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, CheckCircle, Calculator } from 'lucide-react';

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

interface EditLancamentoModalProps {
  lancamento: Lancamento | null;
  targetDate: string; // Data do OFX para referência
  targetValue: number; // Valor do OFX para referência
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedLancamento: Lancamento) => void;
}

// Função para formatar moeda
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

// Função para formatar data para exibição
const formatDate = (date: string | Date) => {
  const d = new Date(date);
  return d.toLocaleDateString('pt-BR');
};

export default function EditLancamentoModal({
  lancamento,
  targetDate,
  targetValue,
  isOpen,
  onClose,
  onSave
}: EditLancamentoModalProps) {
  const [formData, setFormData] = useState({
    data_lancamento: '',
    valor: 0,
    descricao: '',
  });

  const [showJurosSection, setShowJurosSection] = useState(false);
  const [jurosValue, setJurosValue] = useState(0);
  const [jurosDescricao, setJurosDescricao] = useState('');

  // Atualizar form quando o lançamento mudar
  useEffect(() => {
    if (lancamento) {
      setFormData({
        data_lancamento: lancamento.data_lancamento.split('T')[0], // Format para input date
        valor: parseFloat(lancamento.valor.toString()),
        descricao: lancamento.descricao,
      });
      setJurosValue(0);
      setJurosDescricao('');
      setShowJurosSection(false);
    }
  }, [lancamento]);

  if (!lancamento) return null;

  // Cálculos de validação
  const dateMatch = formData.data_lancamento === targetDate;
  const valueMatch = Math.abs(formData.valor - Math.abs(targetValue)) < 0.01;
  const valueDifference = Math.abs(targetValue) - formData.valor;

  // Aplicar juros/taxas
  const calculateWithJuros = () => {
    const baseValue = parseFloat(lancamento.valor.toString());
    const newValue = baseValue + jurosValue;
    setFormData(prev => ({ ...prev, valor: newValue }));
    
    // Adicionar descrição dos juros
    if (jurosDescricao.trim()) {
      const currentDesc = formData.descricao;
      const jurosText = ` + ${jurosDescricao}: ${formatCurrency(jurosValue)}`;
      if (!currentDesc.includes(jurosText)) {
        setFormData(prev => ({ 
          ...prev, 
          descricao: currentDesc + jurosText 
        }));
      }
    }
  };

  // Usar data do OFX
  const useOFXDate = () => {
    setFormData(prev => ({ ...prev, data_lancamento: targetDate }));
  };

  // Usar valor do OFX
  const useOFXValue = () => {
    setFormData(prev => ({ ...prev, valor: Math.abs(targetValue) }));
  };

  // Salvar alterações
  const handleSave = async () => {
    try {
      // Aqui você pode fazer uma chamada à API para atualizar o lançamento
      const updatedLancamento: Lancamento = {
        ...lancamento,
        data_lancamento: formData.data_lancamento,
        valor: formData.valor,
        descricao: formData.descricao,
      };

      // Simular API call
      const response = await fetch(`/api/lancamentos/${lancamento.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data_lancamento: formData.data_lancamento,
          valor: formData.valor,
          descricao: formData.descricao,
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar lançamento');
      }

      onSave(updatedLancamento);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar lançamento:', error);
      // TODO: Mostrar toast de erro
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Lançamento para Conciliação</DialogTitle>
        </DialogHeader>
        
        {/* Comparação visual */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded">
          <div>
            <h4 className="font-medium mb-2">🎯 Valores Alvo (OFX)</h4>
            <div className="text-sm space-y-1">
              <div>Data: {formatDate(targetDate)}</div>
              <div>Valor: {formatCurrency(targetValue)}</div>
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-2">✏️ Valores Atuais</h4>
            <div className="text-sm space-y-1">
              <div className={dateMatch ? "text-green-600" : "text-red-600"}>
                Data: {formatDate(formData.data_lancamento)}
                {dateMatch && <CheckCircle className="inline h-4 w-4 ml-1" />}
                {!dateMatch && <AlertTriangle className="inline h-4 w-4 ml-1" />}
              </div>
              <div className={valueMatch ? "text-green-600" : "text-red-600"}>
                Valor: {formatCurrency(formData.valor)}
                {valueMatch && <CheckCircle className="inline h-4 w-4 ml-1" />}
                {!valueMatch && <AlertTriangle className="inline h-4 w-4 ml-1" />}
              </div>
              {!valueMatch && (
                <div className="text-xs text-orange-600">
                  Diferença: {formatCurrency(valueDifference)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Formulário de edição */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="data_lancamento" className="block text-sm font-medium mb-1">
              Data do Lançamento
            </Label>
            <div className="flex gap-2">
              <Input
                id="data_lancamento"
                type="date"
                value={formData.data_lancamento}
                onChange={(e) => setFormData(prev => ({ ...prev, data_lancamento: e.target.value }))}
                className="flex-1"
              />
              {!dateMatch && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={useOFXDate}
                  className="whitespace-nowrap"
                >
                  Usar data OFX
                </Button>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="valor" className="block text-sm font-medium mb-1">
              Valor
            </Label>
            <div className="flex gap-2">
              <Input
                id="valor"
                type="number"
                step="0.01"
                value={formData.valor}
                onChange={(e) => setFormData(prev => ({ ...prev, valor: parseFloat(e.target.value) || 0 }))}
                className="flex-1"
              />
              {!valueMatch && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={useOFXValue}
                  className="whitespace-nowrap"
                >
                  Usar valor OFX
                </Button>
              )}
            </div>
            
            {/* Seção de Juros */}
            <div className="mt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowJurosSection(!showJurosSection)}
                className="flex items-center gap-2"
              >
                <Calculator className="h-4 w-4" />
                {showJurosSection ? "Ocultar" : "Adicionar"} Juros/Taxa
              </Button>
              
              {showJurosSection && (
                <div className="mt-2 p-3 border rounded bg-blue-50 space-y-3">
                  <div>
                    <Label htmlFor="juros_descricao" className="block text-sm font-medium mb-1">
                      Descrição dos Juros/Taxa
                    </Label>
                    <Input
                      id="juros_descricao"
                      value={jurosDescricao}
                      onChange={(e) => setJurosDescricao(e.target.value)}
                      placeholder="Ex: Juros bancários, Taxa administrativa..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="juros_valor" className="block text-sm font-medium mb-1">
                      Valor dos Juros/Taxa
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="juros_valor"
                        type="number"
                        step="0.01"
                        value={jurosValue}
                        onChange={(e) => setJurosValue(parseFloat(e.target.value) || 0)}
                        placeholder="0,00"
                        className="flex-1"
                      />
                      <Button 
                        size="sm" 
                        onClick={calculateWithJuros}
                        disabled={!jurosDescricao.trim() || jurosValue === 0}
                      >
                        Aplicar
                      </Button>
                    </div>
                  </div>
                  <div className="text-xs text-blue-600">
                    Valor original: {formatCurrency(parseFloat(lancamento.valor.toString()))}
                    <br />
                    Novo valor: {formatCurrency(parseFloat(lancamento.valor.toString()) + jurosValue)}
                  </div>
                </div>
              )}
            </div>

            {valueMatch && (
              <div className="text-green-600 text-sm mt-1 flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                Valor compatível com OFX
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="descricao" className="block text-sm font-medium mb-1">
              Descrição
            </Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
              rows={3}
              className="resize-none"
            />
          </div>
        </div>

        {/* Status geral */}
        <div className="p-3 rounded border">
          {dateMatch && valueMatch ? (
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">✅ Lançamento compatível com OFX</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-orange-700">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">⚠️ Ainda há diferenças a serem ajustadas</span>
            </div>
          )}
        </div>

        {/* Botões */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            Salvar Alterações
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
