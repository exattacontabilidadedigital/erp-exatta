
import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Edit, Trash2, Globe, Phone, Search } from "lucide-react"
import { BancosPagination } from "./bancos-pagination"

interface BancosListProps {
  onEdit?: (banco: any) => void
  onDelete?: (banco: any) => void
}

export function BancosList({ onEdit, onDelete }: BancosListProps) {
  const [bancos, setBancos] = React.useState<any[]>([])
  const [allBancos, setAllBancos] = React.useState<any[]>([])
  const [errorMsg, setErrorMsg] = React.useState("")
  const [currentPage, setCurrentPage] = React.useState(1)
  const [itemsPerPage, setItemsPerPage] = React.useState(10)
  const [loading, setLoading] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState("")

  async function fetchAllBancos() {
    setLoading(true)
    setErrorMsg("")
    
    try {
      const { supabase } = await import("@/lib/supabase/client")
      
      const { data, error } = await supabase
        .from("bancos")
        .select("*")
        .order("nome", { ascending: true })
      
      if (error) {
        console.error("Erro Supabase:", error)
        setErrorMsg("Erro ao buscar bancos: " + error.message)
        setAllBancos([])
        return
      }
      
      console.log("Bancos carregados:", data?.length || 0)
      setAllBancos(data || [])
    } catch (err) {
      console.error("Erro geral:", err)
      setErrorMsg("Erro inesperado: " + (err as Error).message)
      setAllBancos([])
    } finally {
      setLoading(false)
    }
  }

  // Filtrar bancos com base na busca
  const filteredBancos = React.useMemo(() => {
    if (!searchTerm.trim()) return allBancos
    
    return allBancos.filter(banco => 
      banco.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      banco.nomeCompleto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      banco.codigo?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [allBancos, searchTerm])

  // Paginar bancos filtrados
  const paginatedBancos = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredBancos.slice(startIndex, endIndex)
  }, [filteredBancos, currentPage, itemsPerPage])

  // Calcular total de páginas
  const totalPages = Math.ceil(filteredBancos.length / itemsPerPage)

  React.useEffect(() => {
    fetchAllBancos()
  }, [])

  React.useEffect(() => {
    const handler = () => {
      fetchAllBancos()
    }
    window.addEventListener("bancosAtualizado", handler)
    return () => window.removeEventListener("bancosAtualizado", handler)
  }, [])

  // Reset para primeira página quando buscar
  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  const handleSearch = (term: string) => {
    setSearchTerm(term)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1) // Reset para primeira página
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Bancos Cadastrados</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar por nome, código..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {errorMsg}
          </div>
        )}
        
        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Carregando bancos...</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {paginatedBancos.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    {searchTerm ? "Nenhum banco encontrado para a busca" : "Nenhum banco cadastrado"}
                  </p>
                </div>
              ) : (
                paginatedBancos.map((banco) => (
                  <div key={banco.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm bg-gray-100 px-2 py-1 rounded">{banco.codigo}</span>
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
                ))
              )}
            </div>

            {/* Paginação */}
            <BancosPagination
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={itemsPerPage}
              totalItems={filteredBancos.length}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
              loading={loading}
            />
          </>
        )}
      </CardContent>
    </Card>
  )
}
