"use client"
import { MinhaContaHeader } from "@/components/minha-conta/minha-conta-header"
import { MinhaContaForm } from "@/components/minha-conta/minha-conta-form"

export default function MinhaContaPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <MinhaContaHeader />

      <main className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Minha Conta</h2>
              <p className="text-gray-600 mt-1">Gerencie suas informações pessoais e preferências do sistema</p>
            </div>

            <MinhaContaForm />
          </div>
        </div>
      </main>
    </div>
  )
}
