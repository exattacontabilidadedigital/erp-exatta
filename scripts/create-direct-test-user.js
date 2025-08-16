import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Variáveis de ambiente do Supabase não encontradas")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function createTestUser() {
  try {
    console.log("Criando usuário de teste...")

    // Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: "exattagestaocontabil@gmail.com",
      password: "123@Mudar",
      email_confirm: true,
    })

    if (authError) {
      console.error("Erro ao criar usuário no auth:", authError)
      return
    }

    console.log("Usuário criado no auth:", authData.user.id)

    // Verificar se já existe empresa
    const { data: empresaData } = await supabase
      .from("empresas")
      .select("id")
      .eq("nome", "Exatta Gestão Contábil")
      .single()

    let empresaId = empresaData?.id

    // Se não existe, criar empresa
    if (!empresaId) {
      const { data: novaEmpresa, error: empresaError } = await supabase
        .from("empresas")
        .insert({
          nome: "Exatta Gestão Contábil",
          razao_social: "Exatta Gestão Contábil Ltda",
          cnpj: "12345678000199",
          email: "exattagestaocontabil@gmail.com",
          telefone: "(11) 99999-9999",
          endereco: "Rua Teste, 123",
          cidade: "São Paulo",
          estado: "SP",
          cep: "01234-567",
          regime_tributario: "simples_nacional",
          ativo: true,
        })
        .select("id")
        .single()

      if (empresaError) {
        console.error("Erro ao criar empresa:", empresaError)
        return
      }

      empresaId = novaEmpresa.id
      console.log("Empresa criada:", empresaId)
    }

    // Inserir usuário na tabela usuarios
    const { error: userError } = await supabase.from("usuarios").insert({
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
        configuracoes: { criar: true, editar: true, excluir: true, visualizar: true },
        usuarios: { criar: true, editar: true, excluir: true, visualizar: true },
      },
      ativo: true,
    })

    if (userError) {
      console.error("Erro ao inserir usuário na tabela:", userError)
      return
    }

    console.log("✅ Usuário de teste criado com sucesso!")
    console.log("Email: exattagestaocontabil@gmail.com")
    console.log("Senha: 123@Mudar")
  } catch (error) {
    console.error("Erro geral:", error)
  }
}

createTestUser()
