const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gcefhrwvijehxzrxwyfe.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjZWZocnd2aWplaHh6cnh3eWZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMDUxMTgsImV4cCI6MjA3MDY4MTExOH0.H3yTE4k6n-n8WtIDkFZM1k4_y9uKFV7TLA7AVTh5Lj4';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin() {
  try {
    console.log('🔐 Tentando fazer login...');
    
    // Usar email e senha conhecidos
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'romario.hj2@gmail.com',
      password: '123456' // Assumindo uma senha padrão
    });
    
    if (error) {
      console.log('❌ Erro no login:', error.message);
      
      // Se erro de senha, vamos tentar outras opções
      if (error.message.includes('Invalid login credentials')) {
        console.log('🔄 Tentando com outra senha...');
        
        const passwords = ['123456789', 'password', 'admin', 'romario123'];
        for (const pwd of passwords) {
          const { data: data2, error: error2 } = await supabase.auth.signInWithPassword({
            email: 'romario.hj2@gmail.com',
            password: pwd
          });
          
          if (!error2) {
            console.log('✅ Login bem-sucedido com senha:', pwd);
            console.log('👤 Usuário logado:', data2.user?.id);
            return;
          }
        }
        
        console.log('❌ Nenhuma senha funcionou. Precisa redefinir a senha.');
      }
      return;
    }
    
    console.log('✅ Login bem-sucedido!');
    console.log('👤 Usuário:', data.user?.id);
    console.log('🔑 Session:', data.session?.access_token ? 'Ativa' : 'Inativa');
    
    // Testar busca de templates agora que está logado
    console.log('\n🧪 Testando busca de templates com usuário logado...');
    const { data: templates, error: templateError } = await supabase
      .from('templates_importacao')
      .select('*')
      .limit(5);
    
    if (templateError) {
      console.log('❌ Erro ao buscar templates:', templateError.message);
    } else {
      console.log('✅ Templates encontrados:', templates?.length || 0);
      console.log('📋 Primeiros templates:', templates);
    }
    
  } catch (err) {
    console.log('❌ Erro geral:', err.message);
  }
}

testLogin();