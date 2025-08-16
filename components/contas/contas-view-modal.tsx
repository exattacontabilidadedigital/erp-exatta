"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Building2, Calendar, TrendingUp, TrendingDown, Download } from "lucide-react"
import { gerarPDFConta } from "@/lib/gerar-pdf-conta"

interface ContasViewModalProps {
  isOpen: boolean
  onClose: () => void
  conta: any
}

export function ContasViewModal({ isOpen, onClose, conta }: ContasViewModalProps) {
  if (!conta) return null

  // Dados reais do banco
  const saldoInicial = conta.saldo_inicial ?? 0;
  const saldoAtual = conta.saldo_atual ?? 0;
  const variacao = saldoAtual - saldoInicial;
  const percentual = saldoInicial !== 0 ? ((variacao / saldoInicial) * 100).toFixed(1) : "0.0";

  const handleGerarPDF = () => {
    gerarPDFConta(conta)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Detalhes da Conta Bancária
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Básicas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">Banco</label>
              <p className="font-medium">{conta.bancos?.nome || conta.banco_id}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">Gerente</label>
              <p className="font-medium">{conta.gerente || '-'}</p>
            </div>
          </div>

          {/* Dados da Conta */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">Agência</label>
              <p className="text-sm">{conta.agencia}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">Conta</label>
              <p className="text-sm">{conta.conta}{conta.digito ? `-${conta.digito}` : ''}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">Tipo</label>
              <Badge variant="outline">{conta.tipo_conta}</Badge>
            </div>
          </div>

          <Separator />

          {/* Informações Financeiras */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500">Saldo Inicial</label>
                <p className="text-lg font-medium">R$ {Number(saldoInicial).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500">Saldo Atual</label>
                <p className="text-2xl font-bold text-blue-600">R$ {Number(saldoAtual).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500">Variação</label>
                <div className={`flex items-center ${variacao >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {variacao >= 0 ? <TrendingUp className="w-5 h-5 mr-2" /> : <TrendingDown className="w-5 h-5 mr-2" />}
                  <div>
                    <p className="text-lg font-medium">
                      {variacao >= 0 ? "+" : ""}R$ {Number(variacao).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-sm">({percentual}%)</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500">Status</label>
                <Badge variant={conta.ativo ? "default" : "secondary"} className="bg-green-100 text-green-800">
                  {conta.ativo ? "Ativa" : "Inativa"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Última Movimentação */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Última Movimentação
            </label>
            <p className="font-medium">{new Date(conta.ultimaMovimentacao).toLocaleDateString("pt-BR")}</p>
          </div>

          <Separator />

          {/* Ações */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={handleGerarPDF}>
              <Download className="w-4 h-4 mr-2" />
              Gerar PDF
            </Button>
            <Button onClick={onClose}>Fechar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
