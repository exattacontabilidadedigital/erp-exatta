"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Filter } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export function RelatoriosFiltros() {
  const [dataInicio, setDataInicio] = useState<Date>()
  const [dataFim, setDataFim] = useState<Date>()
  const [filtros, setFiltros] = useState({
    periodo: "",
    conta: "",
    centroCusto: "",
    status: "",
  })

  const handleFiltroChange = (field: string, value: string) => {
    setFiltros((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Filter className="w-4 h-4 mr-2" />
          Filtros
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-4">
          {/* Período Pré-definido */}
          <div className="space-y-2">
            <Label>Período</Label>
            <Select value={filtros.periodo} onValueChange={(value) => handleFiltroChange("periodo", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hoje">Hoje</SelectItem>
                <SelectItem value="ontem">Ontem</SelectItem>
                <SelectItem value="semana">Esta Semana</SelectItem>
                <SelectItem value="mes">Este Mês</SelectItem>
                <SelectItem value="trimestre">Este Trimestre</SelectItem>
                <SelectItem value="ano">Este Ano</SelectItem>
                <SelectItem value="personalizado">Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Data Início */}
          <div className="space-y-2">
            <Label>Data Início</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dataInicio ? format(dataInicio, "dd/MM/yyyy", { locale: ptBR }) : "Selecione"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={dataInicio} onSelect={setDataInicio} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          {/* Data Fim */}
          <div className="space-y-2">
            <Label>Data Fim</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dataFim ? format(dataFim, "dd/MM/yyyy", { locale: ptBR }) : "Selecione"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={dataFim} onSelect={setDataFim} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          {/* Conta */}
          <div className="space-y-2">
            <Label>Conta</Label>
            <Select value={filtros.conta} onValueChange={(value) => handleFiltroChange("conta", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as Contas</SelectItem>
                <SelectItem value="bb">Banco do Brasil</SelectItem>
                <SelectItem value="itau">Itaú</SelectItem>
                <SelectItem value="caixa">Caixa Econômica</SelectItem>
                <SelectItem value="santander">Santander</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Centro de Custo */}
          <div className="space-y-2">
            <Label>Centro de Custo</Label>
            <Select value={filtros.centroCusto} onValueChange={(value) => handleFiltroChange("centroCusto", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Centros</SelectItem>
                <SelectItem value="001">001 - Administrativo</SelectItem>
                <SelectItem value="002">002 - Vendas</SelectItem>
                <SelectItem value="003">003 - Produção</SelectItem>
                <SelectItem value="004">004 - Marketing</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={filtros.status} onValueChange={(value) => handleFiltroChange("status", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="liquidado">Liquidado</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end">
          <Button className="px-8">Aplicar Filtros</Button>
        </div>
      </CardContent>
    </Card>
  )
}
