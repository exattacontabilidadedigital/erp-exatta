import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

const projecoes = [
  {
    data: "15/01/2024",
    descricao: "Recebimento Cliente ABC",
    tipo: "entrada",
    valor: 25000,
    saldoProjetado: 150430,
  },
  {
    data: "18/01/2024",
    descricao: "Pagamento Fornecedor XYZ",
    tipo: "saida",
    valor: 15000,
    saldoProjetado: 135430,
  },
  {
    data: "20/01/2024",
    descricao: "Recebimento Vendas",
    tipo: "entrada",
    valor: 18500,
    saldoProjetado: 153930,
  },
  {
    data: "25/01/2024",
    descricao: "Pagamento Salários",
    tipo: "saida",
    valor: 32000,
    saldoProjetado: 121930,
  },
  {
    data: "30/01/2024",
    descricao: "Recebimento Contratos",
    tipo: "entrada",
    valor: 42000,
    saldoProjetado: 163930,
  },
]

export function FluxoCaixaProjecao() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Projeção dos Próximos 30 Dias</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Saldo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projecoes.map((projecao, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    {new Date(projecao.data.split("/").reverse().join("-")).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Badge variant={projecao.tipo === "entrada" ? "default" : "destructive"} className="text-xs">
                        {projecao.tipo === "entrada" ? "+" : "-"}
                      </Badge>
                      <span className="text-sm">{projecao.descricao}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`font-medium ${projecao.tipo === "entrada" ? "text-green-600" : "text-red-600"}`}>
                      {projecao.tipo === "entrada" ? "+" : "-"}R$ {projecao.valor.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">R$ {projecao.saldoProjetado.toLocaleString()}</span>
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
