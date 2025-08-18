"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Upload, Download, CheckCircle, AlertCircle, X, Wrench } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useImport } from "@/hooks/use-import"
import { useAuth } from "@/contexts/auth-context"
import { CSVParser } from "@/lib/csv-parser"
import { EncodingFixer } from "@/lib/fix-encoding"

interface PlanoContasImportModalProps {
  isOpen: boolean
  onClose: () => void
}

export function PlanoContasImportModal({ isOpen, onClose }: PlanoContasImportModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [importResult, setImportResult] = useState<any>(null)
  const [isFixingEncoding, setIsFixingEncoding] = useState(false)
  const [fixEncodingResult, setFixEncodingResult] = useState<any>(null)
  const { isImporting, progress, importPlanoContas } = useImport()
  const { userData } = useAuth()

  const handleFileSelect = (selectedFile: File) => {
    const validation = CSVParser.validateCSVFile(selectedFile)
    
    if (!validation.valid) {
      alert(validation.error)
      return
    }

    setFile(selectedFile)
    setImportResult(null)
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
    if (!file || !userData?.empresa_id) return

    const result = await importPlanoContas(file, userData.empresa_id)
    setImportResult(result)

    if (result.success) {
      // Dispara evento para atualizar a lista
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("planoContasAtualizado"))
      }
    }
  }

  const handleClose = () => {
    setFile(null)
    setImportResult(null)
    setFixEncodingResult(null)
    onClose()
  }

  const removeFile = () => {
    setFile(null)
    setImportResult(null)
  }

  const handleNovaImportacao = () => {
    setFile(null)
    setImportResult(null)
    setFixEncodingResult(null)
  }

  const handleFixEncoding = async () => {
    if (!userData?.empresa_id) return

    setIsFixingEncoding(true)
    try {
      const result = await EncodingFixer.fixPlanoContasEncoding(userData.empresa_id)
      setFixEncodingResult(result)
      
      if (result.success && result.totalFixed > 0) {
        // Dispara evento para atualizar a lista
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("planoContasAtualizado"))
        }
      }
    } catch (error) {
      setFixEncodingResult({
        success: false,
        message: `Erro ao corrigir encoding: ${error}`,
        totalFixed: 0,
        errors: [String(error)]
      })
    } finally {
      setIsFixingEncoding(false)
    }
  }

  const downloadModelo = () => {
    const headers = ["Código", "Nome", "Tipo", "Nível", "Conta Pai", "Descrição"]
    const exemploData = [
      // ATIVO - Nível 1
      ["1", "ATIVO", "ativo", "1", "", "Bens e direitos da empresa"],
      
      // ATIVO CIRCULANTE - Nível 2
      ["1.1", "ATIVO CIRCULANTE", "ativo", "2", "1", "Bens e direitos realizáveis até 12 meses"],
      
      // Caixa e Equivalentes - Nível 3
      ["1.1.01", "Caixa e Equivalentes", "ativo", "3", "1.1", "Disponibilidades imediatas"],
      ["1.1.01.001", "Caixa", "ativo", "4", "1.1.01", "Dinheiro em espécie"],
      ["1.1.01.002", "Bancos Conta Movimento", "ativo", "4", "1.1.01", "Contas correntes bancárias"],
      ["1.1.01.003", "Aplicações Financeiras", "ativo", "4", "1.1.01", "Aplicações de liquidez imediata"],
      
      // Contas a Receber - Nível 3
      ["1.1.02", "Contas a Receber", "ativo", "3", "1.1", "Valores a receber de terceiros"],
      ["1.1.02.001", "Clientes", "ativo", "4", "1.1.02", "Valores a receber de vendas"],
      ["1.1.02.002", "Duplicatas a Receber", "ativo", "4", "1.1.02", "Duplicatas em aberto"],
      
      // ATIVO NÃO CIRCULANTE - Nível 2
      ["1.2", "ATIVO NÃO CIRCULANTE", "ativo", "2", "1", "Bens e direitos realizáveis após 12 meses"],
      ["1.2.01", "Imobilizado", "ativo", "3", "1.2", "Bens de uso da empresa"],
      ["1.2.01.001", "Máquinas e Equipamentos", "ativo", "4", "1.2.01", "Equipamentos utilizados na produção"],
      
      // PASSIVO - Nível 1
      ["2", "PASSIVO", "passivo", "1", "", "Obrigações da empresa"],
      ["2.1", "PASSIVO CIRCULANTE", "passivo", "2", "2", "Obrigações de curto prazo"],
      ["2.1.01", "Fornecedores", "passivo", "3", "2.1", "Valores a pagar por compras"],
      ["2.1.01.001", "Fornecedores Nacionais", "passivo", "4", "2.1.01", "Fornecedores do mercado nacional"],
      
      // PATRIMÔNIO LÍQUIDO - Nível 1
      ["3", "PATRIMÔNIO LÍQUIDO", "patrimonio", "1", "", "Recursos próprios da empresa"],
      ["3.1", "Capital Social", "patrimonio", "2", "3", "Capital investido pelos sócios"],
      ["3.1.01", "Capital Subscrito", "patrimonio", "3", "3.1", "Capital registrado no contrato social"],
      
      // RECEITAS - Nível 1
      ["4", "RECEITAS", "receita", "1", "", "Entradas de recursos"],
      ["4.1", "Receitas Operacionais", "receita", "2", "4", "Receitas das atividades principais"],
      ["4.1.01", "Vendas de Produtos", "receita", "3", "4.1", "Receitas com vendas de produtos"],
      ["4.1.01.001", "Vendas no Mercado Interno", "receita", "4", "4.1.01", "Vendas realizadas no Brasil"],
      
      // DESPESAS - Nível 1
      ["5", "DESPESAS", "despesa", "1", "", "Saídas de recursos"],
      ["5.1", "Despesas Operacionais", "despesa", "2", "5", "Despesas das atividades principais"],
      ["5.1.01", "Custos dos Produtos Vendidos", "despesa", "3", "5.1", "Custos diretos dos produtos"],
      ["5.1.01.001", "Matéria-Prima", "despesa", "4", "5.1.01", "Custos com matéria-prima utilizada"],
    ]

    // Cria conteúdo CSV com BOM UTF-8 para garantir encoding correto
    const BOM = '\uFEFF'
    const csvContent = BOM + [
      headers.join(","), 
      ...exemploData.map((row) => row.map((cell) => `"${cell}"`).join(","))
    ].join("\n")

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
    <Dialog open={isOpen} onOpenChange={handleClose}>
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
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={removeFile}
                    disabled={isImporting}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                <p className="text-sm text-gray-600">Arraste o arquivo aqui ou clique para selecionar</p>
                <p className="text-xs text-gray-500">Formatos aceitos: CSV</p>
              </div>
            )}
          </div>

          {/* Input de arquivo */}
          <div>
            <Label htmlFor="file-upload">Selecionar Arquivo</Label>
            <Input
              id="file-upload"
              type="file"
              accept=".csv"
              onChange={(e) => {
                const selectedFile = e.target.files?.[0]
                if (selectedFile) {
                  handleFileSelect(selectedFile)
                }
              }}
              className="mt-1"
              disabled={isImporting}
            />
          </div>

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

          {/* Correção de Encoding */}
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium">Corrigir Caracteres Especiais</h4>
                <p className="text-xs text-gray-500">
                  Se os dados importados apresentam caracteres como "Aplica��es" em vez de "Aplicações"
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleFixEncoding}
                disabled={isFixingEncoding || isImporting}
                className="flex items-center gap-2"
              >
                <Wrench className="w-4 h-4" />
                {isFixingEncoding ? "Corrigindo..." : "Corrigir"}
              </Button>
            </div>

            {/* Resultado da correção de encoding */}
            {fixEncodingResult && (
              <Alert className={fixEncodingResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                {fixEncodingResult.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription className={fixEncodingResult.success ? "text-green-800" : "text-red-800"}>
                  <p>{fixEncodingResult.message}</p>
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Instruções */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Formato esperado:</strong>
              <br />• Código, Nome, Tipo, Nível, Conta Pai, Descrição
              <br />• <strong>Tipos aceitos:</strong> ativo, passivo, patrimonio, receita, despesa
              <br />• <strong>Nível:</strong> indica a hierarquia (1, 2, 3, 4...)
              <br />• <strong>Conta Pai:</strong> código da conta hierarquicamente superior (vazio para nível 1)
              <br />• <strong>Encoding:</strong> use UTF-8 para caracteres especiais (ç, ã, é, etc.)
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
            <Button variant="outline" onClick={handleClose} disabled={isImporting}>
              {importResult?.success ? "Fechar" : "Cancelar"}
            </Button>
            {importResult?.success && (
              <Button variant="outline" onClick={handleNovaImportacao}>
                Nova Importação
              </Button>
            )}
            <Button 
              onClick={handleImport} 
              disabled={!file || isImporting || (importResult?.success)}
            >
              {isImporting ? "Importando..." : importResult?.success ? "Importação Concluída" : "Importar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
