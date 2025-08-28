'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function TestSetupPage() {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    // Verificar se já está logado
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
      }
    };
    checkUser();
  }, []);

  const createTestUser = async () => {
    setLoading(true);
    try {
      // Primeiro, criar a empresa
      const { data: empresa, error: empresaError } = await supabase
        .from('empresas')
        .insert({
          razao_social: 'Empresa Teste LTDA',
          nome_fantasia: 'Empresa Teste',
          cnpj: '12.345.678/0001-90',
          email: 'teste@empresa.com',
          telefone: '(11) 99999-9999',
          endereco: 'Rua Teste, 123',
          cidade: 'São Paulo',
          estado: 'SP',
          cep: '01234-567',
          ativo: true
        })
        .select()
        .single();

      if (empresaError) {
        console.error('Erro ao criar empresa:', empresaError);
        toast.error('Erro ao criar empresa: ' + empresaError.message);
        return;
      }

      console.log('Empresa criada:', empresa);

      // Criar usuário na auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: 'admin@teste.com',
        password: '123456',
      });

      if (authError) {
        console.error('Erro ao criar usuário na auth:', authError);
        toast.error('Erro ao criar usuário: ' + authError.message);
        return;
      }

      console.log('Usuário auth criado:', authData);

      // Criar registro na tabela usuarios
      if (authData.user) {
        const { data: userData, error: userError } = await supabase
          .from('usuarios')
          .insert({
            id: authData.user.id,
            nome: 'Administrador Teste',
            email: 'admin@teste.com',
            cargo: 'Administrador',
            role: 'admin',
            empresa_id: empresa.id,
            permissoes: {
              plano_contas: { create: true, read: true, update: true, delete: true },
              lancamentos: { create: true, read: true, update: true, delete: true },
              conciliacao: { create: true, read: true, update: true, delete: true },
              relatorios: { create: true, read: true, update: true, delete: true }
            },
            ativo: true
          })
          .select()
          .single();

        if (userError) {
          console.error('Erro ao criar usuário:', userError);
          toast.error('Erro ao criar dados do usuário: ' + userError.message);
          return;
        }

        console.log('Dados do usuário criados:', userData);
        toast.success('Usuário de teste criado com sucesso!');
        toast.success('Email: admin@teste.com | Senha: 123456');
      }

    } catch (error) {
      console.error('Erro inesperado:', error);
      toast.error('Erro inesperado ao criar usuário de teste');
    } finally {
      setLoading(false);
    }
  };

  const loginTestUser = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'admin@teste.com',
        password: '123456',
      });

      if (error) {
        console.error('Erro no login:', error);
        toast.error('Erro no login: ' + error.message);
        return;
      }

      if (data.user) {
        console.log('Login realizado:', data.user);
        toast.success('Login realizado com sucesso!');
        setUser(data.user);
        // Redirecionar para plano de contas após alguns segundos
        setTimeout(() => {
          router.push('/plano-contas');
        }, 2000);
      }
    } catch (error) {
      console.error('Erro inesperado no login:', error);
      toast.error('Erro inesperado no login');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Erro ao fazer logout: ' + error.message);
    } else {
      setUser(null);
      toast.success('Logout realizado com sucesso!');
    }
  };

  const checkTables = async () => {
    try {
      // Verificar se as tabelas existem e têm dados
      const { data: empresas, error: empresasError } = await supabase
        .from('empresas')
        .select('*')
        .limit(5);

      const { data: usuarios, error: usuariosError } = await supabase
        .from('usuarios')
        .select('*')
        .limit(5);

      console.log('Empresas:', empresas, empresasError);
      console.log('Usuários:', usuarios, usuariosError);

      toast.success('Verificação das tabelas concluída. Verifique o console.');
    } catch (error) {
      console.error('Erro ao verificar tabelas:', error);
      toast.error('Erro ao verificar tabelas');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Setup de Teste</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {user ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-green-800 text-sm">
                    ✅ Logado como: {user.email}
                  </p>
                </div>
                
                <Button 
                  onClick={() => router.push('/plano-contas')}
                  className="w-full"
                >
                  Ir para Plano de Contas
                </Button>
                
                <Button 
                  onClick={logout}
                  variant="outline"
                  className="w-full"
                >
                  Fazer Logout
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-yellow-800 text-sm">
                    ⚠️ Usuário não está logado
                  </p>
                </div>

                <Button 
                  onClick={createTestUser}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Criando...' : 'Criar Usuário de Teste'}
                </Button>

                <Button 
                  onClick={loginTestUser}
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                >
                  {loading ? 'Fazendo Login...' : 'Login com Usuário Teste'}
                </Button>

                <Button 
                  onClick={() => router.push('/login')}
                  variant="secondary"
                  className="w-full"
                >
                  Ir para Página de Login
                </Button>
              </div>
            )}

            <hr />

            <Button 
              onClick={checkTables}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Verificar Tabelas no Console
            </Button>

            <div className="text-xs text-gray-500 text-center">
              <p>Credenciais de teste:</p>
              <p>Email: admin@teste.com</p>
              <p>Senha: 123456</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
