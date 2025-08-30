"use client"

import { useState, useEffect, useMemo } from "react"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChevronDown, X, Search } from "lucide-react"

interface ClienteFornecedor {
  id: string
  nome: string
  tipo: string
  ativo: boolean
}

interface ClienteFornecedorSelectProps {
  value?: string[]
  onValueChange?: (value: string[]) => void
  placeholder?: string
  label?: string
  className?: string
}

export function ClienteFornecedorSelect({ 
  value = [], 
  onValueChange, 
  placeholder = "Selecione", 
  label = "",
  className = ""
}: ClienteFornecedorSelectProps) {
  const { userData } = useAuth()
  const [clientes, setClientes] = useState<ClienteFornecedor[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchClientes()
  }, [userData?.empresa_id])

  const fetchClientes = async () => {
    if (!userData?.empresa_id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('clientes_fornecedores')
        .select('id, nome, tipo, ativo')
        .eq('empresa_id', userData.empresa_id)
        .eq('ativo', true)
        .order('nome')

      if (error) {
        console.error('Erro ao buscar clientes/fornecedores:', error)
        setClientes([])
        return
      }

      const clientesFormatados = data?.map((cliente: any) => ({
        id: cliente.id,
        nome: cliente.nome || 'Cliente não identificado',
        tipo: cliente.tipo || 'Não especificado',
        ativo: cliente.ativo || false
      })) || []

      setClientes(clientesFormatados)
    } catch (error) {
      console.error('Erro ao buscar clientes/fornecedores:', error)
      setClientes([])
    } finally {
      setLoading(false)
    }
  }

  // Função para formatar cliente (definida antes do useMemo)
  const formatarCliente = (cliente: ClienteFornecedor) => {
    return `${cliente.nome} (${cliente.tipo})`
  }

  // Filtrar clientes baseado na busca
  const clientesFiltrados = useMemo(() => {
    if (!searchTerm) return clientes
    
    const searchLower = searchTerm.toLowerCase()
    return clientes.filter(cliente => 
      cliente.nome.toLowerCase().includes(searchLower) ||
      cliente.tipo.toLowerCase().includes(searchLower) ||
      formatarCliente(cliente).toLowerCase().includes(searchLower)
    )
  }, [clientes, searchTerm])

  const handleToggleCliente = (clienteId: string) => {
    const newValue = value.includes(clienteId)
      ? value.filter(id => id !== clienteId)
      : [...value, clienteId]
    
    onValueChange?.(newValue)
  }

  const handleSelectAll = () => {
    if (isAllSelected) {
      onValueChange?.([])
    } else {
      onValueChange?.(clientesFiltrados.map(cliente => cliente.id))
    }
  }

  const isAllSelected = useMemo(() => {
    return clientesFiltrados.length > 0 && clientesFiltrados.every(cliente => value.includes(cliente.id))
  }, [clientesFiltrados, value])

  const isIndeterminate = useMemo(() => {
    return clientesFiltrados.some(cliente => value.includes(cliente.id)) && !isAllSelected
  }, [clientesFiltrados, value, isAllSelected])

  const getDisplayText = () => {
    if (loading) return "Carregando..."
    if (value.length === 0) return placeholder
    if (value.length === 1) {
      const cliente = clientes.find(c => c.id === value[0])
      return cliente ? formatarCliente(cliente) : placeholder
    }
    return `${value.length} selecionados`
  }

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="text-sm font-medium text-gray-700 mb-1 block">
          {label}
        </label>
      )}
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between text-left font-normal h-10"
          >
            <span className="truncate">{getDisplayText()}</span>
            <div className="flex items-center gap-1">
              {value.length > 0 && (
                <div
                  className="h-4 w-4 p-0 hover:bg-gray-200 rounded cursor-pointer flex items-center justify-center"
                  onClick={(e) => {
                    e.stopPropagation()
                    onValueChange?.([])
                  }}
                >
                  <X className="h-3 w-3" />
                </div>
              )}
              <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
            </div>
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-80 p-0" align="start">
          <div className="flex flex-col">
            {/* Campo de pesquisa */}
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Pesquisar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-8"
                />
              </div>
            </div>

            <ScrollArea className="h-48">
              <div className="p-1">
                {/* Checkbox "Todos" */}
                <div className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                  <Checkbox
                    checked={isAllSelected || (isIndeterminate ? "indeterminate" : false)}
                    onCheckedChange={handleSelectAll}
                  />
                  <label 
                    className="text-sm font-medium cursor-pointer flex-1"
                    onClick={handleSelectAll}
                  >
                    Selecionar Todos ({clientesFiltrados.length})
                  </label>
                </div>

                {/* Lista de clientes */}
                {loading ? (
                  <div className="p-3 text-center text-sm text-gray-500">
                    Carregando clientes/fornecedores...
                  </div>
                ) : clientesFiltrados.length === 0 ? (
                  <div className="p-3 text-center text-sm text-gray-500">
                    {searchTerm ? "Nenhum cliente/fornecedor encontrado" : "Nenhum cliente/fornecedor disponível"}
                  </div>
                ) : (
                  clientesFiltrados.map((cliente) => (
                    <div
                      key={cliente.id}
                      className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleToggleCliente(cliente.id)}
                    >
                      <Checkbox
                        checked={value.includes(cliente.id)}
                        onCheckedChange={() => handleToggleCliente(cliente.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {cliente.nome}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          Tipo: {cliente.tipo}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Rodapé com ações */}
            {value.length > 0 && (
              <div className="border-t p-3 bg-gray-50">
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>{value.length} selecionado{value.length !== 1 ? 's' : ''}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onValueChange?.([])}
                    className="h-6 px-2 text-xs"
                  >
                    Limpar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
