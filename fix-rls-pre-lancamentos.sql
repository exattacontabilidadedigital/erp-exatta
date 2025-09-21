-- SOLUÇÃO PARA O PROBLEMA RLS
-- Execute este SQL no Supabase SQL Editor

-- Opção 1: Desabilitar RLS temporariamente (mais simples)
ALTER TABLE pre_lancamentos DISABLE ROW LEVEL SECURITY;

-- Opção 2: Criar política RLS adequada (mais segura)
-- Se preferir manter RLS, use esta política:
/*
ALTER TABLE pre_lancamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios podem ver pre_lancamentos de sua empresa" 
ON pre_lancamentos FOR SELECT 
USING (empresa_id IN (
  SELECT empresa_id 
  FROM usuarios 
  WHERE id = auth.uid()
));

CREATE POLICY "Usuarios podem inserir pre_lancamentos em sua empresa" 
ON pre_lancamentos FOR INSERT 
WITH CHECK (empresa_id IN (
  SELECT empresa_id 
  FROM usuarios 
  WHERE id = auth.uid()
));

CREATE POLICY "Usuarios podem atualizar pre_lancamentos de sua empresa" 
ON pre_lancamentos FOR UPDATE 
USING (empresa_id IN (
  SELECT empresa_id 
  FROM usuarios 
  WHERE id = auth.uid()
));
*/