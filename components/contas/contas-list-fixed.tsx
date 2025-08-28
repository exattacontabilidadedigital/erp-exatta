"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { supabase } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Edit, MoreHorizontal, Search, Trash2, Eye, FileText, TrendingUp, TrendingDown, GitMerge } from "lucide-react"

interface ContasListProps {
  contas: any[];
  loading?: boolean;
  error?: string;
  onVisualizarConta: (conta: any) => void;
  onEditarConta: (conta: any) => void;
  onExcluirConta: (conta: any) => void;
  onExtratoConta: (conta: any) => void;
  onConciliarConta?: (conta: any) => void;
  onRefresh?: () => void;
}

export function ContasList({ 
  contas, 
  loading: isLoading = false, 
  error: errorMessage = "", 
  onVisualizarConta, 
  onEditarConta, 
  onExcluirConta, 
  onExtratoConta, 
  onConciliarConta,
  onRefresh 
}: ContasListProps) {
  // Estados
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [internalLoading, setInternalLoading] = useState(false);
  const [internalError, setInternalError] = useState("");
  const [contasAtualizadas, setContasAtualizadas] = useState<any[] | null>(null);

  useEffect(() => {
    function handleContasAtualizado(e: any) {
      if (e.detail && Array.isArray(e.detail)) {
        setContasAtualizadas(e.detail);
      }
    }
    window.addEventListener("contasAtualizado", handleContasAtualizado);
    return () => {
      window.removeEventListener("contasAtualizado", handleContasAtualizado);
    };
  }, []);

  // Constantes
  const PAGE_SIZE = 10;

  // Função de busca
  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  // Função para calcular variação do saldo
  function getSaldoVariacao(saldoAtual: number, saldoInicial: number) {
    const variacao = saldoAtual - saldoInicial;
    const percentual = saldoInicial !== 0 ? ((variacao / saldoInicial) * 100).toFixed(2) : "0.00";
    return { variacao, percentual };
  }

  // Filtragem das contas
  const contasParaExibir = contasAtualizadas ?? contas;
  const filteredContas = useMemo(() => {
    return contasParaExibir.filter((conta) => {
      if (!conta) return false;
      return (
        (conta.bancos?.nome && conta.bancos.nome.toLowerCase().includes(search.toLowerCase())) ||
        (conta.banco_id && conta.banco_id.toLowerCase().includes(search.toLowerCase())) ||
        (conta.gerente && conta.gerente.toLowerCase().includes(search.toLowerCase())) ||
        (conta.agencia && conta.agencia.includes(search)) ||
        (conta.conta && conta.conta.includes(search)) ||
        (conta.tipo_conta && conta.tipo_conta.toLowerCase().includes(search.toLowerCase()))
      );
    });
  }, [contasParaExibir, search]);

  // Paginação
  const paginatedContas = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return filteredContas.slice(start, end);
  }, [filteredContas, page]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contas Bancárias</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Busca e Ações */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Input
            placeholder="Buscar por banco, gerente, agência, conta ou tipo de conta..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full sm:max-w-md"
          />
          <Button
            onClick={() => setPage(1)}
            disabled={isLoading || internalLoading}
          >
            {isLoading || internalLoading ? "Carregando..." : "Buscar"}
          </Button>
        </div>

        {/* Mensagens de erro */}
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 mt-4">
            <p>{errorMessage}</p>
          </div>
        )}
        
        {internalError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 mt-4">
            <p>{internalError}</p>
          </div>
        )}

        {/* Conteúdo da tabela */}
        <div className="mt-4">
          {filteredContas.length === 0 && !isLoading && !internalLoading ? (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg mb-2">Nenhuma conta encontrada</div>
              <div className="text-gray-400">
                {search ? 
                  "Tente ajustar os filtros de busca" : 
                  "Clique em 'Nova Conta' para adicionar sua primeira conta bancária"
                }
              </div>
              {onRefresh && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={onRefresh}
                >
                  Atualizar Lista
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Banco</TableHead>
                  <TableHead>Agência / Conta</TableHead>
                  <TableHead>Tipo de Conta</TableHead>
                  <TableHead>Saldo Atual</TableHead>
                  <TableHead>Variação</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedContas.map((conta: any) => {
                  const { variacao, percentual } = getSaldoVariacao(conta.saldo_atual || 0, conta.saldo_inicial || 0);
                  return (
                    <TableRow key={conta.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {conta.bancos?.nome || conta.banco_id || "Banco não informado"}
                          </div>
                          {conta.gerente && (
                            <div className="text-sm text-gray-500">{conta.gerente}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>Ag: {conta.agencia || "N/A"}</div>
                          <div>
                            CC: {conta.conta || "N/A"}{conta.digito ? `-${conta.digito}` : ""}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          style={{
                            backgroundColor:
                              conta.tipo_conta === "corrente"
                                ? "#e0f7fa"
                                : conta.tipo_conta === "poupanca"
                                ? "#e8f5e9"
                                : conta.tipo_conta === "investimento"
                                ? "#fff3e0"
                                : conta.tipo_conta === "salario"
                                ? "#fce4ec"
                                : "#f5f5f5",
                            color:
                              conta.tipo_conta === "corrente"
                                ? "#00796b"
                                : conta.tipo_conta === "poupanca"
                                ? "#388e3c"
                                : conta.tipo_conta === "investimento"
                                ? "#f57c00"
                                : conta.tipo_conta === "salario"
                                ? "#c2185b"
                                : "#616161",
                          }}
                        >
                          {conta.tipo_conta || "corrente"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          R$ {Number(conta.saldo_atual || 0).toLocaleString('pt-BR', { 
                            minimumFractionDigits: 2, 
                            maximumFractionDigits: 2 
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={`flex items-center ${variacao >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {variacao >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                          <div>
                            <div className="font-medium">
                              {variacao >= 0 ? "+" : ""}R$ {variacao.toLocaleString('pt-BR', { 
                                minimumFractionDigits: 2, 
                                maximumFractionDigits: 2 
                              })}
                            </div>
                            <div className="text-xs">({percentual}%)</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={conta.ativo ? "default" : "secondary"} 
                          className={conta.ativo ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                        >
                          {conta.ativo ? "Ativa" : "Inativa"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onVisualizarConta(conta)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Visualizar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onExtratoConta(conta)}>
                              <FileText className="mr-2 h-4 w-4" />
                              Extrato
                            </DropdownMenuItem>
                            {onConciliarConta && (
                              <DropdownMenuItem onClick={() => onConciliarConta(conta)}>
                                <GitMerge className="mr-2 h-4 w-4" />
                                Conciliar
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => onEditarConta(conta)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => onExcluirConta(conta)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Paginação */}
        {filteredContas.length > PAGE_SIZE && (
          <div className="flex justify-center items-center gap-2 pt-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setPage((p) => Math.max(1, p - 1))} 
              disabled={page === 1}
            >
              Anterior
            </Button>
            <span>Página {page} de {Math.ceil(filteredContas.length / PAGE_SIZE)}</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setPage((p) => Math.min(Math.ceil(filteredContas.length / PAGE_SIZE), p + 1))} 
              disabled={page === Math.ceil(filteredContas.length / PAGE_SIZE)}
            >
              Próxima
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default ContasList;
