import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/auth-context';

// Hook simplificado para estatisticas
export function useImportStats() {
  const [stats, setStats] = useState({
    totalBatches: 0,
    pendingEntries: 0,
    confirmedToday: 0,
    rejectedToday: 0,
    avgConfidence: 0,
    processingTime: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userData } = useAuth();

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log(' Buscando estatisticas...');
      
      // Contabiliza lotes do usuário atual
      const { count: totalBatches } = await supabase
        .from('lotes_importacao')
        .select('id', { count: 'exact', head: true })
        .eq('usuario_upload', userData?.id || '');

      // Contabiliza pré-lançamentos pendentes visíveis ao usuário via RLS (escopado por lotes do usuário)
      const { count: pendingEntries } = await supabase
        .from('pre_lancamentos')
        .select('id', { count: 'exact', head: true })
        .eq('status_aprovacao', 'pendente');

      setStats({
        totalBatches: totalBatches || 0,
        pendingEntries: pendingEntries || 0,
        confirmedToday: 0,
        rejectedToday: 0,
        avgConfidence: 0,
        processingTime: 0,
      });
      console.log(' Estatisticas ok');
    } catch (err) {
      console.error(' Erro:', err instanceof Error ? err.message : String(err));
      setError('Erro ao carregar estatisticas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userData?.id) return;
    fetchStats();
  }, [userData?.id]);

  return { stats, loading, error, refetch: fetchStats };
}

// Hook para historico
export function useImportBatches() {
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userData } = useAuth();

  const fetchBatches = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log(' Verificando tabela lotes_importacao...');
      
      // Campos existentes em lotes_importacao: data_upload, data_processamento, data_conclusao, usuario_upload, etc.
      let query = supabase
        .from('lotes_importacao')
        .select(
          'id, nome_arquivo, tipo_arquivo, status, total_registros, registros_processados, registros_com_erro, data_upload, data_processamento, data_conclusao, usuario_upload'
        )
        .order('data_upload', { ascending: false })
        .limit(20);

      // Escopar para o usuário atual quando disponível (além do RLS)
      if (userData?.id) {
        query = query.eq('usuario_upload', userData.id);
      }

      const { data, error: dbError } = await query;

      if (dbError) {
        console.error(' Erro:', dbError);
        if (dbError.message?.includes('does not exist')) {
          console.log(' Tabela nao existe, retornando vazio');
          setBatches([]);
          return;
        }
        throw new Error(dbError.message || 'Erro desconhecido');
      }

      console.log(' Lotes:', data?.length || 0);
      setBatches(data || []);
    } catch (err) {
      console.error(' Erro final:', err instanceof Error ? err.message : String(err));
      setError('Erro ao carregar historico');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Aguarda userData para garantir escopo correto
    if (!userData) return;
    fetchBatches();
  }, [userData?.id]);

  return { batches, loading, error, refetch: fetchBatches };
}

// Usar a funcao do arquivo funcionando
export { usePendingEntries } from './use-pending-entries-simple';

// Hook para templates
export function useImportTemplates() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userData } = useAuth();

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 fetchTemplates iniciado para empresa:', userData?.empresa_id);
      
      // Verificar sessão do Supabase diretamente
      const { data: session } = await supabase.auth.getSession();
      console.log('🔐 Sessão atual:', session?.session?.user?.id || 'Não autenticado');
      
      if (!session?.session?.user?.id) {
        console.log('❌ Usuário não autenticado no Supabase');
        setTemplates([]);
        setError('Usuário não autenticado');
        return;
      }

      // Buscar dados do usuário autenticado diretamente
      const { data: userDataDirect, error: userError } = await supabase
        .from('usuarios')
        .select('empresa_id')
        .eq('id', session.session.user.id)
        .single();

      if (userError || !userDataDirect?.empresa_id) {
        console.log('❌ Erro ao buscar dados do usuário:', userError);
        setTemplates([]);
        setError('Erro ao buscar dados do usuário');
        return;
      }

      console.log('✅ Empresa ID do usuário autenticado:', userDataDirect.empresa_id);
      
      console.log('📡 Fazendo query no Supabase...');
      const { data, error: dbError } = await supabase
        .from('templates_importacao')
        .select(
          'id, empresa_id, nome, descricao_padrao, regex_padrao, plano_conta_id, centro_custo_id, cliente_fornecedor_id, conta_bancaria_id, categoria, limite_confianca, confirmacao_automatica, ativo, created_at, data_atualizacao'
        )
        .eq('empresa_id', userDataDirect.empresa_id)
        .order('nome', { ascending: true });

      if (dbError) {
        console.error('❌ Erro templates query:', dbError);
        throw dbError;
      }

      console.log('✅ Query executada com sucesso. Resultados:', data?.length || 0);
      console.log('📋 Templates retornados:', data);
      setTemplates(data || []);
    } catch (err) {
      console.error('❌ Erro final templates:', err instanceof Error ? err.message : String(err));
      setError('Erro ao carregar templates');
    } finally {
      setLoading(false);
    }
  };

  // Função de debug para forçar busca com empresa específica
  const fetchTemplatesWithEmpresa = async (empresaId: string) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🧪 [DEBUG] fetchTemplatesWithEmpresa para empresa:', empresaId);

      const { data, error: dbError } = await supabase
        .from('templates_importacao')
        .select(
          'id, empresa_id, nome, descricao_padrao, regex_padrao, plano_conta_id, centro_custo_id, cliente_fornecedor_id, conta_bancaria_id, categoria, limite_confianca, confirmacao_automatica, ativo, created_at, data_atualizacao'
        )
        .eq('empresa_id', empresaId)
        .order('nome', { ascending: true });

      if (dbError) {
        console.error('❌ [DEBUG] Erro templates query:', dbError);
        throw dbError;
      }

      console.log('✅ [DEBUG] Query executada com sucesso. Resultados:', data?.length || 0);
      console.log('📋 [DEBUG] Templates retornados:', data);
      setTemplates(data || []);
    } catch (err) {
      console.error('❌ [DEBUG] Erro final templates:', err instanceof Error ? err.message : String(err));
      setError('Erro ao carregar templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🔄 useImportTemplates useEffect iniciado');
    fetchTemplates();
  }, []);

  const createTemplate = async (templateData: any) => {
    try {
      // Verificar sessão do Supabase diretamente
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user?.id) {
        return { success: false, error: 'Usuario nao autenticado' };
      }

      // Buscar dados do usuário autenticado
      const { data: userDataDirect, error: userError } = await supabase
        .from('usuarios')
        .select('empresa_id')
        .eq('id', session.session.user.id)
        .single();

      if (userError || !userDataDirect?.empresa_id) {
        return { success: false, error: 'Erro ao buscar dados do usuário' };
      }

      const insertData: any = {
        empresa_id: userDataDirect.empresa_id,
        nome: templateData.nome,
        descricao_padrao: templateData.descricao_padrao || '',
        regex_padrao: templateData.regex_padrao || null,
        categoria: templateData.categoria || null,
        limite_confianca: typeof templateData.limite_confianca === 'number' && !Number.isNaN(templateData.limite_confianca)
          ? templateData.limite_confianca
          : 0.8,
        confirmacao_automatica: !!templateData.confirmacao_automatica,
        ativo: templateData.ativo !== false,
        created_at: new Date().toISOString(),
        data_atualizacao: new Date().toISOString(),
      };

      // Adicionar campos relacionais apenas se tiverem valores válidos
      if (templateData.plano_conta_id && templateData.plano_conta_id !== 'none') {
        insertData.plano_conta_id = templateData.plano_conta_id;
      }
      if (templateData.centro_custo_id && templateData.centro_custo_id !== 'none') {
        insertData.centro_custo_id = templateData.centro_custo_id;
      }
      if (templateData.cliente_fornecedor_id && templateData.cliente_fornecedor_id !== 'none') {
        insertData.cliente_fornecedor_id = templateData.cliente_fornecedor_id;
      }
      if (templateData.conta_bancaria_id && templateData.conta_bancaria_id !== 'none') {
        insertData.conta_bancaria_id = templateData.conta_bancaria_id;
      }

      console.log('🚀 Dados que serão inseridos no banco:', insertData);

      const { data, error } = await supabase
        .from('templates_importacao')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('🚀 CreateTemplate - Erro do Supabase:', error);
        throw new Error(`Supabase error: ${error.message || JSON.stringify(error)}`);
      }
      setTemplates(prev => [...prev, data]);
      return { success: true, data };
    } catch (err) {
      console.error('🚀 CreateTemplate - Erro completo:', err);
      console.error('🚀 CreateTemplate - Tipo do erro:', typeof err);
      console.error('🚀 CreateTemplate - Erro stringified:', JSON.stringify(err));
      
      let errorMessage = 'Erro ao criar template';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (err && typeof err === 'object' && 'message' in err) {
        errorMessage = (err as any).message;
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const updateTemplate = async (id: string, templateData: any) => {
    try {
      // Verificar sessão do Supabase diretamente
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user?.id) {
        return { success: false, error: 'Usuario nao autenticado' };
      }

      const payload: any = { ...templateData };
      
      // Remover campos que não existem na tabela
      delete payload.id;
      delete payload.empresa_id;
      delete payload.created_at;
      delete payload.data_atualizacao; // Campo que não existe
      
      console.log('🔧 UpdateTemplate - Template data original:', templateData);
      console.log('🔧 UpdateTemplate - Payload inicial:', payload);
      
      // Lista de campos válidos para a tabela templates_importacao
      const validFields = [
        'nome', 'descricao_padrao', 'regex_padrao', 'plano_conta_id', 
        'centro_custo_id', 'cliente_fornecedor_id', 'conta_bancaria_id',
        'categoria', 'limite_confianca', 'confirmacao_automatica', 
        'ativo', 'data_atualizacao'
      ];
      
      // Filtrar apenas campos válidos e não vazios
      const cleanPayload: any = {};
      validFields.forEach(field => {
        if (field === 'data_atualizacao') {
          // Campo data_atualizacao é sempre adicionado
          cleanPayload[field] = new Date().toISOString();
        } else if (payload[field] !== undefined && payload[field] !== null && payload[field] !== '') {
          cleanPayload[field] = payload[field];
        }
      });
      
      // Campos especiais que podem ser null
      if (payload.plano_conta_id === null) cleanPayload.plano_conta_id = null;
      if (payload.centro_custo_id === null) cleanPayload.centro_custo_id = null;
      if (payload.cliente_fornecedor_id === null) cleanPayload.cliente_fornecedor_id = null;
      if (payload.conta_bancaria_id === null) cleanPayload.conta_bancaria_id = null;
      
      // Criar um payload mínimo e seguro
      const minimalPayload: any = {
        data_atualizacao: new Date().toISOString()
      };
      
      // Adicionar apenas campos que realmente mudaram e são válidos
      if (payload.nome !== undefined) minimalPayload.nome = payload.nome;
      if (payload.descricao_padrao !== undefined) minimalPayload.descricao_padrao = payload.descricao_padrao;
      if (payload.regex_padrao !== undefined) minimalPayload.regex_padrao = payload.regex_padrao || null;
      if (payload.categoria !== undefined) minimalPayload.categoria = payload.categoria || null;
      if (payload.limite_confianca !== undefined) minimalPayload.limite_confianca = payload.limite_confianca;
      if (payload.confirmacao_automatica !== undefined) minimalPayload.confirmacao_automatica = payload.confirmacao_automatica;
      if (payload.ativo !== undefined) minimalPayload.ativo = payload.ativo;
      
      // Campos relacionais - tratar null explicitamente
      if (payload.plano_conta_id !== undefined) {
        minimalPayload.plano_conta_id = payload.plano_conta_id || null;
      }
      if (payload.centro_custo_id !== undefined) {
        minimalPayload.centro_custo_id = payload.centro_custo_id || null;
      }
      if (payload.cliente_fornecedor_id !== undefined) {
        minimalPayload.cliente_fornecedor_id = payload.cliente_fornecedor_id || null;
      }
      if (payload.conta_bancaria_id !== undefined) {
        minimalPayload.conta_bancaria_id = payload.conta_bancaria_id || null;
      }
      
      console.log('🔧 UpdateTemplate - Payload mínimo:', minimalPayload);
      console.log('🔧 UpdateTemplate - ID do template:', id);

      // Primeiro, vamos verificar se o template existe
      const { data: existingTemplate, error: checkError } = await supabase
        .from('templates_importacao')
        .select('id, empresa_id')
        .eq('id', id)
        .single();

      console.log('🔧 UpdateTemplate - Template existente:', existingTemplate);
      console.log('🔧 UpdateTemplate - Erro ao verificar:', checkError);

      if (checkError) {
        console.error('🔧 UpdateTemplate - Erro ao verificar template existente:', checkError);
        throw new Error(`Template não encontrado: ${checkError.message}`);
      }

      // Teste básico primeiro - apenas data_atualizacao
      console.log('🔧 UpdateTemplate - Testando update básico primeiro...');
      try {
        const { data: testData, error: testError } = await supabase
          .from('templates_importacao')
          .update({ data_atualizacao: new Date().toISOString() })
          .eq('id', id)
          .select();
          
        console.log('🔧 UpdateTemplate - Teste básico:', { testData, testError });
        
        if (testError) {
          console.error('🔧 UpdateTemplate - Erro no teste básico:', {
            message: testError.message,
            details: testError.details,
            hint: testError.hint,
            code: testError.code,
            stringified: JSON.stringify(testError)
          });
          throw new Error(`Teste básico falhou: ${testError.message || testError.details || JSON.stringify(testError)}`);
        }
      } catch (basicTestError) {
        console.error('🔧 UpdateTemplate - Erro capturado no teste básico:', basicTestError);
        throw basicTestError;
      }

      // Se o teste básico passou, fazer o update completo
      console.log('🔧 UpdateTemplate - Teste básico passou, fazendo update completo...');
      const { data, error } = await supabase
        .from('templates_importacao')
        .update(minimalPayload)
        .eq('id', id)
        .select();

      console.log('🔧 UpdateTemplate - Resposta completa do Supabase:', { data, error, payload: minimalPayload });

      if (error) {
        console.error('🔧 UpdateTemplate - Erro detalhado do Supabase:', {
          message: error.message,
          details: error.details, 
          hint: error.hint,
          code: error.code,
          error: error,
          fullError: JSON.stringify(error, null, 2)
        });
        
        // Tentar diferentes formas de obter a mensagem de erro
        let errorMessage = 'Erro desconhecido';
        if (error.message) errorMessage = error.message;
        else if (error.details) errorMessage = error.details;
        else if (error.hint) errorMessage = error.hint;
        else if (typeof error === 'string') errorMessage = error;
        else errorMessage = `Erro ao atualizar template - Code: ${error.code || 'unknown'}`;
        
        throw new Error(errorMessage);
      }

      if (!data || data.length === 0) {
        console.error('🔧 UpdateTemplate - Nenhum registro foi atualizado');
        throw new Error('Nenhum template foi atualizado - possível problema de permissão');
      }

      const updatedTemplate = data[0];
      setTemplates(prev => prev.map(t => t.id === id ? updatedTemplate : t));
      return { success: true, data: updatedTemplate };
      return { success: true, data };
    } catch (err) {
      console.error('🔧 UpdateTemplate - Erro completo:', err);
      console.error('🔧 UpdateTemplate - Tipo do erro:', typeof err);
      console.error('🔧 UpdateTemplate - Erro stringified:', JSON.stringify(err));
      
      let errorMessage = 'Erro ao atualizar template';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (err && typeof err === 'object' && 'message' in err) {
        errorMessage = (err as any).message;
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      // Verificar sessão do Supabase diretamente
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user?.id) {
        return { success: false, error: 'Usuario nao autenticado' };
      }

      const { error } = await supabase
        .from('templates_importacao')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setTemplates(prev => prev.filter(t => t.id !== id));
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Erro ao deletar template' };
    }
  };

  // Nova função updateTemplate baseada na estrutura do createTemplate que funciona
  const updateTemplateNew = async (id: string, templateData: any) => {
    try {
      // Função auxiliar para validar UUID
      const isValidUUID = (uuid: string) => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuid && typeof uuid === 'string' && uuidRegex.test(uuid);
      };

      // Verificar sessão do Supabase diretamente
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user?.id) {
        return { success: false, error: 'Usuario nao autenticado' };
      }

      // Validação básica dos dados obrigatórios
      if (!templateData.nome || !templateData.nome.trim()) {
        return { success: false, error: 'Nome do template é obrigatório' };
      }

      if (!templateData.descricao_padrao || !templateData.descricao_padrao.trim()) {
        return { success: false, error: 'Descrição padrão é obrigatória' };
      }

      console.log('🔍 DEBUGGING - templateData recebido:', templateData);
      
      // Limpar templateData de qualquer propriedade estranha
      const cleanTemplateData = {
        nome: templateData.nome,
        descricao_padrao: templateData.descricao_padrao,
        regex_padrao: templateData.regex_padrao,
        categoria: templateData.categoria,
        limite_confianca: templateData.limite_confianca,
        confirmacao_automatica: templateData.confirmacao_automatica,
        ativo: templateData.ativo,
        plano_conta_id: templateData.plano_conta_id,
        centro_custo_id: templateData.centro_custo_id,
        cliente_fornecedor_id: templateData.cliente_fornecedor_id,
        conta_bancaria_id: templateData.conta_bancaria_id
      };
      
      console.log('� Dados limpos para atualização:', cleanTemplateData);

      // Construir updateData baseado na estrutura do createTemplate que funciona
      const updateData: any = {
        nome: cleanTemplateData.nome.trim(),
        descricao_padrao: cleanTemplateData.descricao_padrao.trim() || '',
        regex_padrao: cleanTemplateData.regex_padrao?.trim() || null,
        categoria: cleanTemplateData.categoria?.trim() || null,
        limite_confianca: (() => {
          const valor = cleanTemplateData.limite_confianca;
          if (typeof valor === 'number' && !Number.isNaN(valor) && valor >= 0 && valor <= 1) {
            return valor;
          }
          return 0.8; // Valor padrão
        })(),
        confirmacao_automatica: !!cleanTemplateData.confirmacao_automatica,
        ativo: cleanTemplateData.ativo !== false,
        data_atualizacao: new Date().toISOString() // Incluído igual ao createTemplate
      };

      // Adicionar campos relacionais apenas se tiverem valores válidos
      if (cleanTemplateData.plano_conta_id && cleanTemplateData.plano_conta_id !== 'none') {
        if (isValidUUID(cleanTemplateData.plano_conta_id)) {
          updateData.plano_conta_id = cleanTemplateData.plano_conta_id;
        } else {
          console.warn('⚠️ plano_conta_id inválido:', cleanTemplateData.plano_conta_id);
          updateData.plano_conta_id = null;
        }
      } else {
        updateData.plano_conta_id = null;
      }
      
      if (cleanTemplateData.centro_custo_id && cleanTemplateData.centro_custo_id !== 'none') {
        if (isValidUUID(cleanTemplateData.centro_custo_id)) {
          updateData.centro_custo_id = cleanTemplateData.centro_custo_id;
        } else {
          console.warn('⚠️ centro_custo_id inválido:', cleanTemplateData.centro_custo_id);
          updateData.centro_custo_id = null;
        }
      } else {
        updateData.centro_custo_id = null;
      }
      
      if (cleanTemplateData.cliente_fornecedor_id && cleanTemplateData.cliente_fornecedor_id !== 'none') {
        if (isValidUUID(cleanTemplateData.cliente_fornecedor_id)) {
          updateData.cliente_fornecedor_id = cleanTemplateData.cliente_fornecedor_id;
        } else {
          console.warn('⚠️ cliente_fornecedor_id inválido:', cleanTemplateData.cliente_fornecedor_id);
          updateData.cliente_fornecedor_id = null;
        }
      } else {
        updateData.cliente_fornecedor_id = null;
      }
      
      if (cleanTemplateData.conta_bancaria_id && cleanTemplateData.conta_bancaria_id !== 'none') {
        if (isValidUUID(cleanTemplateData.conta_bancaria_id)) {
          updateData.conta_bancaria_id = cleanTemplateData.conta_bancaria_id;
        } else {
          console.warn('⚠️ conta_bancaria_id inválido:', cleanTemplateData.conta_bancaria_id);
          updateData.conta_bancaria_id = null;
        }
      } else {
        updateData.conta_bancaria_id = null;
      }

      // VERIFICAÇÃO FINAL: garantir que não há campos problemáticos
      const problematicFields = ['created_at', 'empresa_id'];
      problematicFields.forEach(field => {
        if (field in updateData) {
          console.warn(`🚨 Removendo campo problemático: ${field}`);
          delete updateData[field];
        }
      });

      console.log('🔧 Atualizando template ID:', id);

      // Verificar se o template existe e se o usuário tem permissão para editá-lo
      const { data: existingTemplate, error: checkError } = await supabase
        .from('templates_importacao')
        .select('id, nome, empresa_id')
        .eq('id', id)
        .single();

      if (checkError) {
        console.error('🔧 Erro ao verificar template existente:', checkError);
        throw new Error(`Template não encontrado ou sem permissão: ${checkError.message}`);
      }

      if (!existingTemplate) {
        throw new Error('Template não encontrado');
      }

      console.log('🔧 Template existente encontrado:', existingTemplate);

      // Verificar se já existe outro template com o mesmo nome na mesma empresa (apenas se o nome mudou)
      if (existingTemplate.nome !== updateData.nome) {
        const { data: duplicateCheck, error: duplicateError } = await supabase
          .from('templates_importacao')
          .select('id, nome')
          .eq('empresa_id', existingTemplate.empresa_id)
          .eq('nome', updateData.nome)
          .neq('id', id);

        if (duplicateError) {
          console.error('🔧 Erro ao verificar duplicação de nome:', duplicateError);
        } else if (duplicateCheck && duplicateCheck.length > 0) {
          throw new Error(`Já existe um template com o nome "${updateData.nome}" nesta empresa`);
        }
      }

      // Executar atualização no Supabase
      console.log('🔧 Dados que serão enviados para atualização:', JSON.stringify(updateData, null, 2));
      console.log('🔧 ID do template para atualização:', id);
      
      const { data, error } = await supabase
        .from('templates_importacao')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      console.log('🔧 Resposta do Supabase - data:', data);
      console.log('🔧 Resposta do Supabase - error:', error);

      if (error) {
        console.error('🔧 Erro na atualização do template:', error);
        console.error('🔧 Tipo do erro:', typeof error);
        console.error('🔧 Chaves do erro:', Object.keys(error));
        console.error('🔧 JSON do erro:', JSON.stringify(error, null, 2));
        
        // Criar mensagem de erro mais descritiva
        let errorMessage = 'Erro ao atualizar template';
        
        if (error?.message) {
          errorMessage = error.message;
        } else if (error?.details) {
          errorMessage = error.details;
        } else if (error?.code) {
          errorMessage = `Erro código ${error.code}`;
        }
        
        throw new Error(errorMessage);
      }
      
      console.log('✅ Template atualizado com sucesso:', data);
      setTemplates(prev => prev.map(t => t.id === id ? data : t));
      return { success: true, data };
    } catch (err) {
      console.error('❌ Erro ao atualizar template:', err);
      
      let errorMessage = 'Erro ao atualizar template';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (err && typeof err === 'object' && 'message' in err) {
        errorMessage = (err as any).message;
      }

      // Tratar erros específicos do Supabase
      if (errorMessage.includes('duplicate key value violates unique constraint')) {
        errorMessage = 'Já existe um template com esse nome nesta empresa';
      } else if (errorMessage.includes('permission denied') || errorMessage.includes('RLS')) {
        errorMessage = 'Você não tem permissão para editar este template';
      } else if (errorMessage.includes('foreign key constraint')) {
        errorMessage = 'Um ou mais campos selecionados não são válidos';
      }
      
      return { success: false, error: errorMessage };
    }
  };

  return {
    templates,
    loading,
    error,
    createTemplate, 
    updateTemplate: updateTemplateNew, 
    deleteTemplate,
    refetch: fetchTemplates
  };
}
