
import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, Globe, Phone } from "lucide-react"

interface BancosListProps {
  onEdit?: (banco: any) => void
  onDelete?: (banco: any) => void
}

export function BancosList({ onEdit, onDelete }: BancosListProps) {
  const [bancos, setBancos] = React.useState<any[]>([])
  const [errorMsg, setErrorMsg] = React.useState("")

  async function fetchBancos() {
    const { data, error } = await import("@/lib/supabase/client").then(({ supabase }) =>
      supabase.from("bancos").select("*")
    )
    if (error) {
      setErrorMsg("Erro ao buscar bancos: " + error.message)
      return
    }
    setBancos(data || [])
  }

  React.useEffect(() => {
    fetchBancos()
    const handler = () => fetchBancos()
    window.addEventListener("bancosAtualizado", handler)
    return () => window.removeEventListener("bancosAtualizado", handler)
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bancos Cadastrados</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {bancos.map((banco) => (
            <div key={banco.id} className="border rounded-lg p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{banco.codigo}</span>
                    <h3 className="font-semibold">{banco.nome}</h3>
                    <Badge className={banco.ativo ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                      {banco.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{banco.nomeCompleto}</p>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                    {banco.site && (
                      <div className="flex items-center space-x-1">
                        <Globe className="w-4 h-4" />
                        <span>{banco.site}</span>
                      </div>
                    )}
                    {banco.telefone && (
                      <div className="flex items-center space-x-1">
                        <Phone className="w-4 h-4" />
                        <span>{banco.telefone}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => onEdit?.(banco)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={banco.ativo ? "secondary" : "default"}
                    size="sm"
                    onClick={async () => {
                      const { error } = await import("@/lib/supabase/client").then(({ supabase }) =>
                        supabase.from("bancos").update({ ativo: !banco.ativo }).eq("id", banco.id)
                      )
                      if (error) {
                        alert("Erro ao atualizar status: " + error.message)
                        return
                      }
                      if (typeof window !== "undefined") {
                        window.dispatchEvent(new Event("bancosAtualizado"))
                      }
                    }}
                  >
                    {banco.ativo ? "Desativar" : "Ativar"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onDelete?.(banco)}>
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
