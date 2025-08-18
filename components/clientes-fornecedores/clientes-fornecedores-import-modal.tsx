"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Upload, FileText, Download, CheckCircle, AlertCircle, X } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useImport } from "@/hooks/use-import"
import { useAuth } from "@/contexts/auth-context"
import { CSVParser } from "@/lib/csv-parser"

interface ClientesFornecedoresImportModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ClientesFornecedoresImportModal({ isOpen, onClose }: ClientesFornecedoresImportModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [importResult, setImportResult] = useState<any>(null)
  const { isImporting, progress, importClientesFornecedores } = useImport()
  const { userData } = useAuth()

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      const validation = CSVParser.validateCSVFile(selectedFile)
      
      if (!validation.valid) {
        alert(validation.error)
        return
      }

      setFile(selectedFile)
      setImportResult(null)
    }
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const droppedFile = event.dataTransfer.files[0]
    if (droppedFile && (droppedFile.type === "text/csv" || droppedFile.name.endsWith(".csv"))) {
      const validation = CSVParser.validateCSVFile(droppedFile)
      
      if (!validation.valid) {
        alert(validation.error)
        return
      }

      setFile(droppedFile)
      setImportResult(null)
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

  const handleImport = async () => {
    if (!file || !userData?.empresa_id) return

    const result = await importClientesFornecedores(file, userData.empresa_id)
    setImportResult(result)

    if (result.success) {
      // Dispara evento para atualizar a lista
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("clientesFornecedoresAtualizado"))
      }
    }
  }

  const handleClose = () => {
    setFile(null)
    setImportResult(null)
    onClose()
  }

  const removeFile = () => {
    setFile(null)
    setImportResult(null)
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
    <Dialog open={isOpen} onOpenChange={handleClose}>
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

          {!importResult?.success && (
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <div className="flex items-center justify-center space-x-2 mb-4">
                <FileText className="h-12 w-12 text-gray-400" />
                {file && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={removeFile}
                    disabled={isImporting}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">{file ? file.name : "Arraste o arquivo CSV aqui"}</p>
                <p className="text-xs text-gray-500">ou</p>
                <label htmlFor="file-upload" className="cursor-pointer">
                  <span className="text-sm text-blue-600 hover:text-blue-500">clique para selecionar</span>
                  <input id="file-upload" type="file" accept=".csv" onChange={handleFileSelect} className="hidden" disabled={isImporting} />
                </label>
              </div>
            </div>
          )}

          {/* Progresso da importação */}
          {isImporting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Importando...</span>
                <span>{progress.percentage}%</span>
              </div>
              <Progress value={progress.percentage} className="w-full" />
              <div className="text-xs text-gray-500">
                {progress.processed} de {progress.total} processados
                {progress.errors > 0 && (
                  <span className="text-red-500 ml-2">({progress.errors} erros)</span>
                )}
              </div>
            </div>
          )}

          {/* Resultado da importação */}
          {importResult && (
            <Alert className={importResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              {importResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={importResult.success ? "text-green-800" : "text-red-800"}>
                <div className="space-y-2">
                  <p>{importResult.message}</p>
                  {importResult.errors.length > 0 && (
                    <details className="text-xs">
                      <summary className="cursor-pointer font-medium">Ver erros ({importResult.errors.length})</summary>
                      <ul className="mt-2 space-y-1 list-disc list-inside">
                        {importResult.errors.slice(0, 5).map((error: string, index: number) => (
                          <li key={index}>{error}</li>
                        ))}
                        {importResult.errors.length > 5 && (
                          <li>... e mais {importResult.errors.length - 5} erro(s)</li>
                        )}
                      </ul>
                    </details>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={handleClose} disabled={isImporting}>
              Cancelar
            </Button>
            <Button onClick={handleImport} disabled={!file || isImporting}>
              {isImporting ? "Importando..." : "Importar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
