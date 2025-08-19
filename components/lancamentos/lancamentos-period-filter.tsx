"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, Filter, Pin, PinOff, Calendar as CalendarDays } from "lucide-react"
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays, subWeeks, subMonths } from "date-fns"
import { ptBR } from "date-fns/locale"

export interface PeriodFilter {
  key: string
  label: string
  getValue: () => { startDate: Date; endDate: Date }
  isPinned?: boolean
}

const PREDEFINED_PERIODS: PeriodFilter[] = [
  {
    key: "today",
    label: "Hoje",
    getValue: () => {
      const today = new Date()
      return { startDate: today, endDate: today }
    }
  },
  {
    key: "yesterday",
    label: "Ontem",
    getValue: () => {
      const yesterday = subDays(new Date(), 1)
      return { startDate: yesterday, endDate: yesterday }
    }
  },
  {
    key: "thisWeek",
    label: "Esta Semana",
    getValue: () => {
      const today = new Date()
      return { 
        startDate: startOfWeek(today, { weekStartsOn: 1 }), 
        endDate: endOfWeek(today, { weekStartsOn: 1 })
      }
    }
  },
  {
    key: "lastWeek",
    label: "Semana Passada",
    getValue: () => {
      const lastWeek = subWeeks(new Date(), 1)
      return { 
        startDate: startOfWeek(lastWeek, { weekStartsOn: 1 }), 
        endDate: endOfWeek(lastWeek, { weekStartsOn: 1 })
      }
    }
  },
  {
    key: "thisMonth",
    label: "Este Mês",
    getValue: () => {
      const today = new Date()
      return { 
        startDate: startOfMonth(today), 
        endDate: endOfMonth(today)
      }
    }
  },
  {
    key: "lastMonth",
    label: "Mês Passado",
    getValue: () => {
      const lastMonth = subMonths(new Date(), 1)
      return { 
        startDate: startOfMonth(lastMonth), 
        endDate: endOfMonth(lastMonth)
      }
    }
  },
  {
    key: "thisYear",
    label: "Este Ano",
    getValue: () => {
      const today = new Date()
      return { 
        startDate: startOfYear(today), 
        endDate: endOfYear(today)
      }
    }
  },
  {
    key: "last30Days",
    label: "Últimos 30 Dias",
    getValue: () => {
      const today = new Date()
      return { 
        startDate: subDays(today, 30), 
        endDate: today
      }
    }
  },
  {
    key: "last90Days",
    label: "Últimos 90 Dias",
    getValue: () => {
      const today = new Date()
      return { 
        startDate: subDays(today, 90), 
        endDate: today
      }
    }
  }
]

interface LancamentosPeriodFilterProps {
  onPeriodChange: (period: { startDate: Date | null; endDate: Date | null; periodKey: string | null }) => void
  defaultPinnedPeriod?: string
}

export function LancamentosPeriodFilter({ onPeriodChange, defaultPinnedPeriod = "thisMonth" }: LancamentosPeriodFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null)
  const [pinnedPeriod, setPinnedPeriod] = useState<string | null>(null)
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>()
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>()
  const [isCustomCalendarOpen, setIsCustomCalendarOpen] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // Carregar período padrão apenas uma vez
  useEffect(() => {
    if (!isInitialized) {
      const saved = localStorage.getItem("lancamentos-pinned-period")
      const initialPeriod = saved || defaultPinnedPeriod
      
      if (initialPeriod) {
        const period = PREDEFINED_PERIODS.find(p => p.key === initialPeriod)
        if (period) {
          const { startDate, endDate } = period.getValue()
          onPeriodChange({ startDate, endDate, periodKey: initialPeriod })
          setSelectedPeriod(initialPeriod)
          setPinnedPeriod(saved || null)
        }
      }
      setIsInitialized(true)
    }
  }, [])

  const handlePeriodSelect = (periodKey: string) => {
    const period = PREDEFINED_PERIODS.find(p => p.key === periodKey)
    if (period) {
      const { startDate, endDate } = period.getValue()
      onPeriodChange({ startDate, endDate, periodKey })
      setSelectedPeriod(periodKey)
      setIsOpen(false)
    }
  }

  const handleCustomPeriod = () => {
    if (customStartDate && customEndDate) {
      onPeriodChange({ 
        startDate: customStartDate, 
        endDate: customEndDate, 
        periodKey: "custom" 
      })
      setSelectedPeriod("custom")
      setIsOpen(false)
      setIsCustomCalendarOpen(false)
    }
  }

  const handlePinPeriod = (periodKey: string) => {
    const newPinnedPeriod = pinnedPeriod === periodKey ? null : periodKey
    setPinnedPeriod(newPinnedPeriod)
    
    // Salvar no localStorage
    if (newPinnedPeriod) {
      localStorage.setItem("lancamentos-pinned-period", newPinnedPeriod)
    } else {
      localStorage.removeItem("lancamentos-pinned-period")
    }
  }

  const clearFilters = () => {
    setSelectedPeriod(null)
    setCustomStartDate(undefined)
    setCustomEndDate(undefined)
    onPeriodChange({ startDate: null, endDate: null, periodKey: null })
    setIsOpen(false)
  }

  const getSelectedPeriodLabel = () => {
    if (!selectedPeriod) return "Período"
    
    if (selectedPeriod === "custom") {
      if (customStartDate && customEndDate) {
        return `${format(customStartDate, "dd/MM/yy", { locale: ptBR })} - ${format(customEndDate, "dd/MM/yy", { locale: ptBR })}`
      }
      return "Personalizado"
    }
    
    const period = PREDEFINED_PERIODS.find(p => p.key === selectedPeriod)
    return period ? period.label : "Período"
  }

  return (
    <div className="flex items-center gap-2">
      {pinnedPeriod && (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Pin className="h-3 w-3" />
          {PREDEFINED_PERIODS.find(p => p.key === pinnedPeriod)?.label || "Filtro Fixo"}
        </Badge>
      )}
      
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            className={`flex items-center gap-2 ${selectedPeriod ? 'bg-blue-50 border-blue-200' : ''}`}
          >
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">{getSelectedPeriodLabel()}</span>
            <span className="sm:hidden">Período</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-[320px] sm:w-80 mx-2" 
          align="start"
          side="bottom"
          sideOffset={8}
          avoidCollisions={true}
          collisionPadding={10}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtros de Período
              </CardTitle>
              <p className="text-xs text-gray-500">
                Selecione um período predefinido ou personalize
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Períodos Predefinidos */}
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                  Períodos Predefinidos
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {PREDEFINED_PERIODS.map((period) => (
                    <div key={period.key} className="flex items-center gap-1">
                      <Button
                        variant={selectedPeriod === period.key ? "default" : "outline"}
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => handlePeriodSelect(period.key)}
                      >
                        {period.label}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1 h-8 w-8"
                        onClick={() => handlePinPeriod(period.key)}
                      >
                        {pinnedPeriod === period.key ? (
                          <Pin className="h-3 w-3 text-blue-600" />
                        ) : (
                          <PinOff className="h-3 w-3 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Período Personalizado */}
              <div className="space-y-2 border-t pt-3">
                <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                  Período Personalizado
                </h4>
                <Popover open={isCustomCalendarOpen} onOpenChange={setIsCustomCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customStartDate && customEndDate ? (
                        `${format(customStartDate, "dd/MM/yyyy", { locale: ptBR })} - ${format(customEndDate, "dd/MM/yyyy", { locale: ptBR })}`
                      ) : (
                        "Selecionar datas"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <div className="flex">
                      <div className="p-3">
                        <p className="text-sm font-medium mb-2">Data Inicial</p>
                        <Calendar
                          mode="single"
                          selected={customStartDate}
                          onSelect={setCustomStartDate}
                          locale={ptBR}
                        />
                      </div>
                      <div className="p-3 border-l">
                        <p className="text-sm font-medium mb-2">Data Final</p>
                        <Calendar
                          mode="single"
                          selected={customEndDate}
                          onSelect={setCustomEndDate}
                          locale={ptBR}
                        />
                      </div>
                    </div>
                    {customStartDate && customEndDate && (
                      <div className="p-3 border-t">
                        <Button
                          onClick={handleCustomPeriod}
                          className="w-full"
                          size="sm"
                        >
                          Aplicar Período
                        </Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </div>

              {/* Ações */}
              <div className="flex gap-2 pt-2 border-t">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearFilters}
                  className="flex-1"
                >
                  Limpar Filtros
                </Button>
              </div>
            </CardContent>
          </Card>
        </PopoverContent>
      </Popover>
    </div>
  )
}
