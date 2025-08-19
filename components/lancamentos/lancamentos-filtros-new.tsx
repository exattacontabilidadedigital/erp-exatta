"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X } from "lucide-react"

interface FiltrosData {
  dataInicio: string
  dataFim: string
  tipo: string
  status: string
  valorMin: string
  valorMax: string
  numeroDocumento: string
  descricao: string
}

interface LancamentosFiltrosProps {
  onFilterChange?: (filtros: FiltrosData) => void
}

export function LancamentosFiltros({ onFilterChange }: LancamentosFiltrosProps) {
  const [filtros, setFiltros] = useState<FiltrosData>({
    dataInicio: "",
    dataFim: "",
    tipo: "all",
    status: "all",
    valorMin: "",
    valorMax: "",
    numeroDocumento: "",
    descricao: "",
  })

  // Debounce para filtros de texto para evitar muitas consultas
  const debouncedFilterChange = useMemo(
    () => {
      let timeoutId: NodeJS.Timeout
      return (newFiltros: FiltrosData) => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
          if (onFilterChange) {
            onFilterChange(newFiltros)
          }
        }, 300)
      }
    },
    [onFilterChange]
  )

  // Estabilizar a função de callback para evitar loops
  const stableOnFilterChange = useCallback((filtros: FiltrosData) => {
    // Para filtros de data, tipo e status, aplicar imediatamente
    const isTextFilter = filtros.numeroDocumento !== "" || filtros.descricao !== ""
    
    if (isTextFilter) {
      debouncedFilterChange(filtros)
    } else {
      if (onFilterChange) {
        onFilterChange(filtros)
      }
    }
  }, [onFilterChange, debouncedFilterChange])

  useEffect(() => {
    stableOnFilterChange(filtros)
  }, [filtros, stableOnFilterChange])

  // Cleanup para cancelar debounce pendente quando o componente desmonta
  useEffect(() => {
    return () => {
      // Cancela qualquer timeout pendente
      const cleanup = debouncedFilterChange as any
      if (cleanup && typeof cleanup.cancel === 'function') {
        cleanup.cancel()
      }
    }
  }, [debouncedFilterChange])

  // Verificar se há filtros ativos
  const hasActiveFilters = useMemo(() => {
    return Object.entries(filtros).some(([key, value]) => {
      if (key === 'tipo' || key === 'status') {
        return value !== 'all' && value !== ''
      }
      return value !== ''
    })
  }, [filtros])

  const handleLimparFiltros = () => {
    setFiltros({
      dataInicio: "",
      dataFim: "",
      tipo: "all",
      status: "all",
      valorMin: "",
      valorMax: "",
      numeroDocumento: "",
      descricao: "",
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            Filtros de Busca
            {hasActiveFilters && (
              <span className="ml-2 bg-blue-500 text-white rounded-full px-2 py-1 text-xs">
                Ativos
              </span>
            )}
          </span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleLimparFiltros}
            disabled={!hasActiveFilters}
          >
            <X className="w-4 h-4 mr-2" />
            Limpar
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* Período */}
          <div className="space-y-2">
            <Label htmlFor="dataInicio">Data Início</Label>
            <Input
              id="dataInicio"
              type="date"
              value={filtros.dataInicio}
              onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dataFim">Data Fim</Label>
            <Input
              id="dataFim"
              type="date"
              value={filtros.dataFim}
              onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
            />
          </div>

          {/* Tipo de Lançamento */}
          <div className="space-y-2">
            <Label>Tipo de Lançamento</Label>
            <Select value={filtros.tipo} onValueChange={(value) => setFiltros({ ...filtros, tipo: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="receita">Receita</SelectItem>
                <SelectItem value="despesa">Despesa</SelectItem>
                <SelectItem value="transferencia">Transferência</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={filtros.status} onValueChange={(value) => setFiltros({ ...filtros, status: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="liquidado">Liquidado</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Valor Mínimo */}
          <div className="space-y-2">
            <Label htmlFor="valorMin">Valor Mínimo</Label>
            <Input
              id="valorMin"
              type="number"
              placeholder="0,00"
              value={filtros.valorMin}
              onChange={(e) => setFiltros({ ...filtros, valorMin: e.target.value })}
            />
          </div>

          {/* Valor Máximo */}
          <div className="space-y-2">
            <Label htmlFor="valorMax">Valor Máximo</Label>
            <Input
              id="valorMax"
              type="number"
              placeholder="0,00"
              value={filtros.valorMax}
              onChange={(e) => setFiltros({ ...filtros, valorMax: e.target.value })}
            />
          </div>

          {/* Número do Documento */}
          <div className="space-y-2">
            <Label htmlFor="numeroDocumento">Nº Documento</Label>
            <Input
              id="numeroDocumento"
              placeholder="Ex: NF-001"
              value={filtros.numeroDocumento}
              onChange={(e) => setFiltros({ ...filtros, numeroDocumento: e.target.value })}
            />
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Input
              id="descricao"
              placeholder="Buscar na descrição..."
              value={filtros.descricao}
              onChange={(e) => setFiltros({ ...filtros, descricao: e.target.value })}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
