"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { LancamentosForm } from "./lancamentos-form"

interface Lancamento {
  id: string
  tipo: string
  data: Date
  numeroDocumento: string
  planoContas: string
  centroCusto: string
  valor: string
  clienteFornecedor: string
  contaBancaria: string
  historico: string
  status: string
}

interface LancamentosModalProps {
  isOpen: boolean
  onClose: () => void
  lancamento?: Lancamento
  isEditing?: boolean
}

export function LancamentosModal({ isOpen, onClose, lancamento, isEditing = false }: LancamentosModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Lançamento" : "Novo Lançamento"}</DialogTitle>
        </DialogHeader>
        <LancamentosForm onSuccess={onClose} initialData={lancamento} isEditing={isEditing} />
      </DialogContent>
    </Dialog>
  )
}
