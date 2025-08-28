"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

interface LancamentosDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  lancamento: any
}

export function LancamentosDeleteModal({ isOpen, onClose, onConfirm, lancamento }: LancamentosDeleteModalProps) {
  if (!lancamento) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Confirmar Exclusão
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p className="text-gray-600 mb-4">
            Tem certeza que deseja excluir este lançamento? Esta ação não pode ser desfeita.
          </p>

          <div className="bg-gray-50 p-4 rounded-md space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">ID:</span>
              <span>{lancamento.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Documento:</span>
              <span>{lancamento.numeroDocumento}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Valor:</span>
              <span className="font-semibold">R$ {lancamento.valor.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Cliente/Fornecedor:</span>
              <span>{lancamento.clienteFornecedor}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Excluir Lançamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default LancamentosDeleteModal
