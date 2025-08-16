"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface DepartamentosListProps {
  onEditar?: (departamento: any) => void
  onExcluir?: (departamento: any) => void
}

export function DepartamentosList({ onEditar, onExcluir }: DepartamentosListProps) {
  const [departamentos, setDepartamentos] = useState<any[]>([])
  const [errorMsg, setErrorMsg] = useState("")

  async function fetchDepartamentos() {
    const { data, error } = await supabase.from("departamentos").select("*")
    if (error) {
      setErrorMsg("Erro ao buscar departamentos: " + error.message)
      return
    }
    setDepartamentos(data || [])
  }

  useEffect(() => {
    fetchDepartamentos()
    const handler = () => fetchDepartamentos()
    window.addEventListener("departamentosAtualizado", handler)
    return () => window.removeEventListener("departamentosAtualizado", handler)
  }, [])

  return (
    <div>
      {errorMsg && <div className="text-red-600">{errorMsg}</div>}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {departamentos.map((dep) => (
            <TableRow key={dep.id}>
              <TableCell>{dep.nome}</TableCell>
              <TableCell>{dep.ativo ? "Ativo" : "Inativo"}</TableCell>
              <TableCell>
                <Button size="sm" onClick={() => onEditar?.(dep)}>
                  Editar
                </Button>
                <Button size="sm" variant="destructive" onClick={() => onExcluir?.(dep)}>
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
