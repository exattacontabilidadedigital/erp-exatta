import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, CreditCard, TrendingDown, TrendingUp } from "lucide-react"

export function ContasResumo({ contas }: { contas?: any[] }) {
  const contasArray = Array.isArray(contas) ? contas : [];
  // Calcula os dados reais
  const totalContas = contasArray.length;
  const contasAtivas = contasArray.filter((c) => c.ativo).length;
  const maiorConta = contasArray.reduce((max, c) => (c.saldo_atual > (max?.saldo_atual ?? -Infinity) ? c : max), null);
  const menorConta = contasArray.reduce((min, c) => (c.saldo_atual < (min?.saldo_atual ?? Infinity) ? c : min), null);
  const totalSaldo = contasArray.reduce((acc, c) => acc + (typeof c.saldo_atual === "number" ? c.saldo_atual : 0), 0);

  const resumoData = [
    {
      title: "Total em Contas",
      value: `R$ ${totalSaldo.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change: `Contas: ${totalContas}`,
      changeType: "neutral" as const,
      icon: Building2,
    },
    {
      title: "Contas Ativas",
      value: contasAtivas.toString(),
      change: `Inativas: ${totalContas - contasAtivas}`,
      changeType: "neutral" as const,
      icon: CreditCard,
    },
    {
      title: "Maior Saldo",
      value: maiorConta ? `R$ ${Number(maiorConta.saldo_atual).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "-",
      change: maiorConta?.bancos?.nome || "-",
      changeType: "neutral" as const,
      icon: TrendingUp,
    },
    {
      title: "Menor Saldo",
      value: menorConta ? `R$ ${Number(menorConta.saldo_atual).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "-",
      change: menorConta?.bancos?.nome || "-",
      changeType: "neutral" as const,
      icon: TrendingDown,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {resumoData.map((item, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">{item.title}</CardTitle>
            <item.icon className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{item.value}</div>
            <p className="text-xs mt-1 text-gray-500">{item.change}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
