"use client"

import { useState } from 'react'
import { CSVParser, type CSVParseResult } from '@/lib/csv-parser'
import { supabase } from '@/lib/supabase/client'

export interface ImportProgress {
  total: number
  processed: number
  errors: number
  percentage: number
}

export interface ImportResult {
  success: boolean
  message: string
  totalProcessed: number
  totalErrors: number
  errors: string[]
}

export function useImport() {
  const [isImporting, setIsImporting] = useState(false)
  const [progress, setProgress] = useState<ImportProgress>({
    total: 0,
    processed: 0,
    errors: 0,
    percentage: 0
  })

  const updateProgress = (processed: number, total: number, errors: number = 0) => {
    const percentage = total > 0 ? Math.round((processed / total) * 100) : 0
    setProgress({ total, processed, errors, percentage })
  }

  // Função auxiliar para determinar a natureza com base no tipo
  const getTipoNatureza = (tipo: string): string => {
    const tipoLower = tipo.toLowerCase()
    switch (tipoLower) {
      case 'ativo':
      case 'despesa':
        return 'debito'
      case 'passivo':
      case 'patrimonio':
      case 'patrimônio líquido':
      case 'receita':
        return 'credito'
      default:
        return 'debito' // padrão
    }
  }

  // Função auxiliar para normalizar tipos
  const normalizeTipo = (tipo: string): string => {
    if (!tipo) return 'ativo' // valor padrão seguro
    
    // Remove espaços extras e converte para minúsculas
    const tipoLower = tipo.toLowerCase().trim()
    
    // Remove acentos e caracteres especiais
    const tipoSemAcentos = tipoLower
      .replace(/ã/g, 'a')
      .replace(/á/g, 'a')
      .replace(/à/g, 'a')
      .replace(/â/g, 'a')
      .replace(/é/g, 'e')
      .replace(/ê/g, 'e')
      .replace(/í/g, 'i')
      .replace(/ó/g, 'o')
      .replace(/ô/g, 'o')
      .replace(/õ/g, 'o')
      .replace(/ú/g, 'u')
      .replace(/ç/g, 'c')
      .replace(/\s+/g, ' ') // normaliza espaços múltiplos
      .trim()
    
    switch (tipoSemAcentos) {
      case 'patrimonio liquido':
      case 'patrimônio líquido':
      case 'patrimonio':
        return 'patrimonio'
      case 'ativo':
        return 'ativo'
      case 'passivo':
        return 'passivo'
      case 'receita':
        return 'receita'
      case 'despesa':
        return 'despesa'
      default:
        // Força um valor válido em vez de retornar algo inválido
        return 'ativo'
    }
  }

  const importPlanoContas = async (
    file: File, 
    empresaId: string
  ): Promise<ImportResult> => {
    setIsImporting(true)
    updateProgress(0, 0)

    try {
      // Verifica se o Supabase está configurado
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        return {
          success: false,
          message: 'Configuração do Supabase não encontrada',
          totalProcessed: 0,
          totalErrors: 1,
          errors: ['Configuração do Supabase não encontrada. Verifique as variáveis de ambiente.']
        }
      }

      // Testa conectividade com o Supabase
      try {
        const { error: testError } = await supabase
          .from('plano_contas')
          .select('id')
          .limit(1)
        
        if (testError) {
          console.error('Erro de conectividade com Supabase:', testError)
          return {
            success: false,
            message: 'Erro de conectividade com o banco de dados',
            totalProcessed: 0,
            totalErrors: 1,
            errors: [`Erro de conectividade: ${testError.message}`]
          }
        }
      } catch (connectError) {
        console.error('Erro de conexão:', connectError)
        return {
          success: false,
          message: 'Erro de conexão com o banco de dados',
          totalProcessed: 0,
          totalErrors: 1,
          errors: [`Erro de conexão: ${connectError}`]
        }
      }

      // Parse do arquivo CSV - com headers automáticos
      let parseResult: CSVParseResult
      try {
        parseResult = await CSVParser.parseFile(file, {
          skipEmptyLines: true
          // Não especifica delimiter - deixa o parser detectar automaticamente
          // Não especifica headers - deixa o parser usar a primeira linha como headers
        })
      } catch (error) {
        // Se falhar, tenta com ISO-8859-1 (Latin-1)
        console.log('Tentando com encoding ISO-8859-1...')
        parseResult = await CSVParser.parseFile(file, {
          skipEmptyLines: true,
          encoding: 'iso-8859-1'
        })
      }

      if (parseResult.errors.length > 0) {
        return {
          success: false,
          message: 'Erro ao processar arquivo CSV',
          totalProcessed: 0,
          totalErrors: parseResult.errors.length,
          errors: parseResult.errors
        }
      }

      const { data: contas } = parseResult
      
      // Debug: log dos dados parseados
      console.log('Dados parseados do CSV:', contas)
      console.log('Primeira conta:', contas[0])
      console.log('Propriedades da primeira conta:', Object.keys(contas[0] || {}))
      console.log('Total de contas:', contas.length)
      
      updateProgress(0, contas.length)

      const errors: string[] = []
      let processed = 0

      // Processa as contas em lotes para melhor performance
      const batchSize = 10
      for (let i = 0; i < contas.length; i += batchSize) {
        const batch = contas.slice(i, i + batchSize)
        
        for (const conta of batch) {
          try {
            // Debug: log da conta sendo processada
            console.log('Processando conta:', conta)
            
            // Normaliza propriedades para minúsculas para validação
            const normalizedConta = {
              codigo: conta.codigo || conta.Codigo,
              nome: conta.nome || conta.Nome,
              tipo: conta.tipo || conta.Tipo,
              nivel: conta.nivel || conta.Nivel,
              conta_pai: conta.conta_pai || conta['Conta Pai'],
              descricao: conta.descricao || conta.Descricao
            }
            
            // Valida dados obrigatórios
            if (!normalizedConta.codigo || !normalizedConta.nome || !normalizedConta.tipo) {
              errors.push(`Linha ${i + processed + 1}: Campos obrigatórios faltando (código, nome, tipo)`)
              continue
            }

            // Prepara dados para inserção
            const tipoNormalizado = normalizeTipo(normalizedConta.tipo)
            const naturezaCalculada = getTipoNatureza(tipoNormalizado)
            
            const contaData = {
              codigo: normalizedConta.codigo.trim(),
              nome: normalizedConta.nome.trim(),
              tipo: tipoNormalizado,
              natureza: naturezaCalculada,
              nivel: normalizedConta.nivel ? parseInt(normalizedConta.nivel) : 1,
              conta_pai_id: null,
              descricao: normalizedConta.descricao?.trim() || '',
              ativo: true,
              empresa_id: empresaId
            }

            // Se tem conta pai, busca o ID
            if (normalizedConta.conta_pai && normalizedConta.conta_pai.trim()) {
              const { data: contaPai } = await supabase
                .from('plano_contas')
                .select('id')
                .eq('codigo', normalizedConta.conta_pai.trim())
                .eq('empresa_id', empresaId)
                .single()

              if (contaPai) {
                contaData.conta_pai_id = contaPai.id
              }
            }

            // Insere no banco
            const { error } = await supabase
              .from('plano_contas')
              .insert([contaData])

            if (error) {
              // Se for erro de duplicação, apenas reporta como aviso
              if (error.message.includes('duplicate key') || error.message.includes('already exists')) {
                console.log(`Conta ${normalizedConta.codigo} já existe, pulando...`)
              } else if (error.message.includes('plano_contas_tipo_check')) {
                errors.push(`Linha ${i + processed + 1}: Tipo inválido '${contaData.tipo}' - deve ser um dos valores: ativo, passivo, patrimonio, receita, despesa`)
              } else {
                errors.push(`Linha ${i + processed + 1}: ${error.message}`)
              }
            } else {
              processed++
            }

          } catch (error) {
            errors.push(`Linha ${i + processed + 1}: Erro inesperado - ${error}`)
          }

          updateProgress(i + processed, contas.length, errors.length)
        }
      }

      return {
        success: processed > 0,
        message: processed > 0 
          ? `${processed} conta(s) importada(s) com sucesso${errors.length > 0 ? ` (${errors.length} erro(s))` : ''}`
          : 'Nenhuma conta foi importada',
        totalProcessed: processed,
        totalErrors: errors.length,
        errors
      }

    } catch (error) {
      return {
        success: false,
        message: `Erro durante importação: ${error}`,
        totalProcessed: 0,
        totalErrors: 1,
        errors: [String(error)]
      }
    } finally {
      setIsImporting(false)
    }
  }

  const importClientesFornecedores = async (
    file: File,
    empresaId: string
  ): Promise<ImportResult> => {
    setIsImporting(true)
    updateProgress(0, 0)

    try {
      const parseResult: CSVParseResult = await CSVParser.parseFile(file, {
        headers: ['codigo', 'nome_razao_social', 'tipo', 'cpf_cnpj', 'email', 'telefone', 'endereco', 'cidade', 'estado', 'cep', 'status']
      })

      if (parseResult.errors.length > 0) {
        return {
          success: false,
          message: 'Erro ao processar arquivo CSV',
          totalProcessed: 0,
          totalErrors: parseResult.errors.length,
          errors: parseResult.errors
        }
      }

      const { data: registros } = parseResult
      updateProgress(0, registros.length)

      const errors: string[] = []
      let processed = 0

      for (let i = 0; i < registros.length; i++) {
        const registro = registros[i]

        try {
          // Valida dados obrigatórios
          if (!registro.codigo || !registro.nome_razao_social || !registro.tipo) {
            errors.push(`Linha ${i + 1}: Campos obrigatórios faltando (codigo, nome_razao_social, tipo)`)
            continue
          }

          if (!['Cliente', 'Fornecedor'].includes(registro.tipo)) {
            errors.push(`Linha ${i + 1}: Tipo deve ser 'Cliente' ou 'Fornecedor'`)
            continue
          }

          // Prepara dados para inserção
          const clienteFornecedorData = {
            codigo: registro.codigo.trim(),
            nome_razao_social: registro.nome_razao_social.trim(),
            tipo: registro.tipo.trim(),
            cpf_cnpj: registro.cpf_cnpj?.trim() || '',
            email: registro.email?.trim() || '',
            telefone: registro.telefone?.trim() || '',
            endereco: registro.endereco?.trim() || '',
            cidade: registro.cidade?.trim() || '',
            estado: registro.estado?.trim() || '',
            cep: registro.cep?.trim() || '',
            ativo: registro.status?.toLowerCase() !== 'inativo',
            empresa_id: empresaId
          }

          // Insere no banco
          const { error } = await supabase
            .from('clientes_fornecedores')
            .insert([clienteFornecedorData])

          if (error) {
            errors.push(`Linha ${i + 1}: ${error.message}`)
          } else {
            processed++
          }

        } catch (error) {
          errors.push(`Linha ${i + 1}: Erro inesperado - ${error}`)
        }

        updateProgress(i + 1, registros.length, errors.length)
      }

      return {
        success: processed > 0,
        message: processed > 0 
          ? `${processed} registro(s) importado(s) com sucesso${errors.length > 0 ? ` (${errors.length} erro(s))` : ''}`
          : 'Nenhum registro foi importado',
        totalProcessed: processed,
        totalErrors: errors.length,
        errors
      }

    } catch (error) {
      return {
        success: false,
        message: `Erro durante importação: ${error}`,
        totalProcessed: 0,
        totalErrors: 1,
        errors: [String(error)]
      }
    } finally {
      setIsImporting(false)
    }
  }

  const importCentroCustos = async (
    file: File,
    empresaId: string
  ): Promise<ImportResult> => {
    setIsImporting(true)
    updateProgress(0, 0)

    try {
      const parseResult: CSVParseResult = await CSVParser.parseFile(file, {
        headers: ['codigo', 'nome', 'responsavel', 'orcamento', 'descricao', 'status']
      })

      if (parseResult.errors.length > 0) {
        return {
          success: false,
          message: 'Erro ao processar arquivo CSV',
          totalProcessed: 0,
          totalErrors: parseResult.errors.length,
          errors: parseResult.errors
        }
      }

      const { data: centros } = parseResult
      updateProgress(0, centros.length)

      const errors: string[] = []
      let processed = 0

      for (let i = 0; i < centros.length; i++) {
        const centro = centros[i]

        try {
          // Valida dados obrigatórios
          if (!centro.codigo || !centro.nome) {
            errors.push(`Linha ${i + 1}: Campos obrigatórios faltando (codigo, nome)`)
            continue
          }

          // Prepara dados para inserção
          const centroCustoData = {
            codigo: centro.codigo.trim(),
            nome: centro.nome.trim(),
            responsavel: centro.responsavel?.trim() || '',
            orcamento: centro.orcamento ? parseFloat(centro.orcamento.replace(/[^\d.,]/g, '').replace(',', '.')) : 0,
            descricao: centro.descricao?.trim() || '',
            ativo: centro.status?.toLowerCase() !== 'inativo',
            empresa_id: empresaId
          }

          // Insere no banco
          const { error } = await supabase
            .from('centro_custos')
            .insert([centroCustoData])

          if (error) {
            errors.push(`Linha ${i + 1}: ${error.message}`)
          } else {
            processed++
          }

        } catch (error) {
          errors.push(`Linha ${i + 1}: Erro inesperado - ${error}`)
        }

        updateProgress(i + 1, centros.length, errors.length)
      }

      return {
        success: processed > 0,
        message: processed > 0 
          ? `${processed} centro(s) de custo importado(s) com sucesso${errors.length > 0 ? ` (${errors.length} erro(s))` : ''}`
          : 'Nenhum centro de custo foi importado',
        totalProcessed: processed,
        totalErrors: errors.length,
        errors
      }

    } catch (error) {
      return {
        success: false,
        message: `Erro durante importação: ${error}`,
        totalProcessed: 0,
        totalErrors: 1,
        errors: [String(error)]
      }
    } finally {
      setIsImporting(false)
    }
  }

  return {
    isImporting,
    progress,
    importPlanoContas,
    importClientesFornecedores,
    importCentroCustos
  }
}
