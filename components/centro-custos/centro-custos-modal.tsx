import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CentroCustosForm } from "./centro-custos-form"

interface CentroCustosModalProps {
  isOpen: boolean
  onClose: () => void
  isEditing?: boolean
  centroCusto?: any
  centroPai?: any
}

export function CentroCustosModal({ isOpen, onClose, isEditing = false, centroCusto, centroPai }: CentroCustosModalProps) {
  const handleSuccess = () => {
    onClose()
  }

  const getTitle = () => {
    if (isEditing) return "Editar Centro de Custos"
    if (centroPai) return `Novo Subcentro de "${centroPai.nome}"`
    return "Novo Centro de Custos"
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
        </DialogHeader>
        <CentroCustosForm 
          onSuccess={handleSuccess} 
          initialData={centroCusto} 
          isEditing={isEditing} 
          centroPai={centroPai}
        />
      </DialogContent>
    </Dialog>
  )
}
