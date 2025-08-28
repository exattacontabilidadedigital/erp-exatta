"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"

interface FiltrosData {
  dataInicio: string
  dataFim: string
  tipo: string
  status: string
  valorMin: string
  valorMax: string
  numeroDocumento: string
  descricao: string
  planoContaId: string
  centroCustoId: string
  clienteFornecedorId: string
}

interface PlanoContas {
  id: string
  codigo: string
  nome: string
}

interface CentroCusto {
  id: string
  codigo: string
  nome: string
}

interface ClienteFornecedor {
  id: string
  nome: string
  tipo: string
}

interface LancamentosFiltrosProps {
  onFilterChange?: (filtros: FiltrosData) => void
}

export function LancamentosFiltros({ onFilterChange }: LancamentosFiltrosProps) {
  const { userData } = useAuth()
  const [filtros, setFiltros] = useState<FiltrosData>({
    dataInicio: "",
    dataFim: "",
    tipo: "all",
    status: "all",
    valorMin: "",
    valorMax: "",
    numeroDocumento: "",
    descricao: "",
    planoContaId: "all",
    centroCustoId: "all",
    clienteFornecedorId: "all",
  })

  const [planoContas, setPlanoContas] = useState<PlanoContas[]>([])
  const [centroCustos, setCentroCustos] = useState<CentroCusto[]>([])
  const [clientesFornecedores, setClientesFornecedores] = useState<ClienteFornecedor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOptions()
  }, [userData?.empresa_id])

  useEffect(() => {
    if (onFilterChange) {
      onFilterChange(filtros)
    }
  }, [filtros, onFilterChange])

  const fetchOptions = async () => {
    if (!userData?.empresa_id) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      // Buscar plano de contas
      const { data: planos, error: planosError } = await supabase
        .from('plano_contas')
        .select('id, codigo, nome')
        .eq('empresa_id', userData.empresa_id)
        .eq('ativo', true)
        .order('codigo')

      if (planosError) {
        console.error('Erro ao buscar plano de contas:', planosError)
      }

      // Buscar centros de custo
      const { data: centros, error: centrosError } = await supabase
        .from('centro_custos')
        .select('id, codigo, nome')
        .eq('empresa_id', userData.empresa_id)
        .eq('ativo', true)
        .order('codigo')

      if (centrosError) {
        console.error('Erro ao buscar centros de custo:', centrosError)
      }

      // Buscar clientes/fornecedores
      const { data: clientes, error: clientesError } = await supabase
        .from('clientes_fornecedores')
        .select('id, nome, tipo')
        .eq('empresa_id', userData.empresa_id)
        .eq('ativo', true)
        .order('nome')

      if (clientesError) {
        console.error('Erro ao buscar clientes/fornecedores:', clientesError)
      }

      setPlanoContas(planos || [])
      setCentroCustos(centros || [])
      setClientesFornecedores(clientes || [])
    } catch (error) {
      console.error('Erro ao carregar opções dos filtros:', error)
    } finally {
      setLoading(false)
    }
  }

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
      planoContaId: "all",
      centroCustoId: "all",
      clienteFornecedorId: "all",
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Filtros de Busca</span>
          <div className="flex items-center gap-2">
            {loading && (
              <div className="text-sm text-gray-500">Carregando opções...</div>
            )}
            <Button variant="ghost" size="sm" onClick={handleLimparFiltros}>
              <X className="w-4 h-4 mr-2" />
              Limpar
            </Button>
          </div>
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
                <SelectValue placeholder="Todos os tipos" />
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
                <SelectValue placeholder="Todos os status" />
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

          {/* Plano de Contas */}
          <div className="space-y-2">
            <Label>Plano de Contas</Label>
            <Select 
              value={filtros.planoContaId} 
              onValueChange={(value) => setFiltros({ ...filtros, planoContaId: value })}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas as contas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as contas</SelectItem>
                {planoContas.map((plano) => (
                  <SelectItem key={plano.id} value={plano.id}>
                    {plano.codigo} - {plano.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Centro de Custo */}
          <div className="space-y-2">
            <Label>Centro de Custo</Label>
            <Select 
              value={filtros.centroCustoId} 
              onValueChange={(value) => setFiltros({ ...filtros, centroCustoId: value })}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os centros" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os centros</SelectItem>
                {centroCustos.map((centro) => (
                  <SelectItem key={centro.id} value={centro.id}>
                    {centro.codigo} - {centro.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cliente/Fornecedor */}
          <div className="space-y-2">
            <Label>Cliente/Fornecedor</Label>
            <Select 
              value={filtros.clienteFornecedorId} 
              onValueChange={(value) => setFiltros({ ...filtros, clienteFornecedorId: value })}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os clientes/fornecedores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {clientesFornecedores.map((cliente) => (
                  <SelectItem key={cliente.id} value={cliente.id}>
                    {cliente.nome} ({cliente.tipo})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default LancamentosFiltros
