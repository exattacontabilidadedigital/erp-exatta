"use client"

import { Building2, Plus, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface BancosHeaderProps {
  onNovoBanco?: () => void
}

export function BancosHeader({ onNovoBanco }: BancosHeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Cadastro de Bancos</h1>
              <p className="text-gray-600">Gerencie as instituições bancárias</p>
            </div>
          </div>
          <Button onClick={onNovoBanco}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Banco
          </Button>
        </div>
      </div>
    </header>
  )
}
