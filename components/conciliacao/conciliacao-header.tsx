"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Calendar, Building, Upload } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase/client";
import Link from "next/link";

interface ContaBancaria {
  id: string;
  nome: string;
  banco: string;
  agencia: string;
  conta: string;
  saldo_atual: number;
  bancos?: {
    nome: string;
  };
}

interface ConciliacaoHeaderProps {
  periodo: { mes: string; ano: string };
  setPeriodo: (periodo: { mes: string; ano: string }) => void;
  setLancamentosImportados: (lancamentos: any[]) => void;
  contaSelecionada: ContaBancaria | null;
  setContaSelecionada: (conta: ContaBancaria | null) => void;
}

export function ConciliacaoHeader({
  periodo,
  setPeriodo,
  setLancamentosImportados,
  contaSelecionada,
  setContaSelecionada
}: ConciliacaoHeaderProps) {
  const { userData, empresaData } = useAuth();
  const [contasBancarias, setContasBancarias] = useState<ContaBancaria[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Carregar contas bancárias
  const loadContasBancarias = useCallback(async () => {
    if (!empresaData?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contas_bancarias')
        .select(`
          *,
          bancos:banco_id (
            id,
            nome,
            codigo
          )
        `)
        .eq('empresa_id', empresaData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const contasFormatadas = (data || []).map(conta => ({
        id: conta.id,
        nome: `${conta.bancos?.nome || 'Banco'} - ${conta.agencia}/${conta.conta}`,
        banco: conta.bancos?.nome || conta.banco_id || 'Banco',
        agencia: conta.agencia,
        conta: conta.conta,
        saldo_atual: conta.saldo_atual || 0,
        bancos: conta.bancos
      }));

      setContasBancarias(contasFormatadas);
    } catch (error) {
      console.error('Erro ao carregar contas bancárias:', error);
    } finally {
      setLoading(false);
    }
  }, [empresaData?.id]);

  // Carregar dados iniciais
  useEffect(() => {
    loadContasBancarias();
  }, [loadContasBancarias]);

  // Função para upload de arquivo OFX
  const handleUploadOFX = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !contaSelecionada) return;

    // Validar extensão do arquivo
    if (!file.name.toLowerCase().endsWith('.ofx') && !file.name.toLowerCase().endsWith('.qfx')) {
      alert('Por favor, selecione um arquivo OFX ou QFX válido.');
      return;
    }

    setUploading(true);
    try {
      console.log('🚀 Iniciando upload OFX...');
      console.log('📊 Dados do upload:', {
        fileName: file.name,
        fileSize: file.size,
        bankAccountId: contaSelecionada.id,
        empresaId: empresaData?.id,
        userId: userData?.id,
        periodo: `${periodo.ano}-${periodo.mes}-01`
      });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('bank_account_id', contaSelecionada.id);
      formData.append('empresa_id', empresaData?.id || '');
      formData.append('user_id', userData?.id || '');
      formData.append('period_start', `${periodo.ano}-${periodo.mes}-01`);
      formData.append('period_end', `${periodo.ano}-${periodo.mes}-31`);

      console.log('📤 Enviando requisição...');
      const response = await fetch('/api/reconciliation/upload-ofx', {
        method: 'POST',
        body: formData,
      });

      console.log('📥 Resposta recebida:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Erro na resposta:', errorData);
        throw new Error(errorData.error || 'Erro ao fazer upload do arquivo');
      }

      const result = await response.json();
      console.log('✅ Upload realizado com sucesso:', result);
      
      // Recarregar dados após upload
      if (setLancamentosImportados) {
        setLancamentosImportados(result.transactions || []);
      }

      alert('Arquivo OFX importado com sucesso!');
    } catch (error) {
      console.error('Erro no upload:', error);
      alert('Erro ao importar arquivo OFX. Tente novamente.');
    } finally {
      setUploading(false);
      // Limpar o input
      event.target.value = '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/contas">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Conciliação Bancária
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Compare transações bancárias com lançamentos do sistema
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-4">
          {/* Seleção de Conta Bancária */}
          <div className="space-y-2 flex-shrink-0">
            <label className="text-sm font-medium">Conta Bancária</label>
            <Select 
              value={contaSelecionada?.id || ''} 
              onValueChange={(value) => {
                const conta = contasBancarias.find(c => c.id === value);
                setContaSelecionada(conta || null);
              }}
              disabled={loading}
            >
              <SelectTrigger className="w-fit min-w-[200px]">
                <SelectValue placeholder="Selecione uma conta bancária" />
              </SelectTrigger>
              <SelectContent>
                {contasBancarias.map((conta) => (
                  <SelectItem key={conta.id} value={conta.id}>
                    {conta.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Seleção de Período */}
          <div className="space-y-2 flex-shrink-0">
            <label className="text-sm font-medium">Período</label>
            <div className="flex gap-2">
              <Select 
                value={periodo.mes} 
                onValueChange={(value) => setPeriodo({ ...periodo, mes: value })}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => {
                    const month = (i + 1).toString().padStart(2, '0');
                    return (
                      <SelectItem key={month} value={month}>
                        {month}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <Select 
                value={periodo.ano} 
                onValueChange={(value) => setPeriodo({ ...periodo, ano: value })}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => {
                    const year = (new Date().getFullYear() - i).toString();
                    return (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Botão Importar OFX */}
          {contaSelecionada && (
            <div className="space-y-2 flex-shrink-0">
              <label className="text-sm font-medium text-transparent">Ação</label>
              <div className="relative">
                <input
                  type="file"
                  accept=".ofx,.qfx"
                  onChange={handleUploadOFX}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={uploading}
                />
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={uploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? 'Importando...' : 'Importar OFX'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
