@echo off
cd /d "c:\Users\romar\Downloads\transacoes (4)"

echo === Verificando status do git ===
git status

echo.
echo === Adicionando arquivos ===
git add .

echo.
echo === Fazendo commit ===
git commit -m "feat: Implementar paginacao melhorada no plano de contas

- Corrigir paginacao para preservar estrutura hierarquica
- Implementar achatamento da arvore para paginacao
- Adicionar filtros funcionais com busca e tipo
- Melhorar performance exibindo apenas itens da pagina atual
- Corrigir problemas de importacao de componentes
- Implementar navegacao intuitiva com controles de paginacao"

echo.
echo === Fazendo push para o GitHub ===
git push -u origin master

echo.
echo === Operacao concluida! ===
pause
