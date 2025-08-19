"use client"

import { useState, useRef } from 'react'
import { useCentroCustosImport } from '@/hooks/use-centro-custos-import'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle, Upload, FileText, Download } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ImportCentroCustosModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  empresaId: string
  onImportComplete?: () => void
}

export function ImportCentroCustosModal({
  open,
  onOpenChange,
  empresaId,
  onImportComplete
}: ImportCentroCustosModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [importResult, setImportResult] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const { isImporting, progress, importCentroCustos } = useCentroCustosImport()

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setImportResult(null)
    }
  }

  const handleImport = async () => {
    if (!selectedFile) return

    try {
      const result = await importCentroCustos(selectedFile, empresaId)
      setImportResult(result)
      
      if (result.success && onImportComplete) {
        onImportComplete()
      }
    } catch (error) {
      setImportResult({
        success: false,
        message: `Erro inesperado: ${error}`,
        totalProcessed: 0,
        totalErrors: 1,
        errors: [String(error)]
      })
    }
  }

  const handleClose = () => {
    if (!isImporting) {
      setSelectedFile(null)
      setImportResult(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      onOpenChange(false)
    }
  }

  const downloadTemplate = () => {
    const csvContent = [
      'codigo,nome,tipo,nivel,centro_pai,responsavel,departamento,orcamento_mensal,aceita_lancamentos,descricao',
      '001,Administração,administrativo,1,,João Silva,Administração,50000.00,false,Centro de custos administrativos - não recebe lançamentos diretos',
      '001.001,Recursos Humanos,administrativo,2,001,Maria Santos,RH,20000.00,true,Gestão de pessoas',
      '001.002,Contabilidade,administrativo,2,001,Carlos Lima,Contabilidade,15000.00,true,Controles contábeis',
      '002,Produção,operacional,1,,Pedro Costa,Produção,100000.00,false,Centro de produção - centro pai',
      '002.001,Linha A,operacional,2,002,Ana Paula,Produção,60000.00,true,Linha de produção A',
      '002.002,Linha B,operacional,2,002,José Santos,Produção,40000.00,true,Linha de produção B',
      '003,Vendas,vendas,1,,Roberto Silva,Comercial,80000.00,true,Área comercial',
      '004,Financeiro,financeiro,1,,Lucia Ferreira,Financeiro,30000.00,true,Controles financeiros'
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'modelo_centro_custos.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importar Centro de Custos
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações sobre o formato */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">Formato do Arquivo CSV</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p>• <strong>Colunas obrigatórias:</strong> codigo, nome, tipo</p>
              <p>• <strong>Tipos válidos:</strong> operacional, administrativo, vendas, financeiro</p>
              <p>• <strong>Hierarquia:</strong> Use centro_pai para criar sub-centros</p>
              <p>• <strong>Aceita Lançamentos:</strong> true/false (padrão: true)</p>
              <p>• <strong>Nível:</strong> 1 para centros principais, 2+ para sub-centros</p>
              <p>• <strong>Formato:</strong> CSV com separador vírgula ou ponto-e-vírgula</p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={downloadTemplate}
              className="mt-3"
            >
              <Download className="h-4 w-4 mr-2" />
              Baixar Modelo
            </Button>
          </div>

          {/* Seleção de arquivo */}
          <div className="space-y-3">
            <label htmlFor="file-input" className="block text-sm font-medium">
              Selecionar Arquivo CSV
            </label>
            <input
              id="file-input"
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              disabled={isImporting}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 disabled:opacity-50"
            />
            {selectedFile && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FileText className="h-4 w-4" />
                {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </div>
            )}
          </div>

          {/* Progress durante importação */}
          {isImporting && (
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Importando centro de custos...</span>
                <span>{progress.processed} de {progress.total}</span>
              </div>
              <Progress value={progress.percentage} className="w-full" />
              {progress.errors > 0 && (
                <div className="flex items-center gap-2 text-sm text-amber-600">
                  <AlertCircle className="h-4 w-4" />
                  {progress.errors} erro(s) encontrado(s)
                </div>
              )}
            </div>
          )}

          {/* Resultado da importação */}
          {importResult && (
            <Alert className={importResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              <div className="flex items-start gap-3">
                {importResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <AlertDescription>
                    <div className="font-medium mb-2">{importResult.message}</div>
                    <div className="flex gap-4 text-sm">
                      <Badge variant="outline" className="text-green-700">
                        {importResult.totalProcessed} importados
                      </Badge>
                      {importResult.totalErrors > 0 && (
                        <Badge variant="outline" className="text-red-700">
                          {importResult.totalErrors} erros
                        </Badge>
                      )}
                    </div>
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          )}

          {/* Lista de erros */}
          {importResult?.errors && importResult.errors.length > 0 && (
            <div className="max-h-40 overflow-y-auto space-y-1">
              <h4 className="font-medium text-red-900">Erros encontrados:</h4>
              {importResult.errors.map((error: string, index: number) => (
                <div key={index} className="text-sm text-red-700 bg-red-50 p-2 rounded">
                  {error}
                </div>
              ))}
            </div>
          )}

          {/* Botões */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isImporting}
            >
              {importResult ? 'Fechar' : 'Cancelar'}
            </Button>
            {!importResult && (
              <Button
                onClick={handleImport}
                disabled={!selectedFile || isImporting}
              >
                <Upload className="h-4 w-4 mr-2" />
                {isImporting ? 'Importando...' : 'Importar'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
