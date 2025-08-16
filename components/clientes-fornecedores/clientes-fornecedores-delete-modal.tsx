"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, User, Building2, Mail, Phone, MapPin } from "lucide-react"

interface ClientesFornecedoresDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  clienteFornecedor: any
}

export function ClientesFornecedoresDeleteModal({
  isOpen,
  onClose,
  clienteFornecedor,
}: ClientesFornecedoresDeleteModalProps) {
  if (!clienteFornecedor) return null

  const handleDelete = async () => {
    if (!clienteFornecedor?.id) {
      onClose()
      return
    }
    const { error } = await import("@/lib/supabase/client").then(({ supabase }) =>
      supabase.from("clientes_fornecedores").delete().eq("id", clienteFornecedor.id)
    )
    if (error) {
      alert("Erro ao excluir cliente/fornecedor: " + error.message)
    }
    onClose()
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("clientesFornecedoresAtualizado"))
    }
  }

  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case "cliente":
        return <Badge className="bg-blue-100 text-blue-800">Cliente</Badge>
      case "fornecedor":
        return <Badge className="bg-orange-100 text-orange-800">Fornecedor</Badge>
      case "ambos":
        return <Badge className="bg-purple-100 text-purple-800">Cliente/Fornecedor</Badge>
      default:
        return <Badge variant="secondary">{tipo}</Badge>
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            <span>Confirmar Exclusão</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.
          </p>

          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center space-x-3 mb-3">
              {clienteFornecedor.tipo === "cliente" ? (
                <User className="w-5 h-5 text-blue-600" />
              ) : (
                <Building2 className="w-5 h-5 text-orange-600" />
              )}
              <div>
                <h3 className="font-semibold">{clienteFornecedor.nome}</h3>
                <p className="text-sm text-gray-600">{clienteFornecedor.documento}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 mb-3">
              {getTipoBadge(clienteFornecedor.tipo)}
              <Badge variant={clienteFornecedor.ativo ? "default" : "secondary"}>
                {clienteFornecedor.ativo ? "Ativo" : "Inativo"}
              </Badge>
            </div>

            <div className="space-y-2 text-sm text-gray-600">
              {clienteFornecedor.email && (
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4" />
                  <span>{clienteFornecedor.email}</span>
                </div>
              )}
              {clienteFornecedor.telefone && (
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4" />
                  <span>{clienteFornecedor.telefone}</span>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span>
                  {clienteFornecedor.cidade}/{clienteFornecedor.estado}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              <strong>Atenção:</strong> A exclusão deste registro pode afetar lançamentos e relatórios associados.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Excluir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
