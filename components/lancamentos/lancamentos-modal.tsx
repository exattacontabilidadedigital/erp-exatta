"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { LancamentosForm } from "./lancamentos-form"
import { ErrorBoundary } from "./error-boundary"

interface Lancamento {
  id: string
  tipo: string
  data_lancamento: Date
  numero_documento: string
  plano_conta_id: string
  centro_custo_id: string
  valor: number
  cliente_fornecedor_id: string
  conta_bancaria_id: string
  forma_pagamento_id: string
  descricao: string
  status: string
}

interface LancamentosModalProps {
  isOpen: boolean
  onClose: () => void
  lancamento?: Lancamento
  isEditing?: boolean
}

export function LancamentosModal({ isOpen, onClose, lancamento, isEditing = false }: LancamentosModalProps) {
  const handleSuccess = () => {
    onClose() // Isso vai chamar handleCloseEditModal que agora atualiza a lista
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby="lancamentos-modal-description">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Lançamento" : "Novo Lançamento"}</DialogTitle>
        </DialogHeader>
        <div id="lancamentos-modal-description">
          <ErrorBoundary
            fallback={
              <div className="p-4 border border-red-300 bg-red-50 rounded-md">
                <h3 className="text-red-800 font-medium">Erro no formulário</h3>
                <p className="text-red-600 text-sm mt-2">
                  Ocorreu um erro ao carregar o formulário de lançamentos. Tente fechar e abrir o modal novamente.
                </p>
              </div>
            }
          >
            <LancamentosForm onSuccess={handleSuccess} initialData={lancamento} isEditing={isEditing} />
          </ErrorBoundary>
        </div>
      </DialogContent>
    </Dialog>
  )
}
