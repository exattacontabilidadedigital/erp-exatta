"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface TiposCentroCustosListProps {
  onEditar?: (tipo: any) => void
  onExcluir?: (tipo: any) => void
}

export function TiposCentroCustosList({ onEditar, onExcluir }: TiposCentroCustosListProps) {
  const [tipos, setTipos] = useState<any[]>([])
  const [errorMsg, setErrorMsg] = useState("")

  async function fetchTipos() {
    const { data, error } = await supabase.from("tipos_centro_custos").select("*")
    if (error) {
      setErrorMsg("Erro ao buscar tipos: " + error.message)
      return
    }
    setTipos(data || [])
  }

  useEffect(() => {
    fetchTipos()
    const handler = () => fetchTipos()
    window.addEventListener("tiposCentroCustosAtualizado", handler)
    return () => window.removeEventListener("tiposCentroCustosAtualizado", handler)
  }, [])

  return (
    <div>
      {errorMsg && <div className="text-red-600">{errorMsg}</div>}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tipos.map((tipo) => (
            <TableRow key={tipo.id}>
              <TableCell>{tipo.nome}</TableCell>
              <TableCell>{tipo.descricao}</TableCell>
              <TableCell>{tipo.ativo ? "Ativo" : "Inativo"}</TableCell>
              <TableCell>
                <Button size="sm" onClick={() => onEditar?.(tipo)}>
                  Editar
                </Button>
                <Button size="sm" variant="destructive" onClick={() => onExcluir?.(tipo)}>
                  Excluir
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
