"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Trash2 } from "lucide-react"
import { toast } from "sonner"

interface CentroCustosDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  centro: any
}

export function CentroCustosDeleteModal({ isOpen, onClose, centro }: CentroCustosDeleteModalProps) {
  if (!centro) return null

  const handleDelete = async () => {
    if (!centro?.id) {
      onClose()
      return
    }
    // Real delete from Supabase
    const { error } = await import("@/lib/supabase/client").then(({ supabase }) =>
      supabase.from("centro_custos").delete().eq("id", centro.id)
    )
    if (error) {
      alert("Erro ao excluir centro de custo: " + error.message)
    } else {
      toast.success("Centro de custo excluído com sucesso!");
    }
    onClose()
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("centroCustosAtualizado"))
    }
  }

  const getTipoBadge = (tipo: string) => {
    const badges = {
      operacional: { label: "Operacional", className: "bg-blue-100 text-blue-800" },
      administrativo: { label: "Administrativo", className: "bg-green-100 text-green-800" },
      comercial: { label: "Comercial", className: "bg-purple-100 text-purple-800" },
      financeiro: { label: "Financeiro", className: "bg-orange-100 text-orange-800" },
      producao: { label: "Produção", className: "bg-red-100 text-red-800" },
      apoio: { label: "Apoio", className: "bg-gray-100 text-gray-800" },
    }
    const badge = badges[tipo as keyof typeof badges]
    if (!badge) {
      return <Badge className="bg-gray-100 text-gray-800">{tipo || "Tipo desconhecido"}</Badge>
    }
    return <Badge className={badge.className}>{badge.label}</Badge>
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
            Tem certeza que deseja excluir o centro de custo abaixo? Esta ação não pode ser desfeita.
          </p>

          <div className="p-4 bg-gray-50 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">Centro:</span>
              <span>
                {centro.codigo} - {centro.nome}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Tipo:</span>
              {getTipoBadge(centro.tipo)}
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Responsável:</span>
              <span>{centro.responsavel}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Orçamento:</span>
              <span>R$ {(centro.orcamentoMensal ?? 0).toLocaleString()}</span>
            </div>
          </div>

          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Atenção:</p>
                <p>
                  Todos os lançamentos associados a este centro de custo serão mantidos, mas ficarão sem classificação.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleDelete} className="gap-2">
            <Trash2 className="w-4 h-4" />
            Excluir Centro
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
