"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Trash2, X } from "lucide-react"
import { useToast } from "@/contexts/toast-context"
import { supabase } from "@/lib/supabase/client"

interface UsuariosDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  usuario?: any
  onDeleted?: () => void
}

export function UsuariosDeleteModal({ isOpen, onClose, usuario }: UsuariosDeleteModalProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const handleDelete = async () => {
    setIsLoading(true)
    try {
      if (!usuario?.id) throw new Error("Usuário inválido")
      const { error } = await supabase
        .from("usuarios")
        .delete()
        .eq("id", usuario.id)
      if (error) throw error
      toast({
        title: "Usuário excluído",
        description: `O usuário ${usuario?.nome} foi excluído com sucesso.`,
      })
      onClose()
      if (typeof arguments[0]?.onDeleted === "function") arguments[0].onDeleted()
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir usuário.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!usuario) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center text-red-600">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Confirmar Exclusão
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-gray-600">
            Tem certeza que deseja excluir o usuário <strong>{usuario.nome}</strong>?
          </p>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-medium text-red-800 mb-2">Atenção:</h4>
            <ul className="text-sm text-red-700 space-y-1">
              <li>• Esta ação não pode ser desfeita</li>
              <li>• O usuário perderá acesso ao sistema</li>
              <li>• Histórico de ações será mantido</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-4">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir Usuário
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
