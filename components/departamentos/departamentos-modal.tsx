"use client"

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DepartamentosForm } from "@/components/departamentos/departamentos-form";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DepartamentosDeleteModal } from "@/components/departamentos/departamentos-delete-modal";
import { supabase } from "@/lib/supabase/client";

interface DepartamentosModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DepartamentosModal({ isOpen, onClose }: DepartamentosModalProps) {
  const [departamentos, setDepartamentos] = useState<any[]>([]);
  const [editDepartamento, setEditDepartamento] = useState<any>(null);
  const [deleteDepartamento, setDeleteDepartamento] = useState<any>(null);

  async function fetchDepartamentos() {
    const { data } = await supabase.from("departamentos").select("*");
    setDepartamentos(data || []);
  }

  useEffect(() => {
    if (isOpen) fetchDepartamentos();
    const handler = () => fetchDepartamentos();
    window.addEventListener("departamentosAtualizado", handler);
    return () => window.removeEventListener("departamentosAtualizado", handler);
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Departamentos</DialogTitle>
        </DialogHeader>
        <div className="mb-6">
          <DepartamentosForm
            isEditing={!!editDepartamento}
            initialData={editDepartamento}
            onSuccess={() => {
              setEditDepartamento(null);
              fetchDepartamentos();
            }}
          />
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departamentos.map((dep) => (
                <TableRow key={dep.id}>
                  <TableCell>{dep.nome}</TableCell>
                  <TableCell>{dep.ativo ? "Ativo" : "Inativo"}</TableCell>
                  <TableCell>
                    <Button size="sm" onClick={() => setEditDepartamento(dep)}>
                      Editar
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => setDeleteDepartamento(dep)}>
                      Excluir
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {deleteDepartamento && (
          <DepartamentosDeleteModal
            isOpen={!!deleteDepartamento}
            departamento={deleteDepartamento}
            onClose={() => setDeleteDepartamento(null)}
          />
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
