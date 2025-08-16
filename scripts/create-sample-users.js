import { createClient } from "@supabase/supabase-js"

// Configuração do Supabase Admin (usar service role key)
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Usuários de exemplo para criar
const sampleUsers = [
  {
    email: "admin@techsolutions.com.br",
    password: "admin123",
    nome: "João Silva",
    telefone: "(11) 99999-1111",
    cargo: "Administrador",
    role: "admin",
    empresa_id: null, // Será definido após inserir empresas
  },
  {
    email: "contador@techsolutions.com.br",
    password: "contador123",
    nome: "Maria Santos",
    telefone: "(11) 99999-2222",
    cargo: "Contador",
    role: "contador",
    empresa_id: null,
  },
  {
    email: "usuario@techsolutions.com.br",
    password: "usuario123",
    nome: "Pedro Oliveira",
    telefone: "(11) 99999-3333",
    cargo: "Assistente Financeiro",
    role: "usuario",
    empresa_id: null,
  },
]

async function createSampleUsers() {
  console.log("Iniciando criação de usuários de exemplo...")

  // Primeiro, buscar uma empresa para associar os usuários
  const { data: empresas, error: empresasError } = await supabase.from("empresas").select("id").limit(1)

  if (empresasError || !empresas || empresas.length === 0) {
    console.error("Erro: Nenhuma empresa encontrada. Execute primeiro o script de empresas.")
    return
  }

  const empresaId = empresas[0].id

  for (const userData of sampleUsers) {
    try {
      // 1. Criar usuário no Auth do Supabase
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true, // Confirmar email automaticamente
      })

      if (authError) {
        console.error(`Erro ao criar usuário ${userData.email}:`, authError.message)
        continue
      }

      console.log(`✓ Usuário criado no Auth: ${userData.email}`)

      // 2. Inserir dados complementares na tabela usuarios
      const { error: dbError } = await supabase.from("usuarios").insert({
        id: authUser.user.id,
        email: userData.email,
        nome: userData.nome,
        telefone: userData.telefone,
        cargo: userData.cargo,
        role: userData.role,
        empresa_id: empresaId,
        ativo: true,
        permissoes: getPermissoesPorRole(userData.role),
      })

      if (dbError) {
        console.error(`Erro ao inserir dados do usuário ${userData.email}:`, dbError.message)
        continue
      }

      console.log(`✓ Dados do usuário inseridos na tabela: ${userData.email}`)
    } catch (error) {
      console.error(`Erro geral ao criar usuário ${userData.email}:`, error.message)
    }
  }

  console.log("Criação de usuários concluída!")
}

function getPermissoesPorRole(role) {
  const permissoes = {
    admin: {
      lancamentos: { criar: true, editar: true, excluir: true, visualizar: true },
      relatorios: { criar: true, editar: true, excluir: true, visualizar: true },
      contas: { criar: true, editar: true, excluir: true, visualizar: true },
      plano_contas: { criar: true, editar: true, excluir: true, visualizar: true },
      centro_custos: { criar: true, editar: true, excluir: true, visualizar: true },
      usuarios: { criar: true, editar: true, excluir: true, visualizar: true },
      configuracoes: { criar: true, editar: true, excluir: true, visualizar: true },
    },
    contador: {
      lancamentos: { criar: true, editar: true, excluir: true, visualizar: true },
      relatorios: { criar: true, editar: false, excluir: false, visualizar: true },
      contas: { criar: true, editar: true, excluir: false, visualizar: true },
      plano_contas: { criar: true, editar: true, excluir: false, visualizar: true },
      centro_custos: { criar: true, editar: true, excluir: false, visualizar: true },
      usuarios: { criar: false, editar: false, excluir: false, visualizar: true },
      configuracoes: { criar: false, editar: true, excluir: false, visualizar: true },
    },
    usuario: {
      lancamentos: { criar: true, editar: false, excluir: false, visualizar: true },
      relatorios: { criar: false, editar: false, excluir: false, visualizar: true },
      contas: { criar: false, editar: false, excluir: false, visualizar: true },
      plano_contas: { criar: false, editar: false, excluir: false, visualizar: true },
      centro_custos: { criar: false, editar: false, excluir: false, visualizar: true },
      usuarios: { criar: false, editar: false, excluir: false, visualizar: false },
      configuracoes: { criar: false, editar: false, excluir: false, visualizar: false },
    },
  }

  return permissoes[role] || permissoes.usuario
}

// Executar o script
createSampleUsers().catch(console.error)
