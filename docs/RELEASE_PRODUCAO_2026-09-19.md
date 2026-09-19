# Release de Produção — 19/09/2026

Branch congelada para publicação em produção após homologação funcional.

## Escopo homologado

- Layout institucional MQ nos modos dia e noite.
- Dashboard responsivo com correção de enquadramento mobile.
- Persistência em Vercel Blob.
- Administração protegida por `ADMIN_TOKEN`.
- Importação XLSX com validação antes da publicação.
- Histórico de importações e última atualização.
- Paginação:
  - Qualidade > Por Skill: 10 padrão; 15/30/Todos.
  - Qualidade > Itens Aferidos: 10 padrão; 15/30/Todos.
  - ISC > Pesquisa por Operador: 25 padrão; 50/100/Todos.
  - Falta Grave > Operadores com Falta Grave: 10 padrão; 15/30/Todos.
  - Operadores: 10 padrão; 15/30/Todos.
- Filtro de quartil no ISC > Pesquisa por Operador.
- Painel Operadores:
  - RE antes de Operador;
  - coluna Supervisão removida;
  - Quartil Qualidade ao lado de Qualidade.

## Regras de quartil

- 1º Quartil: 90% a 100%
- 2º Quartil: 80% a 89,99%
- 3º Quartil: 60% a 79,99%
- 4º Quartil: abaixo de 60%

## Validação de homologação

A importação de homologação foi persistida e o backend devolveu os seguintes indicadores de Agosto/2026:

- Qualidade: 96,27%
- Monitorias: 2.136
- ISC: 94,09%
- TMA: 03:31
- Faltas Graves: 20

## Pré-requisitos para produção

Antes do corte:

1. manter uma cópia do deployment atual de produção para rollback;
2. configurar no projeto de produção:
   - `ADMIN_TOKEN`;
   - credencial de Blob exclusiva de produção;
3. não reutilizar o Blob de homologação;
4. publicar esta branch;
5. validar `/api/config`, `/api/data` e acesso administrativo;
6. importar o XLSX oficial no ambiente de produção;
7. conferir os indicadores e somente então considerar o corte concluído.

## Rollback

O deployment atual de `painelmonitoriaqualidade.vercel.app` deve permanecer disponível até a validação pós-publicação.
