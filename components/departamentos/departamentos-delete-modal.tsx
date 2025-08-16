"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface DepartamentosDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  departamento: any
}

export function DepartamentosDeleteModal({ isOpen, onClose, departamento }: DepartamentosDeleteModalProps) {
  if (!departamento) return null

  const handleDelete = async () => {
    if (!departamento?.id) {
      onClose()
      return
    }
    const { error } = await import("@/lib/supabase/client").then(({ supabase }) =>
      supabase.from("departamentos").delete().eq("id", departamento.id)
    )
    if (error) {
      alert("Erro ao excluir departamento: " + error.message)
    }
    onClose()
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("departamentosAtualizado"))
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar Exclusão</DialogTitle>
        </DialogHeader>
        <div className="py-4">Tem certeza que deseja excluir o departamento <b>{departamento.nome}</b>?</div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button variant="destructive" onClick={handleDelete}>Excluir</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
