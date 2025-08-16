"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Upload, FileText, Download, CheckCircle } from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface ClientesFornecedoresImportModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ClientesFornecedoresImportModal({ isOpen, onClose }: ClientesFornecedoresImportModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [success, setSuccess] = useState(false)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
    }
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const droppedFile = event.dataTransfer.files[0]
    if (droppedFile && (droppedFile.type === "text/csv" || droppedFile.name.endsWith(".csv"))) {
      setFile(droppedFile)
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

  const handleImport = async () => {
    if (!file) return

    setUploading(true)
    setProgress(0)

    // Simular upload
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setUploading(false)
          setSuccess(true)
          setTimeout(() => {
            setSuccess(false)
            setFile(null)
            onClose()
          }, 2000)
          return 100
        }
        return prev + 10
      })
    }, 200)
  }

  const downloadModelo = () => {
    const csvData = [
      [
        "codigo",
        "nome_razao_social",
        "tipo",
        "cpf_cnpj",
        "email",
        "telefone",
        "endereco",
        "cidade",
        "estado",
        "cep",
        "status",
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
    ]

    const csvContent = csvData.map((row) => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", "modelo_clientes_fornecedores.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importar Clientes e Fornecedores
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            <p className="mb-2">Instruções para importação:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Arquivo deve estar no formato CSV</li>
              <li>Primeira linha deve conter os cabeçalhos</li>
              <li>Campos obrigatórios: código, nome, tipo, CPF/CNPJ</li>
              <li>Tipos aceitos: Cliente, Fornecedor</li>
            </ul>

            <Button variant="link" size="sm" onClick={downloadModelo} className="p-0 h-auto mt-2 text-blue-600">
              <Download className="h-3 w-3 mr-1" />
              Baixar modelo CSV
            </Button>
          </div>

          {!success && (
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <div className="space-y-2">
                <p className="text-sm font-medium">{file ? file.name : "Arraste o arquivo CSV aqui"}</p>
                <p className="text-xs text-gray-500">ou</p>
                <label htmlFor="file-upload" className="cursor-pointer">
                  <span className="text-sm text-blue-600 hover:text-blue-500">clique para selecionar</span>
                  <input id="file-upload" type="file" accept=".csv" onChange={handleFileSelect} className="hidden" />
                </label>
              </div>
            </div>
          )}

          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Importando...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {success && (
            <div className="flex items-center justify-center space-x-2 text-green-600 py-4">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Importação concluída com sucesso!</span>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleImport} disabled={!file || uploading || success}>
              {uploading ? "Importando..." : "Importar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
