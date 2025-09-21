const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hjgrirpojhbzegdjukfm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqZ3JpcnBvamhiemVnZGp1a2ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA1NjI5ODUsImV4cCI6MjA0NjEzODk4NX0.Lzjcp-BFJxKLTLTgdG1NCgfQs1-G5d4t9DpXGwJIj_M';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createTemplatesTable() {
  console.log('🔧 Criando tabela templates_importacao...');
  
  try {
    const createTableSQL = `
      create table public.templates_importacao (
        id uuid not null default gen_random_uuid (),
        empresa_id uuid not null,
        nome character varying(255) not null,
        descricao_padrao character varying(500) null,
        regex_padrao character varying(500) null,
        plano_conta_id uuid null,
        centro_custo_id uuid null,
        cliente_fornecedor_id uuid null,
        conta_bancaria_id uuid null,
        categoria character varying(100) null,
        limite_confianca numeric(3, 2) null default 0.80,
        confirmacao_automatica boolean null default false,
        ativo boolean null default true,
        created_at timestamp with time zone null default now(),
        updated_at timestamp with time zone null default now(),
        constraint templates_importacao_pkey primary key (id),
        constraint uk_templates_importacao_empresa_nome unique (empresa_id, nome),
        constraint templates_importacao_conta_bancaria_id_fkey foreign KEY (conta_bancaria_id) references contas_bancarias (id) on delete RESTRICT,
        constraint templates_importacao_empresa_id_fkey foreign KEY (empresa_id) references empresas (id) on delete CASCADE,
        constraint templates_importacao_plano_conta_id_fkey foreign KEY (plano_conta_id) references plano_contas (id) on delete RESTRICT,
        constraint templates_importacao_centro_custo_id_fkey foreign KEY (centro_custo_id) references centro_custos (id) on delete RESTRICT,
        constraint templates_importacao_cliente_fornecedor_id_fkey foreign KEY (cliente_fornecedor_id) references clientes_fornecedores (id) on delete set null,
        constraint templates_importacao_limite_confianca_check check (
          (
            (limite_confianca >= (0)::numeric)
            and (limite_confianca <= (1)::numeric)
          )
        )
      );
    `;

    const createIndexesSQL = `
      create index IF not exists idx_templates_importacao_empresa on public.templates_importacao using btree (empresa_id);
      create index IF not exists idx_templates_importacao_padrao on public.templates_importacao using btree (descricao_padrao);
      create index IF not exists idx_templates_importacao_ativo on public.templates_importacao using btree (ativo);
      create index IF not exists idx_templates_importacao_categoria on public.templates_importacao using btree (categoria);
    `;

    // Verificar se a tabela já existe
    const { data: tables } = await supabase
      .rpc('get_table_info', { table_name: 'templates_importacao' })
      .single();

    if (tables) {
      console.log('⚠️ Tabela templates_importacao já existe');
      return;
    }

    // Executar SQL usando rpc
    const { data, error } = await supabase.rpc('execute_sql', {
      sql_query: createTableSQL + createIndexesSQL
    });

    if (error) {
      console.error('❌ Erro ao criar tabela:', error);
      return;
    }

    console.log('✅ Tabela templates_importacao criada com sucesso!');

    // Testar inserção
    const testTemplate = {
      empresa_id: 'cf764510-7038-4e64-ae14-1eefef7fcdbd', // Substitua pelo ID da sua empresa
      nome: 'Template Teste',
      descricao_padrao: 'Template para teste',
      categoria: 'teste',
      limite_confianca: 0.8,
      confirmacao_automatica: false,
      ativo: true
    };

    const { data: insertData, error: insertError } = await supabase
      .from('templates_importacao')
      .insert(testTemplate)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Erro ao inserir template de teste:', insertError);
    } else {
      console.log('✅ Template de teste inserido:', insertData);
      
      // Remover template de teste
      await supabase
        .from('templates_importacao')
        .delete()
        .eq('id', insertData.id);
      
      console.log('🗑️ Template de teste removido');
    }

  } catch (err) {
    console.error('❌ Erro geral:', err);
  }
}

createTemplatesTable();