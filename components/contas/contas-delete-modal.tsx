"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"
import { supabase } from "@/lib/supabase/client"


interface ContasDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  conta: any
  onConfirm: () => void
}

export function ContasDeleteModal({ isOpen, onClose, conta, onConfirm }: ContasDeleteModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  if (!conta) return null

  const handleDelete = async () => {
    setLoading(true)
    setError(null)
    const { error } = await supabase.from("contas_bancarias").delete().eq("id", conta.id)
    setLoading(false)
    if (error) {
      setError("Erro ao excluir conta: " + error.message)
      return
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("contasAtualizado"))
    }
    onConfirm()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Confirmar Exclusão
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-gray-600">
            Tem certeza que deseja excluir a conta bancária abaixo? Esta ação não pode ser desfeita.
          </p>

          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="font-medium">{conta.banco}</div>
            <div className="text-sm text-gray-600">
              Agência: {conta.agencia} | Conta: {conta.conta}{conta.digito ? `-${conta.digito}` : ""}
            </div>
            <div className="text-sm text-gray-600">Saldo Atual: R$ {Number(conta.saldo_atual || 0).toLocaleString()}</div>
          </div>
          {loading && <div className="text-center py-2">Excluindo conta...</div>}
          {error && <div className="text-center text-red-600 py-2">{error}</div>}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              Excluir Conta
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
