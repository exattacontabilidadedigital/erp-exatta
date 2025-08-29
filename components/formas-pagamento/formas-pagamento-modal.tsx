import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FormasPagamentoForm } from "./formas-pagamento-form"

interface FormasPagamentoModalProps {
  isOpen: boolean
  onClose: () => void
  formaPagamento?: any
  isEditing?: boolean
}

export function FormasPagamentoModal({ isOpen, onClose, formaPagamento = null, isEditing = false }: FormasPagamentoModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Forma de Pagamento" : "Nova Forma de Pagamento"}
          </DialogTitle>
        </DialogHeader>
        <FormasPagamentoForm 
          onSuccess={onClose} 
          initialData={formaPagamento}
          isEditing={isEditing}
        />
      </DialogContent>
    </Dialog>
  )
}
