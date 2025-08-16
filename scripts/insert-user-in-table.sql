-- Script para inserir usuário na tabela usuarios
-- Este script busca o usuário no auth.users e cria entrada na tabela usuarios

DO $$
DECLARE
    user_auth_id uuid;
    empresa_id_var uuid;
BEGIN
    -- Buscar o ID do usuário no sistema de auth pelo email
    SELECT id INTO user_auth_id 
    FROM auth.users 
    WHERE email = 'romario.hj2@gmail.com';
    
    IF user_auth_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não encontrado no sistema de autenticação';
    END IF;
    
    -- Verificar se já existe uma empresa ou criar uma nova
    SELECT id INTO empresa_id_var 
    FROM empresas 
    WHERE razao_social ILIKE '%Exatta%' OR nome_fantasia ILIKE '%Exatta%'
    LIMIT 1;
    
    -- Se não encontrou empresa, criar uma nova
    IF empresa_id_var IS NULL THEN
        INSERT INTO empresas (
            id,
            razao_social,
            nome_fantasia,
            cnpj,
            email,
            telefone,
            endereco,
            cidade,
            estado,
            cep,
            regime_tributario,
            ativo,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            'Exatta Gestão Contábil Ltda',
            'Exatta Contábil',
            '12.345.678/0001-90',
            'contato@exatta.com.br',
            '(11) 99999-9999',
            'Rua das Empresas, 123',
            'São Paulo',
            'SP',
            '01234-567',
            'simples_nacional',
            true,
            NOW(),
            NOW()
        ) RETURNING id INTO empresa_id_var;
    END IF;
    
    -- Inserir ou atualizar o usuário na tabela usuarios
    INSERT INTO usuarios (
        id,
        nome,
        email,
        telefone,
        cargo,
        role,
        empresa_id,
        permissoes,
        ativo,
        created_at,
        updated_at
    ) VALUES (
        user_auth_id,
        'Romário',
        'romario.hj2@gmail.com',
        '(11) 99999-9999',
        'Administrador',
        'admin',
        empresa_id_var,
        '{"dashboard": true, "lancamentos": true, "relatorios": true, "configuracoes": true, "usuarios": true}'::jsonb,
        true,
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        nome = EXCLUDED.nome,
        email = EXCLUDED.email,
        telefone = EXCLUDED.telefone,
        cargo = EXCLUDED.cargo,
        role = EXCLUDED.role,
        empresa_id = EXCLUDED.empresa_id,
        permissoes = EXCLUDED.permissoes,
        ativo = EXCLUDED.ativo,
        updated_at = NOW();
    
    RAISE NOTICE 'Usuário inserido/atualizado com sucesso na tabela usuarios';
    RAISE NOTICE 'ID do usuário: %', user_auth_id;
    RAISE NOTICE 'ID da empresa: %', empresa_id_var;
END $$;
