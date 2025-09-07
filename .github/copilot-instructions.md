# Regras para uso do shadcn no projeto

1. **Instalação**  
    Utilize o comando oficial para instalar componentes shadcn:  
    `npx shadcn-ui@latest add <componente>`

2. **Customização**  
    Personalize os componentes apenas via tokens de tema ou arquivos de configuração.  
    Evite modificar diretamente o código fonte dos componentes gerados.

3. **Consistência Visual**  
    Siga o padrão de design definido no projeto.  
    Utilize os componentes shadcn para garantir consistência na interface.

4. **Documentação**  
    Sempre consulte a [documentação oficial](https://ui.shadcn.com/docs) antes de implementar novos componentes.

5. **Boas Práticas**  
    - Prefira composições e extensões via props e slots.
    - Evite duplicação de componentes.
    - Mantenha os componentes atualizados conforme novas versões do shadcn.

6. **Revisão de Código**  
    Toda adição ou alteração de componentes shadcn deve passar por revisão de código.

7. **Acessibilidade**  
    Garanta que os componentes utilizados estejam acessíveis, seguindo as recomendações do shadcn.

8. **Importação**  
    Importe componentes diretamente dos arquivos gerados em `components/ui` ou pasta definida no projeto.
