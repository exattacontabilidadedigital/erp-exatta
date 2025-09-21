import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTemplateUpdate() {
  console.log('🧪 === TESTE DE ATUALIZAÇÃO DE TEMPLATE ===');
  
  try {
    // 1. Verificar autenticação (simulando o que o app faz)
    const { data: session } = await supabase.auth.getSession();
    console.log('🔍 Sessão atual:', session?.session?.user?.id ? 'Autenticado' : 'Não autenticado');
    
    // 2. Listar templates existentes
    console.log('🔍 Listando templates existentes...');
    const { data: templates, error: listError } = await supabase
      .from('templates_importacao')
      .select('id, nome, empresa_id')
      .limit(5);
    
    if (listError) {
      console.error('❌ Erro ao listar templates:', listError);
      return;
    }
    
    console.log('📋 Templates encontrados:', templates);
    
    if (!templates || templates.length === 0) {
      console.log('ℹ️ Nenhum template encontrado para testar');
      return;
    }
    
    // 3. Tentar atualizar o primeiro template
    const templateToUpdate = templates[0];
    console.log('🎯 Template selecionado para teste:', templateToUpdate);
    
    const updateData = {
      nome: templateToUpdate.nome,
      descricao_padrao: 'Teste de atualização - ' + new Date().toISOString(),
      ativo: true
    };
    
    console.log('📝 Dados de atualização:', updateData);
    
    const { data: updateResult, error: updateError } = await supabase
      .from('templates_importacao')
      .update(updateData)
      .eq('id', templateToUpdate.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ ERRO NA ATUALIZAÇÃO:');
      console.error('Tipo do erro:', typeof updateError);
      console.error('Erro completo:', updateError);
      console.error('Mensagem:', updateError.message);
      console.error('Detalhes:', updateError.details);
      console.error('Código:', updateError.code);
      console.error('JSON stringified:', JSON.stringify(updateError, null, 2));
    } else {
      console.log('✅ Atualização bem-sucedida:', updateResult);
    }
    
  } catch (error) {
    console.error('💥 Erro não capturado:', error);
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  testTemplateUpdate().then(() => {
    console.log('🏁 Teste concluído');
    process.exit(0);
  });
}

export { testTemplateUpdate };