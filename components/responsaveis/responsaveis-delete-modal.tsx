"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface ResponsaveisDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  responsavel: any
}

export function ResponsaveisDeleteModal({ isOpen, onClose, responsavel }: ResponsaveisDeleteModalProps) {
  if (!responsavel) return null

  const handleDelete = async () => {
    if (!responsavel?.id) {
      onClose()
      return
    }
    const { error } = await import("@/lib/supabase/client").then(({ supabase }) =>
      supabase.from("responsaveis").delete().eq("id", responsavel.id)
    )
    if (error) {
      alert("Erro ao excluir responsável: " + error.message)
    }
    onClose()
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("responsaveisAtualizado"))
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar Exclusão</DialogTitle>
        </DialogHeader>
        <div className="py-4">Tem certeza que deseja excluir o responsável <b>{responsavel.nome}</b>?</div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button variant="destructive" onClick={handleDelete}>Excluir</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
