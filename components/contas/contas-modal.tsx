"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ContasForm } from "./contas-form"


interface ContasModalProps {
  isOpen: boolean
  onClose: () => void
  conta?: any
  isEditing?: boolean
}

export function ContasModal({ isOpen, onClose, conta, isEditing }: ContasModalProps) {

  const handleSuccess = () => {
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Conta Bancária" : "Nova Conta Bancária"}</DialogTitle>
        </DialogHeader>
        <ContasForm onSuccess={handleSuccess} initialData={conta} isEditing={isEditing} />
      </DialogContent>
    </Dialog>
  )
}
