"use client"

import { useState } from "react"
import { TiposCentroCustosForm } from "@/components/tipos-centro-custos/tipos-centro-custos-form"
import { TiposCentroCustosList } from "@/components/tipos-centro-custos/tipos-centro-custos-list"
import { TiposCentroCustosDeleteModal } from "@/components/tipos-centro-custos/tipos-centro-custos-delete-modal"

export default function TiposCentroCustosPage() {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedTipo, setSelectedTipo] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<any>(null)

  const handleEditar = (tipo: any) => {
    setIsEditing(true)
    setEditData(tipo)
  }
  const handleExcluir = (tipo: any) => {
    setSelectedTipo(tipo)
    setIsDeleteModalOpen(true)
  }
  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false)
    setSelectedTipo(null)
  }
  const handleSuccess = () => {
    setIsEditing(false)
    setEditData(null)
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Tipos de Centro de Custos</h1>
      <div className="mb-8">
        <TiposCentroCustosForm onSuccess={handleSuccess} initialData={editData} isEditing={isEditing} />
      </div>
      <TiposCentroCustosList onEditar={handleEditar} onExcluir={handleExcluir} />
      <TiposCentroCustosDeleteModal isOpen={isDeleteModalOpen} onClose={handleCloseDeleteModal} tipo={selectedTipo} />
    </div>
  )
}
