import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface UploadResult {
  success: boolean;
  imported_count?: number;
  message?: string;
  error?: string;
}

export function useUploadOFX() {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadFile = async (file: File, bankAccountId: string): Promise<UploadResult> => {
    if (!file) {
      throw new Error('Nenhum arquivo selecionado');
    }

    if (!bankAccountId) {
      throw new Error('Selecione uma conta bancária antes de fazer upload');
    }

    // Validar tipo de arquivo
    const allowedTypes = ['.ofx', '.qfx'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!allowedTypes.includes(fileExtension)) {
      throw new Error('Tipo de arquivo não suportado. Use arquivos .ofx ou .qfx');
    }

    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bank_account_id', bankAccountId);

      const response = await fetch('/api/reconciliation/upload-ofx', {
        method: 'POST',
        body: formData,
      });

      setProgress(100);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro HTTP ${response.status}`);
      }

      const result = await response.json();

      toast({
        title: "Upload realizado com sucesso!",
        description: `${result.imported_count || 0} transações importadas`,
      });

      return {
        success: true,
        imported_count: result.imported_count,
        message: result.message
      };

    } catch (error) {
      console.error('Erro no upload:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Falha no upload do arquivo";

      toast({
        title: "Erro no Upload",
        description: errorMessage,
        variant: "destructive",
      });

      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // Verificar tamanho (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'Arquivo muito grande. Máximo permitido: 10MB'
      };
    }

    // Verificar extensão
    const allowedTypes = ['.ofx', '.qfx'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!allowedTypes.includes(fileExtension)) {
      return {
        valid: false,
        error: 'Tipo de arquivo não suportado. Use arquivos .ofx ou .qfx'
      };
    }

    return { valid: true };
  };

  const getFileInfo = (file: File) => {
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    return {
      name: file.name,
      size: file.size,
      sizeInMB: `${sizeInMB} MB`,
      extension,
      lastModified: new Date(file.lastModified).toLocaleDateString('pt-BR')
    };
  };

  return {
    uploading,
    progress,
    uploadFile,
    validateFile,
    getFileInfo
  };
}
