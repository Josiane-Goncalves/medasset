# MedAsset

Sistema full stack para controle de equipamentos médico-hospitalares.

O MedAsset foi criado para centralizar informações essenciais sobre equipamentos utilizados em ambientes de saúde, facilitando identificação, rastreabilidade, consulta e acompanhamento de manutenção.

A proposta do projeto é simples: construir um sistema funcional, direto e sustentável, sem complexidade arquitetural desnecessária.

---

## Sobre o projeto

Em ambientes hospitalares e clínicos, equipamentos médico-hospitalares precisam ser identificados, localizados e acompanhados com clareza.

Informações como:

- equipamento;
- marca;
- modelo;
- número de série;
- patrimônio;
- status operacional;
- manutenção preventiva;

fazem parte da rotina de engenharia clínica e de setores responsáveis pelo controle desses ativos.

O MedAsset nasce para organizar esse fluxo em uma aplicação web simples, com regras claras e foco em confiabilidade dos dados.

---

## Objetivos

O projeto tem como objetivos principais:

- centralizar o cadastro de equipamentos;
- evitar registros duplicados;
- facilitar busca e identificação;
- acompanhar o estado dos equipamentos;
- apoiar o controle de manutenção preventiva;
- manter regras de negócio simples e explícitas;
- garantir integridade dos dados;
- aplicar boas práticas de desenvolvimento full stack.

---

## Escopo

O desenvolvimento é feito de forma incremental, por pequenas funcionalidades independentes.

Entre as funcionalidades planejadas estão:

- cadastro de equipamentos;
- edição e exclusão;
- consulta e detalhamento;
- busca e filtros;
- controle de número de série e patrimônio únicos;
- status operacional;
- acompanhamento de manutenção preventiva;
- autenticação;
- perfis de acesso `ADMIN` e `USER`.

O objetivo não é transformar o MedAsset em um ERP hospitalar ou em uma plataforma completa de engenharia clínica.

O foco é resolver bem um conjunto específico de problemas.

---

## Regras de negócio

Algumas regras fazem parte da base do sistema:

- número de série é obrigatório e único;
- patrimônio, quando informado, também deve ser único;
- equipamentos duplicados devem ser identificados de forma clara;
- dados enviados para a API são validados no backend;
- regras de negócio não dependem apenas das validações do frontend;
- integridade dos dados também é protegida no banco.

Novas regras são adicionadas apenas quando necessárias ao domínio do projeto.

---

## Arquitetura

O backend segue uma separação simples de responsabilidades:

```text
Controller
    ↓
Service
    ↓
Repository
    ↓
Prisma
    ↓
PostgreSQL
```

A intenção é manter cada camada com uma responsabilidade clara:

- **Controller:** comunicação HTTP;
- **Service:** regras de negócio;
- **Repository:** persistência;
- **Prisma/PostgreSQL:** acesso e armazenamento dos dados.

O projeto evita abstrações que não tragam benefício real para o escopo atual.

---

## Tecnologias

### Frontend

- React
- TypeScript
- Vite

### Backend

- Node.js
- NestJS
- TypeScript

### Banco de dados

- PostgreSQL
- Prisma ORM

### Qualidade

- Jest
- ESLint
- Prettier

### Infraestrutura local

- Docker Compose

---

## Qualidade e segurança

O MedAsset é desenvolvido com atenção a alguns princípios:

- validação de entrada no backend;
- tratamento controlado de erros;
- proteção de variáveis de ambiente;
- CORS configurado por ambiente;
- constraints de banco para integridade dos dados;
- testes de regras e comportamentos relevantes;
- funções e responsabilidades pequenas;
- redução de duplicação;
- código legível e de fácil manutenção.

---

## Processo de desenvolvimento

O projeto é desenvolvido em pequenas fatias.

Cada funcionalidade passa por:

```text
Definição de comportamento
        ↓
Implementação
        ↓
Testes
        ↓
Revisão
        ↓
Commit
```

Essa abordagem permite evoluir o sistema sem perder clareza sobre o comportamento de cada parte.

---

## Contexto

O MedAsset foi inspirado em necessidades reais de ambientes hospitalares e de engenharia clínica.

O projeto combina conhecimento de domínio em saúde com desenvolvimento de software, buscando transformar rotinas operacionais em soluções digitais simples e confiáveis.

---

## Status

Em desenvolvimento.

A evolução do projeto pode ser acompanhada pelo histórico de commits e pelas funcionalidades disponíveis no repositório.

## Autoria

Desenvolvido por **Josiane Gonçalves**.

Profissional em transição para desenvolvimento de software, com experiência na área da saúde e em engenharia clínica.