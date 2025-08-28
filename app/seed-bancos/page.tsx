'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase/client';

export default function SeedBancosPage() {
  const [resultado, setResultado] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const inserirBancosExemplo = async () => {
    setLoading(true);
    setResultado('Inserindo bancos de exemplo...');

    try {
      const bancos = [
        { codigo: '001', nome: 'Banco do Brasil', nomeCompleto: 'Banco do Brasil S.A.', ativo: true, site: 'www.bb.com.br', telefone: '(11) 4004-0001' },
        { codigo: '033', nome: 'Santander', nomeCompleto: 'Banco Santander (Brasil) S.A.', ativo: true, site: 'www.santander.com.br', telefone: '(11) 4004-0033' },
        { codigo: '104', nome: 'Caixa Econômica', nomeCompleto: 'Caixa Econômica Federal', ativo: true, site: 'www.caixa.gov.br', telefone: '(11) 4004-0104' },
        { codigo: '237', nome: 'Bradesco', nomeCompleto: 'Banco Bradesco S.A.', ativo: true, site: 'www.bradesco.com.br', telefone: '(11) 4004-0237' },
        { codigo: '341', nome: 'Itaú', nomeCompleto: 'Itaú Unibanco S.A.', ativo: true, site: 'www.itau.com.br', telefone: '(11) 4004-0341' },
        { codigo: '745', nome: 'Citibank', nomeCompleto: 'Citibank N.A.', ativo: true, site: 'www.citibank.com.br', telefone: '(11) 4004-0745' },
        { codigo: '260', nome: 'Nu Pagamentos', nomeCompleto: 'Nu Pagamentos S.A.', ativo: true, site: 'www.nubank.com.br', telefone: '(11) 4004-0260' },
        { codigo: '077', nome: 'Banco Inter', nomeCompleto: 'Banco Inter S.A.', ativo: true, site: 'www.bancointer.com.br', telefone: '(11) 4004-0077' },
        { codigo: '212', nome: 'Banco Original', nomeCompleto: 'Banco Original S.A.', ativo: true, site: 'www.original.com.br', telefone: '(11) 4004-0212' },
        { codigo: '290', nome: 'PagSeguro', nomeCompleto: 'PagSeguro Digital S.A.', ativo: true, site: 'www.pagseguro.com.br', telefone: '(11) 4004-0290' },
        { codigo: '380', nome: 'PicPay', nomeCompleto: 'PicPay Serviços S.A.', ativo: true, site: 'www.picpay.com', telefone: '(11) 4004-0380' },
        { codigo: '336', nome: 'C6 Bank', nomeCompleto: 'Banco C6 S.A.', ativo: true, site: 'www.c6bank.com.br', telefone: '(11) 4004-0336' },
        { codigo: '208', nome: 'BTG Pactual', nomeCompleto: 'Banco BTG Pactual S.A.', ativo: true, site: 'www.btgpactual.com', telefone: '(11) 4004-0208' },
        { codigo: '655', nome: 'Banco Votorantim', nomeCompleto: 'Banco Votorantim S.A.', ativo: false, site: 'www.bv.com.br', telefone: '(11) 4004-0655' },
        { codigo: '422', nome: 'Banco Safra', nomeCompleto: 'Banco Safra S.A.', ativo: true, site: 'www.safra.com.br', telefone: '(11) 4004-0422' }
      ];

      let sucessos = 0;
      let erros = 0;

      for (const banco of bancos) {
        try {
          const { error } = await supabase
            .from('bancos')
            .upsert(banco, { onConflict: 'codigo' });

          if (error) {
            console.error(`Erro ao inserir ${banco.nome}:`, error);
            erros++;
            setResultado(prev => prev + `\n❌ Erro ${banco.nome}: ${error.message}`);
          } else {
            sucessos++;
            setResultado(prev => prev + `\n✅ ${banco.nome} inserido com sucesso`);
          }
        } catch (err) {
          erros++;
          setResultado(prev => prev + `\n❌ Erro ${banco.nome}: ${err}`);
        }
      }

      setResultado(prev => prev + `\n\n🎉 Finalizado! ${sucessos} sucessos, ${erros} erros`);
      
      // Disparar evento para atualizar a lista
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("bancosAtualizado"));
      }

    } catch (error: any) {
      setResultado(prev => prev + `\n❌ ERRO GERAL: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const limparBancos = async () => {
    setLoading(true);
    setResultado('Limpando bancos...');

    try {
      const { error } = await supabase
        .from('bancos')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (error) {
        setResultado(prev => prev + `\n❌ Erro ao limpar: ${error.message}`);
      } else {
        setResultado(prev => prev + '\n✅ Bancos removidos com sucesso');
        
        // Disparar evento para atualizar a lista
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("bancosAtualizado"));
        }
      }
    } catch (error: any) {
      setResultado(prev => prev + `\n❌ Erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Configurar Dados de Exemplo - Bancos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button 
                onClick={inserirBancosExemplo}
                disabled={loading}
                variant="default"
              >
                {loading ? 'Inserindo...' : 'Inserir 15 Bancos de Exemplo'}
              </Button>
              
              <Button 
                onClick={limparBancos}
                variant="destructive"
                disabled={loading}
              >
                {loading ? 'Limpando...' : 'Limpar Todos os Bancos'}
              </Button>
            </div>
            
            {resultado && (
              <div className="bg-gray-100 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Log de Execução:</h3>
                <pre className="text-sm whitespace-pre-wrap font-mono">{resultado}</pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
