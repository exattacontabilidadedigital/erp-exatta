"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, BarChart3, TrendingUp, Building2, DollarSign, Calendar, Users } from "lucide-react"

const relatoriosDisponiveis = [
  {
    id: "balancete",
    nome: "Balancete",
    descricao: "Balancete de verificação",
    icon: FileText,
    categoria: "Contábil",
  },
  {
    id: "dre",
    nome: "DRE",
    descricao: "Demonstração do Resultado",
    icon: TrendingUp,
    categoria: "Gerencial",
  },
  {
    id: "fluxo-caixa",
    nome: "Fluxo de Caixa",
    descricao: "Movimentação de caixa",
    icon: DollarSign,
    categoria: "Financeiro",
  },
  {
    id: "extrato-bancario",
    nome: "Extrato Bancário",
    descricao: "Movimentações bancárias",
    icon: Building2,
    categoria: "Bancário",
  },
  {
    id: "lancamentos-periodo",
    nome: "Lançamentos por Período",
    descricao: "Lançamentos filtrados",
    icon: Calendar,
    categoria: "Operacional",
  },
  {
    id: "receitas-despesas",
    nome: "Receitas vs Despesas",
    descricao: "Comparativo mensal",
    icon: BarChart3,
    categoria: "Analítico",
  },
  {
    id: "centro-custos",
    nome: "Centro de Custos",
    descricao: "Análise por centro",
    icon: Users,
    categoria: "Gerencial",
  },
]

interface RelatoriosListProps {
  relatorioSelecionado: string
  onRelatorioSelect: (relatorioId: string) => void
}

export function RelatoriosList({ relatorioSelecionado, onRelatorioSelect }: RelatoriosListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Relatórios Disponíveis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {relatoriosDisponiveis.map((relatorio) => (
          <Button
            key={relatorio.id}
            variant={relatorioSelecionado === relatorio.id ? "default" : "ghost"}
            className="w-full justify-start h-auto p-3"
            onClick={() => onRelatorioSelect(relatorio.id)}
          >
            <div className="flex items-start space-x-3">
              <relatorio.icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <div className="font-medium text-sm">{relatorio.nome}</div>
                <div className="text-xs text-gray-500">{relatorio.descricao}</div>
                <div className="text-xs text-blue-600 mt-1">{relatorio.categoria}</div>
              </div>
            </div>
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}
