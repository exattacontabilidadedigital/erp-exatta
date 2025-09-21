// Script para verificar estrutura da tabela empresas
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkEmpresasStructure() {
  console.log('🔍 Verificando estrutura da tabela empresas...\n');

  try {
    // Buscar algumas empresas para ver as colunas disponíveis
    const { data: empresas, error } = await supabase
      .from('empresas')
      .select('*')
      .limit(3);

    if (error) {
      console.error('❌ Erro ao buscar empresas:', error);
      return;
    }

    if (empresas && empresas.length > 0) {
      console.log('📋 Colunas disponíveis na tabela empresas:');
      const firstEmpresa = empresas[0];
      Object.keys(firstEmpresa).forEach((col, index) => {
        console.log(`${index + 1}. ${col}: ${typeof firstEmpresa[col]} (${firstEmpresa[col]})`);
      });

      console.log('\n📋 Todas as empresas encontradas:');
      empresas.forEach((empresa, index) => {
        console.log(`${index + 1}. ID: ${empresa.id}`);
        // Tentar diferentes possíveis colunas de nome
        const possibleNames = ['nome', 'razao_social', 'nome_fantasia', 'empresa_nome'];
        possibleNames.forEach(nameCol => {
          if (empresa[nameCol]) {
            console.log(`   ${nameCol}: ${empresa[nameCol]}`);
          }
        });
        console.log('');
      });
    } else {
      console.log('❌ Nenhuma empresa encontrada.');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkEmpresasStructure();