# Script PowerShell para commit no GitHub
Set-Location "c:\Users\romar\Downloads\transacoes (4)"

Write-Host "=== Verificando status do git ===" -ForegroundColor Green
& git status

Write-Host "`n=== Adicionando arquivos ===" -ForegroundColor Green
& git add .

Write-Host "`n=== Fazendo commit ===" -ForegroundColor Green
& git commit -m "feat: Implementar paginacao melhorada no plano de contas

- Corrigir paginacao para preservar estrutura hierarquica
- Implementar achatamento da arvore para paginacao
- Adicionar filtros funcionais com busca e tipo
- Melhorar performance exibindo apenas itens da pagina atual
- Corrigir problemas de importacao de componentes
- Implementar navegacao intuitiva com controles de paginacao"

Write-Host "`n=== Fazendo push para o GitHub ===" -ForegroundColor Green
& git push -u origin master

Write-Host "`n=== Operacao concluida! ===" -ForegroundColor Green
Read-Host "Pressione Enter para continuar"
