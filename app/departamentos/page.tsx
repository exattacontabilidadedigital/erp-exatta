"use client"

import { useState } from "react"
import { DepartamentosForm } from "@/components/departamentos/departamentos-form"
import { DepartamentosList } from "@/components/departamentos/departamentos-list"
import { DepartamentosDeleteModal } from "@/components/departamentos/departamentos-delete-modal"

export default function DepartamentosPage() {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedDepartamento, setSelectedDepartamento] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<any>(null)

  const handleEditar = (dep: any) => {
    setIsEditing(true)
    setEditData(dep)
  }
  const handleExcluir = (dep: any) => {
    setSelectedDepartamento(dep)
    setIsDeleteModalOpen(true)
  }
  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false)
    setSelectedDepartamento(null)
  }
  const handleSuccess = () => {
    setIsEditing(false)
    setEditData(null)
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Departamentos</h1>
      <div className="mb-8">
        <DepartamentosForm onSuccess={handleSuccess} initialData={editData} isEditing={isEditing} />
      </div>
      <DepartamentosList onEditar={handleEditar} onExcluir={handleExcluir} />
      <DepartamentosDeleteModal isOpen={isDeleteModalOpen} onClose={handleCloseDeleteModal} departamento={selectedDepartamento} />
    </div>
  )
}
