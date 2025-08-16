import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FormasPagamentoForm } from "./formas-pagamento-form"

interface FormasPagamentoModalProps {
  isOpen: boolean
  onClose: () => void
}

export function FormasPagamentoModal({ isOpen, onClose }: FormasPagamentoModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Forma de Pagamento</DialogTitle>
        </DialogHeader>
        <FormasPagamentoForm onSuccess={onClose} />
      </DialogContent>
    </Dialog>
  )
}
