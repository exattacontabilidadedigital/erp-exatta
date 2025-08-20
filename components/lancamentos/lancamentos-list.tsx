"use client"

import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ContaBancariaSelect } from "@/components/ui/conta-bancaria-select"
import { PlanoContaSelect } from "@/components/ui/plano-conta-select"
import { Edit, MoreHorizontal, Search, Trash2, Eye } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"
import { adjustToLocalTimezone, parseDateFromDatabase } from "@/lib/date-utils"
import type { ColumnConfig } from "./lancamentos-columns-config"
import { LancamentosPeriodFilter } from "./lancamentos-period-filter"
import { LancamentosPagination } from "./lancamentos-pagination"

interface ContaBancaria {
  id: string
  banco_nome: string
  agencia: string
  conta: string
  digito: string
}

interface LancamentosListProps {
  onVisualizar?: (lancamento: any) => void
  onEditar?: (lancamento: any) => void
  onExcluir?: (lancamento: any) => void
  refresh?: number
  showContasFilter?: boolean
  onDataChange?: (data: any[]) => void
  filtros?: any
  columns?: ColumnConfig[]
  periodFilter?: {
    startDate: Date | null
    endDate: Date | null
    periodKey: string | null
  }
  onPeriodChange?: (period: { startDate: Date | null; endDate: Date | null; periodKey: string | null }) => void
}

export function LancamentosList({ onVisualizar, onEditar, onExcluir, refresh, showContasFilter = true, onDataChange, filtros, columns, periodFilter, onPeriodChange }: LancamentosListProps) {
  const { userData } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [rawLancamentos, setRawLancamentos] = useState<any[]>([])
  const [contasBancarias, setContasBancarias] = useState<ContaBancaria[]>([])
  const [contasSelecionadas, setContasSelecionadas] = useState<string[]>([])
  const [planoContasSelecionadas, setPlanoContasSelecionadas] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  
  // Estados de paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  
  // Ref para controlar se uma busca está em andamento
  const isSearchingRef = useRef(false)
  const lastSearchParamsRef = useRef<string>("")
  const hasInitializedRef = useRef(false)

  // Formatação dos lançamentos usando useMemo para evitar recriações desnecessárias
  const lancamentos = useMemo(() => {
    if (!rawLancamentos.length) return []
    
    return rawLancamentos.map((l: any) => {
      try {
        return {
          ...l,
          data_lancamento: parseDateFromDatabase(l.data_lancamento),
          // Se tiver dados dos JOINs, usa; senão, mostra apenas os IDs ou 'N/A'
          plano_conta_nome: l.plano_contas 
            ? `${l.plano_contas.codigo} - ${l.plano_contas.nome}` 
            : l.plano_conta_id ? `ID: ${l.plano_conta_id}` : 'N/A',
          centro_custo_nome: l.centro_custos 
            ? `${l.centro_custos.codigo} - ${l.centro_custos.nome}` 
            : l.centro_custo_id ? `ID: ${l.centro_custo_id}` : 'N/A',
          conta_bancaria_nome: l.contas_bancarias && l.contas_bancarias.bancos 
            ? `${l.contas_bancarias.bancos.nome} - Ag: ${l.contas_bancarias.agencia} | Cc: ${l.contas_bancarias.conta}${l.contas_bancarias.digito ? `-${l.contas_bancarias.digito}` : ''}`
            : l.conta_bancaria_id ? `ID: ${l.conta_bancaria_id}` : 'N/A',
          cliente_fornecedor_nome: l.clientes_fornecedores?.nome 
            || (l.cliente_fornecedor_id ? `ID: ${l.cliente_fornecedor_id}` : 'N/A'),
          forma_pagamento_nome: l.formas_pagamento?.nome 
            || (l.forma_pagamento_id ? `ID: ${l.forma_pagamento_id}` : 'N/A')
        }
      } catch (formatError) {
        console.error('Erro ao formatar lançamento:', l, formatError)
        return {
          ...l,
          data_lancamento: l.data_lancamento ? parseDateFromDatabase(l.data_lancamento) : new Date(),
          plano_conta_nome: 'Erro ao formatar',
          centro_custo_nome: 'Erro ao formatar',
          conta_bancaria_nome: 'Erro ao formatar',
          cliente_fornecedor_nome: 'Erro ao formatar',
          forma_pagamento_nome: 'Erro ao formatar'
        }
      }
    })
  }, [rawLancamentos])

  // Função para verificar se uma coluna deve ser visível
  const isColumnVisible = (columnKey: string): boolean => {
    if (!columns) return true // Se não há configuração, mostra todas
    const column = columns.find(col => col.key === columnKey)
    return column ? column.visible : true
  }

  // Função para contar colunas visíveis (para colspan)
  const getVisibleColumnsCount = (): number => {
    if (!columns) return 11 // Total padrão de colunas
    return columns.filter(col => col.visible).length
  }

  useEffect(() => {
    // Só executa uma vez na inicialização ou quando o refresh muda explicitamente
    if (!hasInitializedRef.current || (refresh && refresh > 0)) {
      hasInitializedRef.current = true
      fetchLancamentos()
      fetchContasBancarias()
    }
  }, [refresh])

  // Efeito separado para mudanças de período (sem refresh automático)
  useEffect(() => {
    if (hasInitializedRef.current && (periodFilter?.startDate || periodFilter?.endDate)) {
      const timeoutId = setTimeout(() => {
        fetchLancamentos()
      }, 100) // Pequeno delay para evitar múltiplas execuções
      
      return () => clearTimeout(timeoutId)
    }
  }, [periodFilter?.startDate, periodFilter?.endDate, periodFilter?.periodKey])

  // Efeito para mudança de empresa
  useEffect(() => {
    if (hasInitializedRef.current && userData?.empresa_id) {
      fetchLancamentos()
      fetchContasBancarias()
    }
  }, [userData?.empresa_id])

  // Cleanup quando o componente desmonta
  useEffect(() => {
    return () => {
      isSearchingRef.current = false
      lastSearchParamsRef.current = ""
      hasInitializedRef.current = false
    }
  }, [])

  // Aplicar filtros usando useMemo para evitar recálculos desnecessários
  const filteredLancamentos = useMemo(() => {
    let filtered = lancamentos

    // Filtro por termo de busca
    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (lancamento) =>
          lancamento.numero_documento?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lancamento.cliente_fornecedor_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lancamento.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lancamento.plano_conta_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lancamento.centro_custo_nome?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtro por conta bancária selecionada
    if (contasSelecionadas.length > 0) {
      filtered = filtered.filter(lancamento => 
        contasSelecionadas.includes(lancamento.conta_bancaria_id)
      )
    }

    // Filtro por plano de contas selecionado
    if (planoContasSelecionadas.length > 0) {
      filtered = filtered.filter(lancamento => 
        planoContasSelecionadas.includes(lancamento.plano_conta_id)
      )
    }

    // Filtros avançados
    if (filtros) {
      // Filtro por data início
      if (filtros.dataInicio) {
        filtered = filtered.filter(lancamento => {
          const dataLancamento = parseDateFromDatabase(lancamento.data_lancamento)
          const dataInicio = new Date(filtros.dataInicio)
          return dataLancamento >= dataInicio
        })
      }

      // Filtro por data fim
      if (filtros.dataFim) {
        filtered = filtered.filter(lancamento => {
          const dataLancamento = parseDateFromDatabase(lancamento.data_lancamento)
          const dataFim = new Date(filtros.dataFim)
          return dataLancamento <= dataFim
        })
      }

      // Filtro por tipo
      if (filtros.tipo && filtros.tipo !== "all") {
        filtered = filtered.filter(lancamento => lancamento.tipo === filtros.tipo)
      }

      // Filtro por status
      if (filtros.status && filtros.status !== "all") {
        filtered = filtered.filter(lancamento => lancamento.status === filtros.status)
      }

      // Filtro por valor mínimo
      if (filtros.valorMin) {
        const valorMin = parseFloat(filtros.valorMin)
        filtered = filtered.filter(lancamento => 
          parseFloat(lancamento.valor) >= valorMin
        )
      }

      // Filtro por valor máximo
      if (filtros.valorMax) {
        const valorMax = parseFloat(filtros.valorMax)
        filtered = filtered.filter(lancamento => 
          parseFloat(lancamento.valor) <= valorMax
        )
      }

      // Filtro por número do documento
      if (filtros.numeroDocumento) {
        filtered = filtered.filter(lancamento => 
          lancamento.numero_documento?.toLowerCase().includes(filtros.numeroDocumento.toLowerCase())
        )
      }

      // Filtro por descrição
      if (filtros.descricao) {
        filtered = filtered.filter(lancamento => 
          lancamento.descricao?.toLowerCase().includes(filtros.descricao.toLowerCase())
        )
      }

      // Filtro por plano de contas
      if (filtros.planoContaId && filtros.planoContaId !== "all") {
        filtered = filtered.filter(lancamento => 
          lancamento.plano_conta_id === filtros.planoContaId
        )
      }

      // Filtro por centro de custo
      if (filtros.centroCustoId && filtros.centroCustoId !== "all") {
        filtered = filtered.filter(lancamento => 
          lancamento.centro_custo_id === filtros.centroCustoId
        )
      }

      // Filtro por cliente/fornecedor
      if (filtros.clienteFornecedorId && filtros.clienteFornecedorId !== "all") {
        filtered = filtered.filter(lancamento => 
          lancamento.cliente_fornecedor_id === filtros.clienteFornecedorId
        )
      }
    }

    return filtered
  }, [lancamentos, searchTerm, contasSelecionadas, planoContasSelecionadas, filtros])

  // Lançamentos paginados
  const paginatedLancamentos = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredLancamentos.slice(startIndex, endIndex)
  }, [filteredLancamentos, currentPage, itemsPerPage])

  // Informações de paginação
  const totalPages = Math.ceil(filteredLancamentos.length / itemsPerPage)
  const totalItems = filteredLancamentos.length

  // Handlers de paginação
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  const handleItemsPerPageChange = useCallback((newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1) // Resetar para primeira página
  }, [])

  // Reset da página quando filtros mudam
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, contasSelecionadas, planoContasSelecionadas, filtros])

  // useCallback para estabilizar onDataChange com debounce
  const stableOnDataChange = useCallback((data: any[]) => {
    // Debounce para evitar chamadas excessivas
    const timeoutId = setTimeout(() => {
      if (onDataChange) {
        onDataChange(data)
      }
    }, 100)
    
    return () => clearTimeout(timeoutId)
  }, [onDataChange])

  useEffect(() => {
    const cleanup = stableOnDataChange(filteredLancamentos)
    return cleanup
  }, [filteredLancamentos, stableOnDataChange])

  const fetchLancamentos = async () => {
    if (!userData?.empresa_id) {
      console.log('Usuário não possui empresa_id, pulando busca de lançamentos')
      setLoading(false)
      return
    }

    // Criar uma chave única para os parâmetros da busca
    const searchParams = `${userData.empresa_id}-${periodFilter?.startDate ? adjustToLocalTimezone(periodFilter.startDate) : ''}-${periodFilter?.endDate ? adjustToLocalTimezone(periodFilter.endDate) : ''}-${refresh || 0}`
    
    // Verificações mais rigorosas para evitar múltiplas buscas
    if (isSearchingRef.current) {
      console.log('Busca já em andamento, ignorando nova solicitação')
      return
    }

    if (lastSearchParamsRef.current === searchParams) {
      console.log('Parâmetros de busca iguais aos anteriores, ignorando')
      return
    }

    // Proteção adicional: verificar se foi executado recentemente
    const now = Date.now()
    const lastExecution = (window as any).lastFetchTime || 0
    if (now - lastExecution < 1000) { // Mínimo 1 segundo entre execuções
      console.log('Busca executada recentemente, ignorando')
      return
    }

    console.log('Iniciando busca de lançamentos para empresa:', userData.empresa_id)
    isSearchingRef.current = true
    lastSearchParamsRef.current = searchParams
    ;(window as any).lastFetchTime = now
    setLoading(true)
    
    try {
      // Primeira tentativa: consulta com JOINs (para tabelas com FK)
      let query = supabase
        .from("lancamentos")
        .select(`
          *,
          plano_contas(codigo, nome),
          centro_custos(codigo, nome),
          contas_bancarias(
            agencia,
            conta,
            digito,
            bancos(nome)
          ),
          clientes_fornecedores(nome, tipo),
          formas_pagamento(nome)
        `)
        .eq("empresa_id", userData.empresa_id)

      // Aplicar filtro de período se especificado
      if (periodFilter?.startDate && periodFilter?.endDate) {
        const startDateString = adjustToLocalTimezone(periodFilter.startDate)
        const endDateString = adjustToLocalTimezone(periodFilter.endDate)
        query = query
          .gte('data_lancamento', startDateString)
          .lte('data_lancamento', endDateString)
      }

      let { data, error } = await query.order("data_lancamento", { ascending: false })

      // Se der erro, tenta consulta simples sem JOINs
      if (error) {
        console.warn('Erro na consulta com JOINs, tentando consulta simples:', error)
        
        let simpleQuery = supabase
          .from("lancamentos")
          .select("*")
          .eq("empresa_id", userData.empresa_id)

        // Aplicar filtro de período na consulta simples também
        if (periodFilter?.startDate && periodFilter?.endDate) {
          const startDateString = adjustToLocalTimezone(periodFilter.startDate)
          const endDateString = adjustToLocalTimezone(periodFilter.endDate)
          simpleQuery = simpleQuery
            .gte('data_lancamento', startDateString)
            .lte('data_lancamento', endDateString)
        }

        const { data: simpleData, error: simpleError } = await simpleQuery.order("data_lancamento", { ascending: false })

        if (simpleError) {
          console.error('Erro na consulta simples:', simpleError)
          throw simpleError
        }

        data = simpleData
      }

      console.log('Dados brutos do Supabase:', data)

      if (!data) {
        console.log('Nenhum dado retornado do Supabase')
        setRawLancamentos([])
        return
      }

      // Agora só salva os dados brutos, sem formatação
      setRawLancamentos(data)
    } catch (error) {
      console.error('Erro ao buscar lançamentos:', error)
      // Definir um array vazio em caso de erro para não quebrar a interface
      setRawLancamentos([])
    } finally {
      setLoading(false)
      isSearchingRef.current = false
    }
  }

  const fetchContasBancarias = async () => {
    if (!userData?.empresa_id) return

    try {
      const { data, error } = await supabase
        .from('contas_bancarias')
        .select(`
          id,
          agencia,
          conta,
          digito,
          bancos(nome)
        `)
        .eq('empresa_id', userData.empresa_id)
        .eq('ativo', true)
        .order('agencia')

      if (error) {
        console.error('Erro ao buscar contas bancárias para filtro:', error)
        return
      }

      const contasFormatadas = data?.map((conta: any) => ({
        id: conta.id,
        banco_nome: conta.bancos?.nome || 'Banco não identificado',
        agencia: conta.agencia || '',
        conta: conta.conta || '',
        digito: conta.digito || ''
      })) || []

      setContasBancarias(contasFormatadas)
    } catch (error) {
      console.error('Erro ao carregar contas bancárias:', error)
      setContasBancarias([])
    }
  }

  const handleSearch = (term: string) => {
    setSearchTerm(term)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pago":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">Pago</Badge>
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
      default:
        return null
    }
  }

  // Estatísticas dos lançamentos
  const totalReceitas = filteredLancamentos
    .filter(l => l.tipo === 'receita')
    .reduce((sum, l) => sum + Number.parseFloat(l.valor || 0), 0)
  
  const totalDespesas = filteredLancamentos
    .filter(l => l.tipo === 'despesa')
    .reduce((sum, l) => sum + Number.parseFloat(l.valor || 0), 0)
  
  const saldoLiquido = totalReceitas - totalDespesas

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Carregando lançamentos...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Resumo Financeiro */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Total de Lançamentos</div>
            <div className="text-2xl font-bold">{filteredLancamentos.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Total Receitas</div>
            <div className="text-2xl font-bold text-green-600">
              R$ {totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Total Despesas</div>
            <div className="text-2xl font-bold text-red-600">
              R$ {totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Saldo Líquido</div>
            <div className={`text-2xl font-bold ${saldoLiquido >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              R$ {saldoLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Lançamentos Contábeis</CardTitle>
          <div className="flex gap-2 sm:gap-4 items-center flex-col sm:flex-row">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 text-sm"
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              {onPeriodChange && (
                <div className="w-full sm:w-auto">
                  <LancamentosPeriodFilter onPeriodChange={onPeriodChange} />
                </div>
              )}
              <div className="w-full sm:w-[200px] min-w-[160px]">
                <ContaBancariaSelect
                  value={contasSelecionadas}
                  onValueChange={setContasSelecionadas}
                  placeholder="Todas as contas"
                  label=""
                />
              </div>
              <div className="w-full sm:w-[200px] min-w-[160px]">
                <PlanoContaSelect
                  value={planoContasSelecionadas}
                  onValueChange={setPlanoContasSelecionadas}
                  placeholder="Todos os planos"
                  label=""
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {isColumnVisible('data_lancamento') && (
                    <TableHead className="text-xs sm:text-sm">
                      <span className="hidden sm:inline">Data</span>
                      <span className="sm:hidden">Dt</span>
                    </TableHead>
                  )}
                  {isColumnVisible('tipo') && (
                    <TableHead className="text-xs sm:text-sm">Tipo</TableHead>
                  )}
                  {isColumnVisible('numero_documento') && (
                    <TableHead className="text-xs sm:text-sm">
                      <span className="hidden sm:inline">Documento</span>
                      <span className="sm:hidden">Doc</span>
                    </TableHead>
                  )}
                  {isColumnVisible('descricao') && (
                    <TableHead className="text-xs sm:text-sm">
                      <span className="hidden sm:inline">Descrição</span>
                      <span className="sm:hidden">Desc</span>
                    </TableHead>
                  )}
                  {isColumnVisible('plano_conta') && (
                    <TableHead className="text-xs sm:text-sm">
                      <span className="hidden sm:inline">Plano de Contas</span>
                      <span className="sm:hidden">Plano</span>
                    </TableHead>
                  )}
                  {isColumnVisible('centro_custo') && (
                    <TableHead className="text-xs sm:text-sm">
                      <span className="hidden sm:inline">Centro de Custo</span>
                      <span className="sm:hidden">Centro</span>
                    </TableHead>
                  )}
                  {isColumnVisible('conta_bancaria') && (
                    <TableHead className="text-xs sm:text-sm">
                      <span className="hidden sm:inline">Conta Bancária</span>
                      <span className="sm:hidden">Conta</span>
                    </TableHead>
                  )}
                  {isColumnVisible('cliente_fornecedor') && (
                    <TableHead className="text-xs sm:text-sm">
                      <span className="hidden sm:inline">Cliente/Fornecedor</span>
                      <span className="sm:hidden">Cliente</span>
                    </TableHead>
                  )}
                  {isColumnVisible('valor') && (
                    <TableHead className="text-xs sm:text-sm">Valor</TableHead>
                  )}
                  {isColumnVisible('status') && (
                    <TableHead className="text-xs sm:text-sm">Status</TableHead>
                  )}
                  {isColumnVisible('acoes') && (
                    <TableHead className="text-xs sm:text-sm">Ações</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLancamentos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={getVisibleColumnsCount()} className="text-center py-8 text-gray-500">
                      {lancamentos.length === 0 
                        ? "Nenhum lançamento encontrado"
                        : "Nenhum lançamento corresponde aos filtros aplicados"
                      }
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedLancamentos.map((lancamento) => (
                    <TableRow key={lancamento.id}>
                      {isColumnVisible('data_lancamento') && (
                        <TableCell className="text-xs sm:text-sm">
                          <span className="hidden sm:inline">
                            {lancamento.data_lancamento.toLocaleDateString('pt-BR')}
                          </span>
                          <span className="sm:hidden">
                            {lancamento.data_lancamento.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                          </span>
                        </TableCell>
                      )}
                      {isColumnVisible('tipo') && <TableCell className="text-xs sm:text-sm">{getTipoBadge(lancamento.tipo)}</TableCell>}
                      {isColumnVisible('numero_documento') && (
                        <TableCell className="max-w-[80px] sm:max-w-xs truncate text-xs sm:text-sm">
                          {lancamento.numero_documento}
                        </TableCell>
                      )}
                      {isColumnVisible('descricao') && (
                        <TableCell className="max-w-[120px] sm:max-w-xs truncate text-xs sm:text-sm">
                          {lancamento.descricao}
                        </TableCell>
                      )}
                      {isColumnVisible('plano_conta') && (
                        <TableCell className="max-w-[100px] sm:max-w-xs truncate text-xs sm:text-sm">
                          {lancamento.plano_conta_nome}
                        </TableCell>
                      )}
                      {isColumnVisible('centro_custo') && (
                        <TableCell className="max-w-[100px] sm:max-w-xs truncate text-xs sm:text-sm">
                          {lancamento.centro_custo_nome}
                        </TableCell>
                      )}
                      {isColumnVisible('conta_bancaria') && (
                        <TableCell className="max-w-[100px] sm:max-w-xs truncate text-xs sm:text-sm">
                          {lancamento.conta_bancaria_nome}
                        </TableCell>
                      )}
                      {isColumnVisible('cliente_fornecedor') && (
                        <TableCell className="max-w-[100px] sm:max-w-xs truncate text-xs sm:text-sm">
                          {lancamento.cliente_fornecedor_nome}
                        </TableCell>
                      )}
                      {isColumnVisible('valor') && (
                        <TableCell className="text-right font-medium text-xs sm:text-sm">
                          <span className="hidden sm:inline">
                            R$ {lancamento.valor.toLocaleString('pt-BR', { 
                              minimumFractionDigits: 2 
                            })}
                          </span>
                          <span className="sm:hidden">
                            R$ {(lancamento.valor / 1000).toFixed(0)}k
                          </span>
                        </TableCell>
                      )}
                      {isColumnVisible('status') && <TableCell className="text-xs sm:text-sm">{getStatusBadge(lancamento.status)}</TableCell>}
                      {isColumnVisible('acoes') && (
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => onVisualizar?.(lancamento)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Visualizar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onEditar?.(lancamento)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => onExcluir?.(lancamento)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Componente de Paginação */}
      <div className="mt-4">
        <LancamentosPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredLancamentos.length}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      </div>
    </div>
  )

  const getPlanoContasText = (codigo: string) => {
    const planos: { [key: string]: string } = {
      "1.1.01": "1.1.01 - Caixa",
      "1.1.02": "1.1.02 - Bancos",
      "3.1.01": "3.1.01 - Receita de Vendas",
      "4.1.01": "4.1.01 - Despesas Administrativas",
      "4.1.02": "4.1.02 - Despesas Operacionais",
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
          <div className="relative w-48">
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
                  <TableCell>{lancamento.numero_documento}</TableCell>
                  <TableCell className="text-sm">
                    {lancamento.plano_contas ? `${lancamento.plano_contas.codigo} - ${lancamento.plano_contas.nome}` : "-"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {lancamento.centro_custos ? `${lancamento.centro_custos.codigo} - ${lancamento.centro_custos.nome}` : "-"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {lancamento.clientes_fornecedores ? `${lancamento.clientes_fornecedores.nome} (${lancamento.clientes_fornecedores.tipo})` : "-"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {lancamento.contas_bancarias && lancamento.contas_bancarias.bancos 
                      ? `${lancamento.contas_bancarias.bancos.nome} - Ag: ${lancamento.contas_bancarias.agencia} | Cc: ${lancamento.contas_bancarias.conta}${lancamento.contas_bancarias.digito ? `-${lancamento.contas_bancarias.digito}` : ''}`
                      : "-"
                    }
                  </TableCell>
                  <TableCell>
                    <span className={lancamento.tipo === "despesa" ? "text-red-600" : "text-green-600"}>
                      {lancamento.tipo === "despesa" ? "-" : "+"}R${" "}
                      {Number.parseFloat(lancamento.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
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
