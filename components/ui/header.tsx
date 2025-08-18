"use client"
import React from "react"
import Link from "next/link"
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
import { toast } from "sonner"

export default function Header() {
  const router = useRouter()
  const handleLogout = () => {
    router.push("/login")
  }
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo e Navegação */}
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">SC</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">Sistema Contábil</h1>
            </div>
            <nav className="hidden md:flex space-x-6">
              <Link href="/" className="text-blue-600 font-medium">Dashboard</Link>
              <Link href="/lancamentos" className="text-gray-600 hover:text-gray-900">Lançamentos</Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-gray-600 hover:text-gray-900 p-0 h-auto font-normal">
                    Cadastros
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem asChild><Link href="/contas" className="w-full">Contas</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link href="/plano-contas" className="w-full">Plano de Contas</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link href="/centro-custos" className="w-full">Centro de Custos</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link href="/bancos" className="w-full">Bancos</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link href="/clientes-fornecedores" className="w-full">Clientes/Fornecedores</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link href="/formas-pagamento" className="w-full">Formas de Pagamento</Link></DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-gray-600 hover:text-gray-900 p-0 h-auto font-normal">
                    Relatórios
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem asChild><Link href="/relatorios" className="w-full">Relatórios Contábeis</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link href="/fluxo-caixa" className="w-full">Fluxo de Caixa</Link></DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>
          </div>
          {/* Ações do usuário */}
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon">
              <Bell className="w-5 h-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link href="/minha-conta" className="w-full"><User className="w-4 h-4 mr-2" />Configurações da Conta</Link></DropdownMenuItem>
                <DropdownMenuItem><Settings className="w-4 h-4 mr-2" />Configurações</DropdownMenuItem>
                <DropdownMenuItem asChild><Link href="/empresa" className="w-full"><Settings className="w-4 h-4 mr-2" />Dados da Empresa</Link></DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link href="/usuarios" className="w-full"><Users className="w-4 h-4 mr-2" />Gestão de Usuários</Link></DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600"><LogOut className="w-4 h-4 mr-2" />Sair do Sistema</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}
