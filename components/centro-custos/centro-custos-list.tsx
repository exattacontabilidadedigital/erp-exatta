"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Edit, MoreHorizontal, Search, Trash2, Eye, BarChart3, TrendingUp, TrendingDown } from "lucide-react"


interface CentroCustosListProps {
  onVisualizar?: (centro: any) => void
  onEditar?: (centro: any) => void
  onExcluir?: (centro: any) => void
  onRelatorio?: (centro: any) => void
}

export function CentroCustosList({ onVisualizar, onEditar, onExcluir, onRelatorio }: CentroCustosListProps) {
  function handleSearch(term: string) {
    setSearchTerm(term);
    if (!term) {
      setFilteredCentros(centros);
      return;
    }
    const lowerTerm = term.toLowerCase();
    setFilteredCentros(
      centros.filter((centro) =>
        centro.nome?.toLowerCase().includes(lowerTerm) ||
        centro.codigo?.toLowerCase().includes(lowerTerm) ||
        centro.departamento?.toLowerCase().includes(lowerTerm) ||
        centro.descricao?.toLowerCase().includes(lowerTerm)
      )
    );
  }
  function getTipoBadge(tipo: string) {
    return <Badge variant="default">{tipo}</Badge>;
  }

  function getPercentualBadge(percentual: number) {
    if (percentual >= 90) {
      return <Badge variant="destructive">{percentual}%</Badge>;
    }
    if (percentual >= 70) {
      return <Badge variant="default" className="bg-yellow-500 text-black">{percentual}%</Badge>;
    }
    return <Badge variant="default" className="bg-green-500">{percentual}%</Badge>;
  }
  const [centros, setCentros] = useState<any[]>([]);
  const { userData } = require("@/contexts/auth-context").useAuth();
  const [gastos, setGastos] = useState<Record<string, number>>({});
  const [responsaveis, setResponsaveis] = useState<any[]>([]);

  useEffect(() => {
    async function fetchCentros() {
      if (!userData?.empresa_id) {
        setCentros([]);
        setFilteredCentros([]);
        setErrorMsg("Empresa não encontrada.");
        return;
      }
      const { data, error } = await supabase
        .from("centro_custos")
        .select("*")
        .eq("empresa_id", userData.empresa_id);
      if (error) {
        setErrorMsg("Erro ao buscar centros de custo: " + error.message);
        setCentros([]);
        setFilteredCentros([]);
        return;
      }
      setCentros(data || []);
      setFilteredCentros(data || []);
      setErrorMsg(data && data.length > 0 ? "" : "Nenhum centro de custo cadastrado.");
    }
    async function fetchResponsaveis() {
      if (!userData?.empresa_id) return;
      const { data, error } = await supabase.from("responsaveis").select("id, nome").eq("empresa_id", userData.empresa_id).eq("ativo", true);
      if (!error && data) setResponsaveis(data);
    }
    fetchCentros();
    fetchResponsaveis();
    // Listener para atualizar ao cadastrar/editar/excluir
    function handleAtualizado() {
      fetchCentros();
      fetchResponsaveis();
    }
    window.addEventListener("centroCustosAtualizado", handleAtualizado);
    return () => {
      window.removeEventListener("centroCustosAtualizado", handleAtualizado);
    };
  }, [userData?.empresa_id]);

  useEffect(() => {
    async function fetchGastos() {
      if (!userData?.empresa_id) return;
      const { data, error } = await supabase
        .from("lancamentos")
        .select("centro_custo_id, valor")
        .eq("empresa_id", userData.empresa_id)
        .eq("status", "pago");
      if (error || !data) return;
      const somaPorCentro: Record<string, number> = {};
      data.forEach((lanc: any) => {
        if (!somaPorCentro[lanc.centro_custo_id]) somaPorCentro[lanc.centro_custo_id] = 0;
        somaPorCentro[lanc.centro_custo_id] += Number(lanc.valor ?? 0);
      });
      setGastos(somaPorCentro);
    }
    fetchGastos();
  }, [userData?.empresa_id, centros]);
  // Removido dicionário fixo de responsáveis
  // ...existing code...
  const [errorMsg, setErrorMsg] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  // ...existing code...
  const [filteredCentros, setFilteredCentros] = useState<any[]>([]);

  // ...existing code...

  // Retorno principal do componente
  return (
    <Card>
      {errorMsg && (
        <div className="p-4 text-center text-red-600 font-semibold">{errorMsg}</div>
      )}
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Centros de Custos</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar centros..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Centro</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Orçamento</TableHead>
                <TableHead>Gasto Atual</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCentros.map((centro) => (
                <TableRow key={centro.id}>
                  <TableCell>
                    <div>
                      <div className={`${
                        centro.aceita_lancamentos === false 
                          ? 'font-bold text-gray-800' 
                          : 'font-medium'
                      }`}>
                        {centro.codigo} - {centro.nome}
                      </div>
                      <div className="text-sm text-gray-500">{centro.departamento}</div>
                      <div className="text-xs text-gray-400">{centro.descricao}</div>
                      {centro.aceita_lancamentos === false && (
                        <div className="text-xs text-red-600 font-medium mt-1">
                          Centro organizador
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getTipoBadge(centro.tipo)}</TableCell>
                  <TableCell>{responsaveis.find(r => r.id === centro.responsavel)?.nome ?? centro.responsavel}</TableCell>
                  <TableCell>
                    <div className="font-medium">R$ {Number(centro.orcamento_mensal ?? 0).toLocaleString()}</div>
                    <div className="text-xs text-gray-500">Mensal</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">R$ {Number(gastos[centro.id] ?? 0).toLocaleString()}</div>
                    <div className="text-xs text-gray-500">Mensal</div>
                  </TableCell>
                  <TableCell>{getPercentualBadge(
                    centro.orcamento_mensal
                      ? Math.round(((gastos[centro.id] ?? 0) / Number(centro.orcamento_mensal)) * 100)
                      : 0
                  )}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onVisualizar?.(centro)}>
                          <Eye className="mr-2 h-4 w-4" /> Visualizar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEditar?.(centro)}>
                          <Edit className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => onExcluir?.(centro)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

