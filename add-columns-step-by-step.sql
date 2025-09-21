-- VERSÃO SIMPLIFICADA PARA TESTE
-- Execute uma linha por vez para verificar erros

-- 1. Adicionar apenas a coluna usuario_id primeiro
ALTER TABLE pre_lancamentos 
ADD COLUMN IF NOT EXISTS usuario_id UUID REFERENCES auth.users(id);

-- 2. Adicionar a coluna empresa_id
ALTER TABLE pre_lancamentos 
ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id);

-- 3. Atualizar usuario_id baseado no lotes_importacao
UPDATE pre_lancamentos 
SET usuario_id = l.usuario_upload
FROM lotes_importacao l 
WHERE pre_lancamentos.lote_id = l.id 
AND pre_lancamentos.usuario_id IS NULL;

-- 4. Atualizar empresa_id baseado na tabela usuarios
UPDATE pre_lancamentos 
SET empresa_id = u.empresa_id
FROM usuarios u
WHERE pre_lancamentos.usuario_id = u.id 
AND pre_lancamentos.empresa_id IS NULL;

-- 5. Criar índices
CREATE INDEX IF NOT EXISTS idx_pre_lancamentos_usuario_id ON pre_lancamentos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pre_lancamentos_empresa_id ON pre_lancamentos(empresa_id);