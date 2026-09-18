# Painel Monitoria de Qualidade

Backup técnico recuperado e homologado do Painel de Monitoria de Qualidade.

## Estado desta versão

- Interface pública recuperada.
- Área administrativa recuperada.
- Importador XLSX reconstruído e validado com a planilha operacional real em ambiente isolado.
- Botão **Atualizar painel**, **Última atualização** e **Histórico de Importações** incluídos.
- Persistência preparada com Vercel Blob.
- Produção original não foi alterada durante a recuperação.

## Segurança e dados

Este repositório é **público**. Por isso, ele contém somente o código-fonte e uma base vazia de inicialização. Relatórios reais, nomes de operadores, indicadores operacionais detalhados e demais dados da operação **não devem ser versionados**.

O arquivo `public/assets/dashboard-data.js` é propositalmente vazio. Os dados reais entram pelo módulo administrativo e são persistidos fora do GitHub.

Nunca adicione ao repositório:

- planilhas XLSX/XLS/CSV com dados reais;
- PDFs operacionais;
- `ADMIN_TOKEN`;
- `BLOB_READ_WRITE_TOKEN`;
- arquivos de teste contendo nomes ou dados reais.

## Variáveis de ambiente

Crie no projeto da Vercel:

- `ADMIN_TOKEN`: chave do acesso administrativo;
- `BLOB_READ_WRITE_TOKEN`: fornecida pela integração Vercel Blob.

Use `.env.example` somente como referência. Não versione valores reais.

## Estrutura

- `public/`: interface web e importador XLSX;
- `api/`: rotas públicas e administrativas;
- `lib/`: autenticação, validação, HTTP e persistência;
- `vercel.json`: rotas e cabeçalhos;
- `package.json`: dependências do projeto.

## Homologação concluída

A recuperação foi testada com uma planilha real de aproximadamente 23,35 MB em ambiente isolado. O fluxo validou arquivo, processou dados, atualizou o painel e preservou o último conjunto válido ao receber posteriormente um XLSX inválido.
