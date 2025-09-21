import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/auth-context';

// Hook simples para buscar pré-lançamentos
export function usePendingEntries() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userData } = useAuth();

  const fetchPendingEntries = async () => {
    console.log('🚀 INICIANDO fetchPendingEntries');
    
    try {
      setLoading(true);
      setError(null);
      
      // Verificar sessão do Supabase diretamente
      const { data: session } = await supabase.auth.getSession();
      console.log('🔐 Sessão atual:', session?.session?.user?.id || 'Não autenticado');
      
      if (!session?.session?.user?.id) {
        console.log('❌ Usuário não autenticado no Supabase');
        setEntries([]);
        setError('Usuário não autenticado');
        return;
      }

      console.log('🔍 BUSCANDO PRÉ-LANÇAMENTOS DO USUÁRIO AUTENTICADO...');
      
      // Declarar variáveis
      let data: any[] = [];
      let dbError: any = null;
      
      try {
        // Tentativa 1: Usar usuario_id/empresa_id se existirem
        const { data: userData } = await supabase
          .from('usuarios')
          .select('empresa_id')
          .eq('id', session.session.user.id)
          .single();

        if (userData?.empresa_id) {
          const result = await supabase
            .from('pre_lancamentos')
            .select('*, empresa_id, usuario_id')
            .eq('empresa_id', userData.empresa_id)
            .order('data_criacao', { ascending: false });
          
          if (!result.error) {
            data = result.data || [];
            console.log('✅ Usado consulta por empresa_id');
          } else {
            throw new Error('Colunas novas não existem ainda');
          }
        }
      } catch (err) {
        // Tentativa 2: Usar método tradicional via lotes
        console.log('🔄 Usando método tradicional via lotes...');
        const result = await supabase
          .from('pre_lancamentos')
          .select('*')
          .order('data_criacao', { ascending: false });
        
        data = result.data || [];
        dbError = result.error;
      }

      if (dbError) {
        console.error('❌ Erro ao buscar pré-lançamentos:', dbError);
        setError(`Erro: ${dbError.message}`);
        return;
      }

      console.log('✅ PRÉ-LANÇAMENTOS ENCONTRADOS:', data.length);
      if (data.length > 0) {
        console.log('📋 Primeiro pré-lançamento:', data[0]);
        console.log('📊 Distribuição por status:', {
          pendente: data.filter(e => e.status_aprovacao === 'pendente').length,
          aprovado: data.filter(e => e.status_aprovacao === 'aprovado').length,
          rejeitado: data.filter(e => e.status_aprovacao === 'rejeitado').length,
        });
      }
      
      setEntries(data);
    } catch (err) {
      console.error('❌ ERRO:', err);
      setError(`Erro: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingEntries();
  }, []);

  const approveEntry = async (entryId: string) => {
    if (!userData?.id) return { success: false, error: 'Usuário não autenticado' };

    try {
      const { error } = await supabase
        .from('pre_lancamentos')
        .update({
          status_aprovacao: 'aprovado',
          usuario_aprovacao: userData.id,
          data_aprovacao: new Date().toISOString(),
        })
        .eq('id', entryId);

      if (error) throw error;
      
      // Atualizar lista local
      setEntries(prev => prev.map(entry => 
        entry.id === entryId 
          ? { ...entry, status_aprovacao: 'aprovado', usuario_aprovacao: userData.id, data_aprovacao: new Date().toISOString() }
          : entry
      ));
      
      return { success: true };
    } catch (err) {
      console.error('Erro ao aprovar lançamento:', err);
      return { success: false, error: 'Erro ao aprovar lançamento' };
    }
  };

  const rejectEntry = async (entryId: string, reason?: string) => {
    if (!userData?.id) return { success: false, error: 'Usuário não autenticado' };

    try {
      const { error } = await supabase
        .from('pre_lancamentos')
        .update({
          status_aprovacao: 'rejeitado',
          usuario_aprovacao: userData.id,
          data_aprovacao: new Date().toISOString(),
          motivo_rejeicao: reason,
        })
        .eq('id', entryId);

      if (error) throw error;

      // Atualizar lista local
      setEntries(prev => prev.map(entry => 
        entry.id === entryId 
          ? { ...entry, status_aprovacao: 'rejeitado', usuario_aprovacao: userData.id, data_aprovacao: new Date().toISOString(), motivo_rejeicao: reason }
          : entry
      ));
      
      return { success: true };
    } catch (err) {
      console.error('Erro ao rejeitar lançamento:', err);
      return { success: false, error: 'Erro ao rejeitar lançamento' };
    }
  };

  return { 
    preEntries: entries, 
    loading, 
    error, 
    approveEntry, 
    rejectEntry, 
    refetch: fetchPendingEntries 
  };
}