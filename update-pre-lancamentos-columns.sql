-- Script para adicionar colunas user_id e empresa_id na tabela pre_lancamentos
-- Executar com privilégios de administrador

-- 1. Adicionar coluna user_id na tabela pre_lancamentos
-- (para rastrear diretamente qual usuário criou o pré-lançamento)
ALTER TABLE public.pre_lancamentos 
ADD COLUMN IF NOT EXISTS user_id uuid;

-- Adicionar comentário na coluna
COMMENT ON COLUMN public.pre_lancamentos.user_id IS 'ID do usuário que fez upload do lote (derivado de lotes_importacao.usuario_upload)';

-- 2. Adicionar coluna empresa_id na tabela pre_lancamentos
-- (para facilitar consultas diretas por empresa sem precisar fazer JOIN)
ALTER TABLE public.pre_lancamentos 
ADD COLUMN IF NOT EXISTS empresa_id uuid;

-- Adicionar comentário na coluna
COMMENT ON COLUMN public.pre_lancamentos.empresa_id IS 'ID da empresa do usuário (derivado de usuarios.empresa_id)';

-- 3. Criar foreign key constraints
ALTER TABLE public.pre_lancamentos 
ADD CONSTRAINT IF NOT EXISTS pre_lancamentos_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE SET NULL;

ALTER TABLE public.pre_lancamentos 
ADD CONSTRAINT IF NOT EXISTS pre_lancamentos_empresa_id_fkey 
FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE;

-- 4. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_pre_lancamentos_user_id 
ON public.pre_lancamentos(user_id);

CREATE INDEX IF NOT EXISTS idx_pre_lancamentos_empresa_id 
ON public.pre_lancamentos(empresa_id);

-- Índice composto para consultas por empresa e status
CREATE INDEX IF NOT EXISTS idx_pre_lancamentos_empresa_status 
ON public.pre_lancamentos(empresa_id, status_aprovacao);

-- 5. Atualizar registros existentes na tabela pre_lancamentos
-- Buscar user_id e empresa_id através da relação com lotes_importacao e usuarios

UPDATE public.pre_lancamentos 
SET 
    user_id = l.usuario_upload,
    empresa_id = u.empresa_id
FROM lotes_importacao l
JOIN usuarios u ON l.usuario_upload = u.id
WHERE 
    pre_lancamentos.lote_id = l.id
    AND (pre_lancamentos.user_id IS NULL OR pre_lancamentos.empresa_id IS NULL);

-- 6. Criar função para manter as colunas atualizadas automaticamente
CREATE OR REPLACE FUNCTION update_pre_lancamentos_user_empresa()
RETURNS TRIGGER AS $$
BEGIN
    -- Quando um novo pré-lançamento é criado, buscar user_id e empresa_id do lote
    IF NEW.user_id IS NULL OR NEW.empresa_id IS NULL THEN
        SELECT 
            l.usuario_upload,
            u.empresa_id
        INTO 
            NEW.user_id,
            NEW.empresa_id
        FROM lotes_importacao l
        JOIN usuarios u ON l.usuario_upload = u.id
        WHERE l.id = NEW.lote_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Criar trigger para executar a função automaticamente
DROP TRIGGER IF EXISTS trigger_update_pre_lancamentos_user_empresa ON pre_lancamentos;
CREATE TRIGGER trigger_update_pre_lancamentos_user_empresa
    BEFORE INSERT ON pre_lancamentos
    FOR EACH ROW
    EXECUTE FUNCTION update_pre_lancamentos_user_empresa();

-- 8. Atualizar políticas RLS para usar as novas colunas

-- Remover política antiga
DROP POLICY IF EXISTS "Usuários podem ver pré-lançamentos de seus lotes" ON pre_lancamentos;

-- Criar nova política mais eficiente usando empresa_id diretamente
CREATE POLICY "Usuários podem gerenciar pré-lançamentos de sua empresa" ON pre_lancamentos
    FOR ALL USING (
        -- Acesso direto pela empresa do usuário
        EXISTS (
            SELECT 1 FROM usuarios 
            WHERE usuarios.id = auth.uid() 
            AND usuarios.empresa_id = pre_lancamentos.empresa_id
        )
    );

-- Política adicional para o próprio usuário (acesso direto aos seus pré-lançamentos)
CREATE POLICY "Usuários podem ver próprios pré-lançamentos" ON pre_lancamentos
    FOR ALL USING (pre_lancamentos.user_id = auth.uid());

-- 9. Verificar resultados da atualização
SELECT 
    'Verificação pós-atualização' as status,
    COUNT(*) as total_registros,
    COUNT(user_id) as registros_com_user_id,
    COUNT(empresa_id) as registros_com_empresa_id,
    COUNT(*) - COUNT(user_id) as registros_sem_user_id,
    COUNT(*) - COUNT(empresa_id) as registros_sem_empresa_id
FROM pre_lancamentos;

-- 10. Mostrar exemplos dos dados atualizados
SELECT 
    pl.id,
    pl.descricao,
    pl.valor,
    pl.status_aprovacao,
    pl.user_id,
    pl.empresa_id,
    u.nome as usuario_nome,
    u.email as usuario_email,
    e.razao_social as empresa_nome
FROM pre_lancamentos pl
LEFT JOIN usuarios u ON pl.user_id = u.id
LEFT JOIN empresas e ON pl.empresa_id = e.id
ORDER BY pl.data_criacao DESC
LIMIT 5;

-- 11. Verificar se os índices foram criados
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'pre_lancamentos' 
AND (indexname LIKE '%user_id%' OR indexname LIKE '%empresa_id%')
ORDER BY indexname;