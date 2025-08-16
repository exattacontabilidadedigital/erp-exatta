"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, Clock, Percent } from "lucide-react"

interface FormasPagamentoListProps {
  onEditar: (formaPagamento: any) => void
  onExcluir: (formaPagamento: any) => void
}

export function FormasPagamentoList({ onEditar, onExcluir }: FormasPagamentoListProps) {
  const formasPagamento = [
    {
      id: 1,
      nome: "Dinheiro",
      tipo: "dinheiro",
      prazoMedio: 0,
      taxaJuros: 0,
      ativo: true,
    },
    {
      id: 2,
      nome: "Cartão de Crédito",
      tipo: "cartao_credito",
      prazoMedio: 30,
      taxaJuros: 2.5,
      ativo: true,
    },
    {
      id: 3,
      nome: "PIX",
      tipo: "pix",
      prazoMedio: 0,
      taxaJuros: 0,
      ativo: true,
    },
    {
      id: 4,
      nome: "Boleto Bancário",
      tipo: "boleto",
      prazoMedio: 3,
      taxaJuros: 0,
      ativo: true,
    },
  ]

  const getTipoLabel = (tipo: string) => {
    const tipos: { [key: string]: string } = {
      dinheiro: "Dinheiro",
      cartao_credito: "Cartão de Crédito",
      cartao_debito: "Cartão de Débito",
      transferencia: "Transferência",
      boleto: "Boleto",
      pix: "PIX",
      cheque: "Cheque",
      outros: "Outros",
    }
    return tipos[tipo] || tipo
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Formas de Pagamento Cadastradas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {formasPagamento.map((forma) => (
            <div key={forma.id} className="border rounded-lg p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-semibold">{forma.nome}</h3>
                    <Badge variant="outline">{getTipoLabel(forma.tipo)}</Badge>
                    <Badge variant={forma.ativo ? "default" : "secondary"}>{forma.ativo ? "Ativo" : "Inativo"}</Badge>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{forma.prazoMedio} dias</span>
                    </div>
                    {forma.taxaJuros > 0 && (
                      <div className="flex items-center space-x-1">
                        <Percent className="w-4 h-4" />
                        <span>{forma.taxaJuros}% juros</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => onEditar(forma)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onExcluir(forma)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
