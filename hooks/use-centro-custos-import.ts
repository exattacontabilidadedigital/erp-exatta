import { useState, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/components/ui/use-toast'
import { supabase } from '@/lib/supabase/client'

interface CentroCustoImportData {
  codigo: string
  nome: string
  tipo: string
  responsavel?: string
  departamento?: string
  orcamento_mensal?: number
  status?: string
  conta_pai_codigo?: string
}

interface ImportProgress {
  total: number
  processed: number
  errors: number
  success: number
}

export function useCentroCustosImport() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isImporting, setIsImporting] = useState(false)
  const [progress, setProgress] = useState<ImportProgress>({
    total: 0,
    processed: 0,
    errors: 0,
    success: 0
  })
  const [errors, setErrors] = useState<string[]>([])

  const validateCentroCusto = useCallback((item: any, index: number): CentroCustoImportData | null => {
    const errors: string[] = []

    if (!item.codigo || typeof item.codigo !== 'string') {
      errors.push(`Linha ${index + 2}: Código é obrigatório`)
    }

    if (!item.nome || typeof item.nome !== 'string') {
      errors.push(`Linha ${index + 2}: Nome é obrigatório`)
    }

    if (!item.tipo || !['RECEITA', 'DESPESA', 'ATIVO', 'PASSIVO', 'PATRIMONIO'].includes(item.tipo)) {
      errors.push(`Linha ${index + 2}: Tipo deve ser RECEITA, DESPESA, ATIVO, PASSIVO ou PATRIMONIO`)
    }

    if (errors.length > 0) {
      setErrors(prev => [...prev, ...errors])
      return null
    }

    return {
      codigo: item.codigo.toString().trim(),
      nome: item.nome.toString().trim(),
      tipo: item.tipo.toString().trim().toUpperCase(),
      responsavel: item.responsavel?.toString().trim() || null,
      departamento: item.departamento?.toString().trim() || null,
      orcamento_mensal: item.orcamento_mensal ? parseFloat(item.orcamento_mensal) : null,
      status: item.status?.toString().trim() || 'ATIVO',
      conta_pai_codigo: item.conta_pai_codigo?.toString().trim() || null
    }
  }, [])

  const importCentroCustos = useCallback(async (data: any[]) => {
    if (!user?.user_metadata?.empresa_id) {
      toast({
        title: "Erro",
        description: "Empresa não identificada",
        variant: "destructive"
      })
      return false
    }

    setIsImporting(true)
    setProgress({ total: data.length, processed: 0, errors: 0, success: 0 })
    setErrors([])

    try {
      const validItems: CentroCustoImportData[] = []
      
      // Validação dos dados
      for (let i = 0; i < data.length; i++) {
        const validItem = validateCentroCusto(data[i], i)
        if (validItem) {
          validItems.push(validItem)
        }
        
        setProgress(prev => ({
          ...prev,
          processed: i + 1,
          errors: prev.errors + (validItem ? 0 : 1)
        }))
      }

      if (validItems.length === 0) {
        toast({
          title: "Erro",
          description: "Nenhum centro de custo válido encontrado",
          variant: "destructive"
        })
        return false
      }

      // Inserção no banco
      const itemsToInsert = validItems.map(item => ({
        ...item,
        empresa_id: user.user_metadata.empresa_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))

      const { data: insertedData, error } = await supabase
        .from('centro_custos')
        .insert(itemsToInsert)
        .select()

      if (error) {
        console.error('Erro ao inserir centros de custo:', error)
        toast({
          title: "Erro",
          description: "Erro ao importar centros de custo: " + error.message,
          variant: "destructive"
        })
        return false
      }

      setProgress(prev => ({
        ...prev,
        success: insertedData?.length || validItems.length
      }))

      toast({
        title: "Sucesso",
        description: `${validItems.length} centros de custo importados com sucesso`,
      })

      return true

    } catch (error) {
      console.error('Erro durante importação:', error)
      toast({
        title: "Erro",
        description: "Erro inesperado durante a importação",
        variant: "destructive"
      })
      return false
    } finally {
      setIsImporting(false)
    }
  }, [user, toast, validateCentroCusto])

  const downloadTemplate = useCallback(() => {
    const headers = [
      'codigo',
      'nome', 
      'tipo',
      'responsavel',
      'departamento',
      'orcamento_mensal',
      'status',
      'conta_pai_codigo'
    ]

    const csvContent = [
      headers.join(','),
      '001,Centro de Custo Exemplo,DESPESA,João Silva,Administrativo,5000.00,ATIVO,',
      '002,Departamento Vendas,DESPESA,Maria Santos,Comercial,3000.00,ATIVO,001'
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', 'modelo_centro_custos.csv')
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }, [])

  return {
    isImporting,
    progress,
    errors,
    importCentroCustos,
    downloadTemplate
  }
}
