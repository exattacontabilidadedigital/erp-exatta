"use client"

import { useState } from "react"
import { useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Edit, MoreHorizontal, Search, Trash2, Eye } from "lucide-react"
import { supabase } from "@/lib/supabase/client"


interface LancamentosListProps {
  onVisualizar?: (lancamento: any) => void
  onEditar?: (lancamento: any) => void
  onExcluir?: (lancamento: any) => void
  refresh?: number
}

export function LancamentosList({ onVisualizar, onEditar, onExcluir, refresh }: LancamentosListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [lancamentos, setLancamentos] = useState<any[]>([])
  const [filteredLancamentos, setFilteredLancamentos] = useState<any[]>([])

  useEffect(() => {
    async function fetchLancamentos() {
      const { data, error } = await supabase.from("lancamentos").select("*").order("data", { ascending: false })
      if (!error && data) {
        // Converte campo data para Date
        const lancs = data.map((l: any) => ({ ...l, data: new Date(l.data) }))
        setLancamentos(lancs)
        setFilteredLancamentos(lancs)
      }
    }
    fetchLancamentos()
  }, [refresh])

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    const filtered = lancamentos.filter(
      (lancamento) =>
        lancamento.numeroDocumento?.toLowerCase().includes(term.toLowerCase()) ||
        lancamento.clienteFornecedor?.toLowerCase().includes(term.toLowerCase()) ||
        lancamento.historico?.toLowerCase().includes(term.toLowerCase()),
    )
    setFilteredLancamentos(filtered)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "liquidado":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">Liquidado</Badge>
        )
      case "pendente":
        return <Badge variant="secondary">Pendente</Badge>
      case "cancelado":
        return <Badge variant="destructive">Cancelado</Badge>
      default:
        return null
    }
  }

  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case "receita":
        return <Badge className="bg-green-100 text-green-800">Receita</Badge>
      case "despesa":
        return <Badge className="bg-red-100 text-red-800">Despesa</Badge>
      case "transferencia":
        return <Badge className="bg-blue-100 text-blue-800">Transferência</Badge>
      case "pagamento":
        return <Badge className="bg-orange-100 text-orange-800">Pagamento</Badge>
      case "recebimento":
        return <Badge className="bg-purple-100 text-purple-800">Recebimento</Badge>
      default:
        return null
    }
  }

  const getPlanoContasText = (codigo: string) => {
    const planos: { [key: string]: string } = {
      "1.1.01": "1.1.01 - Caixa",
      "1.1.02": "1.1.02 - Bancos",
      "1.2.01": "1.2.01 - Contas a Receber",
      "2.1.01": "2.1.01 - Fornecedores",
      "3.1.01": "3.1.01 - Receita de Vendas",
      "4.1.01": "4.1.01 - Despesas Operacionais",
    }
    return planos[codigo] || codigo
  }

  const getCentroCustoText = (codigo: string) => {
    const centros: { [key: string]: string } = {
      "001": "001 - Administrativo",
      "002": "002 - Vendas",
      "003": "003 - Produção",
      "004": "004 - Marketing",
      "005": "005 - Financeiro",
    }
    return centros[codigo] || codigo
  }

  const getClienteFornecedorText = (codigo: string) => {
    const clientes: { [key: string]: string } = {
      cliente1: "Empresa ABC Ltda",
      cliente2: "Cliente DEF",
      fornecedor1: "Fornecedor XYZ",
      fornecedor2: "Fornecedor 123",
    }
    return clientes[codigo] || codigo
  }

  const getContaBancariaText = (codigo: string) => {
    const contas: { [key: string]: string } = {
      bb001: "Banco do Brasil - CC 12345-6",
      itau001: "Itaú - CC 67890-1",
      caixa001: "Caixa Econômica - CC 11111-2",
      santander001: "Santander - CC 22222-3",
    }
    return contas[codigo] || codigo
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Lista de Lançamentos</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar lançamentos..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Plano de Contas</TableHead>
                <TableHead>Centro de Custo</TableHead>
                <TableHead>Cliente/Fornecedor</TableHead>
                <TableHead>Conta Bancária</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLancamentos.map((lancamento) => (
                <TableRow key={lancamento.id}>
                  <TableCell>{lancamento.data ? new Date(lancamento.data).toLocaleDateString() : ""}</TableCell>
                  <TableCell>{getTipoBadge(lancamento.tipo)}</TableCell>
                  <TableCell>{lancamento.numeroDocumento}</TableCell>
                  <TableCell>{getPlanoContasText(lancamento.planoContas)}</TableCell>
                  <TableCell>{getCentroCustoText(lancamento.centroCusto)}</TableCell>
                  <TableCell>{getClienteFornecedorText(lancamento.clienteFornecedor)}</TableCell>
                  <TableCell className="text-sm">{getContaBancariaText(lancamento.contaBancaria)}</TableCell>
                  <TableCell>
                    <span>
                      {lancamento.tipo === "despesa" ? "-" : "+"}R${" "}
                      {Number.parseFloat(lancamento.valor).toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell>{getStatusBadge(lancamento.status)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onVisualizar?.(lancamento)}>
                          <Eye className="mr-2 h-4 w-4" /> Visualizar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEditar?.(lancamento)}>
                          <Edit className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => onExcluir?.(lancamento)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
                </div>
              </CardContent>
            </Card>
          )
        }
