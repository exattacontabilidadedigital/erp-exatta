"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Settings, Eye, EyeOff } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export interface ColumnConfig {
  key: string
  label: string
  visible: boolean
  required?: boolean
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { key: "data_lancamento", label: "Data", visible: true, required: true },
  { key: "tipo", label: "Tipo", visible: true },
  { key: "numero_documento", label: "Documento", visible: true },
  { key: "descricao", label: "Descrição", visible: true, required: true },
  { key: "plano_conta", label: "Plano de Contas", visible: true },
  { key: "centro_custo", label: "Centro de Custo", visible: true },
  { key: "conta_bancaria", label: "Conta Bancária", visible: true },
  { key: "cliente_fornecedor", label: "Cliente/Fornecedor", visible: false },
  { key: "valor", label: "Valor", visible: true, required: true },
  { key: "status", label: "Status", visible: true },
  { key: "status_conciliacao", label: "Status Conciliação", visible: true },
  { key: "acoes", label: "Ações", visible: true, required: true }
]

interface LancamentosColumnsConfigProps {
  columns: ColumnConfig[]
  onColumnsChange: (columns: ColumnConfig[]) => void
}

export function LancamentosColumnsConfig({ columns, onColumnsChange }: LancamentosColumnsConfigProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleColumnToggle = (columnKey: string, checked: boolean) => {
    const updatedColumns = columns.map(col => 
      col.key === columnKey ? { ...col, visible: checked } : col
    )
    onColumnsChange(updatedColumns)
  }

  const handleSelectAll = () => {
    const updatedColumns = columns.map(col => ({ ...col, visible: true }))
    onColumnsChange(updatedColumns)
  }

  const handleSelectNone = () => {
    const updatedColumns = columns.map(col => 
      col.required ? col : { ...col, visible: false }
    )
    onColumnsChange(updatedColumns)
  }

  const handleReset = () => {
    onColumnsChange(DEFAULT_COLUMNS)
    setIsOpen(false) // Fechar o popover após resetar
  }

  const visibleCount = columns.filter(col => col.visible).length
  const totalCount = columns.length

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="flex items-center gap-2"
        >
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline">Colunas</span>
          <span className="sm:hidden">Col</span>
          ({visibleCount}/{totalCount})
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[300px] sm:w-80 mx-2" 
        align="end"
        side="bottom"
        sideOffset={8}
        alignOffset={-10}
        avoidCollisions={true}
        collisionPadding={10}
      >
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configurar Colunas
            </CardTitle>
            <p className="text-xs text-gray-500">
              Selecione as colunas que deseja visualizar na tabela
            </p>
            <div className="flex flex-col gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSelectAll}
                className="w-full text-xs"
              >
                <Eye className="h-3 w-3 mr-1" />
                Mostrar Todas
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSelectNone}
                className="w-full text-xs"
              >
                <EyeOff className="h-3 w-3 mr-1" />
                Ocultar Opcionais
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {columns.map((column) => (
              <div key={column.key} className="flex items-center space-x-2">
                <Checkbox
                  id={column.key}
                  checked={column.visible}
                  onCheckedChange={(checked) => handleColumnToggle(column.key, checked as boolean)}
                  disabled={column.required}
                />
                <label
                  htmlFor={column.key}
                  className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1 ${
                    column.required ? 'text-gray-500' : ''
                  }`}
                >
                  {column.label}
                  {column.required && (
                    <span className="text-xs text-gray-400 ml-1">(obrigatória)</span>
                  )}
                </label>
              </div>
            ))}
            <div className="pt-2 border-t">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleReset}
                className="w-full"
              >
                Restaurar Padrão
              </Button>
            </div>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  )
}

export { DEFAULT_COLUMNS }
