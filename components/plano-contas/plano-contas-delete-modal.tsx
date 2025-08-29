"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle } from "lucide-react"

interface PlanoContasDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  conta: any
}

export function PlanoContasDeleteModal({ isOpen, onClose, onConfirm, conta }: PlanoContasDeleteModalProps) {
  if (!conta) return null

  const getTipoBadge = (tipo: string) => {
    const badges = {
      ativo: { label: "Ativo", className: "bg-blue-100 text-blue-800" },
      passivo: { label: "Passivo", className: "bg-red-100 text-red-800" },
      patrimonio: { label: "PL", className: "bg-green-100 text-green-800" },
      receita: { label: "Receita", className: "bg-purple-100 text-purple-800" },
      despesa: { label: "Despesa", className: "bg-orange-100 text-orange-800" },
    }
    const badge = badges[tipo as keyof typeof badges]
    return <Badge className={badge.className}>{badge.label}</Badge>
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Confirmar Exclusão
          </DialogTitle>
          <DialogDescription>
            Esta ação não pode ser desfeita. A conta será permanentemente removida do plano de contas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Conta a ser excluída:</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">{conta.codigo}</span>
                <span className="text-sm text-gray-900">{conta.nome}</span>
              </div>
              <div className="flex items-center gap-2">
                {getTipoBadge(conta.tipo)}
                <Badge variant={conta.natureza === "devedora" ? "default" : "secondary"} className="text-xs">
                  {conta.natureza === "devedora" ? "Devedora" : "Credora"}
                </Badge>
              </div>
            </div>
          </div>

          {conta.children && conta.children.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Atenção:</strong> Esta conta possui {conta.children.length} subconta(s). Todas as subcontas
                também serão excluídas.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Excluir Conta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
