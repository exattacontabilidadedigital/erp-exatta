"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface ResponsaveisListProps {
  onEditar?: (responsavel: any) => void
  onExcluir?: (responsavel: any) => void
}

export function ResponsaveisList({ onEditar, onExcluir }: ResponsaveisListProps) {
  const [responsaveis, setResponsaveis] = useState<any[]>([])
  const [errorMsg, setErrorMsg] = useState("")

  async function fetchResponsaveis() {
    const { data, error } = await supabase.from("responsaveis").select("*")
    if (error) {
      setErrorMsg("Erro ao buscar responsáveis: " + error.message)
      return
    }
    setResponsaveis(data || [])
  }

  useEffect(() => {
    fetchResponsaveis()
    const handler = () => fetchResponsaveis()
    window.addEventListener("responsaveisAtualizado", handler)
    return () => window.removeEventListener("responsaveisAtualizado", handler)
  }, [])

  return (
    <div>
      {errorMsg && <div className="text-red-600">{errorMsg}</div>}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {responsaveis.map((resp) => (
            <TableRow key={resp.id}>
              <TableCell>{resp.nome}</TableCell>
              <TableCell>{resp.email}</TableCell>
              <TableCell>{resp.ativo ? "Ativo" : "Inativo"}</TableCell>
              <TableCell>
                <Button size="sm" onClick={() => onEditar?.(resp)}>
                  Editar
                </Button>
                <Button size="sm" variant="destructive" onClick={() => onExcluir?.(resp)}>
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
