"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, Download, FileText, Plus, BarChart3, Upload } from "lucide-react"
import React from "react"
import Link from "next/link"

interface CentroCustosHeaderProps {
  onNovoCentro?: () => void
  onImportar?: () => void
  onExportar?: () => void
  onRelatorio?: () => void
  onAnalise?: () => void
}

export function CentroCustosHeader({
  onNovoCentro,
  onImportar,
  onExportar,
  onRelatorio,
  onAnalise,
}: CentroCustosHeaderProps) {
  // Lógica para fechar o menu ao clicar fora
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const menu = document.getElementById("cadastros-menu");
      const button = document.getElementById("cadastros-btn");
      if (menu && !menu.classList.contains("hidden")) {
        if (menu && !menu.contains(event.target as Node) && button && !button.contains(event.target as Node)) {
          menu.classList.add("hidden");
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold text-gray-900">Centro de Custos</h1>
          </div>

          <div className="flex items-center space-x-2">
            {/* Botão Cadastros com submenu em modal */}
            <div className="relative group">
              <Button id="cadastros-btn" variant="outline" size="sm" className="flex items-center" type="button" onClick={() => {
                const menu = document.getElementById("cadastros-menu");
                if (menu) menu.classList.toggle("hidden");
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Cadastros
              </Button>
              <div id="cadastros-menu" className="absolute right-0 mt-2 w-56 bg-white border rounded shadow-lg hidden z-10">
                <button type="button" className="block w-full text-left px-4 py-2 hover:bg-blue-50 text-gray-700" onClick={() => window.dispatchEvent(new Event("abrirModalDepartamentos"))}>Departamentos</button>
                <button type="button" className="block w-full text-left px-4 py-2 hover:bg-blue-50 text-gray-700" onClick={() => window.dispatchEvent(new Event("abrirModalResponsaveis"))}>Responsáveis</button>
                <button type="button" className="block w-full text-left px-4 py-2 hover:bg-blue-50 text-gray-700" onClick={() => window.dispatchEvent(new Event("abrirModalTiposCentroCustos"))}>Tipos de Centro de Custo</button>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={onNovoCentro}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Centro
            </Button>
            <Button variant="outline" size="sm" onClick={onImportar}>
              <Upload className="w-4 h-4 mr-2" />
              Importar
            </Button>
            <Button variant="outline" size="sm" onClick={onExportar}>
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            <Button variant="outline" size="sm" onClick={onRelatorio}>
              <FileText className="w-4 h-4 mr-2" />
              Relatório
            </Button>
            <Button variant="outline" size="sm" onClick={onAnalise}>
              <BarChart3 className="w-4 h-4 mr-2" />
              Análise
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
