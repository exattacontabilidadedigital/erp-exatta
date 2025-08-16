import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  FileText,
  CreditCard,
  Building2,
  Users,
  BarChart3,
  Calculator,
  Shield,
  CheckCircle,
  ArrowRight,
} from "lucide-react"

export default function FuncionalidadesPage() {
  const categorias = [
    {
      titulo: "Lançamentos Contábeis",
      icone: FileText,
      cor: "bg-emerald-50 text-emerald-600",
      funcionalidades: [
        {
          nome: "Lançamentos Automáticos",
          descricao: "Registre receitas, despesas e transferências com classificação automática por plano de contas.",
        },
        {
          nome: "Importação de Extratos",
          descricao: "Importe extratos bancários em CSV/Excel e concilie automaticamente com seus lançamentos.",
        },
        {
          nome: "Centro de Custos",
          descricao: "Organize gastos por departamentos, projetos ou centros de custos personalizados.",
        },
        {
          nome: "Histórico Completo",
          descricao: "Mantenha registro detalhado de todas as movimentações com auditoria completa.",
        },
      ],
    },
    {
      titulo: "Relatórios Financeiros",
      icone: BarChart3,
      cor: "bg-blue-50 text-blue-600",
      funcionalidades: [
        {
          nome: "Balancete Patrimonial",
          descricao: "Visualize a situação patrimonial da empresa com relatórios detalhados por período.",
        },
        {
          nome: "DRE Automática",
          descricao: "Demonstração do Resultado do Exercício gerada automaticamente com comparativos.",
        },
        {
          nome: "Fluxo de Caixa",
          descricao: "Acompanhe entradas e saídas com projeções futuras e alertas de saldo baixo.",
        },
        {
          nome: "Exportação Múltipla",
          descricao: "Exporte relatórios em PDF, Excel ou envie por email diretamente do sistema.",
        },
      ],
    },
    {
      titulo: "Gestão Bancária",
      icone: CreditCard,
      cor: "bg-purple-50 text-purple-600",
      funcionalidades: [
        {
          nome: "Múltiplas Contas",
          descricao: "Gerencie quantas contas bancárias precisar com controle individual de saldos.",
        },
        {
          nome: "Conciliação Bancária",
          descricao: "Compare extratos bancários com lançamentos e identifique divergências automaticamente.",
        },
        {
          nome: "Transferências",
          descricao: "Registre transferências entre contas com lançamentos automáticos de débito e crédito.",
        },
        {
          nome: "Alertas Inteligentes",
          descricao: "Receba notificações de saldo baixo, vencimentos e movimentações suspeitas.",
        },
      ],
    },
    {
      titulo: "Plano de Contas",
      icone: Building2,
      cor: "bg-orange-50 text-orange-600",
      funcionalidades: [
        {
          nome: "Estrutura Hierárquica",
          descricao: "Organize contas em níveis hierárquicos seguindo padrões contábeis brasileiros.",
        },
        {
          nome: "Classificação Automática",
          descricao: "Sistema inteligente sugere classificação baseada no histórico de lançamentos.",
        },
        {
          nome: "Contas Personalizadas",
          descricao: "Crie contas específicas para seu negócio mantendo a estrutura padrão.",
        },
        {
          nome: "Relatórios por Conta",
          descricao: "Visualize movimentações detalhadas de qualquer conta do plano.",
        },
      ],
    },
    {
      titulo: "Gestão de Usuários",
      icone: Users,
      cor: "bg-teal-50 text-teal-600",
      funcionalidades: [
        {
          nome: "Múltiplos Usuários",
          descricao: "Adicione contadores, assistentes e gestores com diferentes níveis de acesso.",
        },
        {
          nome: "Permissões Granulares",
          descricao: "Controle exato sobre quem pode visualizar, editar ou excluir cada tipo de informação.",
        },
        {
          nome: "Auditoria de Ações",
          descricao: "Registre todas as ações dos usuários para compliance e segurança.",
        },
        {
          nome: "Perfis Personalizados",
          descricao: "Crie perfis de acesso específicos para diferentes funções na empresa.",
        },
      ],
    },
    {
      titulo: "Segurança e Backup",
      icone: Shield,
      cor: "bg-red-50 text-red-600",
      funcionalidades: [
        {
          nome: "Criptografia Avançada",
          descricao: "Todos os dados são protegidos com criptografia de nível bancário.",
        },
        {
          nome: "Backup Automático",
          descricao: "Backups diários automáticos com possibilidade de restauração pontual.",
        },
        {
          nome: "Acesso Seguro",
          descricao: "Autenticação de dois fatores e controle de sessões ativas.",
        },
        {
          nome: "Compliance LGPD",
          descricao: "Sistema totalmente adequado às normas de proteção de dados.",
        },
      ],
    },
  ]

  const beneficios = [
    "Redução de 80% no tempo de fechamento mensal",
    "Eliminação de erros manuais de digitação",
    "Relatórios gerenciais em tempo real",
    "Conformidade com normas contábeis",
    "Integração com sistemas bancários",
    "Suporte técnico especializado",
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/landing"
              className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">Voltar</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button
                  variant="outline"
                  className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 bg-transparent"
                >
                  Fazer Login
                </Button>
              </Link>
              <Link href="/cadastro">
                <Button className="bg-emerald-600 hover:bg-emerald-700">Começar Grátis</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <Badge className="mb-6 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Funcionalidades Completas</Badge>
          <h1 className="text-5xl font-bold text-slate-900 mb-6 leading-tight">
            Tudo que você precisa para
            <span className="text-emerald-600 block">gestão contábil completa</span>
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Descubra como nosso sistema pode transformar a contabilidade da sua empresa com ferramentas profissionais e
            interface intuitiva.
          </p>
        </div>
      </section>

      {/* Funcionalidades por Categoria */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="space-y-16">
            {categorias.map((categoria, index) => (
              <div key={index} className="relative">
                <div className="flex items-center gap-4 mb-8">
                  <div className={`p-3 rounded-xl ${categoria.cor}`}>
                    <categoria.icone className="h-8 w-8" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-slate-900">{categoria.titulo}</h2>
                    <div className="h-1 w-20 bg-emerald-500 rounded-full mt-2"></div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {categoria.funcionalidades.map((func, funcIndex) => (
                    <Card
                      key={funcIndex}
                      className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-xl text-slate-900">{func.nome}</CardTitle>
                          <CheckCircle className="h-6 w-6 text-emerald-500 flex-shrink-0" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="text-slate-600 text-base leading-relaxed">
                          {func.descricao}
                        </CardDescription>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefícios */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Benefícios Comprovados</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Empresas que usam nosso sistema relatam melhorias significativas em eficiência e precisão contábil.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {beneficios.map((beneficio, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-4 rounded-lg bg-emerald-50 border border-emerald-100"
              >
                <CheckCircle className="h-6 w-6 text-emerald-600 flex-shrink-0" />
                <span className="text-slate-700 font-medium">{beneficio}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-gradient-to-r from-emerald-600 to-emerald-700">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Pronto para revolucionar sua contabilidade?</h2>
          <p className="text-xl text-emerald-100 mb-8 max-w-2xl mx-auto">
            Junte-se a milhares de empresas que já transformaram sua gestão financeira.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/cadastro">
              <Button
                size="lg"
                className="bg-white text-emerald-600 hover:bg-emerald-50 px-8 py-4 text-lg font-semibold"
              >
                Começar Teste Grátis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/landing">
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10 px-8 py-4 text-lg font-semibold bg-transparent"
              >
                Ver Demonstração
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Calculator className="h-8 w-8 text-emerald-400" />
                <span className="text-xl font-bold">ContábilPro</span>
              </div>
              <p className="text-slate-400">Sistema completo de gestão contábil para empresas modernas.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-slate-400">
                <li>
                  <Link href="/funcionalidades" className="hover:text-white transition-colors">
                    Funcionalidades
                  </Link>
                </li>
                <li>
                  <Link href="/precos" className="hover:text-white transition-colors">
                    Preços
                  </Link>
                </li>
                <li>
                  <Link href="/demo" className="hover:text-white transition-colors">
                    Demonstração
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2 text-slate-400">
                <li>
                  <Link href="/ajuda" className="hover:text-white transition-colors">
                    Central de Ajuda
                  </Link>
                </li>
                <li>
                  <Link href="/contato" className="hover:text-white transition-colors">
                    Contato
                  </Link>
                </li>
                <li>
                  <Link href="/treinamento" className="hover:text-white transition-colors">
                    Treinamento
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-slate-400">
                <li>
                  <Link href="/sobre" className="hover:text-white transition-colors">
                    Sobre Nós
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="hover:text-white transition-colors">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="/carreiras" className="hover:text-white transition-colors">
                    Carreiras
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-400">
            <p>&copy; 2024 ContábilPro. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
