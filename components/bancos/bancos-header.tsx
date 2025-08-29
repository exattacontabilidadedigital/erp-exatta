"use client"

import { Plus, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface BancosHeaderProps {
  onNovoBanco?: () => void
}

export function BancosHeader({ onNovoBanco }: BancosHeaderProps) {
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
            <h1 className="text-xl font-bold text-gray-900">Cadastro de Bancos</h1>
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
