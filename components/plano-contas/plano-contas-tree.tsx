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
  ativo: boolean
  conta_pai_id?: string | null
  children?: ContaNode[]
}

interface PlanoContasTreeProps {
  onAdicionarSubconta?: (node: ContaNode) => void
  onEditar?: (node: ContaNode) => void
  onExcluir?: (node: ContaNode) => void
  onToggleAtivo?: (node: ContaNode) => void
  refresh?: number
  filtroCard?: string
}
// Busca dados reais do Supabase
function buildTree(flatList: ContaNode[]): ContaNode[] {
  console.log("Construindo árvore com dados:", flatList.length, "itens")
  const nodesById: { [id: string]: ContaNode } = {}
  const tree: ContaNode[] = []
  
  // Cria os nós com array de filhos vazio
  flatList.forEach((node) => {
    nodesById[node.id] = { ...node, children: [] }
  })
  
  // Constrói a hierarquia
  flatList.forEach((node) => {
    if (node.conta_pai_id && nodesById[node.conta_pai_id]) {
      nodesById[node.conta_pai_id].children!.push(nodesById[node.id])
      console.log(`Adicionando ${node.codigo} como filho de ${nodesById[node.conta_pai_id].codigo}`)
    } else {
      tree.push(nodesById[node.id])
      console.log(`Adicionando ${node.codigo} como nó raiz`)
    }
  })
  
  // Ordena recursivamente por código
  function sortTreeByCode(nodes: ContaNode[]): ContaNode[] {
    return nodes
      .sort((a, b) => a.codigo.localeCompare(b.codigo, undefined, { numeric: true }))
      .map(node => {
        const sortedNode = {
          ...node,
          children: node.children ? sortTreeByCode(node.children) : []
        }
        if (sortedNode.children && sortedNode.children.length > 0) {
          console.log(`Conta ${sortedNode.codigo} tem ${sortedNode.children.length} filhos:`, sortedNode.children.map(c => c.codigo))
        }
        return sortedNode
      })
  }
  
  const sortedTree = sortTreeByCode(tree)
  console.log("Árvore final ordenada:", sortedTree)
  return sortedTree
}

export function PlanoContasTree({ onAdicionarSubconta, onEditar, onExcluir, onToggleAtivo, refresh, filtroCard }: PlanoContasTreeProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedNodes, setExpandedNodes] = useState(new Set())
  const [contas, setContas] = useState<ContaNode[]>([])

  useEffect(() => {
    async function fetchContas() {
      const { data, error } = await supabase
        .from("plano_contas")
        .select("*")
        .order("codigo", { ascending: true })
      if (!error && data) {
        console.log("Dados brutos do Supabase:", data)
        const tree = buildTree(data)
        console.log("Árvore construída:", tree)
        setContas(tree)
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

  // Função para filtrar contas baseado no termo de busca
  const filterContas = (nodes: ContaNode[], searchTerm: string): ContaNode[] => {
    if (!searchTerm.trim()) {
      return nodes
    }

    const filteredNodes: ContaNode[] = []

    for (const node of nodes) {
      // Verifica se o nó atual corresponde ao termo de busca
      const matchesSearch = 
        node.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.natureza.toLowerCase().includes(searchTerm.toLowerCase())

      // Filtra os filhos recursivamente
      const filteredChildren = node.children ? filterContas(node.children, searchTerm) : []

      // Inclui o nó se ele ou seus filhos correspondem ao termo de busca
      if (matchesSearch || filteredChildren.length > 0) {
        filteredNodes.push({
          ...node,
          children: filteredChildren
        })
      }
    }

    return filteredNodes
  }

  // Função para filtrar contas baseado no filtro do card
  const filterContasByCard = (nodes: ContaNode[], filtro: string): ContaNode[] => {
    if (!filtro || filtro === 'todas') {
      return nodes
    }

    const filteredNodes: ContaNode[] = []

    for (const node of nodes) {
      let includeNode = false

      // Aplica o filtro baseado no tipo de card clicado
      switch (filtro) {
        case 'ativas':
          includeNode = node.ativo === true
          break
        case 'inativas':
          includeNode = node.ativo === false
          break
        case 'grupos':
          includeNode = parseInt(node.nivel) === 1
          break
        default:
          includeNode = true
      }

      // Filtra os filhos recursivamente
      const filteredChildren = node.children ? filterContasByCard(node.children, filtro) : []

      // Inclui o nó se ele corresponde ao filtro ou tem filhos que correspondem
      if (includeNode || filteredChildren.length > 0) {
        filteredNodes.push({
          ...node,
          children: filteredChildren
        })
      }
    }

    return filteredNodes
  }

  // Aplica ambos os filtros: primeiro o filtro do card, depois o termo de busca
  let contasFiltradas = filterContasByCard(contas, filtroCard || '')
  contasFiltradas = filterContas(contasFiltradas, searchTerm)

  // Efeito para expandir nós quando há busca (separado da função de filtro)
  useEffect(() => {
    if (searchTerm.trim()) {
      const expandAll = (nodes: ContaNode[]) => {
        const nodeIds: string[] = []
        const traverse = (nodeList: ContaNode[]) => {
          nodeList.forEach(node => {
            if (node.children && node.children.length > 0) {
              nodeIds.push(node.id)
              traverse(node.children)
            }
          })
        }
        traverse(nodes)
        return nodeIds
      }
      
      const nodesToExpand = expandAll(contasFiltradas)
      setExpandedNodes(new Set(nodesToExpand))
    }
  }, [searchTerm, contas])

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

  const renderNode = (node: ContaNode, depth: number = 0): React.ReactNode => {
    const hasChildren = node.children && node.children.length > 0
    const isExpanded = expandedNodes.has(node.id)
    const paddingLeft = depth * 24
    
    // Conta analítica é nível 5, todas as outras são sintéticas
    const isContaAnalitica = parseInt(node.nivel) === 5

    // Debug para verificar se as contas têm filhos
    if (hasChildren) {
      console.log(`Conta ${node.codigo} tem ${node.children?.length} filhos, isExpanded: ${isExpanded}`)
    }

    const handleRowClick = () => {
      if (hasChildren) {
        console.log(`Clicou na conta ${node.codigo} - ${node.nome}`)
        toggleNode(node.id)
      }
    }

    return (
      <div key={node.id}>
        <div
          className={`flex items-center justify-between p-2 border-b border-gray-100 ${
            hasChildren 
              ? 'cursor-pointer hover:bg-blue-50 hover:border-blue-200' 
              : 'hover:bg-gray-50'
          }`}
          style={{ paddingLeft: `${paddingLeft + 8}px` }}
          onClick={handleRowClick}
        >
          <div className="flex items-center space-x-2 flex-1">
            {hasChildren ? (
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-0 h-6 w-6" 
                onClick={(e) => {
                  e.stopPropagation(); // Evita duplo clique
                  toggleNode(node.id);
                }}
              >
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            ) : (
              <div className="w-6" />
            )}

            <div className="flex items-center space-x-3 flex-1">
              {!isContaAnalitica ? (
                <b 
                  className="text-sm text-gray-700"
                  style={{ 
                    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                    display: 'inline-block'
                  }}
                >
                  {node.codigo}
                </b>
              ) : (
                <span 
                  className="text-sm text-gray-700"
                  style={{ 
                    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                    display: 'inline-block'
                  }}
                >
                  {node.codigo}
                </span>
              )}
              
              {!isContaAnalitica ? (
                <b className="text-sm text-gray-900">
                  {node.nome}
                </b>
              ) : (
                <span className="text-sm text-gray-900">
                  {node.nome}
                </span>
              )}
              
              {getTipoBadge(node.tipo)}
              <Badge variant={node.natureza === "devedora" ? "default" : "secondary"} className="text-xs">
                {node.natureza === "devedora" ? "D" : "C"}
              </Badge>
              {!node.ativo && <Badge variant="destructive">Inativa</Badge>}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="h-8 w-8 p-0"
                onClick={(e) => e.stopPropagation()} // Evita propagar o clique
              >
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
              <DropdownMenuItem onClick={() => onToggleAtivo?.(node)}>
                {node.ativo ? (
                  <>
                    <span className="mr-2 h-4 w-4 text-red-600">×</span>
                    Desativar
                  </>
                ) : (
                  <>
                    <span className="mr-2 h-4 w-4 text-green-600">✓</span>
                    Ativar
                  </>
                )}
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
              placeholder="Buscar por código, nome, tipo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-8"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-96 overflow-y-auto">
          {contasFiltradas.length > 0 ? (
            contasFiltradas.map((node) => renderNode(node))
          ) : (
            <div className="p-4 text-center text-gray-500">
              {searchTerm ? "Nenhuma conta encontrada" : "Carregando..."}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
