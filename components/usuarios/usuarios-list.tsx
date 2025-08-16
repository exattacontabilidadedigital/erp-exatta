"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, Trash2, Shield, User, CheckCircle, XCircle } from "lucide-react"

interface UsuariosListProps {
  onEditarUsuario: (usuario: any) => void
  onExcluirUsuario: (usuario: any) => void
}

export function UsuariosList({ onEditarUsuario, onExcluirUsuario }: UsuariosListProps) {
  const usuarios = [
    {
      id: 1,
      nome: "João Silva",
      email: "joao.silva@empresa.com.br",
      role: "admin",
      status: "ativo",
      ultimoAcesso: "2024-01-15 14:30",
      permissoes: [
        "dashboard",
        "lancamentos",
        "contas",
        "plano-contas",
        "centro-custos",
        "relatorios",
        "usuarios",
        "configuracoes",
      ],
    },
    {
      id: 2,
      nome: "Maria Santos",
      email: "maria.santos@empresa.com.br",
      role: "contador",
      status: "ativo",
      ultimoAcesso: "2024-01-15 09:15",
      permissoes: ["dashboard", "lancamentos", "contas", "plano-contas", "centro-custos", "relatorios"],
    },
    {
      id: 3,
      nome: "Pedro Costa",
      email: "pedro.costa@empresa.com.br",
      role: "usuario",
      status: "inativo",
      ultimoAcesso: "2024-01-10 16:45",
      permissoes: ["dashboard", "lancamentos", "relatorios"],
    },
    {
      id: 4,
      nome: "Ana Oliveira",
      email: "ana.oliveira@empresa.com.br",
      role: "auditor",
      status: "ativo",
      ultimoAcesso: "2024-01-15 11:20",
      permissoes: ["dashboard", "relatorios", "contas", "plano-contas"],
    },
  ]

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      admin: { label: "Administrador", color: "bg-red-100 text-red-800" },
      contador: { label: "Contador", color: "bg-blue-100 text-blue-800" },
      usuario: { label: "Usuário", color: "bg-gray-100 text-gray-800" },
      auditor: { label: "Auditor", color: "bg-purple-100 text-purple-800" },
    }

    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.usuario
    return <Badge className={config.color}>{config.label}</Badge>
  }

  const getStatusBadge = (status: string) => {
    return status === "ativo" ? (
      <Badge className="bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        Ativo
      </Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800">
        <XCircle className="w-3 h-3 mr-1" />
        Inativo
      </Badge>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <User className="w-5 h-5 mr-2" />
          Usuários do Sistema
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {usuarios.map((usuario) => (
            <div key={usuario.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{usuario.nome}</h3>
                  <p className="text-sm text-gray-500">{usuario.email}</p>
                  <p className="text-xs text-gray-400">Último acesso: {usuario.ultimoAcesso}</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {getRoleBadge(usuario.role)}
                {getStatusBadge(usuario.status)}

                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500">{usuario.permissoes.length} permissões</span>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEditarUsuario(usuario)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onExcluirUsuario(usuario)} className="text-red-600">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
