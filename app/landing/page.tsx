import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Calculator,
  TrendingUp,
  Shield,
  Users,
  FileText,
  BarChart3,
  CheckCircle,
  ArrowRight,
  Star,
  Play,
  Check,
} from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calculator className="h-8 w-8 text-green-700" />
            <span className="text-2xl font-bold text-gray-900">ContábilPro</span>
          </div>

          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/funcionalidades" className="text-gray-700 hover:text-green-700 transition-colors font-medium">
              Produto
            </Link>
            <Link href="/funcionalidades" className="text-gray-700 hover:text-green-700 transition-colors font-medium">
              Recursos
            </Link>
            <Link href="/precos" className="text-gray-700 hover:text-green-700 transition-colors font-medium">
              Preço
            </Link>
          </nav>

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
          <Badge className="mb-6 bg-green-100 text-green-800 hover:bg-green-100">
            ✨ Novo: Relatórios com IA integrada
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Transforme sua <span className="text-green-700">Gestão Financeira</span> com Nossa Solução Contábil
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Relatórios detalhados, controle de fluxo de caixa e muito mais, tudo em um só lugar. Simplifique sua
            contabilidade e foque no crescimento do seu negócio.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link href="/cadastro">
              <Button size="lg" className="bg-green-700 hover:bg-green-800 text-white px-8 py-4 text-lg">
                Experimente Gratuitamente
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button
              variant="outline"
              size="lg"
              className="px-8 py-4 text-lg border-green-700 text-green-700 hover:bg-green-50 bg-transparent"
            >
              <Play className="mr-2 h-5 w-5" />
              Ver Demonstração
            </Button>
          </div>
          <div className="flex items-center justify-center space-x-8 text-sm text-gray-500">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
              Teste grátis por 30 dias
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
              Sem cartão de crédito
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
              Suporte 24/7
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="funcionalidades" className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Tudo que você precisa para sua contabilidade</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Uma plataforma completa com todas as ferramentas essenciais para gestão financeira profissional
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-8 text-center">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FileText className="h-8 w-8 text-green-700" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Lançamentos Simples</h3>
                <p className="text-gray-600 leading-relaxed">
                  Registre receitas, despesas e transferências de forma intuitiva com validações automáticas
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-8 text-center">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <BarChart3 className="h-8 w-8 text-green-700" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Relatórios em Tempo Real</h3>
                <p className="text-gray-600 leading-relaxed">
                  DRE, Balancetes e análises personalizadas com exportação para PDF e Excel
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-8 text-center">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <TrendingUp className="h-8 w-8 text-green-700" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Fluxo de Caixa</h3>
                <p className="text-gray-600 leading-relaxed">
                  Projeções futuras, alertas de saldo baixo e controle total das movimentações
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-8 text-center">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Shield className="h-8 w-8 text-green-700" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Segurança Total</h3>
                <p className="text-gray-600 leading-relaxed">
                  Criptografia de ponta, backups automáticos e controle de acesso por usuário
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-8 text-center">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="h-8 w-8 text-green-700" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Gestão de Usuários</h3>
                <p className="text-gray-600 leading-relaxed">
                  Controle de permissões, múltiplos usuários e auditoria completa de ações
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-8 text-center">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Calculator className="h-8 w-8 text-green-700" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Plano de Contas</h3>
                <p className="text-gray-600 leading-relaxed">
                  Estrutura hierárquica personalizável seguindo padrões contábeis brasileiros
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 bg-green-700 text-white">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Números que impressionam</h2>
            <p className="text-xl text-green-100">Milhares de empresas já confiam em nossa solução</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">10k+</div>
              <div className="text-green-100">Empresas ativas</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">1M+</div>
              <div className="text-green-100">Lançamentos processados</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">99.9%</div>
              <div className="text-green-100">Uptime garantido</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">24/7</div>
              <div className="text-green-100">Suporte disponível</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">O que nossos clientes dizem</h2>
            <p className="text-xl text-gray-600">Depoimentos reais de quem já transformou sua gestão financeira</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-6 italic">
                  "Revolucionou nossa contabilidade. Relatórios que antes levavam horas, agora ficam prontos em
                  minutos."
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-green-700 font-bold">MR</span>
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">Maria Rodrigues</div>
                    <div className="text-gray-500">Contadora, Escritório MR</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-6 italic">
                  "Interface intuitiva e suporte excepcional. Migrar para o ContábilPro foi a melhor decisão."
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-green-700 font-bold">JS</span>
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">João Silva</div>
                    <div className="text-gray-500">CEO, TechStart</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-6 italic">
                  "Controle total do fluxo de caixa e relatórios precisos. Recomendo para qualquer empresa."
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-green-700 font-bold">AC</span>
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">Ana Costa</div>
                    <div className="text-gray-500">Diretora Financeira, Inovacorp</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="precos" className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Planos que se adaptam ao seu negócio</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Escolha o plano ideal para sua empresa e comece a transformar sua gestão financeira hoje mesmo
            </p>
          </div>

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

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-green-700 to-green-800 text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold mb-6">Pronto para transformar sua contabilidade?</h2>
          <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
            Junte-se a milhares de empresas que já otimizaram sua gestão financeira com nossa plataforma
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
          <p className="text-sm text-green-200 mt-6">
            Teste gratuito por 30 dias • Sem compromisso • Cancele quando quiser
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Calculator className="h-6 w-6 text-green-400" />
                <span className="text-xl font-bold">ContábilPro</span>
              </div>
              <p className="text-gray-400 leading-relaxed">
                A solução completa para gestão financeira e contábil da sua empresa.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Produto</h4>
              <ul className="space-y-2 text-gray-400">
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
                  <Link href="#" className="hover:text-white transition-colors">
                    Integrações
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    API
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Suporte</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Central de Ajuda
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Documentação
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Contato
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Status
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Empresa</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Sobre
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Carreiras
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Privacidade
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 ContábilPro. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
