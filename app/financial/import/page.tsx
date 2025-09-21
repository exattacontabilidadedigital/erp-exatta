"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { 
  Upload, 
  FileText, 
  Settings, 
  History, 
  BarChart3,
  Clock,
  CheckCircle,
  TrendingUp,
  Activity,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import { ImportUpload } from "./components/import-upload";
import { PreEntries } from "./components/pre-entries";
import { ImportTemplates } from "./components/import-templates";
import { ImportHistory } from "./components/import-history";
import { useImportStats } from "@/hooks/use-import-data";

export default function ImportPage() {
  const [activeTab, setActiveTab] = useState("upload");
  const { stats, loading: statsLoading, error: statsError, refetch: refetchStats } = useImportStats();

  const successRate = stats.confirmedToday + stats.rejectedToday > 0 
    ? (stats.confirmedToday / (stats.confirmedToday + stats.rejectedToday)) * 100 
    : 0;

  // Função para recarregar dados quando houver mudanças
  const handleDataChange = () => {
    refetchStats();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Importar Lançamentos</h1>
          <p className="text-muted-foreground">
            Importe lançamentos financeiros de arquivos OFX e CSV
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={refetchStats}
          disabled={statsLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${statsLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Alerta de erro se houver */}
      {statsError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {statsError}
          </AlertDescription>
        </Alert>
      )}

      {/* Dashboard de estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Lotes Processados
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '...' : stats.totalBatches}
            </div>
            <p className="text-xs text-muted-foreground">
              Total de importações
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pendentes
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '...' : stats.pendingEntries}
            </div>
            <p className="text-xs text-muted-foreground">
              Aguardando revisão
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Taxa de Sucesso
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '...' : `${successRate.toFixed(1)}%`}
            </div>
            <Progress value={successRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Hoje: {stats.confirmedToday} confirmados, {stats.rejectedToday} rejeitados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Confiança Média
            </CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '...' : `${(stats.avgConfidence * 100).toFixed(1)}%`}
            </div>
            <Progress value={stats.avgConfidence * 100} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Precisão do matching
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Importar
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center gap-2 relative">
            <FileText className="h-4 w-4" />
            Pendentes
            {stats.pendingEntries > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                {stats.pendingEntries}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Histórico
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <ImportUpload onNavigateToPending={() => setActiveTab('pending')} />
        </TabsContent>

        <TabsContent value="pending">
          <PreEntries onDataChange={handleDataChange} />
        </TabsContent>

        <TabsContent value="templates">
          <ImportTemplates />
        </TabsContent>

        <TabsContent value="history">
          <ImportHistory />
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytics e Relatórios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-8">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Dashboard de analytics em desenvolvimento</p>
                <p className="text-sm mt-2">
                  Aqui você poderá visualizar métricas detalhadas de performance,
                  <br />
                  tendências de matching e relatórios de uso dos templates.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}