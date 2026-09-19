# Registro de Recuperação

## Objetivo

Preservar o painel existente, recuperar o código disponível e reconstruir somente os componentes necessários para restaurar atualização, persistência e administração, sem alterar os cálculos de negócio já validados.

## Itens recuperados/reconstruídos

- interface principal do painel;
- importador XLSX;
- atualização de dados via API;
- configuração de metas;
- sessão administrativa;
- histórico de importações;
- persistência em Vercel Blob;
- indicador de última atualização.

## Homologação

Foram realizados testes isolados de:

1. abertura e navegação do painel em dispositivo móvel;
2. área administrativa;
3. botão Atualizar painel;
4. histórico com registros de Sucesso e Erro;
5. importação de XLSX real;
6. rejeição de XLSX inválido sem sobrescrever os dados válidos anteriores.

## Ambiente

As variáveis administrativas e de persistência do projeto de homologação foram salvas na Vercel. Este registro também força um novo deployment para que o runtime leia as configurações atualizadas.

## Observação de privacidade

Dados reais utilizados na homologação não fazem parte deste repositório. A base versionada é vazia por segurança.
