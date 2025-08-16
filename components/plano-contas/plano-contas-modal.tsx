"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PlanoContasForm } from "./plano-contas-form"

interface PlanoContasModalProps {
  isOpen: boolean
  onClose: () => void
  isEditing?: boolean
  conta?: any
    isSubconta?: boolean
  contaPai?: string
}

export function PlanoContasModal({
  isOpen,
  onClose,
  isEditing = false,
  conta = null,
  contaPai = "",
}: PlanoContasModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Conta" : contaPai ? "Nova Subconta" : "Nova Conta"}</DialogTitle>
        </DialogHeader>
        <PlanoContasForm onSuccess={onClose} initialData={conta} contaPai={contaPai} isEditing={isEditing} />
      </DialogContent>
    </Dialog>
  )
}
