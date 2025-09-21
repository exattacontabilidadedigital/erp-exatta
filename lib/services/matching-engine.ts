// Engine de correspondência para transações
// Arquivo: lib/services/matching-engine.ts

import { DadosTransacao, ModeloImportacao, ResultadoCorrespondencia } from '@/types/import';
import Fuse from 'fuse.js';
import * as levenshtein from 'fast-levenshtein';

interface MatchingOptions {
  limiteConfiancaMinima?: number;
  incluirSugestoes?: boolean;
  maxSugestoes?: number;
}

export class MatchingEngine {
  private modelos: ModeloImportacao[] = [];
  private fuseEngine!: Fuse<ModeloImportacao>;

  constructor(modelos: ModeloImportacao[]) {
    this.modelos = modelos.filter(m => m.ativo);
    this.inicializarFuseEngine();
  }

  /**
   * Inicializa o engine Fuse.js para busca fuzzy
   */
  private inicializarFuseEngine() {
    this.fuseEngine = new Fuse(this.modelos, {
      keys: [
        { name: 'padraoDescricao', weight: 0.8 },
        { name: 'nome', weight: 0.2 }
      ],
      threshold: 0.6, // Quanto menor, mais restritivo
      includeScore: true,
      minMatchCharLength: 3,
      ignoreLocation: true
    });
  }

  /**
   * Encontra correspondência para uma transação
   */
  async encontrarCorrespondencia(
    transacao: DadosTransacao, 
    options: MatchingOptions = {}
  ): Promise<ResultadoCorrespondencia> {
    const { 
      limiteConfiancaMinima = 0.7, 
      incluirSugestoes = true, 
      maxSugestoes = 3 
    } = options;

    const descricaoNormalizada = this.normalizarTexto(transacao.descricao);
    
    // 1. Tentativa de correspondência exata
    const correspondenciaExata = this.buscarCorrespondenciaExata(descricaoNormalizada);
    if (correspondenciaExata) {
      return {
        modelo: correspondenciaExata,
        pontuacao: 1.0,
        tipo: 'exato',
        sugestoes: incluirSugestoes ? this.obterSugestoes(descricaoNormalizada, maxSugestoes, [correspondenciaExata.id]) : undefined
      };
    }

    // 2. Tentativa de correspondência por regex
    const correspondenciaRegex = this.buscarCorrespondenciaRegex(descricaoNormalizada);
    if (correspondenciaRegex) {
      return {
        modelo: correspondenciaRegex,
        pontuacao: 0.95,
        tipo: 'regex',
        sugestoes: incluirSugestoes ? this.obterSugestoes(descricaoNormalizada, maxSugestoes, [correspondenciaRegex.id]) : undefined
      };
    }

    // 3. Tentativa de correspondência fuzzy
    const correspondenciaFuzzy = this.buscarCorrespondenciaFuzzy(descricaoNormalizada);
    if (correspondenciaFuzzy && correspondenciaFuzzy.pontuacao >= limiteConfiancaMinima) {
      return {
        modelo: correspondenciaFuzzy.modelo,
        pontuacao: correspondenciaFuzzy.pontuacao,
        tipo: 'fuzzy',
        sugestoes: incluirSugestoes ? this.obterSugestoes(descricaoNormalizada, maxSugestoes, [correspondenciaFuzzy.modelo.id]) : undefined
      };
    }

    // 4. Nenhuma correspondência encontrada
    return {
      modelo: null,
      pontuacao: 0,
      tipo: 'manual',
      sugestoes: incluirSugestoes ? this.obterSugestoes(descricaoNormalizada, maxSugestoes) : undefined
    };
  }

  /**
   * Busca correspondência exata após normalização
   */
  private buscarCorrespondenciaExata(descricaoNormalizada: string): ModeloImportacao | null {
    return this.modelos.find(modelo => {
      const padraoNormalizado = this.normalizarTexto(modelo.padraoDescricao);
      return padraoNormalizado === descricaoNormalizada;
    }) || null;
  }

  /**
   * Busca correspondência usando regex
   */
  private buscarCorrespondenciaRegex(descricaoNormalizada: string): ModeloImportacao | null {
    for (const modelo of this.modelos) {
      if (modelo.padraoRegex) {
        try {
          const regex = new RegExp(modelo.padraoRegex, 'gi');
          if (regex.test(descricaoNormalizada)) {
            return modelo;
          }
        } catch (error) {
          console.warn(`Regex inválido no modelo ${modelo.id}: ${modelo.padraoRegex}`, error);
        }
      }
    }
    return null;
  }

  /**
   * Busca correspondência usando algoritmos fuzzy
   */
  private buscarCorrespondenciaFuzzy(descricaoNormalizada: string): { modelo: ModeloImportacao; pontuacao: number } | null {
    const resultadosFuse = this.fuseEngine.search(descricaoNormalizada);
    
    if (resultadosFuse.length === 0) {
      return null;
    }

    const melhorResultado = resultadosFuse[0];
    const modelo = melhorResultado.item;
    
    // Combinar pontuação do Fuse com Levenshtein para maior precisão
    const pontuacaoFuse = 1 - (melhorResultado.score || 1);
    const pontuacaoLevenshtein = this.calcularSimilaridadeLevenshtein(
      descricaoNormalizada,
      this.normalizarTexto(modelo.padraoDescricao)
    );
    
    // Média ponderada (60% Fuse, 40% Levenshtein)
    const pontuacaoFinal = (pontuacaoFuse * 0.6) + (pontuacaoLevenshtein * 0.4);
    
    return {
      modelo,
      pontuacao: pontuacaoFinal
    };
  }

  /**
   * Calcula similaridade usando distância de Levenshtein
   */
  private calcularSimilaridadeLevenshtein(texto1: string, texto2: string): number {
    const distancia = levenshtein.get(texto1, texto2);
    const comprimentoMaximo = Math.max(texto1.length, texto2.length);
    
    if (comprimentoMaximo === 0) return 1;
    
    return 1 - (distancia / comprimentoMaximo);
  }

  /**
   * Obtém sugestões de modelos alternativos
   */
  private obterSugestoes(
    descricaoNormalizada: string, 
    maxSugestoes: number, 
    excluirIds: number[] = []
  ): Array<{ modelo: ModeloImportacao; pontuacao: number; motivo: string }> {
    const sugestoes: Array<{ modelo: ModeloImportacao; pontuacao: number; motivo: string }> = [];
    
    // Buscar usando Fuse.js
    const resultadosFuse = this.fuseEngine.search(descricaoNormalizada)
      .filter(resultado => !excluirIds.includes(resultado.item.id))
      .slice(0, maxSugestoes * 2); // Buscar mais para filtrar depois
    
    for (const resultado of resultadosFuse) {
      const modelo = resultado.item;
      const pontuacaoFuse = 1 - (resultado.score || 1);
      
      // Calcular similaridade adicional
      const pontuacaoLevenshtein = this.calcularSimilaridadeLevenshtein(
        descricaoNormalizada,
        this.normalizarTexto(modelo.padraoDescricao)
      );
      
      const pontuacaoFinal = (pontuacaoFuse * 0.7) + (pontuacaoLevenshtein * 0.3);
      
      // Determinar motivo da sugestão
      let motivo = 'Similaridade de texto';
      if (pontuacaoLevenshtein > 0.8) {
        motivo = 'Alta similaridade textual';
      } else if (pontuacaoFuse > 0.7) {
        motivo = 'Correspondência parcial de palavras-chave';
      }

      sugestoes.push({
        modelo,
        pontuacao: pontuacaoFinal,
        motivo
      });
    }

    // Ordenar por pontuação e retornar apenas as melhores
    return sugestoes
      .sort((a, b) => b.pontuacao - a.pontuacao)
      .slice(0, maxSugestoes)
      .filter(s => s.pontuacao >= 0.3); // Filtrar sugestões muito baixas
  }

  /**
   * Normaliza texto para comparação
   */
  private normalizarTexto(texto: string): string {
    if (!texto) return '';
    
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^\w\s]/g, ' ') // Substitui pontuação por espaços
      .replace(/\s+/g, ' ') // Colapsa espaços múltiplos
      .trim();
  }

  /**
   * Atualiza a lista de modelos e reinicializa o engine
   */
  atualizarModelos(novosModelos: ModeloImportacao[]) {
    this.modelos = novosModelos.filter(m => m.ativo);
    this.inicializarFuseEngine();
  }

  /**
   * Obtém estatísticas de uso dos modelos
   */
  obterEstatisticasModelos(): Array<{
    modelo: ModeloImportacao;
    usoRecente: number;
    taxaSucesso: number;
    ultimoUso?: Date;
  }> {
    return this.modelos.map(modelo => ({
      modelo,
      usoRecente: modelo.contadorUso || 0,
      taxaSucesso: modelo.taxaSucesso || 0,
      // ultimoUso seria obtido do banco de dados
    }));
  }

  /**
   * Sugere otimizações para modelos existentes
   */
  sugerirOtimizacoes(): Array<{
    modeloId: number;
    problema: string;
    sugestao: string;
    prioridade: 'alta' | 'media' | 'baixa';
  }> {
    const otimizacoes: Array<{
      modeloId: number;
      problema: string;
      sugestao: string;
      prioridade: 'alta' | 'media' | 'baixa';
    }> = [];

    for (const modelo of this.modelos) {
      // Verificar modelos com baixa taxa de sucesso
      if (modelo.taxaSucesso < 0.5 && modelo.contadorUso > 10) {
        otimizacoes.push({
          modeloId: modelo.id,
          problema: 'Taxa de sucesso baixa',
          sugestao: 'Revisar padrão de descrição ou adicionar regex mais específico',
          prioridade: 'alta'
        });
      }

      // Verificar modelos pouco utilizados
      if (modelo.contadorUso < 5) {
        otimizacoes.push({
          modeloId: modelo.id,
          problema: 'Modelo pouco utilizado',
          sugestao: 'Considerar tornar o padrão mais genérico ou desativar o modelo',
          prioridade: 'baixa'
        });
      }

      // Verificar modelos sem regex quando deveriam ter
      if (!modelo.padraoRegex && modelo.padraoDescricao.includes('*')) {
        otimizacoes.push({
          modeloId: modelo.id,
          problema: 'Padrão sugere uso de regex',
          sugestao: 'Adicionar padrão regex para melhor precisão',
          prioridade: 'media'
        });
      }

      // Verificar limite de confiança muito alto
      if (modelo.limiteConfianca > 0.95 && modelo.contadorUso > 0) {
        otimizacoes.push({
          modeloId: modelo.id,
          problema: 'Limite de confiança muito restritivo',
          sugestao: 'Considerar reduzir limite de confiança para 0.90',
          prioridade: 'media'
        });
      }
    }

    return otimizacoes.sort((a, b) => {
      const prioridades = { alta: 3, media: 2, baixa: 1 };
      return prioridades[b.prioridade] - prioridades[a.prioridade];
    });
  }

  /**
   * Testa um modelo contra uma lista de transações de exemplo
   */
  testarModelo(
    modelo: ModeloImportacao, 
    transacoesExemplo: DadosTransacao[]
  ): {
    totalTestes: number;
    acertos: number;
    erros: number;
    taxaAcerto: number;
    exemplosErros: Array<{ transacao: DadosTransacao; motivoErro: string }>;
  } {
    let acertos = 0;
    const exemplosErros: Array<{ transacao: DadosTransacao; motivoErro: string }> = [];

    for (const transacao of transacoesExemplo) {
      const descricaoNormalizada = this.normalizarTexto(transacao.descricao);
      const padraoNormalizado = this.normalizarTexto(modelo.padraoDescricao);
      
      let corresponde = false;
      let motivoErro = '';

      // Teste de correspondência exata
      if (padraoNormalizado === descricaoNormalizada) {
        corresponde = true;
      }
      // Teste de regex se disponível
      else if (modelo.padraoRegex) {
        try {
          const regex = new RegExp(modelo.padraoRegex, 'gi');
          if (regex.test(descricaoNormalizada)) {
            corresponde = true;
          } else {
            motivoErro = 'Não passou no teste de regex';
          }
        } catch {
          motivoErro = 'Regex inválido';
        }
      }
      // Teste de similaridade fuzzy
      else {
        const similaridade = this.calcularSimilaridadeLevenshtein(
          descricaoNormalizada, 
          padraoNormalizado
        );
        
        if (similaridade >= modelo.limiteConfianca) {
          corresponde = true;
        } else {
          motivoErro = `Similaridade ${(similaridade * 100).toFixed(1)}% abaixo do limite ${(modelo.limiteConfianca * 100).toFixed(1)}%`;
        }
      }

      if (corresponde) {
        acertos++;
      } else {
        exemplosErros.push({
          transacao,
          motivoErro: motivoErro || 'Correspondência não encontrada'
        });
      }
    }

    const totalTestes = transacoesExemplo.length;
    const erros = totalTestes - acertos;
    const taxaAcerto = totalTestes > 0 ? acertos / totalTestes : 0;

    return {
      totalTestes,
      acertos,
      erros,
      taxaAcerto,
      exemplosErros: exemplosErros.slice(0, 5) // Retornar apenas os primeiros 5 erros
    };
  }
}

// Função utilitária para criar engine com modelos
export function criarMatchingEngine(modelos: ModeloImportacao[]): MatchingEngine {
  return new MatchingEngine(modelos);
}

// Função para normalizar texto (exportada para uso geral)
export function normalizarTexto(texto: string): string {
  if (!texto) return '';
  
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^\w\s]/g, ' ') // Substitui pontuação por espaços
    .replace(/\s+/g, ' ') // Colapsa espaços múltiplos
    .trim();
}

// Função para calcular similaridade entre dois textos
export function calcularSimilaridade(texto1: string, texto2: string): number {
  const texto1Norm = normalizarTexto(texto1);
  const texto2Norm = normalizarTexto(texto2);
  
  const distancia = levenshtein.get(texto1Norm, texto2Norm);
  const comprimentoMaximo = Math.max(texto1Norm.length, texto2Norm.length);
  
  if (comprimentoMaximo === 0) return 1;
  
  return 1 - (distancia / comprimentoMaximo);
}