"use client"

import { useState } from "react"
import { ClientesFornecedoresHeader } from "@/components/clientes-fornecedores/clientes-fornecedores-header"
import { ClientesFornecedoresList } from "@/components/clientes-fornecedores/clientes-fornecedores-list"
import { ClientesFornecedoresModal } from "@/components/clientes-fornecedores/clientes-fornecedores-modal"
import { ClientesFornecedoresImportModal } from "@/components/clientes-fornecedores/clientes-fornecedores-import-modal"
import { ClientesFornecedoresRelatorioModal } from "@/components/clientes-fornecedores/clientes-fornecedores-relatorio-modal"
import { ClientesFornecedoresDeleteModal } from "@/components/clientes-fornecedores/clientes-fornecedores-delete-modal"

export default function ClientesFornecedoresPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [isRelatorioModalOpen, setIsRelatorioModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedClienteFornecedor, setSelectedClienteFornecedor] = useState(null)

  const handleNovoClienteFornecedor = () => {
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  const handleImportar = () => {
    setIsImportModalOpen(true)
  }

  const handleExportar = () => {
    const csvData = [
      [
        "Código",
        "Nome/Razão Social",
        "Tipo",
        "CPF/CNPJ",
        "Email",
        "Telefone",
        "Endereço",
        "Cidade",
        "Estado",
        "CEP",
        "Status",
      ],
      [
        "CLI001",
        "João Silva",
        "Cliente",
        "123.456.789-00",
        "joao@email.com",
        "(11) 99999-9999",
        "Rua A, 123",
        "São Paulo",
        "SP",
        "01234-567",
        "Ativo",
      ],
      [
        "FOR001",
        "Empresa ABC Ltda",
        "Fornecedor",
        "12.345.678/0001-90",
        "contato@abc.com",
        "(11) 3333-4444",
        "Av. B, 456",
        "São Paulo",
        "SP",
        "01234-890",
        "Ativo",
      ],
      [
        "CLI002",
        "Maria Santos",
        "Cliente",
        "987.654.321-00",
        "maria@email.com",
        "(11) 88888-8888",
        "Rua C, 789",
        "Rio de Janeiro",
        "RJ",
        "20123-456",
        "Ativo",
      ],
      [
        "FOR002",
        "Fornecedor XYZ S.A.",
        "Fornecedor",
        "98.765.432/0001-10",
        "vendas@xyz.com",
        "(21) 2222-3333",
        "Rua D, 321",
        "Rio de Janeiro",
        "RJ",
        "20987-654",
        "Inativo",
      ],
    ]

    const csvContent = csvData.map((row) => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `clientes_fornecedores_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleRelatorio = () => {
    setIsRelatorioModalOpen(true)
  }

  const handleEditar = (clienteFornecedor: any) => {
    setSelectedClienteFornecedor(clienteFornecedor)
    setIsEditModalOpen(true)
  }

  const handleExcluir = (clienteFornecedor: any) => {
    setSelectedClienteFornecedor(clienteFornecedor)
    setIsDeleteModalOpen(true)
  }

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false)
    setSelectedClienteFornecedor(null)
  }

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false)
    setSelectedClienteFornecedor(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ClientesFornecedoresHeader
        onNovoClienteFornecedor={handleNovoClienteFornecedor}
        onImportar={handleImportar}
        onExportar={handleExportar}
        onRelatorio={handleRelatorio}
      />

      <main className="container mx-auto px-4 py-6">
        <ClientesFornecedoresList onEditar={handleEditar} onExcluir={handleExcluir} />
      </main>

      <ClientesFornecedoresModal isOpen={isModalOpen} onClose={handleCloseModal} />
      <ClientesFornecedoresModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        clienteFornecedor={selectedClienteFornecedor}
        isEditing={true}
      />
      <ClientesFornecedoresDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        clienteFornecedor={selectedClienteFornecedor}
      />
      <ClientesFornecedoresImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} />
      <ClientesFornecedoresRelatorioModal
        isOpen={isRelatorioModalOpen}
        onClose={() => setIsRelatorioModalOpen(false)}
      />
      </div>  )
}
