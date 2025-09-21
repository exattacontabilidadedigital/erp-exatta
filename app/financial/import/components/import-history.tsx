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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Eye, 
  Download, 
  Trash2, 
  MoreHorizontal,
  Search,
  Filter,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Calendar,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { useImportBatches } from "@/hooks/use-import-data";

type StatusLote = 'pendente' | 'processando' | 'processado' | 'erro' | 'cancelado';

export function ImportHistory() {
  const { batches, loading, error, refetch } = useImportBatches();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<StatusLote | "todos">("todos");
  const [filterType, setFilterType] = useState<"todos" | "ofx" | "csv">("todos");
  const [selectedBatch, setSelectedBatch] = useState<any | null>(null);

  const filteredBatches = batches.filter(batch => {
    const matchesSearch = searchTerm === "" || 
      batch.nome_arquivo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "todos" || batch.status === filterStatus;
    const matchesType = filterType === "todos" || batch.tipo_arquivo.toLowerCase() === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusColor = (status: StatusLote) => {
    switch (status) {
      case "pendente": return "text-gray-600 bg-gray-50";
      case "processando": return "text-blue-600 bg-blue-50";
      case "processado": return "text-green-600 bg-green-50";
      case "erro": return "text-red-600 bg-red-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  const getStatusIcon = (status: StatusLote) => {
    switch (status) {
      case "pendente": return <Clock className="h-4 w-4" />;
      case "processando": return <AlertCircle className="h-4 w-4 animate-pulse" />;
      case "processado": return <CheckCircle className="h-4 w-4" />;
      case "erro": return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getFileTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "ofx": return "text-purple-600 bg-purple-50";
      case "csv": return "text-orange-600 bg-orange-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const handleViewDetails = (batch: any) => {
    setSelectedBatch(batch);
  };

  const handleDownloadLog = (batch: any) => {
    toast.info("Download do log iniciado...");
    // Implementar download do log
  };

  // Exclusão real pode ser implementada na API futuramente; por ora, apenas feedback
  const handleDelete = async (_id: string) => {
    toast.info('Funcionalidade de exclusão ainda não disponível');
  };

  const stats = {
    total: batches.length,
    processados: batches.filter(b => b.status === "processado").length,
    processando: batches.filter(b => b.status === "processando").length,
    erros: batches.filter(b => b.status === "erro").length,
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
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.processados}</div>
            <div className="text-sm text-muted-foreground">Processados</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.processando}</div>
            <div className="text-sm text-muted-foreground">Processando</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.erros}</div>
            <div className="text-sm text-muted-foreground">Com Erro</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <CardTitle>Histórico de Importações</CardTitle>
              {loading && <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por arquivo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-full sm:w-64"
                />
              </div>
              
              <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as StatusLote | "todos")}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos Status</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="processando">Processando</SelectItem>
                  <SelectItem value="processado">Processado</SelectItem>
                  <SelectItem value="erro">Erro</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterType} onValueChange={(value) => setFilterType(value as "todos" | "ofx" | "csv")}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos Tipos</SelectItem>
                  <SelectItem value="ofx">OFX</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Arquivo</TableHead>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Registros</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Taxa Sucesso</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBatches.map((batch) => (
                  <TableRow key={batch.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium text-sm">{batch.nome_arquivo}</div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="outline" className={`${getFileTypeColor(batch.tipo_arquivo)} border-0 text-xs`}>
                              {batch.tipo_arquivo.toUpperCase()}
                            </Badge>
                            <span>{formatFileSize(batch.tamanho_arquivo || 0)}</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div>{new Date(batch.data_upload).toLocaleDateString('pt-BR')}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(batch.data_upload).toLocaleTimeString('pt-BR')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`${getStatusColor(batch.status)} border-0`}>
                        {getStatusIcon(batch.status)}
                        <span className="ml-1 capitalize">{batch.status}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{batch.total_registros || 0} total</div>
                        <div className="text-xs text-muted-foreground">
                          {batch.registros_processados || 0} processados
                          {(batch.registros_com_erro || 0) > 0 && (
                            <span className="text-red-600 ml-1">
                              • {batch.registros_com_erro} erros
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        -
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground text-sm">-</span>
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
                            onClick={() => handleViewDetails(batch)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDownloadLog(batch)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download Log
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(batch.id)}
                            disabled={loading || batch.status === "processando"}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredBatches.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma importação encontrada</p>
              <p className="text-sm mt-2">
                {searchTerm || filterStatus !== "todos" || filterType !== "todos"
                  ? "Tente ajustar os filtros de busca" 
                  : "Importe um arquivo para ver o histórico aqui"
                }
              </p>
            </div>
          )}

          {loading && (
            <div className="text-center py-8 text-muted-foreground">
              <RefreshCw className="h-12 w-12 mx-auto mb-4 opacity-50 animate-spin" />
              <p>Carregando histórico...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Detalhes */}
      <Dialog open={!!selectedBatch} onOpenChange={() => setSelectedBatch(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Importação</DialogTitle>
            <DialogDescription>
              {selectedBatch?.nome_arquivo}
            </DialogDescription>
          </DialogHeader>
          
          {selectedBatch && (
            <div className="space-y-6">
              {/* Informações Gerais */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    <Badge variant="outline" className={`${getStatusColor(selectedBatch.status)} border-0`}>
                      {getStatusIcon(selectedBatch.status)}
                      <span className="ml-1 capitalize">{selectedBatch.status}</span>
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Tipo de Arquivo</Label>
                  <div className="mt-1">
                    <Badge variant="outline" className={`${getFileTypeColor(selectedBatch.tipo_arquivo)} border-0`}>
                      {String(selectedBatch.tipo_arquivo || '').toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Tamanho</Label>
                  <div className="mt-1 text-sm">{formatFileSize(selectedBatch.tamanho_arquivo || 0)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Data Upload</Label>
                  <div className="mt-1 text-sm">
                    {new Date(selectedBatch.data_upload).toLocaleString('pt-BR')}
                  </div>
                </div>
              </div>

              {/* Estatísticas de Processamento */}
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Estatísticas de Processamento</Label>
                <div className="mt-2 grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{selectedBatch.total_registros || 0}</div>
                    <div className="text-sm text-muted-foreground">Total de Registros</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{selectedBatch.registros_processados || 0}</div>
                    <div className="text-sm text-muted-foreground">Confirmados</div>
                  </div>
                  {(selectedBatch.registros_com_erro || 0) > 0 && (
                    <div className="bg-red-50 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{selectedBatch.registros_com_erro}</div>
                      <div className="text-sm text-muted-foreground">Com Erro</div>
                    </div>
                  )}
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {/* Valor total não está disponível no lote; placeholder */}
                      {'-'}
                    </div>
                    <div className="text-sm text-muted-foreground">Valor Total</div>
                  </div>
                </div>
              </div>

              {/* Configurações */}
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Configurações Utilizadas</Label>
                <div className="mt-2 bg-gray-50 p-3 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Auto-confirmar</span>
                    <span className="text-sm font-medium">
                      {selectedBatch.configuracao?.autoConfirmar ? "Sim" : "Não"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Limite de Confiança</span>
                    <span className="text-sm font-medium">
                      {((selectedBatch.configuracao?.limiteConfianca || 0) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Permitir Duplicadas</span>
                    <span className="text-sm font-medium">
                      {selectedBatch.configuracao?.permitirDuplicadas ? "Sim" : "Não"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Estatísticas Avançadas */}
              {selectedBatch.estatisticas && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Estatísticas Avançadas</Label>
                  <div className="mt-2 bg-gray-50 p-3 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Tempo de Processamento</span>
                      <span className="text-sm font-medium">-</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Taxa de Sucesso</span>
                      <span className="text-sm font-medium">-</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Matches Automáticos</span>
                      <span className="text-sm font-medium">-</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Matches Manuais</span>
                      <span className="text-sm font-medium">-</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Observações de Erro */}
              {selectedBatch.observacoes && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Observações</Label>
                  <div className="mt-2 bg-red-50 border border-red-200 p-3 rounded-lg">
                    <p className="text-sm text-red-800">{selectedBatch.observacoes}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={className}>{children}</label>;
}