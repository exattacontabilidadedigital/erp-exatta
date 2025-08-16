"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Printer, Download, CreditCard, Clock, Percent, CheckCircle } from "lucide-react"

interface FormasPagamentoRelatorioModalProps {
  isOpen: boolean
  onClose: () => void
}

export function FormasPagamentoRelatorioModal({ isOpen, onClose }: FormasPagamentoRelatorioModalProps) {
  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = () => {
    // Simular geração de PDF
    console.log("Gerando PDF do relatório...")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>Relatório de Formas de Pagamento</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Resumo Executivo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumo Executivo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">4</div>
                  <div className="text-sm text-gray-600">Total de Formas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">4</div>
                  <div className="text-sm text-gray-600">Ativas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">8.3</div>
                  <div className="text-sm text-gray-600">Prazo Médio (dias)</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">0.6%</div>
                  <div className="text-sm text-gray-600">Taxa Média</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detalhamento por Forma */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Detalhamento por Forma de Pagamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { nome: "Dinheiro", tipo: "À Vista", prazo: 0, taxa: 0, status: "Ativo" },
                  { nome: "Cartão de Crédito", tipo: "Parcelado", prazo: 30, taxa: 2.5, status: "Ativo" },
                  { nome: "PIX", tipo: "À Vista", prazo: 0, taxa: 0, status: "Ativo" },
                  { nome: "Boleto Bancário", tipo: "À Prazo", prazo: 3, taxa: 0, status: "Ativo" },
                ].map((forma, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{forma.nome}</h4>
                      <Badge variant="outline" className="text-green-600">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {forma.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center space-x-1">
                        <span className="text-gray-500">Tipo:</span>
                        <span>{forma.tipo}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>{forma.prazo} dias</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Percent className="w-4 h-4 text-gray-400" />
                        <span>{forma.taxa}% taxa</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Análises e Recomendações */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Análises e Recomendações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <strong>Diversificação:</strong> Portfolio bem diversificado com 4 formas de pagamento ativas.
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <strong>Pagamentos Instantâneos:</strong> 50% das formas são à vista (Dinheiro e PIX).
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <strong>Custos Financeiros:</strong> Apenas cartão de crédito possui taxa de juros (2.5%).
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botões de Ação */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
            <Button variant="outline" onClick={handleDownloadPDF}>
              <Download className="w-4 h-4 mr-2" />
              Baixar PDF
            </Button>
            <Button onClick={onClose}>Fechar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
