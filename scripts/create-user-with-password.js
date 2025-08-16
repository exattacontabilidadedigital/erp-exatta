const { createClient } = require("@supabase/supabase-js")

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function createUserWithPassword() {
  try {
    console.log("Criando usuário no Supabase Auth...")

    // Criar usuário no sistema de autenticação do Supabase
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: "exattagestaocontabil@gmail.com",
      password: "R@102030",
      email_confirm: true, // Confirma o email automaticamente
    })

    if (authError) {
      console.error("Erro ao criar usuário no auth:", authError)
      return
    }

    console.log("Usuário criado no auth:", authData.user.id)

    // Verificar se já existe empresa
    const { data: empresas, error: empresaError } = await supabase
      .from("empresas")
      .select("*")
      .ilike("nome", "%exatta%")
      .limit(1)

    if (empresaError) {
      console.error("Erro ao buscar empresa:", empresaError)
      return
    }

    let empresaId

    if (empresas && empresas.length > 0) {
      empresaId = empresas[0].id
      console.log("Empresa encontrada:", empresas[0].nome)
    } else {
      // Criar nova empresa
      const { data: novaEmpresa, error: novaEmpresaError } = await supabase
        .from("empresas")
        .insert({
          nome: "Exatta Gestão Contábil",
          cnpj: `temp_${Date.now()}`,
          email: "exattagestaocontabil@gmail.com",
          telefone: "(11) 99999-9999",
          endereco: "São Paulo, SP",
          regime_tributario: "simples_nacional",
          ativo: true,
        })
        .select()
        .single()

      if (novaEmpresaError) {
        console.error("Erro ao criar empresa:", novaEmpresaError)
        return
      }

      empresaId = novaEmpresa.id
      console.log("Nova empresa criada:", novaEmpresa.nome)
    }

    // Criar usuário na tabela usuarios
    const { data: userData, error: userError } = await supabase
      .from("usuarios")
      .insert({
        id: authData.user.id,
        nome: "Administrador Exatta",
        email: "exattagestaocontabil@gmail.com",
        telefone: "(11) 99999-9999",
        cargo: "Administrador",
        role: "admin",
        empresa_id: empresaId,
        permissoes: {
          lancamentos: { criar: true, editar: true, excluir: true, visualizar: true },
          relatorios: { criar: true, editar: true, excluir: true, visualizar: true },
          usuarios: { criar: true, editar: true, excluir: true, visualizar: true },
          configuracoes: { criar: true, editar: true, excluir: true, visualizar: true },
        },
        ativo: true,
      })
      .select()

    if (userError) {
      console.error("Erro ao criar usuário na tabela:", userError)
      return
    }

    console.log("✅ Usuário criado com sucesso!")
    console.log("📧 Email: exattagestaocontabil@gmail.com")
    console.log("🔑 Senha: R@102030")
    console.log("🏢 Empresa:", empresaId)
    console.log("👤 Role: admin")
  } catch (error) {
    console.error("Erro geral:", error)
  }
}

createUserWithPassword()
