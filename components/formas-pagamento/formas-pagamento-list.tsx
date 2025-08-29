"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Edit, Trash2, Clock, Percent, Search, ArrowUpDown, ArrowUp, ArrowDown, X } from "lucide-react"
import { FormasPagamentoPagination } from "./formas-pagamento-pagination"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"

interface FormasPagamentoListProps {
  onEditar: (formaPagamento: any) => void
  onExcluir: (formaPagamento: any) => void
}

export function FormasPagamentoList({ onEditar, onExcluir }: FormasPagamentoListProps) {
  // Estado para paginação e busca
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterTipo, setFilterTipo] = useState("todos")
  const [filterStatus, setFilterStatus] = useState("todos")
  const [sortBy, setSortBy] = useState("nome")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<any>(null)

  // Dados mockados expandidos para demonstrar a paginação
  const formasPagamento = [
    {
      id: 1,
      nome: "Dinheiro",
      tipo: "dinheiro",
      prazoMedio: 0,
      taxaJuros: 0,
      ativo: true,
    },
    {
      id: 2,
      nome: "Cartão de Crédito",
      tipo: "cartao_credito",
      prazoMedio: 30,
      taxaJuros: 2.5,
      ativo: true,
    },
    {
      id: 3,
      nome: "PIX",
      tipo: "pix",
      prazoMedio: 0,
      taxaJuros: 0,
      ativo: true,
    },
    {
      id: 4,
      nome: "Boleto Bancário",
      tipo: "boleto",
      prazoMedio: 3,
      taxaJuros: 0,
      ativo: true,
    },
    {
      id: 5,
      nome: "Cartão de Débito",
      tipo: "cartao_debito",
      prazoMedio: 1,
      taxaJuros: 0,
      ativo: true,
    },
    {
      id: 6,
      nome: "Transferência Bancária",
      tipo: "transferencia",
      prazoMedio: 1,
      taxaJuros: 0,
      ativo: true,
    },
    {
      id: 7,
      nome: "Cheque",
      tipo: "cheque",
      prazoMedio: 5,
      taxaJuros: 0,
      ativo: false,
    },
    {
      id: 8,
      nome: "Cartão de Crédito Premium",
      tipo: "cartao_credito",
      prazoMedio: 45,
      taxaJuros: 1.8,
      ativo: true,
    },
    {
      id: 9,
      nome: "PIX Programado",
      tipo: "pix",
      prazoMedio: 1,
      taxaJuros: 0,
      ativo: true,
    },
    {
      id: 10,
      nome: "Boleto à Vista",
      tipo: "boleto",
      prazoMedio: 0,
      taxaJuros: 0,
      ativo: true,
    },
    {
      id: 11,
      nome: "Cartão Corporativo",
      tipo: "cartao_credito",
      prazoMedio: 30,
      taxaJuros: 2.2,
      ativo: true,
    },
    {
      id: 12,
      nome: "Crédito Direto",
      tipo: "outros",
      prazoMedio: 15,
      taxaJuros: 3.5,
      ativo: true,
    },
  ]

  const getTipoLabel = (tipo: string) => {
    const tipos: { [key: string]: string } = {
      dinheiro: "Dinheiro",
      cartao_credito: "Cartão de Crédito",
      cartao_debito: "Cartão de Débito",
      transferencia: "Transferência",
      boleto: "Boleto",
      pix: "PIX",
      cheque: "Cheque",
      outros: "Outros",
    }
    return tipos[tipo] || tipo
  }

  // Filtrar e ordenar dados
  const filteredData = useMemo(() => {
    let filtered = formasPagamento.filter((forma) => {
      const matchesSearch = forma.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getTipoLabel(forma.tipo).toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesTipo = !filterTipo || filterTipo === "todos" || forma.tipo === filterTipo
      const matchesStatus = !filterStatus || filterStatus === "todos" ||
        (filterStatus === "ativo" && forma.ativo) ||
        (filterStatus === "inativo" && !forma.ativo)
      
      return matchesSearch && matchesTipo && matchesStatus
    })

    // Ordenação
    filtered.sort((a, b) => {
      let aValue = a[sortBy]
      let bValue = b[sortBy]
      
      if (sortBy === "tipo") {
        aValue = getTipoLabel(a.tipo)
        bValue = getTipoLabel(b.tipo)
      }
      
      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }
      
      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    return filtered
  }, [formasPagamento, searchTerm, filterTipo, filterStatus, sortBy, sortOrder])

  // Calcular dados da paginação
  const totalItems = filteredData.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentItems = filteredData.slice(startIndex, endIndex)

  // Handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1) // Reset para primeira página
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setCurrentPage(1) // Reset para primeira página quando buscar
  }

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(column)
      setSortOrder("asc")
    }
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setSearchTerm("")
    setFilterTipo("todos")
    setFilterStatus("todos")
    setSortBy("nome")
    setSortOrder("asc")
    setCurrentPage(1)
  }

  const handleDeleteClick = (item: any) => {
    setItemToDelete(item)
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = () => {
    if (itemToDelete) {
      onExcluir(itemToDelete)
    }
    setShowDeleteDialog(false)
    setItemToDelete(null)
  }

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false)
    setItemToDelete(null)
  }

  return (
    <Card>
      <CardHeader>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle>Formas de Pagamento Cadastradas</CardTitle>
            
            {/* Campo de busca */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por nome ou tipo..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-10"
              />
            </div>
          </div>

          {/* Filtros avançados */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Filtros:</span>
              
              <Select value={filterTipo} onValueChange={setFilterTipo}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os tipos</SelectItem>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                  <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                  <SelectItem value="transferencia">Transferência</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="w-4 h-4 mr-1" />
                Limpar
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Cabeçalhos clicáveis para ordenação */}
        <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 rounded-lg mb-4 text-sm font-medium text-gray-700">
          <div className="col-span-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSort("nome")}
              className="h-auto p-0 font-medium justify-start"
            >
              Nome
              {sortBy === "nome" ? (
                sortOrder === "asc" ? <ArrowUp className="w-4 h-4 ml-1" /> : <ArrowDown className="w-4 h-4 ml-1" />
              ) : (
                <ArrowUpDown className="w-4 h-4 ml-1 opacity-50" />
              )}
            </Button>
          </div>
          <div className="col-span-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSort("tipo")}
              className="h-auto p-0 font-medium justify-start"
            >
              Tipo
              {sortBy === "tipo" ? (
                sortOrder === "asc" ? <ArrowUp className="w-4 h-4 ml-1" /> : <ArrowDown className="w-4 h-4 ml-1" />
              ) : (
                <ArrowUpDown className="w-4 h-4 ml-1 opacity-50" />
              )}
            </Button>
          </div>
          <div className="col-span-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSort("prazoMedio")}
              className="h-auto p-0 font-medium justify-start"
            >
              Prazo
              {sortBy === "prazoMedio" ? (
                sortOrder === "asc" ? <ArrowUp className="w-4 h-4 ml-1" /> : <ArrowDown className="w-4 h-4 ml-1" />
              ) : (
                <ArrowUpDown className="w-4 h-4 ml-1 opacity-50" />
              )}
            </Button>
          </div>
          <div className="col-span-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSort("taxaJuros")}
              className="h-auto p-0 font-medium justify-start"
            >
              Taxa
              {sortBy === "taxaJuros" ? (
                sortOrder === "asc" ? <ArrowUp className="w-4 h-4 ml-1" /> : <ArrowDown className="w-4 h-4 ml-1" />
              ) : (
                <ArrowUpDown className="w-4 h-4 ml-1 opacity-50" />
              )}
            </Button>
          </div>
          <div className="col-span-2 text-right">Ações</div>
        </div>

        <div className="space-y-4">
          {currentItems.map((forma) => (
            <div key={forma.id} className="grid grid-cols-12 gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors items-center">
              <div className="col-span-4">
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold">{forma.nome}</h3>
                  <Badge variant={forma.ativo ? "default" : "secondary"}>
                    {forma.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
              </div>
              <div className="col-span-2">
                <Badge variant="outline">{getTipoLabel(forma.tipo)}</Badge>
              </div>
              <div className="col-span-2">
                <div className="flex items-center space-x-1 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>{forma.prazoMedio} dias</span>
                </div>
              </div>
              <div className="col-span-2">
                {forma.taxaJuros > 0 ? (
                  <div className="flex items-center space-x-1 text-sm text-gray-600">
                    <Percent className="w-4 h-4" />
                    <span>{forma.taxaJuros}%</span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">-</span>
                )}
              </div>
              <div className="col-span-2 flex justify-end space-x-2">
                <Button variant="outline" size="sm" onClick={() => onEditar(forma)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDeleteClick(forma)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      
      {/* Paginação */}
      <FormasPagamentoPagination
        currentPage={currentPage}
        totalPages={totalPages}
        itemsPerPage={itemsPerPage}
        totalItems={totalItems}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
      />

      {/* Diálogo de confirmação de exclusão */}
      <ConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Confirmar Exclusão"
        description={`Tem certeza que deseja excluir a forma de pagamento "${itemToDelete?.nome}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="destructive"
      />
    </Card>
  )
}
