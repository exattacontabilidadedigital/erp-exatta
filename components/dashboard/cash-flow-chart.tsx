import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

const data = [
  { name: "Jan", receitas: 40000, despesas: 30000 },
  { name: "Fev", receitas: 35000, despesas: 28000 },
  { name: "Mar", receitas: 42000, despesas: 32000 },
  { name: "Abr", receitas: 38000, despesas: 29000 },
  { name: "Mai", receitas: 45000, despesas: 35000 },
  { name: "Jun", receitas: 48000, despesas: 33000 },
]

export function CashFlowChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Fluxo de Caixa - Últimos 6 Meses</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value: number) => [`R$ ${value.toLocaleString()}`, ""]} />
            <Legend />
            <Bar dataKey="receitas" fill="#10b981" name="Receitas" />
            <Bar dataKey="despesas" fill="#ef4444" name="Despesas" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
