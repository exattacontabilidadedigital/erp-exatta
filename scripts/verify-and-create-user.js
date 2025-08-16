import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function verifyAndCreateUser() {
  const email = "exattagestaocontabil@gmail.com"
  const password = "123@Mudar"

  try {
    console.log("🔍 Verificando se usuário existe no auth...")

    // Verificar se usuário existe no auth
    const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers()

    if (listError) {
      console.error("❌ Erro ao listar usuários:", listError)
      return
    }

    const existingAuthUser = authUsers.users.find((user) => user.email === email)

    if (existingAuthUser) {
      console.log("✅ Usuário já existe no auth:", existingAuthUser.id)
    } else {
      console.log("⚠️ Usuário não existe no auth. Criando...")

      // Criar usuário no auth
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true, // Confirma email automaticamente
      })

      if (createError) {
        console.error("❌ Erro ao criar usuário no auth:", createError)
        return
      }

      console.log("✅ Usuário criado no auth:", newUser.user.id)
    }

    // Verificar se usuário existe na tabela usuarios
    const { data: dbUser, error: dbError } = await supabase.from("usuarios").select("*").eq("email", email).single()

    if (dbError && dbError.code !== "PGRST116") {
      console.error("❌ Erro ao verificar usuário na tabela:", dbError)
      return
    }

    if (dbUser) {
      console.log("✅ Usuário existe na tabela usuarios:", dbUser.id)
    } else {
      console.log("⚠️ Usuário não existe na tabela usuarios. Criando...")

      // Buscar primeira empresa
      const { data: empresa, error: empresaError } = await supabase
        .from("empresas")
        .select("id, razao_social")
        .eq("ativo", true)
        .limit(1)
        .single()

      if (empresaError) {
        console.error("❌ Erro ao buscar empresa:", empresaError)
        return
      }

      // Criar usuário na tabela
      const { data: newDbUser, error: insertError } = await supabase
        .from("usuarios")
        .insert({
          nome: "Usuário Teste",
          email: email,
          telefone: "(11) 99999-9999",
          cargo: "Administrador",
          role: "admin",
          empresa_id: empresa.id,
          permissoes: {
            lancamentos: { criar: true, editar: true, excluir: true, visualizar: true },
            relatorios: { criar: true, editar: true, excluir: true, visualizar: true },
            configuracoes: { criar: true, editar: true, excluir: true, visualizar: true },
          },
          ativo: true,
        })
        .select()
        .single()

      if (insertError) {
        console.error("❌ Erro ao criar usuário na tabela:", insertError)
        return
      }

      console.log("✅ Usuário criado na tabela usuarios:", newDbUser.id)
      console.log("✅ Associado à empresa:", empresa.razao_social)
    }

    console.log("🎉 Verificação completa! Usuário pronto para login.")
  } catch (error) {
    console.error("❌ Erro geral:", error)
  }
}

verifyAndCreateUser()
