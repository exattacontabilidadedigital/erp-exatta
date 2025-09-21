const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gcefhrwvijehxzrxwyfe.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjZWZocnd2aWplaHh6cnh3eWZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMDUxMTgsImV4cCI6MjA3MDY4MTExOH0.H3yTE4k6n-n8WtIDkFZM1k4_y9uKFV7TLA7AVTh5Lj4';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function simulateWebApp() {
  console.log('🌐 Simulando o comportamento da aplicação web...');
  
  try {
    // 1. Fazer login como na aplicação
    console.log('🔐 Fazendo login como contabil@exattacontabilidade.com.br...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'contabil@exattacontabilidade.com.br',
      password: 'R@748596'
    });

    if (authError) {
      console.log('❌ Erro no login:', authError.message);
      return;
    }

    console.log('✅ Login realizado com sucesso');
    console.log('👤 User ID:', authData.user.id);

    // 2. Verificar sessão como o hook faz
    console.log('\n🔍 Verificando sessão do Supabase...');
    const { data: session } = await supabase.auth.getSession();
    console.log('🔐 Sessão obtida:', session?.session?.user?.id || 'Não autenticado');

    // 3. Buscar dados do usuário
    console.log('\n👤 Buscando dados do usuário...');
    const { data: userData, error: userError } = await supabase
      .from('usuarios')
      .select('empresa_id, nome, email')
      .eq('id', session.session.user.id)
      .single();

    if (userError) {
      console.log('❌ Erro ao buscar usuário:', userError.message);
      return;
    }

    console.log('✅ Usuário encontrado:', userData);

    // 4. Simular exatamente a consulta do hook
    console.log('\n🔍 SIMULANDO CONSULTA DO HOOK...');
    
    // Tentativa 1: Usar empresa_id
    try {
      console.log('📊 Tentativa 1: Consulta por empresa_id...');
      const result = await supabase
        .from('pre_lancamentos')
        .select('*, empresa_id, usuario_id')
        .eq('empresa_id', userData.empresa_id)
        .order('data_criacao', { ascending: false });
      
      if (!result.error) {
        console.log('✅ Consulta por empresa_id bem-sucedida');
        console.log('📋 Registros encontrados:', result.data?.length || 0);
        
        if (result.data && result.data.length > 0) {
          console.log('📄 Primeiro registro:', result.data[0]);
        }
      } else {
        console.log('❌ Erro na consulta por empresa_id:', result.error.message);
      }
    } catch (err) {
      console.log('❌ Erro na tentativa 1:', err.message);
      
      // Tentativa 2: Consulta tradicional
      console.log('🔄 Tentativa 2: Consulta tradicional...');
      const result = await supabase
        .from('pre_lancamentos')
        .select('*')
        .order('data_criacao', { ascending: false });
      
      console.log('📋 Registros na consulta tradicional:', result.data?.length || 0);
      console.log('❌ Erro (se houver):', result.error?.message || 'Nenhum');
    }

  } catch (err) {
    console.error('❌ Erro geral:', err.message);
  }
}

simulateWebApp();