"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Shield, Plus } from "lucide-react"

interface UsuariosFuncoesModalProps {
  isOpen: boolean
  onClose: () => void
  permissoesDisponiveis: { id: string; label: string; descricao: string }[]
  onCreate: (funcao: { nome: string; permissoes: string[]; id?: string }) => void
  funcaoEditando?: { id: string; nome: string; permissoes: string[] }
}

export function UsuariosFuncoesModal({ isOpen, onClose, permissoesDisponiveis, onCreate, funcaoEditando }: UsuariosFuncoesModalProps) {
  const [nomeFuncao, setNomeFuncao] = useState("")
  const [permissoes, setPermissoes] = useState<string[]>([])

  // Preencher dados ao editar
  useEffect(() => {
    if (funcaoEditando) {
      setNomeFuncao(funcaoEditando.nome)
      setPermissoes(funcaoEditando.permissoes)
    } else {
      setNomeFuncao("")
      setPermissoes([])
    }
  }, [funcaoEditando, isOpen])

  const handlePermissaoChange = (id: string, checked: boolean) => {
    setPermissoes((prev) =>
      checked ? [...prev, id] : prev.filter((p) => p !== id)
    )
  }

  const handleCreate = () => {
    if (!nomeFuncao.trim()) return
    if (funcaoEditando) {
      onCreate({ id: funcaoEditando.id, nome: nomeFuncao, permissoes })
    } else {
      onCreate({ nome: nomeFuncao, permissoes })
    }
    setNomeFuncao("")
    setPermissoes([])
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            {funcaoEditando ? "Editar Função" : "Nova Função"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Nome da função (ex: Contador, Auditor, etc)"
            value={nomeFuncao}
            onChange={(e) => setNomeFuncao(e.target.value)}
          />
          <div>
            <div className="font-medium mb-2">Permissões</div>
            <div className="grid grid-cols-1 gap-2">
              {permissoesDisponiveis.map((p) => (
                <label key={p.id} className="flex items-center space-x-2">
                  <Checkbox
                    checked={permissoes.includes(p.id)}
                    onCheckedChange={(checked) => handlePermissaoChange(p.id, checked as boolean)}
                  />
                  <span>{p.label}</span>
                </label>
              ))}
            </div>
          </div>
          <Button onClick={handleCreate} className="w-full bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Criar Função
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
