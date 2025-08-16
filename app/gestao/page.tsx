"use client"

import { useState } from "react";
import { DepartamentosList } from "@/components/departamentos/departamentos-list";
import { DepartamentosForm } from "@/components/departamentos/departamentos-form";
import { DepartamentosDeleteModal } from "@/components/departamentos/departamentos-delete-modal";
import { ResponsaveisList } from "@/components/responsaveis/responsaveis-list";
import { ResponsaveisForm } from "@/components/responsaveis/responsaveis-form";
import { ResponsaveisDeleteModal } from "@/components/responsaveis/responsaveis-delete-modal";
import { TiposCentroCustosList } from "@/components/tipos-centro-custos/tipos-centro-custos-list";
import { TiposCentroCustosForm } from "@/components/tipos-centro-custos/tipos-centro-custos-form";
import { TiposCentroCustosDeleteModal } from "@/components/tipos-centro-custos/tipos-centro-custos-delete-modal";

export default function GestaoPage() {
  // Departamentos
  const [editDepartamento, setEditDepartamento] = useState<any>(null);
  const [deleteDepartamento, setDeleteDepartamento] = useState<any>(null);

  // Responsáveis
  const [editResponsavel, setEditResponsavel] = useState<any>(null);
  const [deleteResponsavel, setDeleteResponsavel] = useState<any>(null);

  // Tipos Centro de Custo
  const [editTipo, setEditTipo] = useState<any>(null);
  const [deleteTipo, setDeleteTipo] = useState<any>(null);

  return (
    <div className="space-y-10 p-6">
      {/* Departamentos */}
      <section>
        <h2 className="text-xl font-bold mb-2">Departamentos</h2>
        <DepartamentosList
          onEditar={setEditDepartamento}
          onExcluir={setDeleteDepartamento}
        />
        {editDepartamento && (
          <DepartamentosForm
            isEditing
            initialData={editDepartamento}
            onSuccess={() => setEditDepartamento(null)}
          />
        )}
        {deleteDepartamento && (
          <DepartamentosDeleteModal
            isOpen={!!deleteDepartamento}
            departamento={deleteDepartamento}
            onClose={() => setDeleteDepartamento(null)}
          />
        )}
      </section>

      {/* Responsáveis */}
      <section>
        <h2 className="text-xl font-bold mb-2">Responsáveis</h2>
        <ResponsaveisList
          onEditar={setEditResponsavel}
          onExcluir={setDeleteResponsavel}
        />
        {editResponsavel && (
          <ResponsaveisForm
            isEditing
            initialData={editResponsavel}
            onSuccess={() => setEditResponsavel(null)}
          />
        )}
        {deleteResponsavel && (
          <ResponsaveisDeleteModal
            isOpen={!!deleteResponsavel}
            responsavel={deleteResponsavel}
            onClose={() => setDeleteResponsavel(null)}
          />
        )}
      </section>

      {/* Tipos de Centro de Custo */}
      <section>
        <h2 className="text-xl font-bold mb-2">Tipos de Centro de Custo</h2>
        <TiposCentroCustosList
          onEditar={setEditTipo}
          onExcluir={setDeleteTipo}
        />
        {editTipo && (
          <TiposCentroCustosForm
            isEditing
            initialData={editTipo}
            onSuccess={() => setEditTipo(null)}
          />
        )}
        {deleteTipo && (
          <TiposCentroCustosDeleteModal
            isOpen={!!deleteTipo}
            tipo={deleteTipo}
            onClose={() => setDeleteTipo(null)}
          />
        )}
      </section>
    </div>
  );
}
