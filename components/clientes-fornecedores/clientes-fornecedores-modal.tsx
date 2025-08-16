"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ClientesFornecedoresForm } from "./clientes-fornecedores-form"

interface ClientesFornecedoresModalProps {
  isOpen: boolean
  onClose: () => void
  clienteFornecedor?: any
  isEditing?: boolean
}

export function ClientesFornecedoresModal({ isOpen, onClose, clienteFornecedor, isEditing }: ClientesFornecedoresModalProps) {
  const handleSuccess = () => {
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Cliente/Fornecedor" : "Novo Cliente/Fornecedor"}</DialogTitle>
        </DialogHeader>
        <ClientesFornecedoresForm
          onSuccess={handleSuccess}
          initialData={clienteFornecedor}
          isEditing={isEditing}
        />
      </DialogContent>
    </Dialog>
  )
}
