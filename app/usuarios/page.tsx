"use client"

import { useState } from "react"
import { UsuariosHeader } from "@/components/usuarios/usuarios-header"
import { UsuariosList } from "@/components/usuarios/usuarios-list"
import { UsuariosModal } from "@/components/usuarios/usuarios-modal"
import { UsuariosDeleteModal } from "@/components/usuarios/usuarios-delete-modal"
import { UsuariosFuncoesModal } from "@/components/usuarios/usuarios-funcoes-modal"
import { UsuariosFuncoesList } from "@/components/usuarios/usuarios-funcoes-list"
import { supabase } from "@/lib/supabase/client"

export default function UsuariosPage() {
  const [funcaoEditando, setFuncaoEditando] = useState<any>(null)
  const [refreshFuncoes, setRefreshFuncoes] = useState(false)
  const [isFuncoesListOpen, setIsFuncoesListOpen] = useState(true)
  // Função para excluir função
  const handleExcluirFuncao = async (funcao: any) => {
    if (!funcao?.id) return
    const { error } = await supabase.from("funcoes").delete().eq("id", funcao.id)
    if (!error) {
      setRefreshFuncoes((prev) => !prev)
      // Exemplo de toast (caso use algum sistema de toast):
      // toast({ title: "Função excluída", description: `Função ${funcao.nome} removida com sucesso.` })
    }
  }

  // Função para editar função (abrir modal de edição)
  const handleEditarFuncao = (funcao: any) => {
    setFuncaoEditando(funcao)
    setIsFuncoesModalOpen(true)
  }
  const [isFuncoesModalOpen, setIsFuncoesModalOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedUsuario, setSelectedUsuario] = useState<any>(null)
  const [refreshUsuarios, setRefreshUsuarios] = useState(false)
  const handleNovoUsuario = () => {
    setSelectedUsuario(null)
    setIsModalOpen(true)
  }

  const handleEditarUsuario = (usuario: any) => {
    setSelectedUsuario(usuario)
    setIsEditModalOpen(true)
  }

  const handleExcluirUsuario = (usuario: any) => {
    setSelectedUsuario(usuario)
    setIsDeleteModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setIsEditModalOpen(false)
    setSelectedUsuario(null)
    setRefreshUsuarios((prev) => !prev)
  }

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false)
    setSelectedUsuario(null)
  }

  // Permissões disponíveis (igual ao modal de usuários)
  const permissoesDisponiveis = [
    { id: "dashboard", label: "Dashboard", descricao: "Visualizar painel principal" },
    { id: "lancamentos", label: "Lançamentos", descricao: "Criar, editar e visualizar lançamentos" },
    { id: "contas", label: "Contas Bancárias", descricao: "Gerenciar contas bancárias" },
    { id: "plano-contas", label: "Plano de Contas", descricao: "Gerenciar plano de contas" },
    { id: "centro-custos", label: "Centro de Custos", descricao: "Gerenciar centros de custos" },
    { id: "fluxo-caixa", label: "Fluxo de Caixa", descricao: "Visualizar fluxo de caixa" },
    { id: "relatorios", label: "Relatórios", descricao: "Gerar e visualizar relatórios" },
    { id: "cadastros", label: "Cadastros", descricao: "Gerenciar cadastros auxiliares" },
    { id: "usuarios", label: "Usuários", descricao: "Gerenciar usuários do sistema" },
    { id: "configuracoes", label: "Configurações", descricao: "Acessar configurações do sistema" },
  ]

  // Função para criar nova função (pode ser adaptada para salvar no banco)
  const handleCreateFuncao = async (funcao: { nome: string; permissoes: string[]; id?: string }) => {
    if (funcao.id) {
      // Editar função existente
      await supabase.from("funcoes").update({ nome: funcao.nome, permissoes: funcao.permissoes }).eq("id", funcao.id)
    } else {
      // Criar nova função
      await supabase.from("funcoes").insert({ nome: funcao.nome, permissoes: funcao.permissoes })
    }
    setRefreshFuncoes((prev) => !prev)
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-8 px-4 md:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <UsuariosHeader onNovoUsuario={handleNovoUsuario} onConfigurarFuncoes={() => setIsFuncoesListOpen((prev) => !prev)} />
        {isFuncoesListOpen && (
          <UsuariosFuncoesList
            onEditar={handleEditarFuncao}
            onExcluir={handleExcluirFuncao}
            refresh={refreshFuncoes}
            onNovoFuncao={() => setIsFuncoesModalOpen(true)}
          />
        )}
        <UsuariosList onEditarUsuario={handleEditarUsuario} onExcluirUsuario={handleExcluirUsuario} refresh={refreshUsuarios} />
        <UsuariosModal isOpen={isModalOpen} onClose={handleCloseModal} usuario={null} isEditing={false} />
        <UsuariosModal isOpen={isEditModalOpen} onClose={handleCloseModal} usuario={selectedUsuario} isEditing={true} />
        <UsuariosDeleteModal isOpen={isDeleteModalOpen} onClose={handleCloseDeleteModal} usuario={selectedUsuario} onDeleted={handleCloseModal} />
        <UsuariosFuncoesModal
          isOpen={isFuncoesModalOpen}
          onClose={() => { setIsFuncoesModalOpen(false); setFuncaoEditando(null); }}
          permissoesDisponiveis={permissoesDisponiveis}
          onCreate={handleCreateFuncao}
          funcaoEditando={funcaoEditando}
        />
      </div>
      </div>
    </>
  )
}
