"use client"

import { useState } from "react"
import { ResponsaveisForm } from "@/components/responsaveis/responsaveis-form"
import { ResponsaveisList } from "@/components/responsaveis/responsaveis-list"
import { ResponsaveisDeleteModal } from "@/components/responsaveis/responsaveis-delete-modal"

export default function ResponsaveisPage() {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedResponsavel, setSelectedResponsavel] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<any>(null)

  const handleEditar = (resp: any) => {
    setIsEditing(true)
    setEditData(resp)
  }
  const handleExcluir = (resp: any) => {
    setSelectedResponsavel(resp)
    setIsDeleteModalOpen(true)
  }
  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false)
    setSelectedResponsavel(null)
  }
  const handleSuccess = () => {
    setIsEditing(false)
    setEditData(null)
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Responsáveis</h1>
      <div className="mb-8">
        <ResponsaveisForm onSuccess={handleSuccess} initialData={editData} isEditing={isEditing} />
      </div>
      <ResponsaveisList onEditar={handleEditar} onExcluir={handleExcluir} />
      <ResponsaveisDeleteModal isOpen={isDeleteModalOpen} onClose={handleCloseDeleteModal} responsavel={selectedResponsavel} />
    </div>
  )
}
