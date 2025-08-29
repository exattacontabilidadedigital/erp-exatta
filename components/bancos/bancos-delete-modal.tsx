"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

interface BancosDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  banco: any
}

export function BancosDeleteModal({ isOpen, onClose, onConfirm, banco }: BancosDeleteModalProps) {
  if (!banco) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Confirmar Exclusão
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-gray-600 mb-4">
            Tem certeza que deseja excluir este banco? Esta ação não pode ser desfeita.
          </p>

          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-xs bg-gray-200 px-2 py-1 rounded">{banco.codigo}</span>
              <span className="font-medium">{banco.nome}</span>
            </div>
            <p className="text-sm text-gray-600">{banco.nomeCompleto}</p>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Excluir Banco
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
