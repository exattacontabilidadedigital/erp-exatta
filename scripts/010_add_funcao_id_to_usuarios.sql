-- Adiciona o campo funcao_id na tabela usuarios para vincular à tabela funcoes
ALTER TABLE usuarios ADD COLUMN funcao_id UUID REFERENCES funcoes(id);
