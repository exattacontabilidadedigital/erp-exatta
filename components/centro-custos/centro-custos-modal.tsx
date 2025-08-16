import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CentroCustosForm } from "./centro-custos-form"

interface CentroCustosModalProps {
  isOpen: boolean
  onClose: () => void
  isEditing?: boolean
  centroCusto?: any
}

export function CentroCustosModal({ isOpen, onClose, isEditing = false, centroCusto }: CentroCustosModalProps) {
  const handleSuccess = () => {
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Centro de Custos" : "Novo Centro de Custos"}</DialogTitle>
        </DialogHeader>
        <CentroCustosForm onSuccess={handleSuccess} initialData={centroCusto} isEditing={isEditing} />
      </DialogContent>
    </Dialog>
  )
}
