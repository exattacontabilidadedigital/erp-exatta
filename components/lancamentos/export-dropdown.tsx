"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Download, FileSpreadsheet, FileText, File } from "lucide-react"

interface ExportDropdownProps {
  onExportCSV?: () => void
  onExportPDF?: () => void
  onExportExcel?: () => void
  disabled?: boolean
}

export function ExportDropdown({ 
  onExportCSV, 
  onExportPDF, 
  onExportExcel, 
  disabled = false 
}: ExportDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleExport = (type: 'csv' | 'pdf' | 'excel', callback?: () => void) => {
    if (callback) {
      callback()
    } else {
      console.log(`Exportando como ${type.toUpperCase()}...`)
    }
    setIsOpen(false)
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled}>
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('csv', onExportCSV)}>
          <FileText className="h-4 w-4 mr-2" />
          Exportar CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('excel', onExportExcel)}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Exportar Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('pdf', onExportPDF)}>
          <File className="h-4 w-4 mr-2" />
          Exportar PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default ExportDropdown
