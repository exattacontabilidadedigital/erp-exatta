"use client"

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ResponsaveisForm } from "@/components/responsaveis/responsaveis-form";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ResponsaveisDeleteModal } from "@/components/responsaveis/responsaveis-delete-modal";
import { supabase } from "@/lib/supabase/client";

interface ResponsaveisModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ResponsaveisModal({ isOpen, onClose }: ResponsaveisModalProps) {
  const [responsaveis, setResponsaveis] = useState<any[]>([]);
  const [editResponsavel, setEditResponsavel] = useState<any>(null);
  const [deleteResponsavel, setDeleteResponsavel] = useState<any>(null);

  async function fetchResponsaveis() {
    const { data } = await supabase.from("responsaveis").select("*");
    setResponsaveis(data || []);
  }

  useEffect(() => {
    if (isOpen) fetchResponsaveis();
    const handler = () => fetchResponsaveis();
    window.addEventListener("responsaveisAtualizado", handler);
    return () => window.removeEventListener("responsaveisAtualizado", handler);
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Responsáveis</DialogTitle>
        </DialogHeader>
        <div className="mb-6">
          <ResponsaveisForm
            isEditing={!!editResponsavel}
            initialData={editResponsavel}
            onSuccess={() => {
              setEditResponsavel(null);
              fetchResponsaveis();
            }}
          />
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {responsaveis.map((resp) => (
                <TableRow key={resp.id}>
                  <TableCell>{resp.nome}</TableCell>
                  <TableCell>{resp.email}</TableCell>
                  <TableCell>{resp.ativo ? "Ativo" : "Inativo"}</TableCell>
                  <TableCell>
                    <Button size="sm" onClick={() => setEditResponsavel(resp)}>
                      Editar
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => setDeleteResponsavel(resp)}>
                      Excluir
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {deleteResponsavel && (
          <ResponsaveisDeleteModal
            isOpen={!!deleteResponsavel}
            responsavel={deleteResponsavel}
            onClose={() => setDeleteResponsavel(null)}
          />
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
