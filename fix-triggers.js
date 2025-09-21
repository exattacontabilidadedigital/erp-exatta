// Script para verificar e corrigir triggers da tabela templates_importacao
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAndFixTriggers() {
  console.log('🔍 Verificando triggers da tabela templates_importacao...\n');

  try {
    // Verificar triggers existentes
    const { data: triggers, error: triggerError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          t.trigger_name,
          t.action_timing,
          t.event_manipulation,
          p.prosrc as function_body
        FROM information_schema.triggers t
        LEFT JOIN pg_proc p ON p.proname = t.action_statement
        WHERE t.event_object_table = 'templates_importacao';
      `
    });

    if (triggerError) {
      console.log('⚠️ Não foi possível verificar triggers via RPC. Tentando outra abordagem...');
      
      // Tentar fazer a atualização diretamente via SQL bruto
      console.log('🔄 Tentando atualização direta...');
      
      const { data: directUpdate, error: directError } = await supabase.rpc('exec_sql', {
        sql: `
          UPDATE templates_importacao 
          SET empresa_id = '15bdcc8f-e7a5-41ce-bc2b-403f78f64236'
          WHERE id = '8216991b-d47d-467d-9185-88818b0722dd';
        `
      });

      if (directError) {
        console.error('❌ Erro na atualização direta:', directError);
        
        // Vamos tentar desabilitar temporariamente os triggers
        console.log('🔧 Tentando desabilitar triggers...');
        
        const { error: disableError } = await supabase.rpc('exec_sql', {
          sql: `ALTER TABLE templates_importacao DISABLE TRIGGER ALL;`
        });

        if (disableError) {
          console.error('❌ Erro ao desabilitar triggers:', disableError);
        } else {
          console.log('✅ Triggers desabilitados. Tentando atualização...');
          
          const { data: updateResult, error: updateError } = await supabase
            .from('templates_importacao')
            .update({ empresa_id: '15bdcc8f-e7a5-41ce-bc2b-403f78f64236' })
            .eq('id', '8216991b-d47d-467d-9185-88818b0722dd')
            .select();

          if (updateError) {
            console.error('❌ Erro na atualização:', updateError);
          } else {
            console.log('✅ Atualização realizada com sucesso!');
            console.log('Resultado:', updateResult);
          }

          // Reabilitar triggers
          console.log('🔧 Reabilitando triggers...');
          const { error: enableError } = await supabase.rpc('exec_sql', {
            sql: `ALTER TABLE templates_importacao ENABLE TRIGGER ALL;`
          });

          if (enableError) {
            console.error('❌ Erro ao reabilitar triggers:', enableError);
          } else {
            console.log('✅ Triggers reabilitados.');
          }
        }
      } else {
        console.log('✅ Atualização direta realizada com sucesso!');
      }
    } else {
      console.log('📋 Triggers encontrados:', triggers);
    }

    // Verificar resultado final
    console.log('\n📋 Verificando resultado final...');
    const { data: finalCheck, error: finalError } = await supabase
      .from('templates_importacao')
      .select('id, nome, empresa_id, updated_at')
      .eq('id', '8216991b-d47d-467d-9185-88818b0722dd')
      .single();

    if (finalError) {
      console.error('❌ Erro ao verificar resultado:', finalError);
    } else {
      console.log('✅ Template atualizado:');
      console.log(`   Nome: ${finalCheck.nome}`);
      console.log(`   ID: ${finalCheck.id}`);
      console.log(`   Nova empresa_id: ${finalCheck.empresa_id}`);
      console.log(`   Atualizado em: ${finalCheck.updated_at}`);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkAndFixTriggers();