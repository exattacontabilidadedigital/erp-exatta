/**
 * Utilitário para corrigir encoding de dados já importados no banco
 */

import { supabase } from '@/lib/supabase/client'

export interface FixEncodingResult {
  success: boolean
  message: string
  totalFixed: number
  errors: string[]
}

export class EncodingFixer {
  /**
   * Corrige problemas de encoding nos nomes das contas já importadas
   */
  static async fixPlanoContasEncoding(empresaId: string): Promise<FixEncodingResult> {
    try {
      // Busca todas as contas com problemas de encoding
      const { data: contas, error: fetchError } = await supabase
        .from('plano_contas')
        .select('id, codigo, nome, descricao')
        .eq('empresa_id', empresaId)
        .or('nome.like.*├º├Áes*,nome.like.*├º├úo*,nome.like.*├úu*,descricao.like.*├º├Áes*,descricao.like.*├º├úo*,descricao.like.*├úu*')

      if (fetchError) {
        return {
          success: false,
          message: `Erro ao buscar contas: ${fetchError.message}`,
          totalFixed: 0,
          errors: [fetchError.message]
        }
      }

      if (!contas || contas.length === 0) {
        return {
          success: true,
          message: 'Nenhuma conta com problema de encoding encontrada',
          totalFixed: 0,
          errors: []
        }
      }

      const errors: string[] = []
      let totalFixed = 0

      // Processa cada conta que precisa de correção
      for (const conta of contas) {
        const nomeCorrigido = this.fixEncodingText(conta.nome)
        const descricaoCorrigida = conta.descricao ? this.fixEncodingText(conta.descricao) : null

        // Só atualiza se houve mudança
        if (nomeCorrigido !== conta.nome || 
            (conta.descricao && descricaoCorrigida !== conta.descricao)) {
          
          const updateData: any = {
            nome: nomeCorrigido
          }
          
          if (conta.descricao && descricaoCorrigida) {
            updateData.descricao = descricaoCorrigida
          }

          const { error: updateError } = await supabase
            .from('plano_contas')
            .update(updateData)
            .eq('id', conta.id)

          if (updateError) {
            errors.push(`Erro ao atualizar conta ${conta.codigo}: ${updateError.message}`)
          } else {
            totalFixed++
            console.log(`Corrigido: ${conta.codigo} - "${conta.nome}" → "${nomeCorrigido}"`)
          }
        }
      }

      return {
        success: errors.length === 0,
        message: errors.length === 0 
          ? `${totalFixed} conta(s) corrigida(s) com sucesso`
          : `${totalFixed} conta(s) corrigida(s), ${errors.length} erro(s) encontrado(s)`,
        totalFixed,
        errors
      }

    } catch (error) {
      return {
        success: false,
        message: `Erro inesperado: ${error}`,
        totalFixed: 0,
        errors: [String(error)]
      }
    }
  }

  /**
   * Corrige problemas de encoding em um texto
   */
  private static fixEncodingText(text: string): string {
    if (!text) return text

    let fixedText = text

    // Correções específicas para o problema identificado
    fixedText = fixedText.replace(/├º├Áes/g, 'ções')
    fixedText = fixedText.replace(/├º├úo/g, 'ção')
    fixedText = fixedText.replace(/├úu/g, 'çu')
    fixedText = fixedText.replace(/├úa/g, 'ça')
    fixedText = fixedText.replace(/├úe/g, 'çe')
    fixedText = fixedText.replace(/├úi/g, 'çi')
    fixedText = fixedText.replace(/├úo/g, 'ço')

    // Outras correções comuns
    fixedText = fixedText.replace(/Ã¡/g, 'á')
    fixedText = fixedText.replace(/Ã£/g, 'ã')
    fixedText = fixedText.replace(/Ã©/g, 'é')
    fixedText = fixedText.replace(/Ã­/g, 'í')
    fixedText = fixedText.replace(/Ã³/g, 'ó')
    fixedText = fixedText.replace(/Ãº/g, 'ú')
    fixedText = fixedText.replace(/Ã§/g, 'ç')
    fixedText = fixedText.replace(/Ã‰/g, 'É')
    fixedText = fixedText.replace(/Ã‡/g, 'Ç')

    return fixedText
  }
}
