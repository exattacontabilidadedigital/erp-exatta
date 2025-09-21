const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gcefhrwvijehxzrxwyfe.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjZWZocnd2aWplaHh6cnh3eWZlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEwNTExOCwiZXhwIjoyMDcwNjgxMTE4fQ.T0mh9T780CqwYOuNVTJuftfdQ-_1ErbRZBF-K5o2IGU';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function resetPassword() {
  try {
    console.log('🔐 Redefinindo senha para romario.hj2@gmail.com...');
    
    const userId = 'ecf8085f-bbcc-4bfc-b691-1dd83872433e';
    const newPassword = '123456';
    
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword
    });
    
    if (error) {
      console.log('❌ Erro ao redefinir senha:', error.message);
      return;
    }
    
    console.log('✅ Senha redefinida com sucesso!');
    console.log('🔑 Nova senha:', newPassword);
    console.log('👤 Usuário:', data.user?.email);
    
    // Agora testar o login
    console.log('\n🧪 Testando login com nova senha...');
    
    const supabaseClient = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjZWZocnd2aWplaHh6cnh3eWZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMDUxMTgsImV4cCI6MjA3MDY4MTExOH0.H3yTE4k6n-n8WtIDkFZM1k4_y9uKFV7TLA7AVTh5Lj4');
    
    const { data: loginData, error: loginError } = await supabaseClient.auth.signInWithPassword({
      email: 'romario.hj2@gmail.com',
      password: newPassword
    });
    
    if (loginError) {
      console.log('❌ Erro no login:', loginError.message);
    } else {
      console.log('✅ Login bem-sucedido!');
      console.log('👤 ID do usuário logado:', loginData.user?.id);
      
      // Testar busca de templates
      console.log('\n🎯 Testando busca de templates...');
      const { data: templates, error: templateError } = await supabaseClient
        .from('templates_importacao')
        .select('*');
      
      if (templateError) {
        console.log('❌ Erro ao buscar templates:', templateError.message);
      } else {
        console.log('✅ Templates encontrados:', templates?.length || 0);
        templates?.forEach(t => {
          console.log('  -', t.nome, '(Empresa:', t.empresa_id + ')');
        });
      }
    }
    
  } catch (err) {
    console.log('❌ Erro geral:', err.message);
  }
}

resetPassword();