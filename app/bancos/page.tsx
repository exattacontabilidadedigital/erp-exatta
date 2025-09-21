"use client"

import { useState } from "react"
import { BancosHeader } from "@/components/bancos/bancos-header"
import { BancosList } from "@/components/bancos/bancos-list"
import { BancosModal } from "@/components/bancos/bancos-modal"
import { BancosDeleteModal } from "@/components/bancos/bancos-delete-modal"

interface Banco {
  id: string
  [key: string]: any
}

export default function BancosPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedBanco, setSelectedBanco] = useState<Banco | null>(null)

  const handleNovoBanco = () => {
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  const handleEditBanco = (banco: Banco) => {
    setSelectedBanco(banco)
    setIsEditModalOpen(true)
  }

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false)
    setSelectedBanco(null)
  }

  const handleDeleteBanco = (banco: Banco) => {
    setSelectedBanco(banco)
    setIsDeleteModalOpen(true)
  }

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false)
    setSelectedBanco(null)
  }

  const handleConfirmDelete = async () => {
    if (!selectedBanco?.id) {
      handleCloseDeleteModal()
      return
    }
    // Real delete from Supabase
    const { error } = await import("@/lib/supabase/client").then(({ supabase }) =>
      supabase.from("bancos").delete().eq("id", selectedBanco.id)
    )
    if (error) {
      alert("Erro ao excluir banco: " + error.message)
    }
    handleCloseDeleteModal()
    // Trigger refresh
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("bancosAtualizado"))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
        <BancosHeader onNovoBanco={handleNovoBanco} />
        <main className="container mx-auto px-4 py-6">
          <BancosList onEdit={handleEditBanco} onDelete={handleDeleteBanco} />
        </main>
        <BancosModal isOpen={isModalOpen} onClose={handleCloseModal} />
        <BancosModal isOpen={isEditModalOpen} onClose={handleCloseEditModal} banco={selectedBanco} isEditing={true} />
        <BancosDeleteModal
          isOpen={isDeleteModalOpen}
          onClose={handleCloseDeleteModal}
          onConfirm={handleConfirmDelete}
          banco={selectedBanco}
        />
      </div>  )
}
