"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Upload, Download, CheckCircle, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface PlanoContasImportModalProps {
  isOpen: boolean
  onClose: () => void
}

export function PlanoContasImportModal({ isOpen, onClose }: PlanoContasImportModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)

  const handleFileSelect = (selectedFile: File) => {
    if (
      selectedFile &&
      (selectedFile.type === "text/csv" ||
        selectedFile.name.endsWith(".csv") ||
        selectedFile.type === "application/vnd.ms-excel")
    ) {
      setFile(selectedFile)
    } else {
      alert("Por favor, selecione apenas arquivos CSV ou Excel (.csv, .xls, .xlsx)")
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      handleFileSelect(droppedFile)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
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
          alert("Plano de contas importado com sucesso!")
          onClose()
          return 100
        }
        return prev + 10
      })
    }, 200)
  }

  const downloadModelo = () => {
    const headers = ["Código", "Nome", "Tipo", "Nível", "Conta Pai", "Descrição"]
    const exemploData = [
      ["1", "ATIVO", "Ativo", "1", "", "Bens e direitos da empresa"],
      ["1.1", "ATIVO CIRCULANTE", "Ativo", "2", "1", "Bens e direitos realizáveis até 12 meses"],
      ["1.1.01", "Caixa e Equivalentes", "Ativo", "3", "1.1", "Disponibilidades imediatas"],
      ["2", "PASSIVO", "Passivo", "1", "", "Obrigações da empresa"],
      ["3", "PATRIMÔNIO LÍQUIDO", "Patrimônio Líquido", "1", "", "Recursos próprios da empresa"],
      ["4", "RECEITAS", "Receita", "1", "", "Entradas de recursos"],
      ["5", "DESPESAS", "Despesa", "1", "", "Saídas de recursos"],
    ]

    const csvContent = [headers.join(","), ...exemploData.map((row) => row.map((cell) => `"${cell}"`).join(","))].join(
      "\n",
    )

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", "modelo_plano_contas.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Importar Plano de Contas
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Área de Upload */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragOver ? "border-blue-500 bg-blue-50" : "border-gray-300"
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            {file ? (
              <div className="space-y-2">
                <CheckCircle className="w-8 h-8 text-green-500 mx-auto" />
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                <p className="text-sm text-gray-600">Arraste o arquivo aqui ou clique para selecionar</p>
                <p className="text-xs text-gray-500">Formatos aceitos: CSV, Excel (.csv, .xls, .xlsx)</p>
              </div>
            )}
          </div>

          {/* Input de arquivo */}
          <div>
            <Label htmlFor="file-upload">Selecionar Arquivo</Label>
            <Input
              id="file-upload"
              type="file"
              accept=".csv,.xls,.xlsx"
              onChange={(e) => {
                const selectedFile = e.target.files?.[0]
                if (selectedFile) {
                  handleFileSelect(selectedFile)
                }
              }}
              className="mt-1"
            />
          </div>

          {/* Progresso do Upload */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Importando...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {/* Instruções */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Formato esperado:</strong>
              <br />• Código, Nome, Tipo, Nível, Conta Pai, Descrição
              <br />• Tipos aceitos: Ativo, Passivo, Patrimônio Líquido, Receita, Despesa
              <br />• Nível indica a hierarquia (1, 2, 3, 4...)
            </AlertDescription>
          </Alert>

          {/* Link para baixar modelo */}
          <div className="flex justify-center">
            <Button variant="link" size="sm" onClick={downloadModelo} className="text-blue-600 hover:text-blue-800">
              <Download className="w-4 h-4 mr-1" />
              Baixar modelo CSV
            </Button>
          </div>

          {/* Botões */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleImport} disabled={!file || uploading}>
              {uploading ? "Importando..." : "Importar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
