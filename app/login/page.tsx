import { LoginForm } from "@/components/auth/login-form"

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Sistema Contábil</h1>
          <p className="text-gray-600">Faça login para acessar sua conta</p>
        </div>

        <LoginForm />
      </div>
    </div>
  )
}
