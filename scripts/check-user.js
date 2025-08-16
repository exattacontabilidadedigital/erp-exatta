const { createClient } = require("@supabase/supabase-js")

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkUser() {
  try {
    console.log("Verificando usuário: exattagestaocontabil@gmail.com")

    // Verificar se o usuário existe na tabela usuarios
    const { data: usuario, error: userError } = await supabase
      .from("usuarios")
      .select(`
        *,
        empresas (
          id,
          razao_social,
          nome_fantasia,
          ativo
        )
      `)
      .eq("email", "exattagestaocontabil@gmail.com")
      .single()

    if (userError) {
      console.log("Erro ao buscar usuário na tabela usuarios:", userError.message)
    } else {
      console.log("Usuário encontrado na tabela usuarios:", usuario)
    }

    // Verificar se o usuário existe no Supabase Auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

    if (authError) {
      console.log("Erro ao listar usuários do auth:", authError.message)
    } else {
      const authUser = authUsers.users.find((u) => u.email === "exattagestaocontabil@gmail.com")
      if (authUser) {
        console.log("Usuário encontrado no Supabase Auth:", {
          id: authUser.id,
          email: authUser.email,
          email_confirmed_at: authUser.email_confirmed_at,
          created_at: authUser.created_at,
        })
      } else {
        console.log("Usuário NÃO encontrado no Supabase Auth")
      }
    }
  } catch (error) {
    console.error("Erro geral:", error)
  }
}

checkUser()
