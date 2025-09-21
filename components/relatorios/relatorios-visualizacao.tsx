"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { FileText, FileSpreadsheet, Printer, Mail } from "lucide-react"
import { RelatoriosEnviarModal } from "./relatorios-enviar-modal"

// Dados mock para demonstração
const balanceteData = [
  { conta: "1.1.01.001", nome: "Caixa Geral", debito: 15000, credito: 0, saldo: 15000 },
  { conta: "1.1.01.002", nome: "Bancos", debito: 85000, credito: 12000, saldo: 73000 },
  { conta: "1.1.02.001", nome: "Clientes", debito: 45000, credito: 8000, saldo: 37000 },
  { conta: "2.1.01.001", nome: "Fornecedores", debito: 5000, credito: 25000, saldo: -20000 },
  { conta: "3.1.01.001", nome: "Capital Social", debito: 0, credito: 100000, saldo: -100000 },
  { conta: "4.1.01.001", nome: "Receita de Vendas", debito: 0, credito: 180000, saldo: -180000 },
  { conta: "5.1.01.001", nome: "Despesas Operacionais", debito: 65000, credito: 0, saldo: 65000 },
]

const dreData = [
  { item: "Receita Bruta", valor: 180000, tipo: "receita" },
  { item: "(-) Deduções", valor: -18000, tipo: "deducao" },
  { item: "Receita Líquida", valor: 162000, tipo: "subtotal" },
  { item: "(-) CMV", valor: -85000, tipo: "custo" },
  { item: "Lucro Bruto", valor: 77000, tipo: "subtotal" },
  { item: "(-) Despesas Operacionais", valor: -45000, tipo: "despesa" },
  { item: "Lucro Operacional", valor: 32000, tipo: "subtotal" },
  { item: "(-) Despesas Financeiras", valor: -3000, tipo: "despesa" },
  { item: "Lucro Líquido", valor: 29000, tipo: "total" },
]

const receitasDespesasData = [
  { mes: "Jan", receitas: 45000, despesas: 32000 },
  { mes: "Fev", receitas: 38000, despesas: 28000 },
  { mes: "Mar", receitas: 42000, despesas: 35000 },
  { mes: "Abr", receitas: 48000, despesas: 38000 },
  { mes: "Mai", receitas: 52000, despesas: 41000 },
  { mes: "Jun", receitas: 47000, despesas: 36000 },
]

const centroCustosData = [
  { nome: "Administrativo", valor: 18500, cor: "#3b82f6" },
  { nome: "Vendas", valor: 15200, cor: "#10b981" },
  { nome: "Produção", valor: 25800, cor: "#f59e0b" },
  { nome: "Marketing", valor: 12300, cor: "#ef4444" },
  { nome: "Financeiro", valor: 8900, cor: "#8b5cf6" },
]

const lancamentosPeriodoData = [
  {
    id: "001",
    data: "2024-01-15",
    tipo: "Receita",
    numeroDocumento: "NF-001",
    descricao: "Venda de produtos",
    clienteFornecedor: "Empresa ABC Ltda",
    planoContas: "4.1.01 - Receita de Vendas",
    centroCusto: "002 - Vendas",
    contaBancaria: "Banco do Brasil - CC 12345-6",
    valor: 15000,
    status: "Liquidado",
  },
  {
    id: "002",
    data: "2024-01-16",
    tipo: "Despesa",
    numeroDocumento: "BOL-002",
    descricao: "Pagamento de fornecedor",
    clienteFornecedor: "Fornecedor XYZ",
    planoContas: "5.1.01 - Despesas Operacionais",
    centroCusto: "001 - Administrativo",
    contaBancaria: "Itaú - CC 98765-4",
    valor: -8500,
    status: "Liquidado",
  },
  {
    id: "003",
    data: "2024-01-17",
    tipo: "Transferência",
    numeroDocumento: "TED-003",
    descricao: "Transferência entre contas",
    clienteFornecedor: "-",
    planoContas: "1.1.01 - Bancos",
    centroCusto: "005 - Financeiro",
    contaBancaria: "Santander - CC 11111-1",
    valor: 5000,
    status: "Liquidado",
  },
  {
    id: "004",
    data: "2024-01-18",
    tipo: "Receita",
    numeroDocumento: "NF-004",
    descricao: "Prestação de serviços",
    clienteFornecedor: "Cliente DEF S.A.",
    planoContas: "4.1.02 - Receita de Serviços",
    centroCusto: "002 - Vendas",
    contaBancaria: "Banco do Brasil - CC 12345-6",
    valor: 12000,
    status: "Pendente",
  },
  {
    id: "005",
    data: "2024-01-19",
    tipo: "Despesa",
    numeroDocumento: "BOL-005",
    descricao: "Aluguel do escritório",
    clienteFornecedor: "Imobiliária GHI",
    planoContas: "5.1.02 - Despesas Administrativas",
    centroCusto: "001 - Administrativo",
    contaBancaria: "Itaú - CC 98765-4",
    valor: -6000,
    status: "Liquidado",
  },
]

const extratoBancarioData = [
  {
    id: "001",
    data: "2024-01-01",
    descricao: "Saldo Inicial",
    documento: "-",
    debito: 0,
    credito: 0,
    saldo: 50000,
    tipo: "saldo-inicial",
  },
  {
    id: "002",
    data: "2024-01-02",
    descricao: "Depósito - Venda de produtos",
    documento: "DEP-001",
    debito: 0,
    credito: 15000,
    saldo: 65000,
    tipo: "credito",
  },
  {
    id: "003",
    data: "2024-01-03",
    descricao: "TED - Pagamento fornecedor",
    documento: "TED-001",
    debito: 8500,
    credito: 0,
    saldo: 56500,
    tipo: "debito",
  },
  {
    id: "004",
    data: "2024-01-05",
    descricao: "PIX - Recebimento cliente",
    documento: "PIX-001",
    debito: 0,
    credito: 12000,
    saldo: 68500,
    tipo: "credito",
  },
  {
    id: "005",
    data: "2024-01-08",
    descricao: "DOC - Pagamento aluguel",
    documento: "DOC-001",
    debito: 6000,
    credito: 0,
    saldo: 62500,
    tipo: "debito",
  },
  {
    id: "006",
    data: "2024-01-10",
    descricao: "Tarifa bancária",
    documento: "TAR-001",
    debito: 25,
    credito: 0,
    saldo: 62475,
    tipo: "debito",
  },
  {
    id: "007",
    data: "2024-01-12",
    descricao: "Depósito - Prestação serviços",
    documento: "DEP-002",
    debito: 0,
    credito: 18000,
    saldo: 80475,
    tipo: "credito",
  },
  {
    id: "008",
    data: "2024-01-15",
    descricao: "Transferência - Aplicação",
    documento: "TED-002",
    debito: 20000,
    credito: 0,
    saldo: 60475,
    tipo: "debito",
  },
]

const fluxoCaixaData = [
  { data: "2024-01-01", descricao: "Saldo Inicial", entrada: 0, saida: 0, saldo: 125000, categoria: "saldo-inicial" },
  { data: "2024-01-02", descricao: "Vendas à vista", entrada: 15000, saida: 0, saldo: 140000, categoria: "vendas" },
  {
    data: "2024-01-03",
    descricao: "Pagamento fornecedores",
    entrada: 0,
    saida: 8500,
    saldo: 131500,
    categoria: "fornecedores",
  },
  {
    data: "2024-01-05",
    descricao: "Recebimento clientes",
    entrada: 22000,
    saida: 0,
    saldo: 153500,
    categoria: "recebimentos",
  },
  { data: "2024-01-08", descricao: "Pagamento salários", entrada: 0, saida: 35000, saldo: 118500, categoria: "folha" },
  { data: "2024-01-10", descricao: "Vendas cartão", entrada: 18500, saida: 0, saldo: 137000, categoria: "vendas" },
  {
    data: "2024-01-12",
    descricao: "Pagamento impostos",
    entrada: 0,
    saida: 12000,
    saldo: 125000,
    categoria: "impostos",
  },
  {
    data: "2024-01-15",
    descricao: "Prestação de serviços",
    entrada: 28000,
    saida: 0,
    saldo: 153000,
    categoria: "servicos",
  },
  {
    data: "2024-01-18",
    descricao: "Pagamento aluguel",
    entrada: 0,
    saida: 6000,
    saldo: 147000,
    categoria: "despesas-fixas",
  },
  {
    data: "2024-01-20",
    descricao: "Recebimento duplicatas",
    entrada: 15000,
    saida: 0,
    saldo: 162000,
    categoria: "recebimentos",
  },
  {
    data: "2024-01-22",
    descricao: "Pagamento energia",
    entrada: 0,
    saida: 2500,
    saldo: 159500,
    categoria: "despesas-fixas",
  },
  { data: "2024-01-25", descricao: "Vendas online", entrada: 12000, saida: 0, saldo: 171500, categoria: "vendas" },
  {
    data: "2024-01-28",
    descricao: "Pagamento marketing",
    entrada: 0,
    saida: 8000,
    saldo: 163500,
    categoria: "marketing",
  },
  {
    data: "2024-01-30",
    descricao: "Recebimento final",
    entrada: 10000,
    saida: 0,
    saldo: 173500,
    categoria: "recebimentos",
  },
]

const fluxoCaixaProjecao = [
  { data: "2024-02-01", descricao: "Vendas previstas", entrada: 45000, saida: 0, saldo: 218500, tipo: "projecao" },
  {
    data: "2024-02-05",
    descricao: "Pagamento fornecedores",
    entrada: 0,
    saida: 25000,
    saldo: 193500,
    tipo: "projecao",
  },
  { data: "2024-02-08", descricao: "Folha de pagamento", entrada: 0, saida: 38000, saldo: 155500, tipo: "projecao" },
  {
    data: "2024-02-15",
    descricao: "Recebimentos previstos",
    entrada: 32000,
    saida: 0,
    saldo: 187500,
    tipo: "projecao",
  },
  { data: "2024-02-20", descricao: "Despesas operacionais", entrada: 0, saida: 15000, saldo: 172500, tipo: "projecao" },
]

const fluxoCaixaGrafico = [
  { data: "01/01", saldo: 125000 },
  { data: "05/01", saldo: 153500 },
  { data: "10/01", saldo: 137000 },
  { data: "15/01", saldo: 153000 },
  { data: "20/01", saldo: 162000 },
  { data: "25/01", saldo: 171500 },
  { data: "30/01", saldo: 173500 },
]

const fluxoCaixaCategorias = [
  { categoria: "Vendas", entrada: 65500, saida: 0, liquido: 65500, cor: "#10b981" },
  { categoria: "Recebimentos", entrada: 47000, saida: 0, liquido: 47000, cor: "#3b82f6" },
  { categoria: "Serviços", entrada: 28000, saida: 0, liquido: 28000, cor: "#8b5cf6" },
  { categoria: "Fornecedores", entrada: 0, saida: 8500, liquido: -8500, cor: "#ef4444" },
  { categoria: "Folha de Pagamento", entrada: 0, saida: 35000, liquido: -35000, cor: "#f59e0b" },
  { categoria: "Impostos", entrada: 0, saida: 12000, liquido: -12000, cor: "#ef4444" },
  { categoria: "Despesas Fixas", entrada: 0, saida: 8500, liquido: -8500, cor: "#6b7280" },
  { categoria: "Marketing", entrada: 0, saida: 8000, liquido: -8000, cor: "#ec4899" },
]

interface RelatoriosVisualizacaoProps {
  relatorioSelecionado: string
}

export function RelatoriosVisualizacao({ relatorioSelecionado }: RelatoriosVisualizacaoProps) {
  const [isEnviarModalOpen, setIsEnviarModalOpen] = useState(false)

  const handleGerarPDF = () => {
    const nomeArquivo = `relatorio_${relatorioSelecionado}_${new Date().toISOString().split("T")[0]}.pdf`
    const content = `Relatório ${relatorioSelecionado.toUpperCase()} - ${new Date().toLocaleDateString()}`
    const blob = new Blob([content], { type: "application/pdf" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = nomeArquivo
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleGerarExcel = () => {
    const nomeArquivo = `relatorio_${relatorioSelecionado}_${new Date().toISOString().split("T")[0]}.xlsx`
    let csvContent = ""
    if (relatorioSelecionado === "balancete") {
      csvContent = "Código,Conta,Débito,Crédito,Saldo\n"
      balanceteData.forEach((item) => {
        csvContent += `${item.conta},${item.nome},${item.debito},${item.credito},${item.saldo}\n`
      })
    } else if (relatorioSelecionado === "dre") {
      csvContent = "Item,Valor\n"
      dreData.forEach((item) => {
        csvContent += `${item.item},${item.valor}\n`
      })
    } else if (relatorioSelecionado === "fluxo-caixa") {
      csvContent = "Data,Descrição,Entrada,Saída,Saldo\n"
      fluxoCaixaData.forEach((item) => {
        csvContent += `${item.data},${item.descricao},${item.entrada},${item.saida},${item.saldo}\n`
      })
    }
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = nomeArquivo
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleImprimir = () => {
    window.print()
  }

  const handleEnviar = () => {
    setIsEnviarModalOpen(true)
  }

  const getNomeRelatorio = (id: string) => {
    const nomes: { [key: string]: string } = {
      balancete: "Balancete de Verificação",
      dre: "Demonstração do Resultado do Exercício",
      "fluxo-caixa": "Fluxo de Caixa",
      "extrato-bancario": "Extrato Bancário",
      "lancamentos-periodo": "Lançamentos por Período",
      "receitas-despesas": "Receitas vs Despesas",
      "centro-custos": "Centro de Custos",
    }
    return nomes[id] || "Relatório"
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>{getNomeRelatorio(relatorioSelecionado)}</CardTitle>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={handleGerarPDF}>
                <FileText className="w-4 h-4 mr-2" />
                PDF
              </Button>
              <Button variant="outline" size="sm" onClick={handleGerarExcel}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Excel
              </Button>
              <Button variant="outline" size="sm" onClick={handleImprimir}>
                <Printer className="w-4 h-4 mr-2" />
                Imprimir
              </Button>
              <Button variant="outline" size="sm" onClick={handleEnviar}>
                <Mail className="w-4 h-4 mr-2" />
                Enviar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {relatorioSelecionado === "balancete" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Balancete de Verificação</h3>
                <Badge>Janeiro 2024</Badge>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Conta</TableHead>
                      <TableHead className="text-right">Débito</TableHead>
                      <TableHead className="text-right">Crédito</TableHead>
                      <TableHead className="text-right">Saldo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {balanceteData.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono text-sm">{item.conta}</TableCell>
                        <TableCell>{item.nome}</TableCell>
                        <TableCell className="text-right">
                          {item.debito > 0 ? `R$ ${item.debito.toLocaleString()}` : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.credito > 0 ? `R$ ${item.credito.toLocaleString()}` : "-"}
                        </TableCell>
                        <TableCell
                          className={`text-right font-medium ${item.saldo >= 0 ? "text-green-600" : "text-red-600"}`}
                        >
                          R$ {Math.abs(item.saldo).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {relatorioSelecionado === "dre" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Demonstração do Resultado do Exercício</h3>
                <Badge>Janeiro 2024</Badge>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dreData.map((item, index) => (
                      <TableRow key={index} className={item.tipo === "total" ? "border-t-2 font-bold" : ""}>
                        <TableCell className={item.tipo === "subtotal" || item.tipo === "total" ? "font-semibold" : ""}>
                          {item.item}
                        </TableCell>
                        <TableCell
                          className={`text-right ${
                            item.tipo === "total"
                              ? "font-bold text-lg"
                              : item.tipo === "subtotal"
                                ? "font-semibold"
                                : ""
                          } ${item.valor >= 0 ? "text-green-600" : "text-red-600"}`}
                        >
                          R$ {Math.abs(item.valor).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {relatorioSelecionado === "receitas-despesas" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Receitas vs Despesas - Últimos 6 Meses</h3>
                <Badge>2024</Badge>
              </div>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={receitasDespesasData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => [`R$ ${value.toLocaleString()}`, ""]} />
                  <Bar dataKey="receitas" fill="#10b981" name="Receitas" />
                  <Bar dataKey="despesas" fill="#ef4444" name="Despesas" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {relatorioSelecionado === "centro-custos" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Distribuição por Centro de Custos</h3>
                <Badge>Janeiro 2024</Badge>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={centroCustosData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ nome, percent }) => `${nome} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="valor"
                    >
                      {centroCustosData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.cor} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [`R$ ${value.toLocaleString()}`, "Valor"]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3">
                  {centroCustosData.map((centro, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: centro.cor }} />
                        <span className="font-medium">{centro.nome}</span>
                      </div>
                      <span className="font-semibold">R$ {centro.valor.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {relatorioSelecionado === "lancamentos-periodo" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Lançamentos por Período</h3>
                <Badge>Janeiro 2024</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-gray-600">Total de Lançamentos</div>
                    <div className="text-2xl font-bold">{lancamentosPeriodoData.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-gray-600">Total Receitas</div>
                    <div className="text-2xl font-bold text-green-600">
                      R${" "}
                      {lancamentosPeriodoData
                        .filter((l) => l.valor > 0)
                        .reduce((sum, l) => sum + l.valor, 0)
                        .toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-gray-600">Total Despesas</div>
                    <div className="text-2xl font-bold text-red-600">
                      R${" "}
                      {Math.abs(
                        lancamentosPeriodoData.filter((l) => l.valor < 0).reduce((sum, l) => sum + l.valor, 0),
                      ).toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-gray-600">Saldo Líquido</div>
                    <div
                      className={`text-2xl font-bold ${
                        lancamentosPeriodoData.reduce((sum, l) => sum + l.valor, 0) >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      R$ {Math.abs(lancamentosPeriodoData.reduce((sum, l) => sum + l.valor, 0)).toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Nº Doc.</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Cliente/Fornecedor</TableHead>
                      <TableHead>Plano de Contas</TableHead>
                      <TableHead>Centro de Custo</TableHead>
                      <TableHead>Conta Bancária</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lancamentosPeriodoData.map((lancamento) => (
                      <TableRow key={lancamento.id}>
                        <TableCell className="text-sm">
                          {new Date(lancamento.data).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              lancamento.tipo === "Receita"
                                ? "default"
                                : lancamento.tipo === "Despesa"
                                  ? "destructive"
                                  : "secondary"
                            }
                          >
                            {lancamento.tipo}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{lancamento.numeroDocumento}</TableCell>
                        <TableCell>{lancamento.descricao}</TableCell>
                        <TableCell>{lancamento.clienteFornecedor}</TableCell>
                        <TableCell className="text-sm">{lancamento.planoContas}</TableCell>
                        <TableCell className="text-sm">{lancamento.centroCusto}</TableCell>
                        <TableCell className="text-sm">{lancamento.contaBancaria}</TableCell>
                        <TableCell
                          className={`text-right font-medium ${
                            lancamento.valor >= 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          R$ {Math.abs(lancamento.valor).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={lancamento.status === "Liquidado" ? "default" : "secondary"}>
                            {lancamento.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {relatorioSelecionado === "extrato-bancario" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Extrato Bancário</h3>
                <Badge>Janeiro 2024</Badge>
              </div>

              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">Banco</div>
                      <div className="font-semibold">Banco do Brasil S.A.</div>
                      <div className="text-sm text-gray-600">Agência: 1234-5 | Conta: 12345-6</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Titular</div>
                      <div className="font-semibold">Empresa Exemplo Ltda</div>
                      <div className="text-sm text-gray-600">CNPJ: 12.345.678/0001-90</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Período</div>
                      <div className="font-semibold">01/01/2024 a 31/01/2024</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-gray-600">Saldo Inicial</div>
                    <div className="text-2xl font-bold text-blue-600">
                      R$ {extratoBancarioData[0].saldo.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-gray-600">Total Créditos</div>
                    <div className="text-2xl font-bold text-green-600">
                      R${" "}
                      {extratoBancarioData
                        .filter((item) => item.credito > 0)
                        .reduce((sum, item) => sum + item.credito, 0)
                        .toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-gray-600">Total Débitos</div>
                    <div className="text-2xl font-bold text-red-600">
                      R${" "}
                      {extratoBancarioData
                        .filter((item) => item.debito > 0)
                        .reduce((sum, item) => sum + item.debito, 0)
                        .toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-gray-600">Saldo Final</div>
                    <div className="text-2xl font-bold text-blue-600">
                      R$ {extratoBancarioData[extratoBancarioData.length - 1].saldo.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Documento</TableHead>
                      <TableHead className="text-right">Débito</TableHead>
                      <TableHead className="text-right">Crédito</TableHead>
                      <TableHead className="text-right">Saldo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {extratoBancarioData.map((movimento) => (
                      <TableRow
                        key={movimento.id}
                        className={movimento.tipo === "saldo-inicial" ? "bg-gray-50 font-semibold" : ""}
                      >
                        <TableCell className="text-sm">
                          {movimento.tipo === "saldo-inicial"
                            ? "01/01/2024"
                            : new Date(movimento.data).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell>{movimento.descricao}</TableCell>
                        <TableCell className="font-mono text-sm">{movimento.documento}</TableCell>
                        <TableCell className="text-right">
                          {movimento.debito > 0 ? (
                            <span className="text-red-600 font-medium">R$ {movimento.debito.toLocaleString()}</span>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {movimento.credito > 0 ? (
                            <span className="text-green-600 font-medium">R$ {movimento.credito.toLocaleString()}</span>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          R$ {movimento.saldo.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Movimentações por Tipo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span>Depósitos</span>
                        <span className="font-semibold text-green-600">
                          {extratoBancarioData.filter((item) => item.descricao.includes("Depósito")).length} movimentos
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Transferências</span>
                        <span className="font-semibold text-blue-600">
                          {
                            extratoBancarioData.filter(
                              (item) =>
                                item.descricao.includes("TED") ||
                                item.descricao.includes("DOC") ||
                                item.descricao.includes("Transferência"),
                            ).length
                          }{" "}
                          movimentos
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>PIX</span>
                        <span className="font-semibold text-purple-600">
                          {extratoBancarioData.filter((item) => item.descricao.includes("PIX")).length} movimentos
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Tarifas</span>
                        <span className="font-semibold text-red-600">
                          {extratoBancarioData.filter((item) => item.descricao.includes("Tarifa")).length} movimentos
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Resumo do Período</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span>Maior Crédito</span>
                        <span className="font-semibold text-green-600">
                          R$ {Math.max(...extratoBancarioData.map((item) => item.credito)).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Maior Débito</span>
                        <span className="font-semibold text-red-600">
                          R$ {Math.max(...extratoBancarioData.map((item) => item.debito)).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Variação do Período</span>
                        <span
                          className={`font-semibold ${
                            extratoBancarioData[extratoBancarioData.length - 1].saldo - extratoBancarioData[0].saldo >=
                            0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          R${" "}
                          {Math.abs(
                            extratoBancarioData[extratoBancarioData.length - 1].saldo - extratoBancarioData[0].saldo,
                          ).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Total de Movimentações</span>
                        <span className="font-semibold text-blue-600">
                          {extratoBancarioData.filter((item) => item.tipo !== "saldo-inicial").length} lançamentos
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {relatorioSelecionado === "fluxo-caixa" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Fluxo de Caixa</h3>
                <Badge>Janeiro 2024</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-gray-600">Saldo Inicial</div>
                    <div className="text-2xl font-bold text-blue-600">
                      R$ {fluxoCaixaData[0].saldo.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-gray-600">Total Entradas</div>
                    <div className="text-2xl font-bold text-green-600">
                      R${" "}
                      {fluxoCaixaData
                        .filter((item) => item.entrada > 0)
                        .reduce((sum, item) => sum + item.entrada, 0)
                        .toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-gray-600">Total Saídas</div>
                    <div className="text-2xl font-bold text-red-600">
                      R${" "}
                      {fluxoCaixaData
                        .filter((item) => item.saida > 0)
                        .reduce((sum, item) => sum + item.saida, 0)
                        .toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-gray-600">Saldo Final</div>
                    <div className="text-2xl font-bold text-blue-600">
                      R$ {fluxoCaixaData[fluxoCaixaData.length - 1].saldo.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Evolução do Saldo</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={fluxoCaixaGrafico}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="data" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => [`R$ ${value.toLocaleString()}`, "Saldo"]} />
                      <Bar dataKey="saldo" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Movimentações Realizadas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Descrição</TableHead>
                            <TableHead className="text-right">Entrada</TableHead>
                            <TableHead className="text-right">Saída</TableHead>
                            <TableHead className="text-right">Saldo</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {fluxoCaixaData.slice(0, 8).map((movimento, index) => (
                            <TableRow
                              key={index}
                              className={movimento.categoria === "saldo-inicial" ? "bg-gray-50 font-semibold" : ""}
                            >
                              <TableCell className="text-sm">
                                {movimento.categoria === "saldo-inicial"
                                  ? "01/01"
                                  : new Date(movimento.data).toLocaleDateString("pt-BR").slice(0, 5)}
                              </TableCell>
                              <TableCell>{movimento.descricao}</TableCell>
                              <TableCell className="text-right">
                                {movimento.entrada > 0 ? (
                                  <span className="text-green-600 font-medium">
                                    R$ {movimento.entrada.toLocaleString()}
                                  </span>
                                ) : (
                                  "-"
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {movimento.saida > 0 ? (
                                  <span className="text-red-600 font-medium">
                                    R$ {movimento.saida.toLocaleString()}
                                  </span>
                                ) : (
                                  "-"
                                )}
                              </TableCell>
                              <TableCell className="text-right font-semibold">
                                R$ {movimento.saldo.toLocaleString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Projeções Futuras</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Descrição</TableHead>
                            <TableHead className="text-right">Entrada</TableHead>
                            <TableHead className="text-right">Saída</TableHead>
                            <TableHead className="text-right">Saldo</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {fluxoCaixaProjecao.map((projecao, index) => (
                            <TableRow key={index} className="bg-blue-50">
                              <TableCell className="text-sm">
                                {new Date(projecao.data).toLocaleDateString("pt-BR").slice(0, 5)}
                              </TableCell>
                              <TableCell className="italic">{projecao.descricao}</TableCell>
                              <TableCell className="text-right">
                                {projecao.entrada > 0 ? (
                                  <span className="text-green-600 font-medium">
                                    R$ {projecao.entrada.toLocaleString()}
                                  </span>
                                ) : (
                                  "-"
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {projecao.saida > 0 ? (
                                  <span className="text-red-600 font-medium">R$ {projecao.saida.toLocaleString()}</span>
                                ) : (
                                  "-"
                                )}
                              </TableCell>
                              <TableCell className="text-right font-semibold text-blue-600">
                                R$ {projecao.saldo.toLocaleString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Análise por Categoria</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {fluxoCaixaCategorias.map((categoria, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: categoria.cor }} />
                          <span className="font-medium">{categoria.categoria}</span>
                        </div>
                        <div className="flex space-x-6 text-sm">
                          {categoria.entrada > 0 && (
                            <span className="text-green-600">Entrada: R$ {categoria.entrada.toLocaleString()}</span>
                          )}
                          {categoria.saida > 0 && (
                            <span className="text-red-600">Saída: R$ {categoria.saida.toLocaleString()}</span>
                          )}
                          <span
                            className={`font-semibold ${categoria.liquido >= 0 ? "text-green-600" : "text-red-600"}`}
                          >
                            Líquido: R$ {Math.abs(categoria.liquido).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {![
            "balancete",
            "dre",
            "receitas-despesas",
            "centro-custos",
            "lancamentos-periodo",
            "extrato-bancario",
            "fluxo-caixa",
          ].includes(relatorioSelecionado) && (
            <div className="text-center py-12">
              <p className="text-gray-500">Relatório em desenvolvimento</p>
              <p className="text-sm text-gray-400 mt-2">
                O relatório "{getNomeRelatorio(relatorioSelecionado)}" será implementado em breve.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {isEnviarModalOpen && (
        <RelatoriosEnviarModal
          isOpen={isEnviarModalOpen}
          onClose={() => setIsEnviarModalOpen(false)}
          relatorioTipo={relatorioSelecionado}
        />
      )}
    </>
  )
}
