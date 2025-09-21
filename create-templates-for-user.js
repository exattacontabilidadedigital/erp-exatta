const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gcefhrwvijehxzrxwyfe.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjZWZocnd2aWplaHh6cnh3eWZlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEwNTExOCwiZXhwIjoyMDcwNjgxMTE4fQ.T0mh9T780CqwYOuNVTJuftfdQ-_1ErbRZBF-K5o2IGU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTemplatesForUser() {
  console.log('🏗️ Criando templates para a empresa do usuário romario.hj2@gmail.com...');
  
  const empresaId = '15bdcc8f-e7a5-41ce-bc2b-403f78f64236';
  
  const templates = [
    {
      empresa_id: empresaId,
      nome: 'PIX Recebimento',
      descricao_padrao: 'PIX RECEBIDO',
      regex_padrao: '.*(PIX|RECEBIDO).*',
      categoria: 'Receitas',
      limite_confianca: 0.85,
      confirmacao_automatica: false,
      ativo: true
    },
    {
      empresa_id: empresaId,
      nome: 'Pagamento Fornecedor',
      descricao_padrao: 'PAGAMENTO FORNECEDOR',
      regex_padrao: '.*(PAGAMENTO|FORNECEDOR).*',
      categoria: 'Despesas',
      limite_confianca: 0.80,
      confirmacao_automatica: false,
      ativo: true
    },
    {
      empresa_id: empresaId,
      nome: 'Transferência Bancária',
      descricao_padrao: 'TED TRANSFERENCIA',
      regex_padrao: '.*(TED|TRANSFERENCIA).*',
      categoria: 'Transferências',
      limite_confianca: 0.75,
      confirmacao_automatica: true,
      ativo: true
    }
  ];

  try {
    const { data, error } = await supabase
      .from('templates_importacao')
      .insert(templates)
      .select();

    if (error) {
      console.error('❌ Erro ao criar templates:', error);
      return;
    }

    console.log('✅ Templates criados com sucesso:');
    data.forEach((template, index) => {
      console.log(`${index + 1}. ${template.nome} (ID: ${template.id})`);
    });

    // Verificar se os templates foram criados
    const { data: allTemplates, error: fetchError } = await supabase
      .from('templates_importacao')
      .select('*')
      .eq('empresa_id', empresaId);

    if (fetchError) {
      console.error('❌ Erro ao verificar templates:', fetchError);
    } else {
      console.log(`\n📊 Total de templates para empresa ${empresaId}: ${allTemplates?.length || 0}`);
    }

  } catch (err) {
    console.error('❌ Erro geral:', err);
  }
}

createTemplatesForUser();