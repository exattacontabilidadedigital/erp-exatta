"use client"
import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Bell, ChevronDown, User, Settings, Users, LogOut } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

// Componente para link de navegação com estado ativo
function NavLink({ href, children, className = "" }: { href: string; children: React.ReactNode; className?: string }) {
  const pathname = usePathname()
  const isActive = pathname === href
  
  return (
    <Link 
      href={href} 
      className={`
        transition-all duration-200 font-medium relative
        ${isActive 
          ? 'text-blue-600 bg-blue-50 px-3 py-2 rounded-md' 
          : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50 px-3 py-2 rounded-md'
        }
        ${className}
      `}
    >
      {children}
      {isActive && (
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-2 h-0.5 bg-blue-600 rounded-full"></div>
      )}
    </Link>
  )
}

// Componente para dropdown de navegação com estado ativo
function NavDropdown({ 
  trigger, 
  routes, 
  children 
}: { 
  trigger: string; 
  routes: string[]; 
  children: React.ReactNode; 
}) {
  const pathname = usePathname()
  const isActive = pathname ? routes.some(route => pathname.startsWith(route)) : false
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className={`
            p-3 h-auto font-medium transition-all duration-200 relative
            ${isActive 
              ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' 
              : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
            }
          `}
        >
          {trigger}
          <ChevronDown className="w-4 h-4 ml-1" />
          {isActive && (
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-2 h-0.5 bg-blue-600 rounded-full"></div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[200px]">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Componente para item do dropdown com estado ativo
function DropdownNavItem({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname()
  const isActive = pathname === href
  
  return (
    <DropdownMenuItem asChild>
      <Link 
        href={href} 
        className={`
          w-full transition-all duration-200 relative
          ${isActive 
            ? 'bg-blue-50 text-blue-600 font-medium border-l-2 border-blue-600' 
            : 'hover:bg-gray-50'
          }
        `}
      >
        {children}
      </Link>
    </DropdownMenuItem>
  )
}

export default function Header() {
  const router = useRouter()
  const { toast } = useToast()
  
  const handleLogout = () => {
    toast({
      title: "Saindo do sistema",
      description: "Redirecionando para login...",
    })
    router.push("/login")
  }
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo e Navegação */}
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity duration-200">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">SC</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">Sistema Contábil</h1>
            </Link>
            <nav className="hidden md:flex space-x-2">
              <NavLink href="/">Dashboard</NavLink>
              <NavDropdown 
                trigger="Financeiro" 
                routes={['/lancamentos', '/financial/import']}
              >
                <DropdownNavItem href="/lancamentos">Lançamentos</DropdownNavItem>
                <DropdownNavItem href="/financial/import">Importar Lançamentos</DropdownNavItem>
              </NavDropdown>
              <NavDropdown 
                trigger="Cadastros" 
                routes={['/contas', '/plano-contas', '/centro-custos', '/bancos', '/clientes-fornecedores', '/formas-pagamento']}
              >
                <DropdownNavItem href="/contas">Contas</DropdownNavItem>
                <DropdownNavItem href="/plano-contas">Plano de Contas</DropdownNavItem>
                <DropdownNavItem href="/centro-custos">Centro de Custos</DropdownNavItem>
                <DropdownNavItem href="/bancos">Bancos</DropdownNavItem>
                <DropdownNavItem href="/clientes-fornecedores">Clientes/Fornecedores</DropdownNavItem>
                <DropdownNavItem href="/formas-pagamento">Formas de Pagamento</DropdownNavItem>
              </NavDropdown>
              <NavDropdown 
                trigger="Relatórios" 
                routes={['/relatorios', '/fluxo-caixa']}
              >
                <DropdownNavItem href="/relatorios">Relatórios Contábeis</DropdownNavItem>
                <DropdownNavItem href="/fluxo-caixa">Fluxo de Caixa</DropdownNavItem>
              </NavDropdown>
            </nav>
          </div>
          {/* Ações do usuário */}
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="icon"
              className="hover:bg-gray-100 transition-colors duration-200"
            >
              <Bell className="w-5 h-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="hover:bg-gray-100 transition-colors duration-200"
                >
                  <User className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[220px]">
                <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/minha-conta" className="w-full hover:bg-gray-50 transition-colors">
                    <User className="w-4 h-4 mr-2" />
                    Configurações da Conta
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-gray-50 transition-colors">
                  <Settings className="w-4 h-4 mr-2" />
                  Configurações
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/empresa" className="w-full hover:bg-gray-50 transition-colors">
                    <Settings className="w-4 h-4 mr-2" />
                    Dados da Empresa
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/usuarios" className="w-full hover:bg-gray-50 transition-colors">
                    <Users className="w-4 h-4 mr-2" />
                    Gestão de Usuários
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleLogout} 
                  className="text-red-600 focus:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair do Sistema
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}
