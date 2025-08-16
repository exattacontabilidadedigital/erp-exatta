"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { Plus, Edit, Trash2, MoreHorizontal, ChevronDown, ChevronRight, Search } from "lucide-react"

type ContaNode = {
  id: string
  codigo: string
  nome: string
  tipo: string
  natureza: string
  nivel: string
  descricao?: string
  ativa: boolean
  contaPai?: string | null
  children?: ContaNode[]
}

interface PlanoContasTreeProps {
  onAdicionarSubconta?: (node: ContaNode) => void
  onEditar?: (node: ContaNode) => void
  onExcluir?: (node: ContaNode) => void
  refresh?: number
}
// Busca dados reais do Supabase
function buildTree(flatList: ContaNode[]): ContaNode[] {
  const nodesById: { [id: string]: ContaNode } = {}
  const tree: ContaNode[] = []
  flatList.forEach((node) => {
    nodesById[node.id] = { ...node, children: [] }
  })
  flatList.forEach((node) => {
    if (node.contaPai && nodesById[node.contaPai]) {
      nodesById[node.contaPai].children!.push(nodesById[node.id])
    } else {
      tree.push(nodesById[node.id])
    }
  })
  return tree
}

export function PlanoContasTree({ onAdicionarSubconta, onEditar, onExcluir, refresh }: PlanoContasTreeProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedNodes, setExpandedNodes] = useState(new Set())
  const [contas, setContas] = useState<ContaNode[]>([])

  useEffect(() => {
    async function fetchContas() {
      const { data, error } = await supabase.from("plano_contas").select("*")
      if (!error && data) {
        setContas(buildTree(data))
      }
    }
    fetchContas()
  }, [refresh])

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes)
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId)
    } else {
      newExpanded.add(nodeId)
    }
    setExpandedNodes(newExpanded)
  }

  const getTipoBadge = (tipo: string) => {
    const badges = {
      ativo: { label: "Ativo", className: "bg-blue-100 text-blue-800" },
      passivo: { label: "Passivo", className: "bg-red-100 text-red-800" },
      patrimonio: { label: "PL", className: "bg-green-100 text-green-800" },
      receita: { label: "Receita", className: "bg-purple-100 text-purple-800" },
      despesa: { label: "Despesa", className: "bg-orange-100 text-orange-800" },
    }
    const badge = badges[tipo as keyof typeof badges]
    return <Badge className={badge.className}>{badge.label}</Badge>
  }

  const renderNode = (node: ContaNode, depth = 0) => {
    const hasChildren = node.children && node.children.length > 0
    const isExpanded = expandedNodes.has(node.id)
    const paddingLeft = depth * 24

    return (
      <div key={node.id}>
        <div
          className="flex items-center justify-between p-2 hover:bg-gray-50 border-b border-gray-100"
          style={{ paddingLeft: `${paddingLeft + 8}px` }}
        >
          <div className="flex items-center space-x-2 flex-1">
            {hasChildren ? (
              <Button variant="ghost" size="sm" className="p-0 h-6 w-6" onClick={() => toggleNode(node.id)}>
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            ) : (
              <div className="w-6" />
            )}

            <div className="flex items-center space-x-3 flex-1">
              <span className="font-mono text-sm font-medium text-gray-700">{node.codigo}</span>
              <span className="text-sm text-gray-900">{node.nome}</span>
              {getTipoBadge(node.tipo)}
              <Badge variant={node.natureza === "devedora" ? "default" : "secondary"} className="text-xs">
                {node.natureza === "devedora" ? "D" : "C"}
              </Badge>
              {!node.ativa && <Badge variant="destructive">Inativa</Badge>}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onAdicionarSubconta?.(node)}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Subconta
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEditar?.(node)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600" onClick={() => onExcluir?.(node)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {hasChildren && isExpanded && <div>{node.children!.map((child) => renderNode(child, depth + 1))}</div>}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Estrutura do Plano de Contas</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar contas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
  <div className="max-h-96 overflow-y-auto">{contas.map((node) => renderNode(node))}</div>
      </CardContent>
    </Card>
  )
}
