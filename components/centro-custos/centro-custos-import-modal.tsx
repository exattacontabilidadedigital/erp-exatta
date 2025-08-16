"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Upload, FileText, Download, CheckCircle } from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface CentroCustosImportModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CentroCustosImportModal({ isOpen, onClose }: CentroCustosImportModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [success, setSuccess] = useState(false)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setSuccess(false)
    }
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const droppedFile = event.dataTransfer.files[0]
    if (droppedFile && (droppedFile.type === "text/csv" || droppedFile.name.endsWith(".csv"))) {
      setFile(droppedFile)
      setSuccess(false)
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

  const handleUpload = async () => {
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
          return 100
        }
        return prev + 10
      })
    }, 200)
  }

  const downloadModeloCsv = () => {
    const csvContent = `codigo,nome,responsavel,orcamento,descricao,status
001,Administração,João Silva,50000.00,Centro de custo administrativo,ativo
002,Vendas,Maria Santos,75000.00,Centro de custo de vendas,ativo
003,Produção,Carlos Oliveira,100000.00,Centro de custo de produção,ativo`

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", "modelo_centro_custos.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleClose = () => {
    setFile(null)
    setUploading(false)
    setProgress(0)
    setSuccess(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Importar Centro de Custos
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Instruções */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Instruções:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Arquivo deve estar no formato CSV</li>
              <li>• Colunas: código, nome, responsável, orçamento, descrição, status</li>
              <li>• Tamanho máximo: 10MB</li>
            </ul>
            <Button
              variant="link"
              size="sm"
              onClick={downloadModeloCsv}
              className="p-0 h-auto text-blue-600 hover:text-blue-800"
            >
              <Download className="w-4 h-4 mr-1" />
              Baixar modelo CSV
            </Button>
          </div>

          {/* Área de Upload */}
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm text-gray-600 mb-2">Arraste e solte seu arquivo CSV aqui ou</p>
            <input type="file" accept=".csv" onChange={handleFileSelect} className="hidden" id="file-upload" />
            <label htmlFor="file-upload">
              <Button variant="outline" size="sm" asChild>
                <span className="cursor-pointer">Selecionar arquivo</span>
              </Button>
            </label>
          </div>

          {/* Arquivo Selecionado */}
          {file && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium">{file.name}</span>
                </div>
                <span className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</span>
              </div>
            </div>
          )}

          {/* Progresso */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Importando...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {/* Sucesso */}
          {success && (
            <div className="bg-green-50 p-3 rounded-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm text-green-800">Centro de custos importados com sucesso!</span>
            </div>
          )}

          {/* Botões */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button onClick={handleUpload} disabled={!file || uploading || success}>
              {uploading ? "Importando..." : "Importar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
