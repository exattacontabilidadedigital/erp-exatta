import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"

const data = [
  { name: "Produção", value: 25800, color: "#3b82f6" },
  { name: "Administrativo", value: 18500, color: "#10b981" },
  { name: "Vendas", value: 15200, color: "#f59e0b" },
  { name: "Marketing", value: 12300, color: "#ef4444" },
  { name: "Financeiro", value: 8900, color: "#8b5cf6" },
  { name: "RH", value: 4730, color: "#06b6d4" },
]

export function CentroCustosChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribuição de Custos por Centro - Janeiro 2024</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => [`R$ ${value.toLocaleString()}`, "Valor"]} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
