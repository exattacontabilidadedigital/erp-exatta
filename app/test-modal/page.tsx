"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import BuscarLancamentosModal from '@/components/conciliacao/buscar-lancamentos-modal';

export default function TestModalPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLancamento, setSelectedLancamento] = useState(null);

  // Transação de exemplo para testar
  const transacaoExemplo = {
    id: 'test-123',
    data: '2025-08-20',
    descricao: 'TESTE TRANSACAO BANCARIA 10,00',
    valor: 10.00,
    tipo: 'credito'
  };

  const handleSelectLancamento = (lancamento: any) => {
    console.log('✅ Lançamento selecionado:', lancamento);
    setSelectedLancamento(lancamento);
    setIsModalOpen(false);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Teste do Modal de Buscar Lançamentos</h1>
        <p className="text-gray-600">
          Esta página permite testar o funcionamento do modal de busca de lançamentos
        </p>
      </div>

      {/* Transação de Referência */}
      <Card>
        <CardHeader>
          <CardTitle>Transação Bancária de Teste</CardTitle>
          <CardDescription>
            Esta é a transação que será usada como referência para a busca
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="text-sm text-gray-600">Data:</span>
              <div className="font-medium">{transacaoExemplo.data}</div>
            </div>
            <div>
              <span className="text-sm text-gray-600">Descrição:</span>
              <div className="font-medium">{transacaoExemplo.descricao}</div>
            </div>
            <div>
              <span className="text-sm text-gray-600">Valor:</span>
              <div className="font-medium">R$ {transacaoExemplo.valor.toFixed(2)}</div>
            </div>
            <div>
              <span className="text-sm text-gray-600">Tipo:</span>
              <div className="font-medium">{transacaoExemplo.tipo}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Controles de Teste */}
      <Card>
        <CardHeader>
          <CardTitle>Controles de Teste</CardTitle>
          <CardDescription>
            Use os botões abaixo para testar diferentes cenários
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Abrir Modal (Com Transação)
            </Button>
            
            <Button 
              onClick={() => {
                // Limpar filtros e abrir modal
                setIsModalOpen(true);
              }}
              variant="outline"
            >
              Abrir Modal (Sem Filtros)
            </Button>
            
            <Button 
              onClick={() => {
                // Testar API diretamente
                fetch('/api/conciliacao/buscar-existentes?page=1&limit=10&status=pendente')
                  .then(res => res.json())
                  .then(data => {
                    console.log('📊 Teste direto da API:', data);
                    alert(`API retornou ${data.lancamentos?.length || 0} de ${data.total || 0} lançamentos`);
                  })
                  .catch(error => {
                    console.error('❌ Erro na API:', error);
                    alert('Erro ao testar API: ' + error.message);
                  });
              }}
              variant="outline"
            >
              Testar API Diretamente
            </Button>
          </div>

          {/* Área de Debug */}
          <div className="mt-6 p-4 bg-gray-900 text-gray-100 rounded-lg font-mono text-sm">
            <div className="text-yellow-400 mb-2">🔍 Console de Debug:</div>
            <div>1. Abra o DevTools (F12)</div>
            <div>2. Vá para a aba Console</div>
            <div>3. Abra o modal e observe os logs</div>
            <div>4. Procure por mensagens com 🔍, 📊, ✅, ❌</div>
          </div>
        </CardContent>
      </Card>

      {/* Resultado da Seleção */}
      {selectedLancamento && (
        <Card>
          <CardHeader>
            <CardTitle>Lançamento Selecionado</CardTitle>
            <CardDescription>
              Este foi o último lançamento selecionado no modal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded-lg overflow-auto">
              {JSON.stringify(selectedLancamento, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Instruções de Teste */}
      <Card>
        <CardHeader>
          <CardTitle>Instruções para Teste</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <h4 className="font-medium">Cenários de Teste:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li><strong>Teste 1:</strong> Abrir modal e verificar se aparecem mais de 3 lançamentos</li>
              <li><strong>Teste 2:</strong> Limpar filtros e verificar se a lista atualiza</li>
              <li><strong>Teste 3:</strong> Aplicar filtros específicos e verificar resultados</li>
              <li><strong>Teste 4:</strong> Testar paginação (se houver mais de 20 lançamentos)</li>
              <li><strong>Teste 5:</strong> Verificar logs no console para debug</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">O que observar:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Quantos lançamentos aparecem na tabela</li>
              <li>Se o contador "X de Y lançamentos" está correto</li>
              <li>Se o botão "Carregar mais" aparece quando necessário</li>
              <li>Mensagens de debug no console do navegador</li>
              <li>Tempo de resposta da API</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Modal */}
      <BuscarLancamentosModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectLancamento={handleSelectLancamento}
        transacaoSelecionada={transacaoExemplo}
        filtrosIniciais={{
          dataInicio: '2025-08-01',
          dataFim: '2025-08-31',
          toleranciaValor: 0.05 // 5% de tolerância para valores
        }}
      />
    </div>
  );
}
