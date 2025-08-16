"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { BancosForm } from "./bancos-form"

interface BancosModalProps {
  isOpen: boolean
  onClose: () => void
  banco?: any
  isEditing?: boolean
}

export function BancosModal({ isOpen, onClose, banco, isEditing = false }: BancosModalProps) {
  const handleSuccess = () => {
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Banco" : "Novo Banco"}</DialogTitle>
        </DialogHeader>
        <BancosForm onSuccess={handleSuccess} initialData={banco} isEditing={isEditing} />
      </DialogContent>
    </Dialog>
  )
}
