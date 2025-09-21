"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Info,
  Settings,
  Eye
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";

type StatusUpload = 'idle' | 'uploading' | 'processing' | 'completed' | 'error';

interface ImportUploadProps {
  onNavigateToPending?: () => void;
}

export function ImportUpload({ onNavigateToPending }: ImportUploadProps) {
  const [uploadStatus, setUploadStatus] = useState<StatusUpload>('idle');
  const [progress, setProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [processingResult, setProcessingResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { userData } = useAuth();

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    if (rejectedFiles.length > 0) {
      toast.error("Arquivo rejeitado", {
        description: "Apenas arquivos OFX e CSV são aceitos (máx. 10MB)",
      });
      return;
    }

    const file = acceptedFiles[0];
    if (file) {
      // Validação básica de arquivo
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (!['ofx', 'csv'].includes(fileExtension || '')) {
        toast.error("Arquivo inválido", {
          description: "Apenas arquivos .ofx e .csv são aceitos",
        });
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error("Arquivo muito grande", {
          description: "O arquivo deve ter no máximo 10MB",
        });
        return;
      }

      setUploadedFile(file);
      setError(null);
      handleFileUpload(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/x-ofx': ['.ofx'],
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  const handleFileUpload = async (file: File) => {
    if (!userData?.id) {
      toast.error("Usuário não autenticado");
      return;
    }

    setUploadStatus('uploading');
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('empresaId', userData.empresa_id);
      formData.append('usuarioId', userData.id);

      // Simular progresso de upload
      const uploadInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(uploadInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      setUploadStatus('processing');

      const response = await fetch('/api/import/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(uploadInterval);
      setProgress(100);

      if (response.ok) {
        const result = await response.json();
        setProcessingResult(result.lote || result);
        setUploadStatus('completed');
        
        toast.success("Arquivo processado com sucesso!", {
          description: `${result.lote?.total_registros || 0} registros processados e enviados para revisão`,
        });
      } else {
        const errorData = await response.json();
        
        // Tratar diferentes tipos de erro
        if (response.status === 409) {
          setUploadStatus('error');
          setError("Arquivo já foi importado anteriormente");
          toast.error("Arquivo duplicado", {
            description: "Este arquivo já foi importado anteriormente",
          });
        } else {
          throw new Error(errorData.error || 'Erro no upload');
        }
      }
    } catch (err: any) {
      setUploadStatus('error');
      setError(err.message);
      
      toast.error("Erro no upload", {
        description: err.message,
      });
    }
  };

  const resetUpload = () => {
    setUploadStatus('idle');
    setProgress(0);
    setUploadedFile(null);
    setProcessingResult(null);
    setError(null);
  };

  const getFileTypeColor = (filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    return extension === 'ofx' ? 'bg-blue-500' : 'bg-green-500';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload de Arquivo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
              ${isDragActive ? 'border-primary bg-primary/5 scale-105' : 'border-muted-foreground/25 hover:border-muted-foreground/50'}
              ${uploadStatus === 'completed' ? 'border-green-500 bg-green-50 dark:bg-green-950' : ''}
              ${uploadStatus === 'error' ? 'border-red-500 bg-red-50 dark:bg-red-950' : ''}
            `}
          >
            <input {...getInputProps()} />
            
            {uploadStatus === 'idle' && (
              <div className="space-y-4">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <p className="text-lg font-medium mb-2">
                    {isDragActive ? 'Solte o arquivo aqui' : 'Arraste um arquivo ou clique para selecionar'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Formatos suportados: <Badge variant="secondary">OFX</Badge> <Badge variant="secondary">CSV</Badge>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Tamanho máximo: 10MB
                  </p>
                </div>
              </div>
            )}

            {(uploadStatus === 'uploading' || uploadStatus === 'processing') && (
              <div className="space-y-4">
                <Upload className="h-12 w-12 mx-auto text-blue-600 animate-pulse" />
                <div>
                  <p className="text-lg font-medium mb-4">
                    {uploadStatus === 'uploading' ? 'Enviando arquivo...' : 'Processando dados...'}
                  </p>
                  <Progress value={progress} className="w-full max-w-md mx-auto" />
                  <p className="text-sm text-muted-foreground mt-2">{progress}%</p>
                </div>
              </div>
            )}

            {uploadStatus === 'completed' && (
              <div className="space-y-4">
                <CheckCircle className="h-12 w-12 mx-auto text-green-600" />
                <div>
                  <p className="text-lg font-medium text-green-700">Arquivo processado com sucesso!</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {processingResult?.totalRegistros} registros encontrados
                  </p>
                </div>
              </div>
            )}

            {uploadStatus === 'error' && (
              <div className="space-y-4">
                <AlertCircle className="h-12 w-12 mx-auto text-red-600" />
                <div>
                  <p className="text-lg font-medium text-red-700">Erro no processamento</p>
                  <p className="text-sm text-red-600 mt-2">{error}</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={resetUpload}
                  >
                    Tentar novamente
                  </Button>
                </div>
              </div>
            )}
          </div>

          {uploadedFile && uploadStatus === 'completed' && processingResult && (
            <div className="mt-6 space-y-4">
              <Separator />
              
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-medium ${getFileTypeColor(uploadedFile.name)}`}>
                  {uploadedFile.name.split('.').pop()?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{uploadedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p><strong>Resumo do processamento:</strong></p>
                    <ul className="text-sm space-y-1 ml-4">
                      <li>• {processingResult.total_registros || processingResult.totalRegistros} registros processados</li>
                      <li>• {processingResult.registros_aprovados || processingResult.registrosAutoConfirmados || 0} confirmados automaticamente</li>
                      <li>• {(processingResult.total_registros || processingResult.totalRegistros) - (processingResult.registros_aprovados || processingResult.registrosAutoConfirmados || 0)} aguardando revisão</li>
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>

              <div className="flex gap-4">
                <Button 
                  onClick={() => onNavigateToPending ? onNavigateToPending() : window.location.href = '/financial/import?tab=pending'}
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Revisar Pendentes
                </Button>
                <Button 
                  variant="outline" 
                  onClick={resetUpload}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Novo Upload
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => window.location.href = '/financial/import?tab=templates'}
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Configurar Templates
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instruções de uso */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Instruções de Uso</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Badge variant="outline" className="bg-blue-50">OFX</Badge>
                Arquivos bancários
              </h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Formato padrão de bancos</li>
                <li>• Contém dados estruturados</li>
                <li>• Alta precisão de importação</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Badge variant="outline" className="bg-green-50">CSV</Badge>
                Planilhas customizadas
              </h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Colunas: Data, Descrição, Valor</li>
                <li>• Separado por vírgula ou ponto-vírgula</li>
                <li>• Aceita campos opcionais</li>
              </ul>
            </div>
          </div>
          
          <Separator />
          
          <div className="text-sm text-muted-foreground">
            <p><strong>Dica:</strong> Configure templates antes da importação para melhor precisão do matching automático.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}