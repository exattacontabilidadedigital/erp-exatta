"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus, Users, Settings } from "lucide-react"
import Link from "next/link"

interface UsuariosHeaderProps {
  onNovoUsuario: () => void
  onConfigurarFuncoes: () => void
}

export function UsuariosHeader({ onNovoUsuario, onConfigurarFuncoes }: UsuariosHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Link>
        <div className="flex items-center space-x-2">
          <Users className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Usuários</h1>
          <Button variant="ghost" onClick={onConfigurarFuncoes} className="ml-2">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <Button onClick={onNovoUsuario} className="bg-blue-600 hover:bg-blue-700">
        <Plus className="h-4 w-4 mr-2" />
        Novo Usuário
      </Button>
    </div>
  )
}
