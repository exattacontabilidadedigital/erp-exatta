"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, CreditCard, Clock, Percent } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface FormasPagamentoDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  formaPagamento: any
}

export function FormasPagamentoDeleteModal({ isOpen, onClose, formaPagamento }: FormasPagamentoDeleteModalProps) {
  if (!formaPagamento) return null

  const handleDelete = () => {
    // Simular exclusão
    console.log("Excluindo forma de pagamento:", formaPagamento.nome)
    onClose()
  }

  const getTipoLabel = (tipo: string) => {
    const tipos: { [key: string]: string } = {
      dinheiro: "Dinheiro",
      cartao_credito: "Cartão de Crédito",
      cartao_debito: "Cartão de Débito",
      transferencia: "Transferência",
      boleto: "Boleto",
      pix: "PIX",
      cheque: "Cheque",
      outros: "Outros",
    }
    return tipos[tipo] || tipo
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <span>Confirmar Exclusão</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              Esta ação não pode ser desfeita. A forma de pagamento será permanentemente removida.
            </AlertDescription>
          </Alert>

          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center space-x-2 mb-3">
              <CreditCard className="h-5 w-5 text-gray-600" />
              <h3 className="font-semibold">{formaPagamento.nome}</h3>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Tipo:</span>
                <Badge variant="outline">{getTipoLabel(formaPagamento.tipo)}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Prazo Médio:</span>
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span>{formaPagamento.prazoMedio} dias</span>
                </div>
              </div>
              {formaPagamento.taxaJuros > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Taxa de Juros:</span>
                  <div className="flex items-center space-x-1">
                    <Percent className="w-4 h-4 text-gray-400" />
                    <span>{formaPagamento.taxaJuros}%</span>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Status:</span>
                <Badge variant={formaPagamento.ativo ? "default" : "secondary"}>
                  {formaPagamento.ativo ? "Ativo" : "Inativo"}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Excluir Forma de Pagamento
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
