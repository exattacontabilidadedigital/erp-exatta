import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { ToastProvider } from "@/contexts/toast-context"
import { Toaster } from "@/components/ui/toaster"
import { MainLayout } from "@/components/layout/main-layout"

export const metadata: Metadata = {
  title: "Sistema Contábil - Gestão Financeira",
  description: "Sistema completo para gerenciamento de lançamentos contábeis",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
body, * {
  font-family: ${GeistSans.style.fontFamily}, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
}
.font-mono, code, pre, kbd, samp {
  font-family: ${GeistMono.style.fontFamily}, ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, monospace !important;
}
        `}</style>
      </head>
      <body>
        <AuthProvider>
          <ToastProvider>
            <MainLayout>
              {children}
            </MainLayout>
            <Toaster />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
