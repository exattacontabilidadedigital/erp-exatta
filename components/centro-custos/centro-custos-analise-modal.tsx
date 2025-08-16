"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BarChart3, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react"

interface CentroCustosAnaliseModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CentroCustosAnaliseModal({ isOpen, onClose }: CentroCustosAnaliseModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Análise de Centro de Custos
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Indicadores Principais */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Eficiência Geral</p>
                    <p className="text-2xl font-bold text-green-600">85%</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Centros em Alerta</p>
                    <p className="text-2xl font-bold text-orange-600">2</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Economia Potencial</p>
                    <p className="text-2xl font-bold text-blue-600">R$ 15k</p>
                  </div>
                  <TrendingDown className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">ROI Médio</p>
                    <p className="text-2xl font-bold text-purple-600">12.5%</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Análise por Centro */}
          <Card>
            <CardHeader>
              <CardTitle>Análise Detalhada por Centro</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {[
                  {
                    codigo: "001",
                    nome: "Administrativo",
                    utilizacao: 70,
                    eficiencia: 85,
                    tendencia: "estavel",
                    recomendacao: "Manter investimento atual",
                  },
                  {
                    codigo: "002",
                    nome: "Vendas",
                    utilizacao: 90,
                    eficiencia: 92,
                    tendencia: "crescimento",
                    recomendacao: "Considerar aumento de orçamento",
                  },
                  {
                    codigo: "003",
                    nome: "Marketing",
                    utilizacao: 95,
                    eficiencia: 78,
                    tendencia: "alerta",
                    recomendacao: "Revisar estratégias de gastos",
                  },
                  {
                    codigo: "004",
                    nome: "Produção",
                    utilizacao: 79,
                    eficiencia: 88,
                    tendencia: "estavel",
                    recomendacao: "Performance satisfatória",
                  },
                  {
                    codigo: "005",
                    nome: "TI",
                    utilizacao: 75,
                    eficiencia: 90,
                    tendencia: "crescimento",
                    recomendacao: "Excelente gestão de recursos",
                  },
                ].map((centro) => (
                  <div key={centro.codigo} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-semibold">
                          {centro.codigo} - {centro.nome}
                        </h4>
                        <p className="text-sm text-gray-600">{centro.recomendacao}</p>
                      </div>
                      <Badge
                        variant={
                          centro.tendencia === "alerta"
                            ? "destructive"
                            : centro.tendencia === "crescimento"
                              ? "default"
                              : "secondary"
                        }
                      >
                        {centro.tendencia === "alerta"
                          ? "Atenção"
                          : centro.tendencia === "crescimento"
                            ? "Crescimento"
                            : "Estável"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Utilização do Orçamento</span>
                          <span>{centro.utilizacao}%</span>
                        </div>
                        <Progress value={centro.utilizacao} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Eficiência</span>
                          <span>{centro.eficiencia}%</span>
                        </div>
                        <Progress value={centro.eficiencia} className="h-2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recomendações */}
          <Card>
            <CardHeader>
              <CardTitle>Recomendações Estratégicas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium">Centro de Marketing</p>
                    <p className="text-sm text-gray-600">
                      Revisar campanhas com baixo ROI e otimizar investimentos em canais digitais.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium">Centro de Vendas</p>
                    <p className="text-sm text-gray-600">
                      Excelente performance. Considerar expansão da equipe comercial.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium">Centro de TI</p>
                    <p className="text-sm text-gray-600">Investir em automação para reduzir custos operacionais.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
