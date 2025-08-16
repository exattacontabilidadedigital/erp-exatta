"use client"

import { ResetPasswordForm } from "@/components/auth/reset-password-form"
import { useSearchParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Mail } from "lucide-react"
import Link from "next/link"

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [errorCode, setErrorCode] = useState<string | null>(null)

  useEffect(() => {
    const urlError = searchParams.get("error")
    const urlErrorCode = searchParams.get("error_code")
    const urlErrorDescription = searchParams.get("error_description")

    // Também verificar no hash da URL
    if (typeof window !== "undefined") {
      const hash = window.location.hash
      if (hash.includes("error=")) {
        const hashParams = new URLSearchParams(hash.substring(1))
        const hashError = hashParams.get("error")
        const hashErrorCode = hashParams.get("error_code")
        const hashErrorDescription = hashParams.get("error_description")

        if (hashError) {
          setError(hashErrorDescription || hashError)
          setErrorCode(hashErrorCode)
        }
      }
    }

    if (urlError) {
      setError(urlErrorDescription || urlError)
      setErrorCode(urlErrorCode)
    }
  }, [searchParams])

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <CardTitle className="text-red-900">Link Inválido ou Expirado</CardTitle>
              <CardDescription>
                {errorCode === "otp_expired"
                  ? "O link de recuperação de senha expirou. Links de recuperação são válidos por apenas 1 hora."
                  : "O link de recuperação de senha é inválido ou já foi utilizado."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  Solicite um novo link de recuperação de senha para continuar.
                </p>
                <div className="space-y-2">
                  <Button asChild className="w-full">
                    <Link href="/forgot-password">
                      <Mail className="w-4 h-4 mr-2" />
                      Solicitar Novo Link
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="w-full bg-transparent">
                    <Link href="/login">Voltar ao Login</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Sistema Contábil</h1>
          <p className="text-gray-600">Defina sua nova senha</p>
        </div>
        <ResetPasswordForm />
      </div>
    </div>
  )
}
