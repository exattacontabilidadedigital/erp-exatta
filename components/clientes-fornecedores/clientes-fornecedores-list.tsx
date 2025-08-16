import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, Mail, Phone, MapPin } from "lucide-react"

interface ClientesFornecedoresListProps {
  onEditar?: (clienteFornecedor: any) => void
  onExcluir?: (clienteFornecedor: any) => void
}

export function ClientesFornecedoresList({ onEditar, onExcluir }: ClientesFornecedoresListProps) {
  const [clientesFornecedores, setClientesFornecedores] = React.useState<any[]>([])
  const [errorMsg, setErrorMsg] = React.useState("")

  async function fetchClientesFornecedores() {
    const { data, error } = await import("@/lib/supabase/client").then(({ supabase }) =>
      supabase.from("clientes_fornecedores").select("*")
    )
    if (error) {
      setErrorMsg("Erro ao buscar clientes/fornecedores: " + error.message)
      return
    }
    setClientesFornecedores(data || [])
  }

  React.useEffect(() => {
    fetchClientesFornecedores()
    const handler = () => fetchClientesFornecedores()
    window.addEventListener("clientesFornecedoresAtualizado", handler)
    return () => window.removeEventListener("clientesFornecedoresAtualizado", handler)
  }, [])

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
    <Card>
      <CardHeader>
        <CardTitle>Clientes e Fornecedores</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {clientesFornecedores.map((item) => (
            <div key={item.id} className="border rounded-lg p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-semibold">{item.nome}</h3>
                    {getTipoBadge(item.tipo)}
                    <Badge variant={item.ativo ? "default" : "secondary"}>{item.ativo ? "Ativo" : "Inativo"}</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{item.documento}</p>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    {item.email && (
                      <div className="flex items-center space-x-1">
                        <Mail className="w-4 h-4" />
                        <span>{item.email}</span>
                      </div>
                    )}
                    {item.telefone && (
                      <div className="flex items-center space-x-1">
                        <Phone className="w-4 h-4" />
                        <span>{item.telefone}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4" />
                      <span>
                        {item.cidade}/{item.estado}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => onEditar?.(item)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onExcluir?.(item)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
