import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link href="/login" className="inline-flex items-center text-blue-600 hover:text-blue-500 mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao login
          </Link>
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <span className="text-white text-2xl font-bold">E</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Recuperar Senha</h1>
          <p className="text-gray-600">Digite seu email para receber instruções de recuperação</p>
        </div>

        <ForgotPasswordForm />
      </div>
    </div>
  )
}
