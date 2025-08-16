"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { FileText, Download, Printer, Users, Building, TrendingUp, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ClientesFornecedoresRelatorioModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ClientesFornecedoresRelatorioModal({ isOpen, onClose }: ClientesFornecedoresRelatorioModalProps) {
  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = () => {
    console.log("Gerando PDF do relatório de clientes e fornecedores...")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Relatório de Clientes e Fornecedores
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Resumo Executivo */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Geral</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,247</div>
                <p className="text-xs text-muted-foreground">+12% vs mês anterior</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Clientes</CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">892</div>
                <p className="text-xs text-muted-foreground">71.5% do total</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Fornecedores</CardTitle>
                <Building className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">355</div>
                <p className="text-xs text-muted-foreground">28.5% do total</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ativos</CardTitle>
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">1,198</div>
                <p className="text-xs text-muted-foreground">96.1% do total</p>
              </CardContent>
            </Card>
          </div>

          {/* Análise por Região */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Distribuição por Estado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">São Paulo</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: "45%" }}></div>
                    </div>
                    <span className="text-sm text-gray-600">561 (45%)</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Rio de Janeiro</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: "28%" }}></div>
                    </div>
                    <span className="text-sm text-gray-600">349 (28%)</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Minas Gerais</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-600 h-2 rounded-full" style={{ width: "15%" }}></div>
                    </div>
                    <span className="text-sm text-gray-600">187 (15%)</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Outros</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div className="bg-orange-600 h-2 rounded-full" style={{ width: "12%" }}></div>
                    </div>
                    <span className="text-sm text-gray-600">150 (12%)</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status e Alertas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Status dos Cadastros</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        Ativo
                      </Badge>
                      <span className="text-sm">Cadastros ativos</span>
                    </div>
                    <span className="font-semibold">1,198</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Inativo</Badge>
                      <span className="text-sm">Cadastros inativos</span>
                    </div>
                    <span className="font-semibold">49</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  Alertas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium text-amber-600">23</span> cadastros com dados incompletos
                  </div>
                  <div className="text-sm">
                    <span className="font-medium text-red-600">7</span> documentos vencidos
                  </div>
                  <div className="text-sm">
                    <span className="font-medium text-blue-600">15</span> atualizações pendentes
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Ações */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-gray-500">
              Relatório gerado em {new Date().toLocaleDateString("pt-BR")} às {new Date().toLocaleTimeString("pt-BR")}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Imprimir
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                <Download className="h-4 w-4 mr-2" />
                Baixar PDF
              </Button>
              <Button onClick={onClose}>Fechar</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
