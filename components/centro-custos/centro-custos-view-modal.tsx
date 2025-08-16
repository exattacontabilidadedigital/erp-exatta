"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { FileText, TrendingUp, TrendingDown, Calendar, User, Building2 } from "lucide-react"

interface CentroCustosViewModalProps {
  isOpen: boolean
  onClose: () => void
  centro: any
}

export function CentroCustosViewModal({ isOpen, onClose, centro }: CentroCustosViewModalProps) {
  if (!centro) return null

  const handleGerarPDF = () => {
    // Simular geração de PDF
    console.log("Gerando PDF do centro de custo:", centro.nome)
  }

  const getTipoBadge = (tipo: string) => {
    const badges = {
      operacional: { label: "Operacional", className: "bg-blue-100 text-blue-800" },
      administrativo: { label: "Administrativo", className: "bg-green-100 text-green-800" },
      comercial: { label: "Comercial", className: "bg-purple-100 text-purple-800" },
      financeiro: { label: "Financeiro", className: "bg-orange-100 text-orange-800" },
      producao: { label: "Produção", className: "bg-red-100 text-red-800" },
      apoio: { label: "Apoio", className: "bg-gray-100 text-gray-800" },
    }
    const badge = badges[tipo as keyof typeof badges]
    if (!badge) {
      return <Badge className="bg-gray-100 text-gray-800">{tipo || "Tipo desconhecido"}</Badge>
    }
    return <Badge className={badge.className}>{badge.label}</Badge>
  }

  const getStatusBadge = (percentual: number) => {
    if (percentual >= 95) {
      return <Badge variant="destructive">Crítico</Badge>
    } else if (percentual >= 85) {
      return <Badge className="bg-yellow-100 text-yellow-800">Atenção</Badge>
    } else {
      return <Badge className="bg-green-100 text-green-800">Normal</Badge>
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">Detalhes do Centro de Custo</DialogTitle>
            <Button onClick={handleGerarPDF} size="sm" className="gap-2">
              <FileText className="w-4 h-4" />
              Gerar PDF
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">Centro de Custo:</span>
                  </div>
                  <p className="text-lg font-semibold">
                    {centro.codigo} - {centro.nome}
                  </p>
                </div>
                <div className="space-y-2">
                  <span className="font-medium">Tipo:</span>
                  <div>{getTipoBadge(centro.tipo)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">Responsável:</span>
                  </div>
                  <p>{centro.responsavel}</p>
                </div>
                <div className="space-y-2">
                  <span className="font-medium">Departamento:</span>
                  <p>{centro.departamento}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">Última Movimentação:</span>
                </div>
                <p>{new Date(centro.ultimaMovimentacao).toLocaleDateString("pt-BR")}</p>
              </div>
            </CardContent>
          </Card>

          {/* Informações Financeiras */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações Financeiras</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Orçamento Mensal</p>
                  <p className="text-2xl font-bold text-blue-600">R$ {(centro.orcamentoMensal ?? 0).toLocaleString()}</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <p className="text-sm text-gray-600">Gasto Atual</p>
                  <p className="text-2xl font-bold text-orange-600">R$ {(centro.gastoAtual ?? 0).toLocaleString()}</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Saldo Disponível</p>
                  <p className="text-2xl font-bold text-green-600">
                    R$ {((centro.orcamentoMensal ?? 0) - (centro.gastoAtual ?? 0)).toLocaleString()}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {centro.percentualGasto >= 90 ? (
                    <TrendingUp className="w-5 h-5 text-red-600" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-green-600" />
                  )}
                  <span className="font-medium">Percentual Utilizado:</span>
                  <span className="text-lg font-semibold">{(centro.percentualGasto ?? 0).toFixed(1)}%</span>
                </div>
                {getStatusBadge(centro.percentualGasto)}
              </div>

              {/* Barra de Progresso */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Utilização do Orçamento</span>
                  <span>{(centro.percentualGasto ?? 0).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-300 ${
                      centro.percentualGasto >= 95
                        ? "bg-red-500"
                        : centro.percentualGasto >= 85
                          ? "bg-yellow-500"
                          : "bg-green-500"
                    }`}
                    style={{ width: `${Math.min(centro.percentualGasto ?? 0, 100)}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Histórico Recente */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Movimentações Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Compra de Material de Escritório</p>
                    <p className="text-sm text-gray-600">15/01/2024</p>
                  </div>
                  <span className="text-red-600 font-medium">-R$ 1.250,00</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Pagamento de Fornecedor</p>
                    <p className="text-sm text-gray-600">12/01/2024</p>
                  </div>
                  <span className="text-red-600 font-medium">-R$ 3.500,00</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Ajuste Orçamentário</p>
                    <p className="text-sm text-gray-600">10/01/2024</p>
                  </div>
                  <span className="text-green-600 font-medium">+R$ 2.000,00</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
