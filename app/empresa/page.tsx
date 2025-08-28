"use client"
import { EmpresaHeader } from "@/components/empresa/empresa-header"
import { EmpresaForm } from "@/components/empresa/empresa-form"

export default function EmpresaPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <EmpresaHeader />

      <main className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Dados da Empresa</h2>
              <p className="text-gray-600 mt-1">Configure as informações da sua empresa</p>
            </div>

            <EmpresaForm />
          </div>
        </div>
      </main>
      </div>  )
}
