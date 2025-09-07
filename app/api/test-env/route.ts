import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    // Verificar se as variáveis de ambiente estão carregadas
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log('🔍 Verificando variáveis de ambiente:');
    console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'DEFINIDA' : 'INDEFINIDA');
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? `DEFINIDA (${supabaseAnonKey.substring(0, 20)}...)` : 'INDEFINIDA');
    console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? `DEFINIDA (${supabaseServiceKey.substring(0, 20)}...)` : 'INDEFINIDA');

    // Testar conexão com Supabase
    if (!supabaseUrl || (!supabaseAnonKey && !supabaseServiceKey)) {
      return NextResponse.json({
        status: 'error',
        error: 'Variáveis de ambiente do Supabase não configuradas',
        environment: {
          supabaseUrl: !!supabaseUrl,
          supabaseAnonKey: !!supabaseAnonKey,
          supabaseServiceKey: !!supabaseServiceKey,
          nodeEnv: process.env.NODE_ENV
        }
      }, { status: 500 });
    }

    // Tentar criar cliente com service role key primeiro, depois anon key
    const supabaseKey = supabaseServiceKey || supabaseAnonKey;
    
    if (!supabaseKey) {
      return NextResponse.json({
        status: 'error',
        error: 'Nenhuma chave Supabase válida encontrada'
      }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔗 Testando conexão com Supabase...');
    
    // Fazer uma consulta simples para testar a conexão
    const { data, error } = await supabase
      .from('empresas')
      .select('id, nome')
      .limit(1);

    if (error) {
      console.error('❌ Erro na consulta Supabase:', error);
      return NextResponse.json({
        status: 'error',
        error: 'Erro ao conectar com Supabase',
        supabaseError: error.message,
        environment: {
          supabaseUrl: !!supabaseUrl,
          supabaseAnonKey: !!supabaseAnonKey,
          supabaseServiceKey: !!supabaseServiceKey,
          usingKey: supabaseServiceKey ? 'service_role' : 'anon'
        }
      }, { status: 500 });
    }

    console.log('✅ Conexão com Supabase funcionando!');

    return NextResponse.json({
      status: 'success',
      environment: {
        supabaseUrl: !!supabaseUrl,
        supabaseAnonKey: !!supabaseAnonKey,
        supabaseServiceKey: !!supabaseServiceKey,
        usingKey: supabaseServiceKey ? 'service_role' : 'anon',
        nodeEnv: process.env.NODE_ENV
      },
      supabaseTest: {
        connected: true,
        empresaCount: data?.length || 0
      },
      message: 'Todas as variáveis de ambiente e conexão Supabase funcionando!'
    });

  } catch (error) {
    console.error('❌ Erro ao verificar variáveis:', error);
    return NextResponse.json(
      { 
        error: 'Erro ao verificar variáveis de ambiente',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      }, 
      { status: 500 }
    );
  }
}
