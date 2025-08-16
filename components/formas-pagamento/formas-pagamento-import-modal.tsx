"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Upload, FileText, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface FormasPagamentoImportModalProps {
  isOpen: boolean
  onClose: () => void
}

export function FormasPagamentoImportModal({ isOpen, onClose }: FormasPagamentoImportModalProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      setSelectedFile(files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleImport = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    // Simular upload
    setTimeout(() => {
      setIsUploading(false)
      setSelectedFile(null)
      onClose()
    }, 2000)
  }

  const downloadModelo = () => {
    const csvData = [
      ["nome", "tipo", "prazo_medio", "taxa_juros", "ativo"],
      ["Exemplo Forma", "dinheiro", "0", "0", "true"],
    ]

    const csvContent = csvData.map((row) => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", "modelo_formas_pagamento.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Importar Formas de Pagamento</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Faça upload de um arquivo CSV com as formas de pagamento.
              <Button
                variant="link"
                className="p-0 h-auto font-normal text-blue-600 hover:text-blue-800"
                onClick={downloadModelo}
              >
                Baixe o modelo aqui
              </Button>
            </AlertDescription>
          </Alert>

          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              isDragOver ? "border-blue-400 bg-blue-50" : "border-gray-300"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-sm text-gray-600 mb-2">Arraste e solte seu arquivo CSV aqui, ou</p>
            <input type="file" accept=".csv" onChange={handleFileSelect} className="hidden" id="file-upload" />
            <label htmlFor="file-upload">
              <Button variant="outline" size="sm" asChild>
                <span>Selecionar arquivo</span>
              </Button>
            </label>
          </div>

          {selectedFile && (
            <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
              <FileText className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-700">{selectedFile.name}</span>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleImport} disabled={!selectedFile || isUploading}>
              {isUploading ? "Importando..." : "Importar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
