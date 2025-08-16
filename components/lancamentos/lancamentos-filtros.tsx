"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, X } from "lucide-react"

export function LancamentosFiltros() {
  const [filtros, setFiltros] = useState({
    dataInicio: "",
    dataFim: "",
    tipo: "",
    status: "",
    valorMin: "",
    valorMax: "",
    clienteFornecedor: "",
    contaBancaria: "",
    centroCusto: "",
    numeroDocumento: "",
    historico: "",
  })

  const handleLimparFiltros = () => {
    setFiltros({
      dataInicio: "",
      dataFim: "",
      tipo: "",
      status: "",
      valorMin: "",
      valorMax: "",
      clienteFornecedor: "",
      contaBancaria: "",
      centroCusto: "",
      numeroDocumento: "",
      historico: "",
    })
  }

  const handleAplicarFiltros = () => {
    // Implementar lógica de aplicação dos filtros
    console.log("Filtros aplicados:", filtros)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Filtros de Busca</span>
          <Button variant="ghost" size="sm" onClick={handleLimparFiltros}>
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
                <SelectItem value="receita">Receita</SelectItem>
                <SelectItem value="despesa">Despesa</SelectItem>
                <SelectItem value="transferencia">Transferência</SelectItem>
                <SelectItem value="pagamento">Pagamento</SelectItem>
                <SelectItem value="recebimento">Recebimento</SelectItem>
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
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="liquidado">Liquidado</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Valor */}
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

          {/* Cliente/Fornecedor */}
          <div className="space-y-2">
            <Label>Cliente/Fornecedor</Label>
            <Select
              value={filtros.clienteFornecedor}
              onValueChange={(value) => setFiltros({ ...filtros, clienteFornecedor: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cliente1">João Silva</SelectItem>
                <SelectItem value="fornecedor1">Fornecedor ABC</SelectItem>
                <SelectItem value="cliente2">Maria Santos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Conta Bancária */}
          <div className="space-y-2">
            <Label>Conta Bancária</Label>
            <Select
              value={filtros.contaBancaria}
              onValueChange={(value) => setFiltros({ ...filtros, contaBancaria: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a conta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="conta1">Banco do Brasil - CC 12345-6</SelectItem>
                <SelectItem value="conta2">Itaú - CC 98765-4</SelectItem>
                <SelectItem value="conta3">Caixa - Poupança 11111-1</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Centro de Custo */}
          <div className="space-y-2">
            <Label>Centro de Custo</Label>
            <Select
              value={filtros.centroCusto}
              onValueChange={(value) => setFiltros({ ...filtros, centroCusto: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vendas">Vendas</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="administrativo">Administrativo</SelectItem>
                <SelectItem value="operacional">Operacional</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Número do Documento */}
          <div className="space-y-2">
            <Label htmlFor="numeroDocumento">Nº Documento</Label>
            <Input
              id="numeroDocumento"
              placeholder="Ex: NF-001, BOL-123"
              value={filtros.numeroDocumento}
              onChange={(e) => setFiltros({ ...filtros, numeroDocumento: e.target.value })}
            />
          </div>

          {/* Histórico */}
          <div className="space-y-2">
            <Label htmlFor="historico">Histórico</Label>
            <Input
              id="historico"
              placeholder="Buscar no histórico"
              value={filtros.historico}
              onChange={(e) => setFiltros({ ...filtros, historico: e.target.value })}
            />
          </div>
        </div>

        <div className="flex justify-end mt-6 space-x-2">
          <Button variant="outline" onClick={handleLimparFiltros}>
            Limpar Filtros
          </Button>
          <Button onClick={handleAplicarFiltros}>
            <Search className="w-4 h-4 mr-2" />
            Aplicar Filtros
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
