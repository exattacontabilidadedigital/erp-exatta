"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Edit3, 
  MoreHorizontal,
  Filter,
  Search,
  Download,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { usePendingEntries } from "@/hooks/use-pending-entries-simple";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase/client";

type StatusPreLancamento = 'pendente' | 'aprovado' | 'rejeitado' | 'duplicado';

interface PreEntriesProps {
  onDataChange?: () => void;
}

export function PreEntries({ onDataChange }: PreEntriesProps) {
  const { preEntries, loading: dataLoading, error, refetch, approveEntry, rejectEntry } = usePendingEntries();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<StatusPreLancamento | "todos">("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const { userData } = useAuth();

  const filteredEntries = preEntries.filter(entry => {
    const matchesStatus = filterStatus === "todos" || entry.status_aprovacao === filterStatus;
    const matchesSearch = searchTerm === "" || 
      entry.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.documento?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  const getStatusColor = (status: StatusPreLancamento) => {
    switch (status) {
      case "pendente": return "text-yellow-600 bg-yellow-50";
      case "aprovado": return "text-green-600 bg-green-50";
      case "rejeitado": return "text-red-600 bg-red-50";
      case "duplicado": return "text-gray-600 bg-gray-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  const getStatusIcon = (status: StatusPreLancamento) => {
    switch (status) {
      case "aprovado": return <CheckCircle className="h-4 w-4" />;
      case "rejeitado": return <XCircle className="h-4 w-4" />;
      case "duplicado": return <Edit3 className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return "text-green-600 bg-green-50";
    if (confidence >= 70) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredEntries.map(entry => entry.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
    }
  };

  const handleBulkAction = async (action: "aprovar" | "rejeitar") => {
    if (selectedIds.length === 0) {
      toast.error("Nenhum item selecionado");
      return;
    }

    setLoading(true);
    try {
      const newStatus: StatusPreLancamento = action === "aprovar" ? "aprovado" : "rejeitado";
      
      const { error: updateError } = await supabase
        .from('pre_lancamentos')
        .update({ 
          status_aprovacao: newStatus,
          usuario_aprovacao: userData?.id,
          data_aprovacao: new Date().toISOString()
        })
        .in('id', selectedIds);

      if (updateError) throw updateError;
      
      setSelectedIds([]);
      refetch(); // Recarregar dados
      onDataChange?.(); // Notificar página principal
      
      toast.success(`${selectedIds.length} item(s) ${action === "aprovar" ? "aprovado(s)" : "rejeitado(s)"} com sucesso!`);
    } catch (error) {
      console.error('Erro ao processar ação em lote:', error);
      toast.error("Erro ao processar ação em lote");
    } finally {
      setLoading(false);
    }
  };

  const handleIndividualAction = async (id: string, action: "aprovar" | "rejeitar" | "editar") => {
    if (action === "editar") {
      toast.info("Funcionalidade de edição em desenvolvimento...");
      return;
    }

    setLoading(true);
    try {
      let result;
      if (action === "aprovar") {
        result = await approveEntry(id);
      } else {
        result = await rejectEntry(id, "Rejeitado manualmente");
      }

      if (result.success) {
        onDataChange?.(); // Notificar página principal
        toast.success(`Item ${action === "aprovar" ? "aprovado" : "rejeitado"} com sucesso!`);
      } else {
        toast.error(result.error || "Erro ao processar ação");
      }
    } catch (error) {
      console.error('Erro ao processar ação:', error);
      toast.error("Erro ao processar ação");
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: preEntries.length,
    pendentes: preEntries.filter(e => e.status_aprovacao === "pendente").length,
    aprovados: preEntries.filter(e => e.status_aprovacao === "aprovado").length,
    rejeitados: preEntries.filter(e => e.status_aprovacao === "rejeitado").length,
  };

  // Função para lidar com clique nos cards de estatísticas
  const handleCardClick = (status: StatusPreLancamento | "todos") => {
    setFilterStatus(status);
    // Limpar busca ao filtrar por card
    setSearchTerm("");
  };

  // Função para obter classes CSS do card baseado no status ativo
  const getCardClasses = (status: StatusPreLancamento | "todos") => {
    const isActive = filterStatus === status;
    const baseClasses = "cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105";
    const activeClasses = isActive ? "ring-2 ring-blue-500 shadow-md" : "";
    return `${baseClasses} ${activeClasses}`;
  };

  return (
    <div className="space-y-6">
      {/* Alerta de erro se houver */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <XCircle className="h-5 w-5 text-red-600 mr-2" />
            <p className="text-red-800">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refetch}
              className="ml-auto"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar novamente
            </Button>
          </div>
        </div>
      )}

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card 
          className={getCardClasses("todos")}
          onClick={() => handleCardClick("todos")}
        >
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total</div>
            {filterStatus === "todos" && (
              <div className="text-xs text-blue-600 font-medium mt-1">• Filtro ativo</div>
            )}
          </CardContent>
        </Card>
        <Card 
          className={getCardClasses("pendente")}
          onClick={() => handleCardClick("pendente")}
        >
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.pendentes}</div>
            <div className="text-sm text-muted-foreground">Pendentes</div>
            {filterStatus === "pendente" && (
              <div className="text-xs text-blue-600 font-medium mt-1">• Filtro ativo</div>
            )}
          </CardContent>
        </Card>
        <Card 
          className={getCardClasses("aprovado")}
          onClick={() => handleCardClick("aprovado")}
        >
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.aprovados}</div>
            <div className="text-sm text-muted-foreground">Aprovados</div>
            {filterStatus === "aprovado" && (
              <div className="text-xs text-blue-600 font-medium mt-1">• Filtro ativo</div>
            )}
          </CardContent>
        </Card>
        <Card 
          className={getCardClasses("rejeitado")}
          onClick={() => handleCardClick("rejeitado")}
        >
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.rejeitados}</div>
            <div className="text-sm text-muted-foreground">Rejeitados</div>
            {filterStatus === "rejeitado" && (
              <div className="text-xs text-blue-600 font-medium mt-1">• Filtro ativo</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <CardTitle>Pré-lançamentos</CardTitle>
                  {dataLoading && <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />}
                </div>
                {/* Indicador de filtro ativo */}
                <div className="text-sm text-muted-foreground">
                  Exibindo {filteredEntries.length} de {preEntries.length} registros
                  {filterStatus !== "todos" && (
                    <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      Filtro: {filterStatus === "pendente" ? "Pendentes" : 
                               filterStatus === "aprovado" ? "Aprovados" : 
                               filterStatus === "rejeitado" ? "Rejeitados" : filterStatus}
                    </span>
                  )}
                  {searchTerm && (
                    <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      Busca: "{searchTerm}"
                    </span>
                  )}
                </div>
              </div>            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              {/* Filtros */}
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-full sm:w-64"
                  />
                </div>
                
                <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as StatusPreLancamento | "todos")}>
                  <SelectTrigger className="w-full sm:w-32">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="aprovado">Aprovado</SelectItem>
                    <SelectItem value="rejeitado">Rejeitado</SelectItem>
                    <SelectItem value="duplicado">Duplicado</SelectItem>
                  </SelectContent>
                </Select>

                {/* Botão para limpar filtros */}
                {(filterStatus !== "todos" || searchTerm) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFilterStatus("todos");
                      setSearchTerm("");
                    }}
                    className="whitespace-nowrap"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Limpar
                  </Button>
                )}
              </div>

              {/* Ações em lote */}
              {selectedIds.length > 0 && (
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={() => handleBulkAction("aprovar")}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Aprovar ({selectedIds.length})
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => handleBulkAction("rejeitar")}
                    disabled={loading}
                  >
                    Rejeitar ({selectedIds.length})
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedIds.length === filteredEntries.length && filteredEntries.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Confiança</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(entry.id)}
                        onCheckedChange={(checked) => handleSelectOne(entry.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {new Date(entry.data_lancamento).toLocaleDateString('pt-BR')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{entry.descricao}</div>
                        {entry.documento && (
                          <div className="text-sm text-muted-foreground">
                            Doc: {entry.documento}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`font-mono ${entry.valor >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {entry.valor >= 0 ? '+' : ''}
                        {entry.valor.toLocaleString('pt-BR', { 
                          style: 'currency', 
                          currency: 'BRL' 
                        })}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`${getStatusColor(entry.status_aprovacao)} border-0`}>
                        {getStatusIcon(entry.status_aprovacao)}
                        <span className="ml-1 capitalize">{entry.status_aprovacao}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`${getConfidenceColor(entry.score_matching || 0)} border-0`}>
                        {(entry.score_matching || 0).toFixed(0)}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleIndividualAction(entry.id, "aprovar")}
                            disabled={loading || entry.status_aprovacao === "aprovado"}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Aprovar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleIndividualAction(entry.id, "rejeitar")}
                            disabled={loading || entry.status_aprovacao === "rejeitado"}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Rejeitar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleIndividualAction(entry.id, "editar")}
                            disabled={loading}
                          >
                            <Edit3 className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredEntries.length === 0 && !dataLoading && (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum pré-lançamento encontrado</p>
              <p className="text-sm mt-2">
                {searchTerm || filterStatus !== "todos" 
                  ? "Tente ajustar os filtros de busca" 
                  : "Importe um arquivo para ver os pré-lançamentos aqui"
                }
              </p>
            </div>
          )}

          {dataLoading && (
            <div className="text-center py-8 text-muted-foreground">
              <RefreshCw className="h-12 w-12 mx-auto mb-4 opacity-50 animate-spin" />
              <p>Carregando pré-lançamentos...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}