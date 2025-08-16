"use client"

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { TiposCentroCustosForm } from "@/components/tipos-centro-custos/tipos-centro-custos-form";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TiposCentroCustosDeleteModal } from "@/components/tipos-centro-custos/tipos-centro-custos-delete-modal";
import { supabase } from "@/lib/supabase/client";

interface TiposCentroCustosModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TiposCentroCustosModal({ isOpen, onClose }: TiposCentroCustosModalProps) {
  const [tipos, setTipos] = useState<any[]>([]);
  const [editTipo, setEditTipo] = useState<any>(null);
  const [deleteTipo, setDeleteTipo] = useState<any>(null);

  async function fetchTipos() {
    const { data } = await supabase.from("tipos_centro_custos").select("*");
    setTipos(data || []);
  }

  useEffect(() => {
    if (isOpen) fetchTipos();
    const handler = () => fetchTipos();
    window.addEventListener("tiposCentroCustosAtualizado", handler);
    return () => window.removeEventListener("tiposCentroCustosAtualizado", handler);
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Tipos de Centro de Custo</DialogTitle>
        </DialogHeader>
        <div className="mb-6">
          <TiposCentroCustosForm
            isEditing={!!editTipo}
            initialData={editTipo}
            onSuccess={() => {
              setEditTipo(null);
              fetchTipos();
            }}
          />
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tipos.map((tipo) => (
                <TableRow key={tipo.id}>
                  <TableCell>{tipo.nome}</TableCell>
                  <TableCell>{tipo.descricao}</TableCell>
                  <TableCell>{tipo.ativo ? "Ativo" : "Inativo"}</TableCell>
                  <TableCell>
                    <Button size="sm" onClick={() => setEditTipo(tipo)}>
                      Editar
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => setDeleteTipo(tipo)}>
                      Excluir
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {deleteTipo && (
          <TiposCentroCustosDeleteModal
            isOpen={!!deleteTipo}
            tipo={deleteTipo}
            onClose={() => setDeleteTipo(null)}
          />
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
