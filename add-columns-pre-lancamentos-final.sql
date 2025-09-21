-- Adicionar colunas usuario_id e empresa_id à tabela pre_lancamentos
ALTER TABLE pre_lancamentos 
ADD COLUMN IF NOT EXISTS usuario_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id);

-- Atualizar registros existentes baseado no padrão dos lotes
-- Usar usuario_upload da tabela lotes_importacao
UPDATE pre_lancamentos 
SET usuario_id = l.usuario_upload
FROM lotes_importacao l 
WHERE pre_lancamentos.lote_id = l.id 
AND pre_lancamentos.usuario_id IS NULL;

-- Para empresa_id, precisamos buscar da tabela usuarios
UPDATE pre_lancamentos 
SET empresa_id = u.empresa_id
FROM usuarios u
WHERE pre_lancamentos.usuario_id = u.id 
AND pre_lancamentos.empresa_id IS NULL;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_pre_lancamentos_usuario_id ON pre_lancamentos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pre_lancamentos_empresa_id ON pre_lancamentos(empresa_id);