"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { FileText, Download } from "lucide-react"

interface LancamentosViewModalProps {
  isOpen: boolean
  onClose: () => void
  lancamento: any
}

export function LancamentosViewModal({ isOpen, onClose, lancamento }: LancamentosViewModalProps) {
  if (!lancamento) return null

  const handleGeneratePDF = () => {
    // Aqui seria implementada a geração do PDF
    console.log("Gerando PDF para lançamento:", lancamento.id)

    // Simulação de geração de PDF
    const pdfContent = `
      DETALHES DO LANÇAMENTO
      
      ID: ${lancamento.id}
      Data: ${new Date(lancamento.data).toLocaleDateString("pt-BR")}
      Tipo: ${lancamento.tipo.toUpperCase()}
      Número do Documento: ${lancamento.numeroDocumento}
      Plano de Contas: ${lancamento.planoContas}
      Centro de Custo: ${lancamento.centroCusto}
      Valor: R$ ${lancamento.valor.toLocaleString()}
      Cliente/Fornecedor: ${lancamento.clienteFornecedor}
      Conta Bancária: ${lancamento.contaBancaria}
      Histórico: ${lancamento.historico}
      Status: ${lancamento.status.toUpperCase()}
    `

    const blob = new Blob([pdfContent], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `lancamento_${lancamento.id}_detalhes.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "liquidado":
        return <Badge className="bg-green-100 text-green-800">Liquidado</Badge>
      case "pendente":
        return <Badge variant="secondary">Pendente</Badge>
      case "cancelado":
        return <Badge variant="destructive">Cancelado</Badge>
      default:
        return null
    }
  }

  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case "receita":
        return <Badge className="bg-green-100 text-green-800">Receita</Badge>
      case "despesa":
        return <Badge className="bg-red-100 text-red-800">Despesa</Badge>
      case "transferencia":
        return <Badge className="bg-blue-100 text-blue-800">Transferência</Badge>
      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Detalhes do Lançamento
            </DialogTitle>
            <Button onClick={handleGeneratePDF} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Gerar PDF
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Básicas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">ID do Lançamento</label>
              <p className="text-lg font-semibold">{lancamento.id}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Data</label>
              <p className="text-lg">{new Date(lancamento.data).toLocaleDateString("pt-BR")}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Tipo</label>
              <div className="mt-1">{getTipoBadge(lancamento.tipo)}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Status</label>
              <div className="mt-1">{getStatusBadge(lancamento.status)}</div>
            </div>
          </div>

          <Separator />

          {/* Informações Financeiras */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Número do Documento</label>
              <p className="text-lg font-medium">{lancamento.numeroDocumento}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Valor</label>
              <p
                className={`text-lg font-bold ${
                  lancamento.tipo === "receita"
                    ? "text-green-600"
                    : lancamento.tipo === "despesa"
                      ? "text-red-600"
                      : "text-blue-600"
                }`}
              >
                {lancamento.tipo === "despesa" ? "-" : "+"}R$ {lancamento.valor.toLocaleString()}
              </p>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500">Plano de Contas</label>
            <p className="text-lg">{lancamento.planoContas}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500">Centro de Custo</label>
            <p className="text-lg">{lancamento.centroCusto}</p>
          </div>

          <Separator />

          {/* Informações Complementares */}
          <div>
            <label className="text-sm font-medium text-gray-500">Cliente/Fornecedor</label>
            <p className="text-lg">{lancamento.clienteFornecedor}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500">Conta Bancária</label>
            <p className="text-lg">{lancamento.contaBancaria}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500">Histórico</label>
            <p className="text-lg bg-gray-50 p-3 rounded-md">{lancamento.historico}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default LancamentosViewModal
