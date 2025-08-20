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

interface CentroCusto {
  id: string
  codigo: string
  nome: string
  ativo: boolean
}

interface CentroCustoSelectProps {
  value?: string[]
  onValueChange?: (value: string[]) => void
  placeholder?: string
  label?: string
  className?: string
}

export function CentroCustoSelect({ 
  value = [], 
  onValueChange, 
  placeholder = "Selecione", 
  label = "",
  className = ""
}: CentroCustoSelectProps) {
  const { userData } = useAuth()
  const [centros, setCentros] = useState<CentroCusto[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchCentros()
  }, [userData?.empresa_id])

  const fetchCentros = async () => {
    if (!userData?.empresa_id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('centro_custos')
        .select('id, codigo, nome, ativo')
        .eq('empresa_id', userData.empresa_id)
        .eq('ativo', true)
        .order('codigo')

      if (error) {
        console.error('Erro ao buscar centros de custo:', error)
        setCentros([])
        return
      }

      const centrosFormatados = data?.map((centro: any) => ({
        id: centro.id,
        codigo: centro.codigo || '',
        nome: centro.nome || 'Centro não identificado',
        ativo: centro.ativo || false
      })) || []

      setCentros(centrosFormatados)
    } catch (error) {
      console.error('Erro ao buscar centros de custo:', error)
      setCentros([])
    } finally {
      setLoading(false)
    }
  }

  // Função para formatar centro (definida antes do useMemo)
  const formatarCentro = (centro: CentroCusto) => {
    return `${centro.codigo} - ${centro.nome}`
  }

  // Filtrar centros baseado na busca
  const centrosFiltrados = useMemo(() => {
    if (!searchTerm) return centros
    
    const searchLower = searchTerm.toLowerCase()
    return centros.filter(centro => 
      centro.codigo.toLowerCase().includes(searchLower) ||
      centro.nome.toLowerCase().includes(searchLower) ||
      formatarCentro(centro).toLowerCase().includes(searchLower)
    )
  }, [centros, searchTerm])

  const handleToggleCentro = (centroId: string) => {
    const newValue = value.includes(centroId)
      ? value.filter(id => id !== centroId)
      : [...value, centroId]
    
    onValueChange?.(newValue)
  }

  const handleSelectAll = () => {
    if (isAllSelected) {
      onValueChange?.([])
    } else {
      onValueChange?.(centrosFiltrados.map(centro => centro.id))
    }
  }

  const isAllSelected = useMemo(() => {
    return centrosFiltrados.length > 0 && centrosFiltrados.every(centro => value.includes(centro.id))
  }, [centrosFiltrados, value])

  const isIndeterminate = useMemo(() => {
    return centrosFiltrados.some(centro => value.includes(centro.id)) && !isAllSelected
  }, [centrosFiltrados, value, isAllSelected])

  const getDisplayText = () => {
    if (loading) return "Carregando..."
    if (value.length === 0) return placeholder
    if (value.length === 1) {
      const centro = centros.find(c => c.id === value[0])
      return centro ? formatarCentro(centro) : placeholder
    }
    return `${value.length} centros selecionados`
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

            <ScrollArea className="h-64">
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
                    Selecionar Todos ({centrosFiltrados.length})
                  </label>
                </div>

                {/* Lista de centros */}
                {loading ? (
                  <div className="p-3 text-center text-sm text-gray-500">
                    Carregando centros de custo...
                  </div>
                ) : centrosFiltrados.length === 0 ? (
                  <div className="p-3 text-center text-sm text-gray-500">
                    {searchTerm ? "Nenhum centro encontrado" : "Nenhum centro disponível"}
                  </div>
                ) : (
                  centrosFiltrados.map((centro) => (
                    <div
                      key={centro.id}
                      className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleToggleCentro(centro.id)}
                    >
                      <Checkbox
                        checked={value.includes(centro.id)}
                        onCheckedChange={() => handleToggleCentro(centro.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {formatarCentro(centro)}
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
