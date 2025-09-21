// Script para melhorar os dados dos templates
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateTemplateData() {
  console.log('🔄 Melhorando dados dos templates...\n');

  const empresaId = '15bdcc8f-e7a5-41ce-bc2b-403f78f64236';

  try {
    // Templates com dados corretos
    const templatesData = [
      {
        nome: 'Pagamento Fornecedor',
        descricao_padrao: 'FORNECEDOR|PAGTO|PAGAMENTO',
        regex_padrao: '.*(FORNECEDOR|PAGTO|PAGAMENTO).*',
        categoria: 'despesa',
        limite_confianca: 0.75
      },
      {
        nome: 'Recebimento Cliente',
        descricao_padrao: 'RECEBTO|CREDITO|DEPOSITO',
        regex_padrao: '.*(RECEBTO|CREDITO|DEPOSITO).*',
        categoria: 'receita',
        limite_confianca: 0.80
      },
      {
        nome: 'Transferência PIX',
        descricao_padrao: 'PIX|TED|DOC',
        regex_padrao: '.*(PIX|TED|DOC).*',
        categoria: 'transferencia',
        limite_confianca: 0.90
      }
    ];

    // Buscar templates atuais
    const { data: currentTemplates, error: fetchError } = await supabase
      .from('templates_importacao')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('nome', { ascending: true });

    if (fetchError) {
      console.error('❌ Erro ao buscar templates:', fetchError);
      return;
    }

    console.log('📋 Templates atuais:');
    currentTemplates?.forEach((template, index) => {
      console.log(`${index + 1}. ${template.nome}`);
      console.log(`   Categoria: ${template.categoria || 'VAZIA'}`);
      console.log(`   Regex: ${template.regex_padrao || 'VAZIO'}`);
      console.log('');
    });

    // Atualizar cada template
    for (const template of currentTemplates || []) {
      const templateData = templatesData.find(t => t.nome === template.nome);
      
      if (templateData) {
        console.log(`🔄 Atualizando: ${template.nome}`);

        // Usar método delete+insert para evitar problemas de trigger
        try {
          // Deletar template atual
          const { error: deleteError } = await supabase
            .from('templates_importacao')
            .delete()
            .eq('id', template.id);

          if (deleteError) {
            console.error(`❌ Erro ao deletar ${template.nome}:`, deleteError);
            continue;
          }

          // Inserir template atualizado
          const updatedTemplate = {
            id: template.id, // Manter o mesmo ID
            empresa_id: empresaId,
            nome: templateData.nome,
            descricao_padrao: templateData.descricao_padrao,
            regex_padrao: templateData.regex_padrao,
            categoria: templateData.categoria,
            limite_confianca: templateData.limite_confianca,
            confirmacao_automatica: template.confirmacao_automatica || false,
            ativo: true,
            plano_conta_id: null,
            centro_custo_id: null,
            cliente_fornecedor_id: null,
            conta_bancaria_id: null
          };

          const { data: insertResult, error: insertError } = await supabase
            .from('templates_importacao')
            .insert([updatedTemplate])
            .select()
            .single();

          if (insertError) {
            console.error(`❌ Erro ao inserir ${template.nome}:`, insertError);
            continue;
          }

          console.log(`✅ ${template.nome} atualizado com sucesso!`);

        } catch (error) {
          console.error(`❌ Erro geral com ${template.nome}:`, error);
        }
      }
    }

    // Verificar resultado final
    console.log('\n📋 Verificando resultado final...');
    const { data: finalTemplates, error: finalError } = await supabase
      .from('templates_importacao')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('nome', { ascending: true });

    if (finalError) {
      console.error('❌ Erro ao verificar resultado:', finalError);
      return;
    }

    console.log(`\n✅ Templates atualizados (${finalTemplates?.length || 0}):`);
    finalTemplates?.forEach((template, index) => {
      console.log(`${index + 1}. ${template.nome}`);
      console.log(`   Categoria: ${template.categoria}`);
      console.log(`   Padrão: ${template.descricao_padrao}`);
      console.log(`   Regex: ${template.regex_padrao}`);
      console.log(`   Confiança: ${template.limite_confianca}`);
      console.log(`   Ativo: ${template.ativo}`);
      console.log('');
    });

    console.log('🎉 Atualização concluída!');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

updateTemplateData();