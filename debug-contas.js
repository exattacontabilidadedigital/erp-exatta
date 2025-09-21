const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkContas() {
  console.log('🔍 Verificando contas bancárias...');
  
  try {
    // Primeiro, vamos ver todas as contas
    const { data: allContas, error } = await supabase
      .from('contas_bancarias')
      .select('*');
    
    if (error) {
      console.log('❌ Erro ao buscar contas:', error.message);
      return;
    }
    
    console.log(`📊 Total de contas encontradas: ${allContas?.length || 0}`);
    
    if (allContas && allContas.length > 0) {
      console.log('📋 Primeiras 3 contas:');
      allContas.slice(0, 3).forEach((conta, index) => {
        console.log(`${index + 1}. ID: ${conta.id}, Empresa: ${conta.empresa_id}, Banco: ${conta.banco_id}`);
      });
      
      // Vamos verificar também as empresas
      const { data: empresas, error: empresaError } = await supabase
        .from('empresas')
        .select('id, nome');
        
      if (!empresaError && empresas) {
        console.log(`\n🏢 Empresas cadastradas: ${empresas.length}`);
        empresas.forEach((empresa, index) => {
          console.log(`${index + 1}. ID: ${empresa.id}, Nome: ${empresa.nome}`);
        });
      }
    } else {
      console.log('🚫 Nenhuma conta bancária encontrada');
    }
    
  } catch (error) {
    console.log('💥 Erro inesperado:', error.message);
  }
}

checkContas();