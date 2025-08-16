"use client"

import { useState } from "react"
import { UsuariosHeader } from "@/components/usuarios/usuarios-header"
import { UsuariosList } from "@/components/usuarios/usuarios-list"
import { UsuariosModal } from "@/components/usuarios/usuarios-modal"
import { UsuariosDeleteModal } from "@/components/usuarios/usuarios-delete-modal"

export default function UsuariosPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedUsuario, setSelectedUsuario] = useState<any>(null)

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
  }

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false)
    setSelectedUsuario(null)
  }

  return (
    <div className="space-y-6">
      <UsuariosHeader onNovoUsuario={handleNovoUsuario} />

      <UsuariosList onEditarUsuario={handleEditarUsuario} onExcluirUsuario={handleExcluirUsuario} />

      <UsuariosModal isOpen={isModalOpen} onClose={handleCloseModal} usuario={null} isEditing={false} />

      <UsuariosModal isOpen={isEditModalOpen} onClose={handleCloseModal} usuario={selectedUsuario} isEditing={true} />

      <UsuariosDeleteModal isOpen={isDeleteModalOpen} onClose={handleCloseDeleteModal} usuario={selectedUsuario} />
    </div>
  )
}
