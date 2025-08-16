"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Upload, FileText, X, CheckCircle, AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface LancamentosImportModalProps {
  isOpen: boolean
  onClose: () => void
}

export function LancamentosImportModal({ isOpen, onClose }: LancamentosImportModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (file: File) => {
    const allowedTypes = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ]

    if (allowedTypes.includes(file.type)) {
      setSelectedFile(file)
      setUploadStatus("idle")
    } else {
      alert("Formato de arquivo não suportado. Use CSV ou Excel (.xlsx, .xls)")
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setUploadProgress(0)

    // Simulação de upload
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsUploading(false)
          setUploadStatus("success")
          return 100
        }
        return prev + 10
      })
    }, 200)
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setUploadStatus("idle")
    setUploadProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleClose = () => {
    setSelectedFile(null)
    setUploadStatus("idle")
    setUploadProgress(0)
    setIsUploading(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    onClose()
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const downloadModeloCSV = () => {
    const headers = [
      "Data",
      "Tipo",
      "Numero_Documento",
      "Plano_Conta",
      "Centro_Custo",
      "Valor",
      "Cliente_Fornecedor",
      "Conta_Bancaria",
      "Historico",
      "Status",
    ]

    const exemploLinha = [
      "01/12/2024",
      "Receita",
      "NF-001",
      "3.1.01 - Vendas de Produtos",
      "Vendas",
      "1500.00",
      "Cliente ABC Ltda",
      "Banco do Brasil - CC 12345",
      "Venda de produtos conforme NF 001",
      "Pendente",
    ]

    const csvContent = [headers.join(","), exemploLinha.join(",")].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)

    link.setAttribute("href", url)
    link.setAttribute("download", "modelo_lancamentos.csv")
    link.style.visibility = "hidden"

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Importar Lançamentos</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Área de upload */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-600 mb-2">Arraste e solte seu arquivo aqui ou</p>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
              Selecionar Arquivo
            </Button>
            <Input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileInputChange}
              className="hidden"
            />
            <p className="text-xs text-gray-500 mt-2">Formatos suportados: CSV, Excel (.xlsx, .xls)</p>
          </div>

          {/* Arquivo selecionado */}
          {selectedFile && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-8 h-8 text-blue-500" />
                    <div>
                      <p className="font-medium text-sm">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
                    </div>
                  </div>
                  {uploadStatus === "idle" && (
                    <Button variant="ghost" size="icon" onClick={handleRemoveFile} disabled={isUploading}>
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                  {uploadStatus === "success" && <CheckCircle className="w-5 h-5 text-green-500" />}
                  {uploadStatus === "error" && <AlertCircle className="w-5 h-5 text-red-500" />}
                </div>

                {/* Barra de progresso */}
                {isUploading && (
                  <div className="mt-3">
                    <Progress value={uploadProgress} className="h-2" />
                    <p className="text-xs text-gray-500 mt-1">Importando... {uploadProgress}%</p>
                  </div>
                )}

                {/* Status de sucesso */}
                {uploadStatus === "success" && (
                  <div className="mt-3 p-2 bg-green-50 rounded text-sm text-green-700">
                    ✓ Arquivo importado com sucesso! 150 lançamentos processados.
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Instruções */}
          <div className="text-xs text-gray-500 space-y-1">
            <p>
              <strong>Formato esperado:</strong>
            </p>
            <p>
              • Data, Tipo, Número Documento, Plano Conta, Centro Custo, Valor, Cliente/Fornecedor, Conta Bancária,
              Histórico, Status
            </p>
            <p>• Primeira linha deve conter os cabeçalhos</p>
            <p>• Datas no formato DD/MM/AAAA</p>
            <p>• Valores no formato 0000.00 (sem separador de milhares)</p>

            <div className="pt-2">
              <Button
                variant="link"
                className="h-auto p-0 text-xs text-blue-600 hover:text-blue-800"
                onClick={downloadModeloCSV}
              >
                📥 Baixar modelo CSV
              </Button>
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={handleClose} disabled={isUploading}>
              Cancelar
            </Button>
            <Button onClick={handleUpload} disabled={!selectedFile || isUploading || uploadStatus === "success"}>
              {isUploading ? "Importando..." : "Importar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
