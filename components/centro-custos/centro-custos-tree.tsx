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
import { Plus, Edit, Trash2, MoreHorizontal, ChevronDown, ChevronRight, Search, Eye, BarChart3, DollarSign, Ban, FileText } from "lucide-react"
import { safeQuery } from "@/lib/supabase/table-utils"

type CentroCustoNode = {
  id: string
  codigo: string
  nome: string
  tipo: string
  responsavel?: string
  departamento?: string
  orcamento_mensal?: number
  descricao?: string
  ativo: boolean
  nivel: number
  centro_pai_id?: string | null
  aceita_lancamentos?: boolean
  children?: CentroCustoNode[]
}

interface CentroCustosTreeProps {
  onAdicionarSubcentro?: (node: CentroCustoNode) => void
  onEditar?: (node: CentroCustoNode) => void
  onExcluir?: (node: CentroCustoNode) => void
  onVisualizar?: (node: CentroCustoNode) => void
  onRelatorio?: (node: CentroCustoNode) => void
  refresh?: number
  filtroCard?: string
}

// Função para construir árvore hierárquica
function buildTree(flatList: CentroCustoNode[]): CentroCustoNode[] {
  console.log("Construindo árvore de centros de custo com dados:", flatList.length, "itens")
  const nodesById: { [id: string]: CentroCustoNode } = {}
  const tree: CentroCustoNode[] = []
  
  // Cria os nós com array de filhos vazio
  flatList.forEach((node) => {
    nodesById[node.id] = { ...node, children: [] }
  })
  
  // Constrói a hierarquia
  flatList.forEach((node) => {
    if (node.centro_pai_id && nodesById[node.centro_pai_id]) {
      // Tem pai, adiciona como filho
      nodesById[node.centro_pai_id].children!.push(nodesById[node.id])
    } else {
      // Não tem pai, é raiz
      tree.push(nodesById[node.id])
    }
  })
  
  // Ordena por código em cada nível
  const sortTree = (nodes: CentroCustoNode[]) => {
    nodes.sort((a, b) => a.codigo.localeCompare(b.codigo))
    nodes.forEach(node => {
      if (node.children && node.children.length > 0) {
        sortTree(node.children)
      }
    })
  }
  
  sortTree(tree)
  console.log("Árvore construída:", tree)
  return tree
}

// Componente para renderizar um nó da árvore
function TreeNode({ 
  node, 
  depth = 0, 
  onAdicionarSubcentro, 
  onEditar, 
  onExcluir, 
  onVisualizar, 
  onRelatorio,
  gastos = {}
}: { 
  node: CentroCustoNode
  depth?: number
  onAdicionarSubcentro?: (node: CentroCustoNode) => void
  onEditar?: (node: CentroCustoNode) => void
  onExcluir?: (node: CentroCustoNode) => void
  onVisualizar?: (node: CentroCustoNode) => void
  onRelatorio?: (node: CentroCustoNode) => void
  gastos?: Record<string, number>
}) {
  const [isExpanded, setIsExpanded] = useState(depth < 2) // Expande primeiros 2 níveis por padrão
  const hasChildren = node.children && node.children.length > 0
  const gasto = gastos[node.id] || 0
  const percentualGasto = node.orcamento_mensal ? (gasto / node.orcamento_mensal) * 100 : 0

  const getTipoBadge = (tipo: string) => {
    const variants: Record<string, string> = {
      'operacional': 'bg-blue-100 text-blue-800',
      'administrativo': 'bg-gray-100 text-gray-800',
      'vendas': 'bg-green-100 text-green-800',
      'financeiro': 'bg-purple-100 text-purple-800'
    }
    return (
      <Badge className={variants[tipo] || 'bg-gray-100 text-gray-800'}>
        {tipo}
      </Badge>
    )
  }

  const getPercentualBadge = (percentual: number) => {
    if (percentual >= 90) {
      return <Badge variant="destructive">{percentual.toFixed(1)}%</Badge>
    }
    if (percentual >= 70) {
      return <Badge className="bg-yellow-500 text-black">{percentual.toFixed(1)}%</Badge>
    }
    return <Badge className="bg-green-500 text-white">{percentual.toFixed(1)}%</Badge>
  }

  const handleRowClick = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div className="select-none">
      <div 
        className={`flex items-center py-2 px-3 rounded-lg border-b ${
          !node.ativo ? 'opacity-50' : ''
        } ${
          hasChildren 
            ? 'cursor-pointer hover:bg-blue-50 hover:border-blue-200' 
            : 'hover:bg-gray-50'
        }`}
        style={{ paddingLeft: `${depth * 24 + 12}px` }}
        onClick={handleRowClick}
      >
        {/* Expansor/Contraer */}
        <div className="w-6 h-6 flex items-center justify-center mr-2">
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation(); // Evita duplo clique
                setIsExpanded(!isExpanded);
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          ) : (
            <div className="w-4 h-4" />
          )}
        </div>

        {/* Informações do centro */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 min-w-[80px]">
              {node.codigo}
            </span>
            <span className={`truncate ${
              node.aceita_lancamentos === false 
                ? 'font-bold text-gray-800' 
                : 'font-medium'
            }`}>
              {node.nome}
            </span>
            {getTipoBadge(node.tipo)}
            {node.orcamento_mensal && gasto > 0 && getPercentualBadge(percentualGasto)}
            
            {/* Indicador de aceita lançamentos */}
            {node.aceita_lancamentos === false ? (
              <Badge variant="outline" className="text-red-600 border-red-200">
                <Ban className="w-3 h-3 mr-1" />
                Centro organizador
              </Badge>
            ) : (
              <Badge variant="outline" className="text-green-600 border-green-200">
                <FileText className="w-3 h-3 mr-1" />
                Aceita lançamentos
              </Badge>
            )}
          </div>
          {node.responsavel && (
            <div className="text-sm text-gray-500 ml-[83px] mt-1">
              Responsável: {node.responsavel}
            </div>
          )}
        </div>

        {/* Valores */}
        <div className="flex items-center gap-4 text-sm">
          {node.orcamento_mensal && (
            <div className="text-right">
              <div className="text-gray-600">Orçamento</div>
              <div className="font-medium">
                R$ {node.orcamento_mensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
          )}
          {gasto > 0 && (
            <div className="text-right">
              <div className="text-gray-600">Gasto</div>
              <div className="font-medium">
                R$ {gasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
          )}
        </div>

        {/* Menu de ações */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 ml-2"
              onClick={(e) => e.stopPropagation()} // Evita expandir/contrair ao clicar no menu
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onVisualizar?.(node)}>
              <Eye className="mr-2 h-4 w-4" />
              Visualizar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAdicionarSubcentro?.(node)}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Subcentro
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEditar?.(node)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onRelatorio?.(node)}>
              <BarChart3 className="mr-2 h-4 w-4" />
              Relatório
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onExcluir?.(node)}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Filhos */}
      {hasChildren && isExpanded && (
        <div>
          {node.children!.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              onAdicionarSubcentro={onAdicionarSubcentro}
              onEditar={onEditar}
              onExcluir={onExcluir}
              onVisualizar={onVisualizar}
              onRelatorio={onRelatorio}
              gastos={gastos}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function CentroCustosTree({ 
  onAdicionarSubcentro, 
  onEditar, 
  onExcluir, 
  onVisualizar, 
  onRelatorio, 
  refresh, 
  filtroCard 
}: CentroCustosTreeProps) {
  const [centros, setCentros] = useState<CentroCustoNode[]>([])
  const [filteredCentros, setFilteredCentros] = useState<CentroCustoNode[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [gastos, setGastos] = useState<Record<string, number>>({})

  // Busca centros de custo
  const fetchCentros = async () => {
    try {
      setLoading(true)
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return

      // Busca dados do usuário
      const { data: userProfile } = await supabase
        .from('usuarios')
        .select('empresa_id')
        .eq('id', userData.user.id)
        .single()

      if (!userProfile?.empresa_id) return

      // Busca centros de custo
      const { data, error } = await supabase
        .from('centro_custos')
        .select('*')
        .eq('empresa_id', userProfile.empresa_id)
        .order('codigo')

      if (error) {
        console.error('Erro ao buscar centros de custo:', error)
        return
      }

      if (data) {
        const tree = buildTree(data)
        setCentros(tree)
        setFilteredCentros(tree)
      }
    } catch (error) {
      console.error('Erro ao buscar centros de custo:', error)
    } finally {
      setLoading(false)
    }
  }

  // Busca gastos por centro
  const fetchGastos = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return

      const { data: userProfile } = await supabase
        .from('usuarios')
        .select('empresa_id')
        .eq('id', userData.user.id)
        .single()

      if (!userProfile?.empresa_id) return

      // Usa safeQuery para evitar erros 400 se a tabela não existir
      const { data, error } = await safeQuery(
        supabase,
        'lancamentos',
        (table) => table
          .select('centrocusto, valor')
          .eq('empresa_id', userProfile.empresa_id)
          .eq('status', 'liquidado')
      )

      if (error || !data) {
        console.log('Não foi possível carregar gastos dos centros de custo')
        return
      }

      // Busca todos os centros para fazer o mapeamento código -> ID
      const { data: centrosData } = await supabase
        .from('centro_custos')
        .select('id, codigo')
        .eq('empresa_id', userProfile.empresa_id)

      if (!centrosData) return

      // Cria mapeamento código -> ID (com correspondência flexível)
      const codigoParaId: Record<string, string> = {}
      centrosData.forEach(centro => {
        if (centro.codigo) {
          // Mapeia diretamente
          codigoParaId[centro.codigo] = centro.id
          
          // Mapeia versões alternativas para compatibilidade
          const codigo = centro.codigo.toString()
          
          // Se código tem ponto, mapeia também sem ponto: "01.1" -> "011"
          if (codigo.includes('.')) {
            const semPonto = codigo.replace(/\./g, '')
            codigoParaId[semPonto] = centro.id
          }
          
          // Se código não tem zeros à esquerda, mapeia com zeros: "1" -> "01", "001"
          if (codigo.match(/^\d+$/)) {
            const comZero = codigo.padStart(2, '0')
            const comDoisZeros = codigo.padStart(3, '0')
            codigoParaId[comZero] = centro.id
            codigoParaId[comDoisZeros] = centro.id
          }
          
          // Se código tem zeros, mapeia sem zeros: "01" -> "1"
          if (codigo.match(/^0+\d+$/)) {
            const semZeros = parseInt(codigo).toString()
            codigoParaId[semZeros] = centro.id
          }
        }
      })

      const somaPorCentro: Record<string, number> = {}
      data.forEach((lanc: any) => {
        if (lanc.centrocusto) {
          // Converte código para ID
          const centroId = codigoParaId[lanc.centrocusto]
          if (centroId) {
            if (!somaPorCentro[centroId]) somaPorCentro[centroId] = 0
            somaPorCentro[centroId] += Number(lanc.valor ?? 0)
          }
        }
      })
      setGastos(somaPorCentro)
    } catch (error) {
      console.error('Erro ao buscar gastos:', error)
    }
  }

  // Filtro de busca
  const handleSearch = (term: string) => {
    setSearchTerm(term)
    if (!term) {
      setFilteredCentros(centros)
      return
    }

    const filterTree = (nodes: CentroCustoNode[]): CentroCustoNode[] => {
      const filtered: CentroCustoNode[] = []
      
      nodes.forEach(node => {
        const matches = 
          node.nome.toLowerCase().includes(term.toLowerCase()) ||
          node.codigo.toLowerCase().includes(term.toLowerCase()) ||
          node.responsavel?.toLowerCase().includes(term.toLowerCase()) ||
          node.departamento?.toLowerCase().includes(term.toLowerCase())

        const filteredChildren = node.children ? filterTree(node.children) : []
        
        if (matches || filteredChildren.length > 0) {
          filtered.push({
            ...node,
            children: filteredChildren
          })
        }
      })
      
      return filtered
    }

    setFilteredCentros(filterTree(centros))
  }

  useEffect(() => {
    fetchCentros()
    fetchGastos()
  }, [refresh])

  useEffect(() => {
    const handleUpdate = () => {
      fetchCentros()
      fetchGastos()
    }
    
    window.addEventListener('centroCustosAtualizado', handleUpdate)
    return () => window.removeEventListener('centroCustosAtualizado', handleUpdate)
  }, [])

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Carregando centros de custo...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Estrutura de Centros de Custo</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar centros..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {filteredCentros.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? 'Nenhum centro encontrado' : 'Nenhum centro de custo cadastrado'}
            </div>
          ) : (
            filteredCentros.map((node) => (
              <TreeNode
                key={node.id}
                node={node}
                onAdicionarSubcentro={onAdicionarSubcentro}
                onEditar={onEditar}
                onExcluir={onExcluir}
                onVisualizar={onVisualizar}
                onRelatorio={onRelatorio}
                gastos={gastos}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
