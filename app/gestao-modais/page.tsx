"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DepartamentosModal } from "@/components/departamentos/departamentos-modal";
import { ResponsaveisModal } from "@/components/responsaveis/responsaveis-modal";
import { TiposCentroCustosModal } from "@/components/tipos-centro-custos/tipos-centro-custos-modal";

export default function GestaoModaisPage() {
  const [departamentosOpen, setDepartamentosOpen] = useState(false);
  const [responsaveisOpen, setResponsaveisOpen] = useState(false);
  const [tiposOpen, setTiposOpen] = useState(false);

  return (
    <div className="space-y-6 p-8">
      <h1 className="text-2xl font-bold mb-6">Gestão de Cadastros</h1>
      <div className="flex gap-4">
        <Button onClick={() => setDepartamentosOpen(true)}>
          Gerenciar Departamentos
        </Button>
        <Button onClick={() => setResponsaveisOpen(true)}>
          Gerenciar Responsáveis
        </Button>
        <Button onClick={() => setTiposOpen(true)}>
          Gerenciar Tipos de Centro de Custo
        </Button>
      </div>
      <DepartamentosModal isOpen={departamentosOpen} onClose={() => setDepartamentosOpen(false)} />
      <ResponsaveisModal isOpen={responsaveisOpen} onClose={() => setResponsaveisOpen(false)} />
      {/* O modal de tipos será criado em seguida */}
      {typeof TiposCentroCustosModal !== "undefined" && (
        <TiposCentroCustosModal isOpen={tiposOpen} onClose={() => setTiposOpen(false)} />
      )}
    </div>
  );
}
