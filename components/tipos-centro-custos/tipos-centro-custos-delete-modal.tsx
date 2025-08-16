"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface TiposCentroCustosDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  tipo: any
}

export function TiposCentroCustosDeleteModal({ isOpen, onClose, tipo }: TiposCentroCustosDeleteModalProps) {
  if (!tipo) return null

  const handleDelete = async () => {
    if (!tipo?.id) {
      onClose()
      return
    }
    const { error } = await import("@/lib/supabase/client").then(({ supabase }) =>
      supabase.from("tipos_centro_custos").delete().eq("id", tipo.id)
    )
    if (error) {
      alert("Erro ao excluir tipo: " + error.message)
    }
    onClose()
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("tiposCentroCustosAtualizado"))
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar Exclusão</DialogTitle>
        </DialogHeader>
        <div className="py-4">Tem certeza que deseja excluir o tipo <b>{tipo.nome}</b>?</div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button variant="destructive" onClick={handleDelete}>Excluir</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
