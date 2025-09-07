"use client"

import { useState, useEffect, useMemo } from "react"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChevronDown, X, Search } from "lucide-react"

interface ContaBancaria {
  id: string
  banco_nome: string
  agencia: string
  conta: string
  digito: string
  tipo_conta: string
  saldo_atual: number
  ativo: boolean
}

interface ContaBancariaSelectProps {
  value?: string[]
  onValueChange?: (value: string[]) => void
  placeholder?: string
  label?: string
  className?: string
}

export function ContaBancariaSelect({ 
  value = [], 
  onValueChange, 
  placeholder = "Selecione", 
  label = "Caixa/Banco",
  className = ""
}: ContaBancariaSelectProps) {
  const { userData } = useAuth()
  const [contas, setContas] = useState<ContaBancaria[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchContas()
  }, [userData?.empresa_id])

  const fetchContas = async () => {
    if (!userData?.empresa_id) {
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('contas_bancarias')
        .select(`
          id,
          agencia,
          conta,
          digito,
          tipo_conta,
          saldo_atual,
          ativo,
          bancos(nome)
        `)
        .eq('empresa_id', userData.empresa_id)
        .eq('ativo', true)
        .order('agencia')

      if (error) {
        console.error('Erro ao buscar contas bancárias:', error)
        setContas([])
        return
      }

      const contasFormatadas = data?.map((conta: any) => ({
        id: conta.id,
        banco_nome: conta.bancos?.nome || 'Banco não identificado',
        agencia: conta.agencia || '',
        conta: conta.conta || '',
        digito: conta.digito || '',
        tipo_conta: conta.tipo_conta || 'Não especificado',
        saldo_atual: conta.saldo_atual || 0,
        ativo: conta.ativo || false
      })) || []

      setContas(contasFormatadas)
    } catch (error) {
      console.error('Erro ao buscar contas bancárias:', error)
      setContas([])
    } finally {
      setLoading(false)
    }
  }

  // Função para formatar conta (definida antes do useMemo)
  const formatarConta = (conta: ContaBancaria) => {
    return `${conta.banco_nome} - Ag: ${conta.agencia} | Cc: ${conta.conta}${conta.digito ? `-${conta.digito}` : ''}`
  }

  // Filtrar contas baseado na busca
  const contasFiltradas = useMemo(() => {
    if (!searchTerm) return contas
    
    const searchLower = searchTerm.toLowerCase()
    return contas.filter(conta => 
      conta.banco_nome.toLowerCase().includes(searchLower) ||
      conta.agencia.toLowerCase().includes(searchLower) ||
      conta.conta.toLowerCase().includes(searchLower) ||
      conta.tipo_conta.toLowerCase().includes(searchLower) ||
      formatarConta(conta).toLowerCase().includes(searchLower)
    )
  }, [contas, searchTerm])

  const handleToggleConta = (contaId: string) => {
    const newValue = value.includes(contaId)
      ? value.filter(id => id !== contaId)
      : [...value, contaId]
    
    onValueChange?.(newValue)
  }

  const handleToggleTodos = () => {
    if (value.length === contasFiltradas.length) {
      onValueChange?.([])
    } else {
      onValueChange?.(contasFiltradas.map(conta => conta.id))
    }
  }

  const isAllSelected = contasFiltradas.length > 0 && value.length === contasFiltradas.length
  const isIndeterminate = value.length > 0 && value.length < contasFiltradas.length

  const getDisplayText = () => {
    if (value.length === 0) return placeholder
    
    if (value.length === 1) {
      const conta = contas.find(c => c.id === value[0])
      return conta ? conta.banco_nome : placeholder
    }
    
    if (value.length <= 3) {
      const nomesBancos = value
        .map(id => contas.find(c => c.id === id)?.banco_nome)
        .filter(Boolean)
      return nomesBancos.join(', ')
    }
    
    return `${value.length} bancos selecionados`
  }

  const getSelectedBanks = () => {
    if (value.length === 0) return []
    
    return value
      .map(id => {
        const conta = contas.find(c => c.id === id)
        return conta ? {
          id: conta.id,
          name: conta.banco_nome,
          fullName: formatarConta(conta)
        } : null
      })
      .filter((bank): bank is NonNullable<typeof bank> => bank !== null)
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
            className={`w-full justify-between text-left font-normal ${
              value.length > 1 && value.length <= 3 ? 'min-h-10 h-auto py-2' : 'h-10'
            }`}
          >
            <div className="flex flex-1 flex-wrap items-center gap-1 overflow-hidden min-w-0">
              {value.length === 0 ? (
                <span className="text-muted-foreground">{placeholder}</span>
              ) : value.length === 1 ? (
                <span className="truncate">{getDisplayText()}</span>
              ) : value.length <= 3 ? (
                getSelectedBanks().map((bank) => (
                  <Badge
                    key={bank.id}
                    variant="secondary"
                    className="h-6 px-2 text-xs truncate max-w-24 sm:max-w-32 flex-shrink-0 flex items-center gap-1"
                    title={bank.fullName}
                  >
                    <span className="truncate">{bank.name}</span>
                    <button
                      className="ml-1 h-4 w-4 rounded-full hover:bg-gray-400/50 hover:text-gray-700 flex items-center justify-center transition-colors duration-150 flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleToggleConta(bank.id)
                      }}
                      aria-label={`Remover ${bank.name}`}
                      type="button"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))
              ) : (
                <span className="text-sm truncate">{getDisplayText()}</span>
              )}
            </div>
            <div className="flex items-center gap-1 ml-1 flex-shrink-0">
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
                    onCheckedChange={handleToggleTodos}
                    id="todos"
                  />
                  <label 
                    htmlFor="todos" 
                    className="text-sm font-medium cursor-pointer flex-1"
                  >
                    Todos
                  </label>
                </div>

                {/* Lista de contas */}
                {loading ? (
                  <div className="px-3 py-4 text-sm text-gray-500 text-center">
                    Carregando contas...
                  </div>
                ) : contasFiltradas.length === 0 ? (
                  <div className="px-3 py-4 text-sm text-gray-500 text-center">
                    {searchTerm ? `Nenhuma conta encontrada para "${searchTerm}"` : 'Nenhuma conta disponível'}
                  </div>
                ) : (
                  contasFiltradas.map((conta) => (
                    <div 
                      key={conta.id} 
                      className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                    >
                      <Checkbox
                        checked={value.includes(conta.id)}
                        onCheckedChange={() => handleToggleConta(conta.id)}
                        id={`conta-${conta.id}`}
                      />
                      <label 
                        htmlFor={`conta-${conta.id}`} 
                        className="text-sm cursor-pointer flex-1 leading-relaxed"
                      >
                        <div className="font-medium">
                          {conta.banco_nome}
                        </div>
                        <div className="text-xs text-gray-500">
                          Ag: {conta.agencia} | Cc: {conta.conta}{conta.digito ? `-${conta.digito}` : ''}
                        </div>
                      </label>
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
