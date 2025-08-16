"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, FileText, Download, X } from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface ContasImportModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ContasImportModal({ isOpen, onClose }: ContasImportModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedConta, setSelectedConta] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const file = event.dataTransfer.files[0]
    if (
      file &&
      (file.type === "text/csv" ||
        file.name.endsWith(".csv") ||
        file.name.endsWith(".ofx") ||
        file.name.endsWith(".txt"))
    ) {
      setSelectedFile(file)
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

  const handleImport = async () => {
    if (!selectedFile || !selectedConta) return

    setIsUploading(true)
    setUploadProgress(0)

    // Simular upload
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsUploading(false)
          onClose()
          return 100
        }
        return prev + 10
      })
    }, 200)
  }

  const downloadModelo = () => {
    const modeloCSV = `Data,Descrição,Valor,Tipo,Saldo
15/12/2024,Depósito em dinheiro,1500.00,C,52500.00
14/12/2024,TED recebida - Cliente ABC,2500.00,C,51000.00
13/12/2024,Pagamento fornecedor XYZ,-800.00,D,48500.00
12/12/2024,Taxa de manutenção,-25.00,D,49300.00`

    const blob = new Blob([modeloCSV], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", "modelo_extrato.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const resetModal = () => {
    setSelectedFile(null)
    setSelectedConta("")
    setIsUploading(false)
    setUploadProgress(0)
  }

  const handleClose = () => {
    resetModal()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Importar Extrato Bancário
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Seleção da Conta */}
          <div className="space-y-2">
            <Label htmlFor="conta">Conta Bancária</Label>
            <Select value={selectedConta} onValueChange={setSelectedConta}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a conta bancária" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bb001">Banco do Brasil - CC 12345-6</SelectItem>
                <SelectItem value="itau001">Itaú - CP 67890-1</SelectItem>
                <SelectItem value="santander001">Santander - CC 54321-0</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Upload de Arquivo */}
          <div className="space-y-2">
            <Label>Arquivo do Extrato</Label>
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              {selectedFile ? (
                <div className="flex items-center justify-center space-x-2">
                  <FileText className="w-8 h-8 text-blue-500" />
                  <div>
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedFile(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div>
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">Arraste o arquivo aqui ou clique para selecionar</p>
                  <p className="text-sm text-gray-500">Formatos aceitos: CSV, OFX, TXT</p>
                </div>
              )}
            </div>
            <Input
              type="file"
              accept=".csv,.ofx,.txt"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <Label htmlFor="file-upload" className="cursor-pointer">
              <Button variant="outline" className="w-full bg-transparent" asChild>
                <span>Selecionar Arquivo</span>
              </Button>
            </Label>
          </div>

          {/* Modelo CSV */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900">Precisa de um modelo?</p>
                <p className="text-xs text-blue-700">Baixe o modelo CSV com o formato esperado</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadModelo}
                className="text-blue-600 border-blue-200 hover:bg-blue-100 bg-transparent"
              >
                <Download className="w-4 h-4 mr-1" />
                Modelo
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Importando extrato...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}

          {/* Botões */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={handleClose} disabled={isUploading}>
              Cancelar
            </Button>
            <Button onClick={handleImport} disabled={!selectedFile || !selectedConta || isUploading}>
              {isUploading ? "Importando..." : "Importar Extrato"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
