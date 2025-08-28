"use client"

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, CalendarDays, AlertCircle } from "lucide-react";
import { ConciliacaoModerna } from "@/components/conciliacao/conciliacao-moderna";

interface ContasConciliacaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  conta: any;
}

export function ContasConciliacaoModal({ isOpen, onClose, conta }: ContasConciliacaoModalProps) {
  const [period, setPeriod] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [showConciliacao, setShowConciliacao] = useState(false);

  if (!conta) return null;

  const handleIniciarConciliacao = () => {
    if (!period.start || !period.end) {
      alert('Por favor, selecione um período válido');
      return;
    }
    setShowConciliacao(true);
  };

  const handleVoltar = () => {
    setShowConciliacao(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Conciliação Bancária - {conta.bancos?.nome || conta.banco_id}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Ag: {conta.agencia} | CC: {conta.conta}-{conta.digito}
          </p>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[calc(95vh-120px)]">
          {!showConciliacao ? (
            // Tela de configuração do período
            <div className="space-y-6 p-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5" />
                    Selecionar Período para Conciliação
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="data-inicio">Data Início</Label>
                      <Input
                        id="data-inicio"
                        type="date"
                        value={period.start}
                        onChange={(e) => setPeriod(prev => ({ ...prev, start: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="data-fim">Data Fim</Label>
                      <Input
                        id="data-fim"
                        type="date"
                        value={period.end}
                        onChange={(e) => setPeriod(prev => ({ ...prev, end: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Informações da conta */}
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Informações da Conta</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Banco:</span>
                        <span className="ml-2 font-medium">{conta.bancos?.nome || conta.banco_id}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Tipo:</span>
                        <span className="ml-2 font-medium capitalize">{conta.tipo_conta}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Agência:</span>
                        <span className="ml-2 font-medium">{conta.agencia}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Conta:</span>
                        <span className="ml-2 font-medium">{conta.conta}-{conta.digito}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Saldo Atual:</span>
                        <span className="ml-2 font-medium">
                          {new Intl.NumberFormat('pt-BR', { 
                            style: 'currency', 
                            currency: 'BRL' 
                          }).format(conta.saldo_atual || 0)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Status:</span>
                        <span className={`ml-2 font-medium ${conta.ativo ? 'text-green-600' : 'text-red-600'}`}>
                          {conta.ativo ? 'Ativa' : 'Inativa'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Aviso importante */}
                  <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-900">Informações Importantes:</p>
                      <ul className="mt-2 space-y-1 text-blue-800">
                        <li>• A conciliação comparará transações bancárias com lançamentos do sistema</li>
                        <li>• Certifique-se de que o período selecionado está correto</li>
                        <li>• Você pode importar arquivos OFX durante o processo</li>
                        <li>• O sistema sugerirá correspondências automáticas</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={onClose}>
                      Cancelar
                    </Button>
                    <Button onClick={handleIniciarConciliacao}>
                      Iniciar Conciliação
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            // Tela de conciliação
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b">
                <div>
                  <h3 className="font-medium">
                    Conciliação: {new Date(period.start).toLocaleDateString('pt-BR')} até {new Date(period.end).toLocaleDateString('pt-BR')}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {conta.bancos?.nome || conta.banco_id} - Ag: {conta.agencia} | CC: {conta.conta}-{conta.digito}
                  </p>
                </div>
                <Button variant="outline" onClick={handleVoltar}>
                  ← Voltar
                </Button>
              </div>
              
              {/* Componente de Conciliação */}
              <ConciliacaoModerna 
                bankAccountId={conta.id}
                period={period}
                hideHeader={true}
                hideUpload={false}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ContasConciliacaoModal;
