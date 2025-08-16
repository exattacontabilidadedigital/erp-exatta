import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calculator, Check, ArrowLeft, ArrowRight } from "lucide-react"

export default function PrecosPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/landing"
              className="flex items-center space-x-2 text-gray-600 hover:text-green-700 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Voltar</span>
            </Link>
            <div className="flex items-center space-x-2">
              <Calculator className="h-8 w-8 text-green-700" />
              <span className="text-2xl font-bold text-gray-900">ContábilPro</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Link href="/login">
              <Button variant="ghost" className="text-gray-700 hover:text-green-700">
                Entrar
              </Button>
            </Link>
            <Link href="/cadastro">
              <Button className="bg-green-700 hover:bg-green-800 text-white">Cadastrar Grátis</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Planos que se adaptam ao seu <span className="text-green-700">negócio</span>
          </h1>
          <p className="text-xl text-gray-600 mb-12 leading-relaxed">
            Escolha o plano ideal para sua empresa e comece a transformar sua gestão financeira hoje mesmo. Todos os
            planos incluem teste gratuito de 30 dias.
          </p>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Plano Básico */}
            <Card className="border-2 border-gray-200 hover:border-green-300 transition-colors duration-300">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Básico</h3>
                  <p className="text-gray-600 mb-6">Ideal para pequenas empresas</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900">R$ 49</span>
                    <span className="text-gray-600">/mês</span>
                  </div>
                  <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white">Começar Teste Gratuito</Button>
                </div>
                <ul className="space-y-4">
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-600 mr-3" />
                    <span className="text-gray-700">Até 1.000 lançamentos/mês</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-600 mr-3" />
                    <span className="text-gray-700">Relatórios básicos</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-600 mr-3" />
                    <span className="text-gray-700">1 usuário</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-600 mr-3" />
                    <span className="text-gray-700">Suporte por email</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-600 mr-3" />
                    <span className="text-gray-700">Backup automático</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Plano Profissional */}
            <Card className="border-2 border-green-500 relative hover:border-green-600 transition-colors duration-300">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-green-600 text-white px-4 py-1">Mais Popular</Badge>
              </div>
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Profissional</h3>
                  <p className="text-gray-600 mb-6">Para empresas em crescimento</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900">R$ 99</span>
                    <span className="text-gray-600">/mês</span>
                  </div>
                  <Button className="w-full bg-green-700 hover:bg-green-800 text-white">Começar Teste Gratuito</Button>
                </div>
                <ul className="space-y-4">
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-600 mr-3" />
                    <span className="text-gray-700">Lançamentos ilimitados</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-600 mr-3" />
                    <span className="text-gray-700">Todos os relatórios</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-600 mr-3" />
                    <span className="text-gray-700">Até 5 usuários</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-600 mr-3" />
                    <span className="text-gray-700">Suporte prioritário</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-600 mr-3" />
                    <span className="text-gray-700">Integrações bancárias</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-600 mr-3" />
                    <span className="text-gray-700">API completa</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Plano Enterprise */}
            <Card className="border-2 border-gray-200 hover:border-green-300 transition-colors duration-300">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Enterprise</h3>
                  <p className="text-gray-600 mb-6">Para grandes organizações</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900">R$ 199</span>
                    <span className="text-gray-600">/mês</span>
                  </div>
                  <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white">Falar com Vendas</Button>
                </div>
                <ul className="space-y-4">
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-600 mr-3" />
                    <span className="text-gray-700">Recursos ilimitados</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-600 mr-3" />
                    <span className="text-gray-700">Relatórios personalizados</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-600 mr-3" />
                    <span className="text-gray-700">Usuários ilimitados</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-600 mr-3" />
                    <span className="text-gray-700">Suporte 24/7</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-600 mr-3" />
                    <span className="text-gray-700">Gerente de conta dedicado</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-600 mr-3" />
                    <span className="text-gray-700">Treinamento personalizado</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">Todos os planos incluem teste gratuito de 30 dias</p>
            <p className="text-sm text-gray-500">
              Precisa de algo personalizado?{" "}
              <Link href="#" className="text-green-700 hover:underline">
                Entre em contato
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Perguntas Frequentes</h2>
            <p className="text-xl text-gray-600">Tire suas dúvidas sobre nossos planos</p>
          </div>

          <div className="space-y-8">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Posso cancelar a qualquer momento?</h3>
                <p className="text-gray-600">
                  Sim, você pode cancelar sua assinatura a qualquer momento sem taxas de cancelamento.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">O teste gratuito requer cartão de crédito?</h3>
                <p className="text-gray-600">
                  Não, você pode testar nossa plataforma por 30 dias sem fornecer informações de pagamento.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Posso mudar de plano depois?</h3>
                <p className="text-gray-600">
                  Sim, você pode fazer upgrade ou downgrade do seu plano a qualquer momento.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-green-700 to-green-800 text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold mb-6">Pronto para começar?</h2>
          <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
            Escolha seu plano e transforme sua gestão financeira hoje mesmo
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/cadastro">
              <Button size="lg" className="bg-white text-green-700 hover:bg-gray-100 px-8 py-4 text-lg font-semibold">
                Começar Teste Gratuito
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white/10 px-8 py-4 text-lg bg-transparent"
              >
                Já tenho conta
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
