"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileDown, Printer } from "lucide-react"

interface PlanoContasRelatorioModalProps {
  isOpen: boolean
  onClose: () => void
}

export function PlanoContasRelatorioModal({ isOpen, onClose }: PlanoContasRelatorioModalProps) {
  const handleGerarPDF = () => {
    // Simular geração de PDF
    const link = document.createElement("a")
    link.href =
      "data:application/pdf;base64,JVBERi0xLjQKJdPr6eEKMSAwIG9iago8PAovVGl0bGUgKFJlbGF0w7NyaW8gZG8gUGxhbm8gZGUgQ29udGFzKQovQ3JlYXRvciAoU2lzdGVtYSBDb250w6FiaWwpCi9Qcm9kdWNlciAoU2lzdGVtYSBDb250w6FiaWwpCi9DcmVhdGlvbkRhdGUgKEQ6MjAyNDEyMTcxMjAwMDBaKQo+PgplbmRvYmoKCjIgMCBvYmoKPDwKL1R5cGUgL0NhdGFsb2cKL1BhZ2VzIDMgMCBSCj4+CmVuZG9iagoKMyAwIG9iago8PAovVHlwZSAvUGFnZXMKL0tpZHMgWzQgMCBSXQovQ291bnQgMQo+PgplbmRvYmoKCjQgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAzIDAgUgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQovQ29udGVudHMgNSAwIFIKPj4KZW5kb2JqCgo1IDAgb2JqCjw8Ci9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCi9GMSAxMiBUZgoxMDAgNzAwIFRkCihSZWxhdMOzcmlvIGRvIFBsYW5vIGRlIENvbnRhcykgVGoKRVQKZW5kc3RyZWFtCmVuZG9iagoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAxNzQgMDAwMDAgbiAKMDAwMDAwMDIyMSAwMDAwMCBuIAowMDAwMDAwMjc4IDAwMDAwIG4gCjAwMDAwMDAzNzggMDAwMDAgbiAKdHJhaWxlcgo8PAovU2l6ZSA2Ci9Sb290IDIgMCBSCj4+CnN0YXJ0eHJlZgo0NzAKJSVFT0Y="
    link.download = `relatorio_plano_contas_${new Date().toISOString().split("T")[0]}.pdf`
    link.click()
  }

  const handleImprimir = () => {
    window.print()
  }

  // Dados mockados do plano de contas
  const relatorioData = {
    totalContas: 45,
    ativo: 18,
    passivo: 12,
    patrimonio: 5,
    receita: 6,
    despesa: 4,
    dataGeracao: new Date().toLocaleDateString("pt-BR"),
    contas: [
      { codigo: "1", nome: "ATIVO", tipo: "Ativo", nivel: 1, filhos: 18 },
      { codigo: "1.1", nome: "ATIVO CIRCULANTE", tipo: "Ativo", nivel: 2, filhos: 8 },
      { codigo: "1.1.01", nome: "Caixa e Equivalentes", tipo: "Ativo", nivel: 3, filhos: 3 },
      { codigo: "1.2", nome: "ATIVO NÃO CIRCULANTE", tipo: "Ativo", nivel: 2, filhos: 10 },
      { codigo: "2", nome: "PASSIVO", tipo: "Passivo", nivel: 1, filhos: 12 },
      { codigo: "2.1", nome: "PASSIVO CIRCULANTE", tipo: "Passivo", nivel: 2, filhos: 7 },
      { codigo: "2.2", nome: "PASSIVO NÃO CIRCULANTE", tipo: "Passivo", nivel: 2, filhos: 5 },
      { codigo: "3", nome: "PATRIMÔNIO LÍQUIDO", tipo: "Patrimônio Líquido", nivel: 1, filhos: 5 },
      { codigo: "4", nome: "RECEITAS", tipo: "Receita", nivel: 1, filhos: 6 },
      { codigo: "5", nome: "DESPESAS", tipo: "Despesa", nivel: 1, filhos: 4 },
    ],
  }

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case "Ativo":
        return "bg-green-100 text-green-800"
      case "Passivo":
        return "bg-red-100 text-red-800"
      case "Patrimônio Líquido":
        return "bg-blue-100 text-blue-800"
      case "Receita":
        return "bg-emerald-100 text-emerald-800"
      case "Despesa":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Relatório do Plano de Contas</span>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handleImprimir}>
                <Printer className="w-4 h-4 mr-2" />
                Imprimir
              </Button>
              <Button variant="outline" size="sm" onClick={handleGerarPDF}>
                <FileDown className="w-4 h-4 mr-2" />
                Gerar PDF
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Resumo Executivo */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo Executivo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{relatorioData.totalContas}</div>
                  <div className="text-sm text-gray-600">Total de Contas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{relatorioData.ativo}</div>
                  <div className="text-sm text-gray-600">Contas do Ativo</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{relatorioData.passivo}</div>
                  <div className="text-sm text-gray-600">Contas do Passivo</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{relatorioData.patrimonio}</div>
                  <div className="text-sm text-gray-600">Patrimônio Líquido</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600">{relatorioData.receita}</div>
                  <div className="text-sm text-gray-600">Contas de Receita</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{relatorioData.despesa}</div>
                  <div className="text-sm text-gray-600">Contas de Despesa</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estrutura Hierárquica */}
          <Card>
            <CardHeader>
              <CardTitle>Estrutura Hierárquica do Plano de Contas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {relatorioData.contas.map((conta, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-1 h-8 rounded" style={{ marginLeft: `${(conta.nivel - 1) * 20}px` }} />
                      <div>
                        <div className="font-medium">
                          {conta.codigo} - {conta.nome}
                        </div>
                        <div className="text-sm text-gray-600">Nível {conta.nivel}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getTipoColor(conta.tipo)}>{conta.tipo}</Badge>
                      <span className="text-sm text-gray-600">{conta.filhos} contas</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Informações do Relatório */}
          <Card>
            <CardHeader>
              <CardTitle>Informações do Relatório</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Data de Geração:</span> {relatorioData.dataGeracao}
                </div>
                <div>
                  <span className="font-medium">Sistema:</span> Sistema Contábil v1.0
                </div>
                <div>
                  <span className="font-medium">Usuário:</span> Administrador
                </div>
                <div>
                  <span className="font-medium">Período:</span> Estrutura Atual
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
