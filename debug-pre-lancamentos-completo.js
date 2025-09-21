const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hjgrirpojhbzegdjukfm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqZ3JpcnBvamhiemVnZGp1a2ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA1NjI5ODUsImV4cCI6MjA0NjEzODk4NX0.Lzjcp-BFJxKLTLTgdG1NCgfQs1-G5d4t9DpXGwJIj_M';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugPreLancamentos() {
  console.log('🔍 Debug completo de pré-lançamentos...');
  
  try {
    // 1. Verificar se existem pré-lançamentos
    console.log('\n1. Verificando todos os pré-lançamentos...');
    const { data: allEntries, error: allError } = await supabase
      .from('pre_lancamentos')
      .select('*')
      .limit(10);

    if (allError) {
      console.error('❌ Erro ao buscar pré-lançamentos:', allError);
      return;
    }

    console.log('📊 Total de pré-lançamentos:', allEntries?.length || 0);
    if (allEntries && allEntries.length > 0) {
      console.log('📋 Primeiro pré-lançamento:');
      console.log(JSON.stringify(allEntries[0], null, 2));
      
      // Verificar lote_ids únicos
      const loteIds = [...new Set(allEntries.map(e => e.lote_id))];
      console.log('📋 Lotes únicos nos pré-lançamentos:', loteIds);
    }

    // 2. Verificar lotes_importacao
    console.log('\n2. Verificando lotes de importação...');
    const { data: allLotes, error: lotesError } = await supabase
      .from('lotes_importacao')
      .select('*')
      .limit(10);

    if (lotesError) {
      console.error('❌ Erro ao buscar lotes:', lotesError);
      return;
    }

    console.log('📊 Total de lotes:', allLotes?.length || 0);
    if (allLotes && allLotes.length > 0) {
      console.log('📋 Primeiro lote:');
      console.log(JSON.stringify(allLotes[0], null, 2));
      
      // Verificar usuários únicos
      const usuarios = [...new Set(allLotes.map(l => l.usuario_upload))];
      console.log('📋 Usuários únicos nos lotes:', usuarios);
    }

    // 3. Verificar relação entre lotes e pré-lançamentos
    if (allEntries && allLotes && allEntries.length > 0 && allLotes.length > 0) {
      console.log('\n3. Verificando relacionamento...');
      
      const loteIdFromPreLancamento = allEntries[0].lote_id;
      const loteEncontrado = allLotes.find(l => l.id === loteIdFromPreLancamento);
      
      console.log('🔗 Lote ID do primeiro pré-lançamento:', loteIdFromPreLancamento);
      console.log('🔗 Lote encontrado:', loteEncontrado ? 'SIM' : 'NÃO');
      
      if (loteEncontrado) {
        console.log('👤 Usuário do lote:', loteEncontrado.usuario_upload);
      }
    }

    // 4. Simular busca como no frontend
    console.log('\n4. Simulando busca do frontend...');
    const usuarioTeste = 'ecf8085f-bbcc-4bfc-b691-1dd83872433e'; // ID do usuário dos dados

    const { data: userBatches, error: batchError } = await supabase
      .from('lotes_importacao')
      .select('id, nome_arquivo, data_upload, usuario_upload')
      .eq('usuario_upload', usuarioTeste);

    if (batchError) {
      console.error('❌ Erro ao buscar lotes do usuário:', batchError);
      return;
    }

    console.log('📋 Lotes do usuário', usuarioTeste, ':', userBatches?.length || 0);
    if (userBatches && userBatches.length > 0) {
      console.log('📋 Lotes encontrados:', userBatches);
      
      const batchIds = userBatches.map(batch => batch.id);
      
      // Buscar pré-lançamentos desses lotes
      const { data: userEntries, error: entriesError } = await supabase
        .from('pre_lancamentos')
        .select('*')
        .in('lote_id', batchIds);

      if (entriesError) {
        console.error('❌ Erro ao buscar pré-lançamentos do usuário:', entriesError);
      } else {
        console.log('✅ Pré-lançamentos do usuário:', userEntries?.length || 0);
        if (userEntries && userEntries.length > 0) {
          console.log('📊 Status dos pré-lançamentos:');
          const statusCount = {};
          userEntries.forEach(e => {
            statusCount[e.status_aprovacao] = (statusCount[e.status_aprovacao] || 0) + 1;
          });
          console.log(statusCount);
        }
      }
    } else {
      console.log('⚠️ Nenhum lote encontrado para o usuário');
    }

  } catch (err) {
    console.error('❌ Erro geral:', err);
  }
}

debugPreLancamentos();