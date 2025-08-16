"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { FileText, Download, TrendingUp, TrendingDown, Calendar } from "lucide-react"

interface ContasExtratoModalProps {
  isOpen: boolean
  onClose: () => void
  conta: any
}

const mockMovimentacoes = [
  {
    id: "001",
    data: "2024-01-15",
    descricao: "Transferência recebida - Cliente ABC",
    tipo: "Crédito",
    valor: 5200.5,
    saldo: 85200.5,
  },
  {
    id: "002",
    data: "2024-01-14",
    descricao: "Pagamento fornecedor XYZ",
    tipo: "Débito",
    valor: -2800.0,
    saldo: 80000.0,
  },
  {
    id: "003",
    data: "2024-01-13",
    descricao: "Depósito em dinheiro",
    tipo: "Crédito",
    valor: 1500.0,
    saldo: 82800.0,
  },
  {
    id: "004",
    data: "2024-01-12",
    descricao: "Taxa de manutenção",
    tipo: "Débito",
    valor: -25.0,
    saldo: 81300.0,
  },
  {
    id: "005",
    data: "2024-01-11",
    descricao: "Pagamento de salários",
    tipo: "Débito",
    valor: -15000.0,
    saldo: 81325.0,
  },
]

export function ContasExtratoModal({ isOpen, onClose, conta }: ContasExtratoModalProps) {
  if (!conta) return null

  const handleExportarExtrato = () => {
    const extratoData = mockMovimentacoes.map((mov) => ({
      data: new Date(mov.data).toLocaleDateString("pt-BR"),
      descricao: mov.descricao,
      tipo: mov.tipo,
  valor: `R$ ${typeof mov.valor === "number" ? mov.valor.toLocaleString() : "0,00"}`,
  saldo: `R$ ${typeof mov.saldo === "number" ? mov.saldo.toLocaleString() : "0,00"}`,
    }))

    const headers = ["Data", "Descrição", "Tipo", "Valor", "Saldo"]
    const csvContent = [
      headers.join(","),
      ...extratoData.map((mov) => [mov.data, `"${mov.descricao}"`, mov.tipo, mov.valor, mov.saldo].join(",")),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute(
      "download",
      `extrato_${conta.banco.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`,
    )
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Extrato Bancário
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações da Conta */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="font-medium">{conta.banco}</div>
                <div className="text-sm text-gray-600">
                  Agência: {conta.agencia} | Conta: {conta.conta}-{conta.digito}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Saldo Atual</div>
                <div className="text-xl font-bold text-blue-600">R$ {typeof conta.saldoAtual === "number" ? conta.saldoAtual.toLocaleString() : "0,00"}</div>
              </div>
            </div>
          </div>

          {/* Período */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              Período: 11/01/2024 a 15/01/2024
            </div>
            <Button variant="outline" size="sm" onClick={handleExportarExtrato}>
              <Download className="w-4 h-4 mr-2" />
              Exportar Extrato
            </Button>
          </div>

          <Separator />

          {/* Movimentações */}
          <div className="space-y-4">
            <h3 className="font-medium">Movimentações</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockMovimentacoes.map((mov) => (
                  <TableRow key={mov.id}>
                    <TableCell className="font-mono text-sm">
                      {new Date(mov.data).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>{mov.descricao}</TableCell>
                    <TableCell>
                      <Badge
                        variant={mov.tipo === "Crédito" ? "default" : "secondary"}
                        className={mov.tipo === "Crédito" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                      >
                        <div className="flex items-center gap-1">
                          {mov.tipo === "Crédito" ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          {mov.tipo}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium ${mov.valor >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {mov.valor >= 0 ? "+" : ""}R$ {typeof mov.valor === "number" ? Math.abs(mov.valor).toLocaleString() : "0,00"}
                    </TableCell>
                    <TableCell className="text-right font-medium">R$ {typeof mov.saldo === "number" ? mov.saldo.toLocaleString() : "0,00"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Resumo */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-sm text-gray-600">Total Créditos</div>
                <div className="font-medium text-green-600">
                  R${" "}
                  {(() => {
                    const totalCreditos = mockMovimentacoes
                      .filter((m) => m.valor > 0)
                      .reduce((acc, m) => acc + m.valor, 0);
                    return typeof totalCreditos === "number" ? totalCreditos.toLocaleString() : "0,00";
                  })()}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Total Débitos</div>
                <div className="font-medium text-red-600">
                  R${" "}
                  {(() => {
                    const totalDebitos = mockMovimentacoes
                      .filter((m) => m.valor < 0)
                      .reduce((acc, m) => acc + m.valor, 0);
                    return typeof totalDebitos === "number" ? Math.abs(totalDebitos).toLocaleString() : "0,00";
                  })()}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Saldo Final</div>
                <div className="font-medium text-blue-600">R$ {typeof conta.saldoAtual === "number" ? conta.saldoAtual.toLocaleString() : "0,00"}</div>
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="flex justify-end">
            <Button onClick={onClose}>Fechar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
