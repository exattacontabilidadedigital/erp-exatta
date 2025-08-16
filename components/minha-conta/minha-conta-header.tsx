import { Button } from "@/components/ui/button"
import { ArrowLeft, Save, Shield } from "lucide-react"
import Link from "next/link"

export function MinhaContaHeader() {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Minha Conta</h1>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Shield className="w-4 h-4 mr-2" />
              Segurança
            </Button>
            <Button size="sm">
              <Save className="w-4 h-4 mr-2" />
              Salvar Alterações
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
