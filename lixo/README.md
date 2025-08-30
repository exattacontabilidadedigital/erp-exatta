# ERP Exatta

Sistema de gestão financeira e contábil desenvolvido com Next.js, React e Supabase.

## Funcionalidades
- Cadastro e gerenciamento de centros de custos
- Cadastro de tipos de centro de custos
- Cadastro de responsáveis, departamentos e empresas
- Lançamentos financeiros
- Relatórios e análises
- Autenticação de usuários
- Experiência otimizada para desktop e mobile

## Tecnologias Utilizadas
- Next.js 15+
- React 19+
- Supabase
- Sonner (toasts)
- Tailwind CSS

## Estrutura do Projeto
```
components/
  centro-custos/
  tipos-centro-custos/
  ...
contexts/
hooks/
lib/
public/
scripts/
styles/
app/
```

## Como rodar o projeto
1. Instale as dependências:
   ```sh
   pnpm install
   ```
2. Configure as variáveis de ambiente do Supabase.
3. Execute o projeto:
   ```sh
   pnpm dev
   ```

## Scripts SQL
Os scripts para criação e popularização do banco estão na pasta `scripts/`.

## Contribuição
Pull requests são bem-vindos! Para grandes mudanças, abra uma issue primeiro para discutir o que deseja modificar.

## Licença
Este projeto está sob a licença MIT.
