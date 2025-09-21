-- Script SQL para adicionar colunas user_id e empresa_id em pre_lancamentos
-- Executar diretamente no Supabase SQL Editor ou pgAdmin

-- 1. Adicionar colunas
ALTER TABLE public.pre_lancamentos 
ADD COLUMN IF NOT EXISTS user_id uuid,
ADD COLUMN IF NOT EXISTS empresa_id uuid;

-- 2. Adicionar comentários
COMMENT ON COLUMN public.pre_lancamentos.user_id IS 'ID do usuário que fez upload do lote';
COMMENT ON COLUMN public.pre_lancamentos.empresa_id IS 'ID da empresa do usuário';

-- 3. Criar foreign keys
ALTER TABLE public.pre_lancamentos 
ADD CONSTRAINT IF NOT EXISTS fk_pre_lancamentos_user_id 
FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE SET NULL;

ALTER TABLE public.pre_lancamentos 
ADD CONSTRAINT IF NOT EXISTS fk_pre_lancamentos_empresa_id 
FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE;

-- 4. Criar índices
CREATE INDEX IF NOT EXISTS idx_pre_lancamentos_user_id ON public.pre_lancamentos(user_id);
CREATE INDEX IF NOT EXISTS idx_pre_lancamentos_empresa_id ON public.pre_lancamentos(empresa_id);

-- 5. Atualizar registros existentes
UPDATE public.pre_lancamentos 
SET 
    user_id = lotes.usuario_upload,
    empresa_id = usuarios.empresa_id
FROM 
    lotes_importacao AS lotes
    JOIN usuarios ON lotes.usuario_upload = usuarios.id
WHERE 
    pre_lancamentos.lote_id = lotes.id;

-- 6. Criar função para manter as colunas atualizadas
CREATE OR REPLACE FUNCTION sync_pre_lancamentos_user_empresa()
RETURNS TRIGGER AS $$
BEGIN
    -- Buscar user_id e empresa_id do lote
    SELECT 
        l.usuario_upload,
        u.empresa_id
    INTO 
        NEW.user_id,
        NEW.empresa_id
    FROM lotes_importacao l
    JOIN usuarios u ON l.usuario_upload = u.id
    WHERE l.id = NEW.lote_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Criar trigger
DROP TRIGGER IF EXISTS trigger_sync_pre_lancamentos_user_empresa ON pre_lancamentos;
CREATE TRIGGER trigger_sync_pre_lancamentos_user_empresa
    BEFORE INSERT ON pre_lancamentos
    FOR EACH ROW
    EXECUTE FUNCTION sync_pre_lancamentos_user_empresa();

-- 8. Atualizar políticas RLS
DROP POLICY IF EXISTS "Usuários podem ver pré-lançamentos de seus lotes" ON pre_lancamentos;

-- Nova política usando empresa_id diretamente (mais eficiente)
CREATE POLICY "Usuarios podem ver pre-lancamentos de sua empresa" ON pre_lancamentos
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM usuarios 
            WHERE usuarios.id = auth.uid() 
            AND usuarios.empresa_id = pre_lancamentos.empresa_id
        )
    );

-- 9. Verificar resultado
SELECT 
    COUNT(*) as total,
    COUNT(user_id) as com_user_id,
    COUNT(empresa_id) as com_empresa_id
FROM pre_lancamentos;