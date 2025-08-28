'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Plus, Settings, Trash2, Edit } from 'lucide-react';

interface MatchingRule {
  id: string;
  name: string;
  description: string;
  conditions: {
    valueRange?: { min: number; max: number };
    descriptionKeywords?: string[];
    dateRange?: number; // dias de tolerância
    accountTypes?: string[];
  };
  priority: number;
  isActive: boolean;
  createdAt: string;
}

interface RuleManagerProps {
  isOpen: boolean;
  onClose: () => void;
  rules: MatchingRule[];
  onSaveRule: (rule: Omit<MatchingRule, 'id' | 'createdAt'>) => void;
  onUpdateRule: (id: string, rule: Partial<MatchingRule>) => void;
  onDeleteRule: (id: string) => void;
}

export default function RuleManager({
  isOpen,
  onClose,
  rules,
  onSaveRule,
  onUpdateRule,
  onDeleteRule
}: RuleManagerProps) {
  const [editingRule, setEditingRule] = useState<MatchingRule | null>(null);
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    valueMin: '',
    valueMax: '',
    keywords: '',
    dateRange: '3',
    priority: '1',
    isActive: true
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      valueMin: '',
      valueMax: '',
      keywords: '',
      dateRange: '3',
      priority: '1',
      isActive: true
    });
    setEditingRule(null);
    setShowForm(false);
  };

  const handleEdit = (rule: MatchingRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description,
      valueMin: rule.conditions.valueRange?.min?.toString() || '',
      valueMax: rule.conditions.valueRange?.max?.toString() || '',
      keywords: rule.conditions.descriptionKeywords?.join(', ') || '',
      dateRange: rule.conditions.dateRange?.toString() || '3',
      priority: rule.priority.toString(),
      isActive: rule.isActive
    });
    setShowForm(true);
  };

  const handleSave = () => {
    const ruleData = {
      name: formData.name,
      description: formData.description,
      conditions: {
        ...(formData.valueMin || formData.valueMax ? {
          valueRange: {
            min: parseFloat(formData.valueMin) || 0,
            max: parseFloat(formData.valueMax) || 999999999
          }
        } : {}),
        ...(formData.keywords ? {
          descriptionKeywords: formData.keywords.split(',').map(k => k.trim()).filter(k => k)
        } : {}),
        dateRange: parseInt(formData.dateRange) || 3
      },
      priority: parseInt(formData.priority) || 1,
      isActive: formData.isActive
    };

    if (editingRule) {
      onUpdateRule(editingRule.id, ruleData);
    } else {
      onSaveRule(ruleData);
    }

    resetForm();
  };

  const handleToggleActive = (rule: MatchingRule) => {
    onUpdateRule(rule.id, { isActive: !rule.isActive });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Gerenciar Regras de Conciliação
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Configure regras automáticas para pareamento de transações
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

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {showForm ? (
            /* Formulário de Regra */
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">
                  {editingRule ? 'Editar Regra' : 'Nova Regra'}
                </h3>
                <Button
                  variant="outline"
                  onClick={resetForm}
                >
                  Cancelar
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome da Regra
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Transferências PIX"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prioridade
                  </label>
                  <Input
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                    min="1"
                    max="10"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descreva quando esta regra deve ser aplicada"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor Mínimo (R$)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.valueMin}
                    onChange={(e) => setFormData(prev => ({ ...prev, valueMin: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor Máximo (R$)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.valueMax}
                    onChange={(e) => setFormData(prev => ({ ...prev, valueMax: e.target.value }))}
                    placeholder="999999.99"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Palavras-chave (separadas por vírgula)
                  </label>
                  <Input
                    value={formData.keywords}
                    onChange={(e) => setFormData(prev => ({ ...prev, keywords: e.target.value }))}
                    placeholder="PIX, TED, DOC, Transferência"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tolerância de Data (dias)
                  </label>
                  <Input
                    type="number"
                    value={formData.dateRange}
                    onChange={(e) => setFormData(prev => ({ ...prev, dateRange: e.target.value }))}
                    min="0"
                    max="30"
                  />
                </div>

                <div className="col-span-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Regra ativa
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={resetForm}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!formData.name.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {editingRule ? 'Atualizar' : 'Salvar'} Regra
                </Button>
              </div>
            </div>
          ) : (
            /* Lista de Regras */
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium">Regras Configuradas ({rules.length})</h3>
                <Button
                  onClick={() => setShowForm(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Regra
                </Button>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {rules.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Settings className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <div className="text-lg font-medium mb-2">Nenhuma regra configurada</div>
                    <div className="text-sm">Crie regras para automatizar a conciliação</div>
                  </div>
                ) : (
                  rules.map((rule) => (
                    <div
                      key={rule.id}
                      className={`border rounded-lg p-4 ${
                        rule.isActive ? 'bg-white' : 'bg-gray-50 opacity-75'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium text-gray-900">{rule.name}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              rule.isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {rule.isActive ? 'Ativa' : 'Inativa'}
                            </span>
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                              Prioridade {rule.priority}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{rule.description}</p>
                          <div className="text-xs text-gray-500 space-y-1">
                            {rule.conditions.valueRange && (
                              <div>
                                Valor: R$ {rule.conditions.valueRange.min.toFixed(2)} - 
                                R$ {rule.conditions.valueRange.max.toFixed(2)}
                              </div>
                            )}
                            {rule.conditions.descriptionKeywords && (
                              <div>
                                Palavras-chave: {rule.conditions.descriptionKeywords.join(', ')}
                              </div>
                            )}
                            {rule.conditions.dateRange && (
                              <div>
                                Tolerância: {rule.conditions.dateRange} dias
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(rule)}
                            className="text-gray-600 hover:text-gray-800"
                          >
                            {rule.isActive ? 'Desativar' : 'Ativar'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(rule)}
                            className="text-gray-600 hover:text-gray-800"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDeleteRule(rule.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            <strong>Dica:</strong> Regras com prioridade mais alta (números menores) são aplicadas primeiro.
            Use tolerância de data para encontrar transações próximas.
          </div>
        </div>
      </div>
    </div>
  );
}
