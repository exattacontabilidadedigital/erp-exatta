"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2, Shield, Plus } from "lucide-react"
import { supabase } from "@/lib/supabase/client"

interface Funcao {
  id: string
  nome: string
  permissoes: string[]
}

interface UsuariosFuncoesListProps {
  onEditar: (funcao: Funcao) => void
  onExcluir: (funcao: Funcao) => void
  refresh?: boolean
  onNovoFuncao?: () => void
}

export function UsuariosFuncoesList({ onEditar, onExcluir, refresh, onNovoFuncao }: UsuariosFuncoesListProps) {
  const [funcoes, setFuncoes] = useState<Funcao[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchFuncoes = async () => {
      setLoading(true)
      const { data, error } = await supabase.from("funcoes").select("*")
      if (!error && data) setFuncoes(data)
      setLoading(false)
    }
    fetchFuncoes()
  }, [refresh])

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <div className="flex items-center">
          <Shield className="w-5 h-5 mr-2" />
          <CardTitle>Funções do Sistema</CardTitle>
        </div>
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={onNovoFuncao}>
          <Plus className="w-4 h-4 mr-2" /> Nova Função
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div>Carregando...</div>
        ) : funcoes.length === 0 ? (
          <div className="text-gray-500">Nenhuma função cadastrada.</div>
        ) : (
          <div className="space-y-4">
            {funcoes.map((funcao) => (
              <div key={funcao.id} className="flex items-center justify-between border rounded-lg p-3">
                <div>
                  <div className="font-semibold">{funcao.nome}</div>
                  <div className="text-xs text-gray-500">Permissões: {funcao.permissoes.join(", ")}</div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button size="sm" variant="outline" onClick={() => onEditar(funcao)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => onExcluir(funcao)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
