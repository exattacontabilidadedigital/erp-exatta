"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const extratoData = [
  {
    data: "10/01/2024",
    descricao: "Venda Produtos - NF 12345",
    conta: "Banco do Brasil",
    entrada: 15000,
    saida: 0,
    saldo: 139000,
  },
  {
    data: "09/01/2024",
    descricao: "Pagamento Fornecedor",
    conta: "Itaú",
    entrada: 0,
    saida: 8500,
    saldo: 124000,
  },
  {
    data: "08/01/2024",
    descricao: "Recebimento PIX",
    conta: "Banco do Brasil",
    entrada: 3200,
    saida: 0,
    saldo: 132500,
  },
  {
    data: "07/01/2024",
    descricao: "Transferência Interna",
    conta: "Caixa Econômica",
    entrada: 5000,
    saida: 0,
    saldo: 129300,
  },
  {
    data: "06/01/2024",
    descricao: "Pagamento Boleto",
    conta: "Santander",
    entrada: 0,
    saida: 2800,
    saldo: 124300,
  },
]

export function FluxoCaixaExtrato() {
  const [periodoSelecionado, setPeriodoSelecionado] = useState("7dias")
  const [contaSelecionada, setContaSelecionada] = useState("todas")

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Extrato de Movimentações</CardTitle>
          <div className="flex space-x-2">
            <Select value={periodoSelecionado} onValueChange={setPeriodoSelecionado}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7dias">7 dias</SelectItem>
                <SelectItem value="15dias">15 dias</SelectItem>
                <SelectItem value="30dias">30 dias</SelectItem>
                <SelectItem value="90dias">90 dias</SelectItem>
              </SelectContent>
            </Select>
            <Select value={contaSelecionada} onValueChange={setContaSelecionada}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as contas</SelectItem>
                <SelectItem value="bb">Banco do Brasil</SelectItem>
                <SelectItem value="itau">Itaú</SelectItem>
                <SelectItem value="caixa">Caixa Econômica</SelectItem>
                <SelectItem value="santander">Santander</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Entrada</TableHead>
                <TableHead>Saída</TableHead>
                <TableHead>Saldo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {extratoData.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    {new Date(item.data.split("/").reverse().join("-")).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="text-sm font-medium">{item.descricao}</div>
                      <div className="text-xs text-gray-500">{item.conta}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.entrada > 0 && (
                      <span className="text-green-600 font-medium">+R$ {item.entrada.toLocaleString()}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {item.saida > 0 && (
                      <span className="text-red-600 font-medium">-R$ {item.saida.toLocaleString()}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">R$ {item.saldo.toLocaleString()}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
