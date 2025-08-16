"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { FileText, Download, Printer } from "lucide-react"

interface CentroCustosRelatorioModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CentroCustosRelatorioModal({ isOpen, onClose }: CentroCustosRelatorioModalProps) {
  const handleGerarPDF = () => {
    // Simular geração de PDF
    console.log("Gerando PDF do relatório...")
  }

  const handleImprimir = () => {
    window.print()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Relatório de Centro de Custos
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Cabeçalho do Relatório */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">Relatório de Centro de Custos</h2>
            <p className="text-gray-600">Período: Janeiro a Dezembro 2024</p>
            <p className="text-sm text-gray-500">Gerado em: {new Date().toLocaleDateString("pt-BR")}</p>
          </div>

          <Separator />

          {/* Resumo Executivo */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo Executivo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">5</p>
                  <p className="text-sm text-gray-600">Total de Centros</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">R$ 340.000</p>
                  <p className="text-sm text-gray-600">Orçamento Total</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">R$ 275.500</p>
                  <p className="text-sm text-gray-600">Gasto Total</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">81%</p>
                  <p className="text-sm text-gray-600">Utilização Média</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detalhamento por Centro */}
          <Card>
            <CardHeader>
              <CardTitle>Detalhamento por Centro de Custo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    codigo: "001",
                    nome: "Administrativo",
                    responsavel: "João Silva",
                    orcamento: 50000,
                    gasto: 35000,
                    status: "Ativo",
                  },
                  {
                    codigo: "002",
                    nome: "Vendas",
                    responsavel: "Maria Santos",
                    orcamento: 80000,
                    gasto: 72000,
                    status: "Ativo",
                  },
                  {
                    codigo: "003",
                    nome: "Marketing",
                    responsavel: "Pedro Costa",
                    orcamento: 30000,
                    gasto: 28500,
                    status: "Ativo",
                  },
                  {
                    codigo: "004",
                    nome: "Produção",
                    responsavel: "Ana Lima",
                    orcamento: 120000,
                    gasto: 95000,
                    status: "Ativo",
                  },
                  {
                    codigo: "005",
                    nome: "TI",
                    responsavel: "Carlos Oliveira",
                    orcamento: 60000,
                    gasto: 45000,
                    status: "Ativo",
                  },
                ].map((centro) => {
                  const utilizacao = (centro.gasto / centro.orcamento) * 100
                  return (
                    <div key={centro.codigo} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold">
                            {centro.codigo} - {centro.nome}
                          </h4>
                          <p className="text-sm text-gray-600">Responsável: {centro.responsavel}</p>
                        </div>
                        <Badge variant={utilizacao > 90 ? "destructive" : utilizacao > 80 ? "secondary" : "default"}>
                          {centro.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Orçamento</p>
                          <p className="font-semibold">R$ {centro.orcamento.toLocaleString("pt-BR")}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Gasto Atual</p>
                          <p className="font-semibold">R$ {centro.gasto.toLocaleString("pt-BR")}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Utilização</p>
                          <p className="font-semibold">{utilizacao.toFixed(1)}%</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Ações */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleImprimir}>
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
            <Button onClick={handleGerarPDF}>
              <Download className="w-4 h-4 mr-2" />
              Gerar PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
