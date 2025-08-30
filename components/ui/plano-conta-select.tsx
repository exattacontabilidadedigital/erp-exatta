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

interface PlanoConta {
  id: string
  codigo: string
  nome: string
  tipo: string
  ativo: boolean
}

interface PlanoContaSelectProps {
  value?: string[]
  onValueChange?: (value: string[]) => void
  placeholder?: string
  label?: string
  className?: string
  tipoFiltro?: string // 'receita', 'despesa', ou undefined para todos
}

export function PlanoContaSelect({ 
  value = [], 
  onValueChange, 
  placeholder = "Selecione", 
  label = "",
  className = "",
  tipoFiltro
}: PlanoContaSelectProps) {
  const { userData } = useAuth()
  const [contas, setContas] = useState<PlanoConta[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchContas()
  }, [userData?.empresa_id, tipoFiltro])

  const fetchContas = async () => {
    if (!userData?.empresa_id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      
      let query = supabase
        .from('plano_contas')
        .select('id, codigo, nome, tipo, ativo')
        .eq('empresa_id', userData.empresa_id)
        .eq('ativo', true)

      // Filtrar por tipo se especificado
      if (tipoFiltro) {
        query = query.eq('tipo', tipoFiltro)
      }

      const { data, error } = await query.order('codigo')

      if (error) {
        console.error('Erro ao buscar plano de contas:', error)
        setContas([])
        return
      }

      const contasFormatadas = data?.map((conta: any) => ({
        id: conta.id,
        codigo: conta.codigo || '',
        nome: conta.nome || 'Conta não identificada',
        tipo: conta.tipo || 'Não especificado',
        ativo: conta.ativo || false
      })) || []

      // Filtrar apenas contas analíticas (que recebem lançamentos)
      // Contas analíticas geralmente têm códigos com mais segmentos (ex: 4.1.01.001)
      const contasAnaliticas = contasFormatadas.filter(conta => {
        const segmentos = conta.codigo.split('.')
        return segmentos.length >= 3 // Contas de 3 níveis ou mais podem receber lançamentos
      })

      setContas(contasAnaliticas)
    } catch (error) {
      console.error('Erro ao buscar plano de contas:', error)
      setContas([])
    } finally {
      setLoading(false)
    }
  }

  // Função para formatar conta (definida antes do useMemo)
  const formatarConta = (conta: PlanoConta) => {
    return `${conta.codigo} - ${conta.nome}`
  }

  // Filtrar contas baseado na busca
  const contasFiltradas = useMemo(() => {
    if (!searchTerm) return contas
    
    const searchLower = searchTerm.toLowerCase()
    return contas.filter(conta => 
      conta.codigo.toLowerCase().includes(searchLower) ||
      conta.nome.toLowerCase().includes(searchLower) ||
      conta.tipo.toLowerCase().includes(searchLower) ||
      formatarConta(conta).toLowerCase().includes(searchLower)
    )
  }, [contas, searchTerm])

  const handleToggleConta = (contaId: string) => {
    const newValue = value.includes(contaId)
      ? value.filter(id => id !== contaId)
      : [...value, contaId]
    
    onValueChange?.(newValue)
  }

  const handleSelectAll = () => {
    if (isAllSelected) {
      onValueChange?.([])
    } else {
      onValueChange?.(contasFiltradas.map(conta => conta.id))
    }
  }

  const isAllSelected = useMemo(() => {
    return contasFiltradas.length > 0 && contasFiltradas.every(conta => value.includes(conta.id))
  }, [contasFiltradas, value])

  const isIndeterminate = useMemo(() => {
    return contasFiltradas.some(conta => value.includes(conta.id)) && !isAllSelected
  }, [contasFiltradas, value, isAllSelected])

  const getDisplayText = () => {
    if (loading) return "Carregando..."
    if (value.length === 0) return placeholder
    if (value.length === 1) {
      const conta = contas.find(c => c.id === value[0])
      return conta ? formatarConta(conta) : placeholder
    }
    return `${value.length} contas selecionadas`
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
                    Selecionar Todas ({contasFiltradas.length})
                  </label>
                </div>

                {/* Lista de contas */}
                {loading ? (
                  <div className="p-3 text-center text-sm text-gray-500">
                    Carregando plano de contas...
                  </div>
                ) : contasFiltradas.length === 0 ? (
                  <div className="p-3 text-center text-sm text-gray-500">
                    {searchTerm ? "Nenhuma conta encontrada" : "Nenhuma conta disponível"}
                  </div>
                ) : (
                  contasFiltradas.map((conta) => (
                    <div
                      key={conta.id}
                      className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleToggleConta(conta.id)}
                    >
                      <Checkbox
                        checked={value.includes(conta.id)}
                        onCheckedChange={() => handleToggleConta(conta.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {formatarConta(conta)}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          Tipo: {conta.tipo}
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
                  <span>{value.length} selecionada{value.length !== 1 ? 's' : ''}</span>
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
