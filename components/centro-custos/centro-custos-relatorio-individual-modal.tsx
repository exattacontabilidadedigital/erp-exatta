"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Download, TrendingUp, TrendingDown, BarChart3 } from "lucide-react"

interface CentroCustosRelatorioIndividualModalProps {
  isOpen: boolean
  onClose: () => void
  centro: any
}

export function CentroCustosRelatorioIndividualModal({
  isOpen,
  onClose,
  centro,
}: CentroCustosRelatorioIndividualModalProps) {
  if (!centro) return null

  const handleGerarPDF = () => {
    console.log("Gerando PDF do relatório individual:", centro.nome)
  }

  const handleExportarCSV = () => {
    const csvData = [
      ["Período", "Descrição", "Valor", "Tipo"],
      ["Jan/2024", "Material de Escritório", "R$ 1.250,00", "Despesa"],
      ["Jan/2024", "Fornecedor ABC", "R$ 3.500,00", "Despesa"],
      ["Jan/2024", "Ajuste Orçamentário", "R$ 2.000,00", "Receita"],
    ]

    const csvContent = csvData.map((row) => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `relatorio_${centro.codigo}_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Relatório - {centro.codigo} - {centro.nome}
            </DialogTitle>
            <div className="flex gap-2">
              <Button onClick={handleExportarCSV} size="sm" variant="outline" className="gap-2 bg-transparent">
                <Download className="w-4 h-4" />
                Exportar CSV
              </Button>
              <Button onClick={handleGerarPDF} size="sm" className="gap-2">
                <FileText className="w-4 h-4" />
                Gerar PDF
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Resumo Executivo */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo Executivo - Janeiro 2024</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Orçamento</p>
                  <p className="text-xl font-bold text-blue-600">R$ {(centro.orcamentoMensal ?? 0).toLocaleString()}</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <p className="text-sm text-gray-600">Realizado</p>
                  <p className="text-xl font-bold text-orange-600">R$ {(centro.gastoAtual ?? 0).toLocaleString()}</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Saldo</p>
                  <p className="text-xl font-bold text-green-600">
                    R$ {((centro.orcamentoMensal ?? 0) - (centro.gastoAtual ?? 0)).toLocaleString()}
                  </p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-600">% Utilizado</p>
                  <p className="text-xl font-bold text-purple-600">{(centro.percentualGasto ?? 0).toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Análise de Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Análise de Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Evolução Mensal</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Dezembro 2023</span>
                      <span className="font-medium">R$ 16.800</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Janeiro 2024</span>
                      <span className="font-medium text-orange-600">R$ {(centro.gastoAtual ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {centro.gastoAtual > 16800 ? (
                        <>
                          <TrendingUp className="w-4 h-4 text-red-500" />
                          <span className="text-red-600">
                            +{(((centro.gastoAtual - 16800) / 16800) * 100).toFixed(1)}% vs mês anterior
                          </span>
                        </>
                      ) : (
                        <>
                          <TrendingDown className="w-4 h-4 text-green-500" />
                          <span className="text-green-600">
                            -{(((16800 - centro.gastoAtual) / 16800) * 100).toFixed(1)}% vs mês anterior
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Principais Categorias</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Pessoal</span>
                      <span className="font-medium">R$ 12.000 (65%)</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Material</span>
                      <span className="font-medium">R$ 4.200 (23%)</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Serviços</span>
                      <span className="font-medium">R$ 2.300 (12%)</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Movimentações Detalhadas */}
          <Card>
            <CardHeader>
              <CardTitle>Movimentações do Período</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Data</th>
                      <th className="text-left py-2">Descrição</th>
                      <th className="text-left py-2">Categoria</th>
                      <th className="text-right py-2">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="space-y-2">
                    <tr className="border-b">
                      <td className="py-2">15/01/2024</td>
                      <td className="py-2">Material de Escritório</td>
                      <td className="py-2">Material</td>
                      <td className="py-2 text-right text-red-600">-R$ 1.250,00</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">12/01/2024</td>
                      <td className="py-2">Pagamento Fornecedor ABC</td>
                      <td className="py-2">Serviços</td>
                      <td className="py-2 text-right text-red-600">-R$ 3.500,00</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">10/01/2024</td>
                      <td className="py-2">Folha de Pagamento</td>
                      <td className="py-2">Pessoal</td>
                      <td className="py-2 text-right text-red-600">-R$ 12.000,00</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">08/01/2024</td>
                      <td className="py-2">Ajuste Orçamentário</td>
                      <td className="py-2">Ajuste</td>
                      <td className="py-2 text-right text-green-600">+R$ 2.000,00</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Recomendações */}
          <Card>
            <CardHeader>
              <CardTitle>Recomendações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="font-medium text-yellow-800">⚠️ Atenção ao Orçamento</p>
                  <p className="text-sm text-yellow-700">
                    O centro está utilizando {(centro.percentualGasto ?? 0).toFixed(1)}% do orçamento. Monitore os gastos para
                    evitar estouro.
                  </p>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="font-medium text-blue-800">💡 Oportunidade</p>
                  <p className="text-sm text-blue-700">
                    Considere renegociar contratos de fornecedores para reduzir custos de serviços.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
