"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
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
import { PlanoContasPagination } from "./plano-contas-pagination"

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

// Função para construir árvore hierárquica
function buildTree(flatList: ContaNode[]): ContaNode[] {
  console.log("Construindo árvore com dados:", flatList.length, "itens")
  const nodesById: { [id: string]: ContaNode } = {}
  const tree: ContaNode[] = []
  
  // Cria os nós com array de filhos vazio
  flatList.forEach((node) => {
    nodesById[node.id] = { ...node, children: [] }
  })
  
  // Constrói a árvore
  flatList.forEach((node) => {
    if (node.conta_pai_id && nodesById[node.conta_pai_id]) {
      nodesById[node.conta_pai_id].children!.push(nodesById[node.id])
    } else {
      tree.push(nodesById[node.id])
    }
  })
  
  const sortTreeByCode = (tree: ContaNode[]): ContaNode[] => {
    return tree
      .sort((a, b) => a.codigo.localeCompare(b.codigo))
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
  console.log("Árvore final:", sortedTree.length, "nós raiz")
  return sortedTree
}

export function PlanoContasTree({ onAdicionarSubconta, onEditar, onExcluir, onToggleAtivo, refresh, filtroCard }: PlanoContasTreeProps) {
  const { userData } = useAuth()
  const [contas, setContas] = useState<ContaNode[]>([])
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(false)
  
  // Estados de paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)
  const [totalItems, setTotalItems] = useState(0)

  const fetchContas = async () => {
    if (!userData?.empresa_id) return
    
    try {
      setLoading(true)
      
      // Buscar TODAS as contas para construir a árvore corretamente
      // A paginação será aplicada depois na visualização
      const { data, error } = await supabase
        .from('plano_contas')
        .select('*')
        .eq('empresa_id', userData.empresa_id)
        .order('codigo')

      if (error) {
        console.error('Erro ao buscar contas:', error)
        return
      }

      if (data) {
        console.log('Dados recebidos do Supabase:', data.length, 'contas')
        const tree = buildTree(data)
        setContas(tree)
        // O total será calculado após aplicar os filtros
      }
    } catch (error) {
      console.error('Erro na busca de contas:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContas()
  }, [refresh])

  // Handlers de paginação
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items)
    setCurrentPage(1) // Resetar para primeira página
  }

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

      // Aplica filtro baseado no tipo
      switch (filtro) {
        case 'ativo':
          includeNode = node.tipo.toLowerCase() === 'ativo'
          break
        case 'passivo':
          includeNode = node.tipo.toLowerCase() === 'passivo'
          break
        case 'receita':
          includeNode = node.tipo.toLowerCase() === 'receita'
          break
        case 'despesa':
          includeNode = node.tipo.toLowerCase() === 'despesa'
          break
        case 'patrimonio':
          includeNode = node.tipo.toLowerCase() === 'patrimônio liquido' || node.tipo.toLowerCase() === 'patrimonio liquido'
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

  // Função para achatar a árvore em uma lista para paginação
  const flattenTreeForPagination = (nodes: ContaNode[]): ContaNode[] => {
    const result: ContaNode[] = []
    
    const traverse = (nodes: ContaNode[], level: number = 0) => {
      for (const node of nodes) {
        result.push({ ...node, nivel: level.toString() })
        if (node.children && node.children.length > 0) {
          traverse(node.children, level + 1)
        }
      }
    }
    
    traverse(nodes)
    return result
  }

  // Aplica ambos os filtros
  let contasFiltradas = filterContasByCard(contas, filtroCard || '')
  contasFiltradas = filterContas(contasFiltradas, searchTerm)
  
  // Achata a árvore filtrada para paginação
  const contasAchatadas = flattenTreeForPagination(contasFiltradas)
  
  // Calcula paginação
  const totalItemsFiltrados = contasAchatadas.length
  const totalPages = Math.ceil(totalItemsFiltrados / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const contasPaginadas = contasAchatadas.slice(startIndex, endIndex)
  
  // Reconstrói a estrutura hierárquica apenas para os itens da página atual
  const buildPageTree = (flatItems: ContaNode[]): ContaNode[] => {
    const itemsById: { [id: string]: ContaNode } = {}
    const tree: ContaNode[] = []
    
    // Cria mapa de itens com children vazios
    flatItems.forEach(item => {
      itemsById[item.id] = { ...item, children: [] }
    })
    
    // Constrói árvore apenas com itens da página
    flatItems.forEach(item => {
      if (item.conta_pai_id && itemsById[item.conta_pai_id]) {
        itemsById[item.conta_pai_id].children!.push(itemsById[item.id])
      } else {
        tree.push(itemsById[item.id])
      }
    })
    
    return tree
  }
  
  const contasParaRenderizar = buildPageTree(contasPaginadas)
  
  // Atualiza total de itens para paginação
  useEffect(() => {
    setTotalItems(totalItemsFiltrados)
  }, [totalItemsFiltrados])

  const getBadgeColor = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case 'ativo':
        return 'bg-green-100 text-green-800'
      case 'passivo':
        return 'bg-red-100 text-red-800'
      case 'receita':
        return 'bg-blue-100 text-blue-800'
      case 'despesa':
        return 'bg-orange-100 text-orange-800'
      case 'patrimônio liquido':
      case 'patrimonio liquido':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const renderNode = (node: ContaNode, depth: number = 0) => {
    const hasChildren = node.children && node.children.length > 0
    const isExpanded = expandedNodes.has(node.id)
    const paddingLeft = depth * 24

    return (
      <div key={node.id} className="border-b border-gray-100 last:border-b-0">
        <div
          className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
          style={{ paddingLeft: `${paddingLeft + 12}px` }}
        >
          <div className="flex items-center space-x-3 flex-1">
            {hasChildren ? (
              <button
                onClick={() => toggleNode(node.id)}
                className="p-1 hover:bg-gray-200 rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            ) : (
              <div className="w-6" />
            )}
            
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <span className="font-mono text-sm font-medium text-gray-900">
                  {node.codigo}
                </span>
                <Badge variant="secondary" className={getBadgeColor(node.tipo)}>
                  {node.tipo}
                </Badge>
                {!node.ativo && (
                  <Badge variant="outline" className="text-red-600 border-red-200">
                    Inativo
                  </Badge>
                )}
              </div>
              <div className="text-sm text-gray-900 font-medium">{node.nome}</div>
              {node.descricao && (
                <div className="text-xs text-gray-500 mt-1">{node.descricao}</div>
              )}
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onAdicionarSubconta && (
                <DropdownMenuItem onClick={() => onAdicionarSubconta(node)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Subconta
                </DropdownMenuItem>
              )}
              {onEditar && (
                <DropdownMenuItem onClick={() => onEditar(node)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
              )}
              {onToggleAtivo && (
                <DropdownMenuItem onClick={() => onToggleAtivo(node)}>
                  {node.ativo ? 'Desativar' : 'Ativar'}
                </DropdownMenuItem>
              )}
              {onExcluir && (
                <DropdownMenuItem 
                  onClick={() => onExcluir(node)}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {hasChildren && isExpanded && (
          <div>
            {node.children!.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Árvore do Plano de Contas</CardTitle>
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
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
          {loading ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <span className="text-gray-600 mt-2">Carregando contas...</span>
            </div>
          ) : contasParaRenderizar.length > 0 ? (
            contasParaRenderizar.map((node) => renderNode(node))
          ) : (
            <div className="p-8 text-center">
              <div className="text-gray-500 text-lg mb-2">
                {searchTerm || filtroCard ? "Nenhuma conta encontrada" : "Nenhuma conta cadastrada"}
              </div>
              {!searchTerm && !filtroCard && (
                <div className="text-gray-400 mb-4">
                  Comece criando as primeiras contas do seu plano de contas
                </div>
              )}
              {!searchTerm && !filtroCard && onAdicionarSubconta && (
                <Button 
                  onClick={() => onAdicionarSubconta({} as ContaNode)}
                  className="mt-2"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeira Conta
                </Button>
              )}
            </div>
          )}
        </div>
        
        {/* Paginação */}
        {totalItemsFiltrados > 0 && (
          <PlanoContasPagination
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            totalItems={totalItemsFiltrados}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
            loading={loading}
          />
        )}
      </CardContent>
    </Card>
  )
}
