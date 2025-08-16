"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mail, FileText, FileSpreadsheet } from "lucide-react"

interface RelatoriosEnviarModalProps {
  isOpen: boolean
  onClose: () => void
  relatorioTipo: string
}

export function RelatoriosEnviarModal({ isOpen, onClose, relatorioTipo }: RelatoriosEnviarModalProps) {
  const [formData, setFormData] = useState({
    destinatarios: "",
    assunto: `Relatório ${relatorioTipo.charAt(0).toUpperCase() + relatorioTipo.slice(1)} - ${new Date().toLocaleDateString()}`,
    mensagem: "Segue em anexo o relatório solicitado.",
    formato: "pdf",
    incluirGraficos: true,
    copiaOculta: false,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Simula envio do email
    console.log("Enviando relatório:", formData)

    // Feedback visual
    alert(`Relatório enviado com sucesso para: ${formData.destinatarios}`)

    onClose()
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Mail className="w-5 h-5" />
            <span>Enviar Relatório por Email</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="destinatarios">Destinatários *</Label>
            <Input
              id="destinatarios"
              type="email"
              placeholder="email@exemplo.com, outro@exemplo.com"
              value={formData.destinatarios}
              onChange={(e) => handleInputChange("destinatarios", e.target.value)}
              required
            />
            <p className="text-xs text-gray-500">Separe múltiplos emails com vírgula</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assunto">Assunto</Label>
            <Input
              id="assunto"
              value={formData.assunto}
              onChange={(e) => handleInputChange("assunto", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="formato">Formato do Arquivo</Label>
            <Select value={formData.formato} onValueChange={(value) => handleInputChange("formato", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4" />
                    <span>PDF</span>
                  </div>
                </SelectItem>
                <SelectItem value="excel">
                  <div className="flex items-center space-x-2">
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Excel</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mensagem">Mensagem</Label>
            <Textarea
              id="mensagem"
              rows={3}
              value={formData.mensagem}
              onChange={(e) => handleInputChange("mensagem", e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="incluirGraficos"
                checked={formData.incluirGraficos}
                onCheckedChange={(checked) => handleInputChange("incluirGraficos", checked as boolean)}
              />
              <Label htmlFor="incluirGraficos" className="text-sm">
                Incluir gráficos no relatório
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="copiaOculta"
                checked={formData.copiaOculta}
                onCheckedChange={(checked) => handleInputChange("copiaOculta", checked as boolean)}
              />
              <Label htmlFor="copiaOculta" className="text-sm">
                Enviar cópia oculta para mim
              </Label>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              <Mail className="w-4 h-4 mr-2" />
              Enviar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
