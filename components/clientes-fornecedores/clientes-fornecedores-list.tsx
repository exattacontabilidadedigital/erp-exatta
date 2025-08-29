import React, { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Edit, Trash2, Mail, Phone, MapPin, Search } from "lucide-react"
import { ClientesFornecedoresPagination } from "./clientes-fornecedores-pagination"

interface ClientesFornecedoresListProps {
  onEditar?: (clienteFornecedor: any) => void
  onExcluir?: (clienteFornecedor: any) => void
}

export function ClientesFornecedoresList({ onEditar, onExcluir }: ClientesFornecedoresListProps) {
  const [clientesFornecedores, setClientesFornecedores] = React.useState<any[]>([])
  const [errorMsg, setErrorMsg] = React.useState("")
  const [loading, setLoading] = React.useState(true)
  
  // Estados para paginação e busca
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState("")

  async function fetchClientesFornecedores() {
    try {
      setLoading(true)
      const { data, error } = await import("@/lib/supabase/client").then(({ supabase }) =>
        supabase.from("clientes_fornecedores").select("*").order("nome")
      )
      if (error) {
        setErrorMsg("Erro ao buscar clientes/fornecedores: " + error.message)
        return
      }
      setClientesFornecedores(data || [])
    } catch (error) {
      setErrorMsg("Erro inesperado ao carregar dados")
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    fetchClientesFornecedores()
    const handler = () => fetchClientesFornecedores()
    window.addEventListener("clientesFornecedoresAtualizado", handler)
    return () => window.removeEventListener("clientesFornecedoresAtualizado", handler)
  }, [])

  // Filtrar dados baseado na busca
  const filteredData = useMemo(() => {
    if (!searchTerm) return clientesFornecedores
    
    return clientesFornecedores.filter((item) =>
      item.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.razao_social?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.cpf_cnpj?.includes(searchTerm) ||
      item.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.cidade?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [clientesFornecedores, searchTerm])

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

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Carregando clientes/fornecedores...</span>
        </CardContent>
      </Card>
    )
  }

  if (errorMsg) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-red-600">
            <p className="font-medium">Erro ao carregar dados</p>
            <p className="text-sm">{errorMsg}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle>Clientes e Fornecedores</CardTitle>
          
          {/* Campo de busca */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar por nome, documento, email..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10"
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {currentItems.map((item) => (
            <div key={item.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-semibold">{item.nome}</h3>
                    {getTipoBadge(item.tipo)}
                    <Badge variant={item.ativo ? "default" : "secondary"}>
                      {item.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{item.cpf_cnpj}</p>
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
                    {item.cidade && item.estado && (
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>
                          {item.cidade}/{item.estado}
                        </span>
                      </div>
                    )}
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
      
      {/* Paginação */}
      <ClientesFornecedoresPagination
        currentPage={currentPage}
        totalPages={totalPages}
        itemsPerPage={itemsPerPage}
        totalItems={totalItems}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
        loading={loading}
      />
    </Card>
  )
}
