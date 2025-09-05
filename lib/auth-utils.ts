import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Utilitário para obter user_id para operações de auditoria
 * Tenta obter de diferentes fontes em ordem de prioridade
 */
export async function getUserId(request: NextRequest, empresaId?: string): Promise<string | null> {
  try {
    // 1. Tentar obter do header Authorization (se implementado)
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      // TODO: Implementar quando sistema de JWT/tokens estiver disponível
      // const token = authHeader.replace('Bearer ', '');
      // const decoded = jwt.decode(token);
      // return decoded?.user_id;
    }

    // 2. Tentar obter do header X-User-ID (custom header)
    const userIdHeader = request.headers.get('x-user-id');
    if (userIdHeader) {
      return userIdHeader;
    }

    // 3. Tentar obter de cookie de sessão (se implementado)
    const cookies = request.headers.get('cookie');
    if (cookies) {
      // TODO: Implementar quando sistema de cookies estiver disponível
      // const sessionCookie = cookies.match(/session=([^;]+)/);
      // if (sessionCookie) {
      //   const session = JSON.parse(decodeURIComponent(sessionCookie[1]));
      //   return session.user_id;
      // }
    }

    // 4. Fallback: buscar primeiro usuário ativo da empresa
    if (empresaId) {
      const { data: usuario } = await supabase
        .from('usuarios')
        .select('id')
        .eq('empresa_id', empresaId)
        .eq('ativo', true)
        .limit(1)
        .single();
      
      if (usuario) {
        console.log('🔄 Usando fallback: primeiro usuário ativo da empresa:', usuario.id);
        return usuario.id;
      }
    }

    // 5. Fallback final: buscar qualquer usuário ativo
    const { data: anyUser } = await supabase
      .from('usuarios')
      .select('id')
      .eq('ativo', true)
      .limit(1)
      .single();
    
    if (anyUser) {
      console.log('🔄 Usando fallback: qualquer usuário ativo:', anyUser.id);
      return anyUser.id;
    }

    console.warn('⚠️ Nenhum usuário encontrado para auditoria');
    return null;

  } catch (error) {
    console.error('❌ Erro ao obter user_id:', error);
    return null;
  }
}

/**
 * Utilitário para obter empresa_id da transação bancária
 */
export async function getEmpresaIdFromBankTransaction(bankTransactionId: string): Promise<string | null> {
  try {
    const { data: bankTransaction } = await supabase
      .from('bank_transactions')
      .select('empresa_id')
      .eq('id', bankTransactionId)
      .single();
    
    return bankTransaction?.empresa_id || null;
  } catch (error) {
    console.error('❌ Erro ao obter empresa_id:', error);
    return null;
  }
}
