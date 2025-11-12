# ChegaMaisUFC — API

API em Node.js/TypeScript com Fastify e Prisma para gerenciamento de salas, ocupação e telemetria (temperatura, internet e Wi‑Fi). Inclui endpoints para administração de salas e para dispositivos ESP reportarem estado e movimentação.

- Runtime: Node.js + TypeScript
- Framework: Fastify 5
- ORM: Prisma 6 (PostgreSQL)
- Validação: Zod

Base URL (dev): http://localhost:3333


## Requisitos

- Node.js 18+ (recomendado LTS)
- pnpm 10+ (ou adapte os comandos para npm/yarn)
- PostgreSQL 16+ (local via Docker ou instância própria)
- Docker (opcional, para subir o banco com docker-compose)


## Instalação

1) Clonar o repositório e instalar dependências

```bash
pnpm install
```

2) Configurar variáveis de ambiente em um arquivo `.env` na raiz do projeto

```env
# Porta HTTP do servidor Fastify
PORT=3333

# URL de conexão do PostgreSQL
# Exemplo usando o docker-compose incluso
DATABASE_URL="postgresql://app:app@localhost:5432/api_salas?schema=public"
```

3) Subir o banco (opcional, via Docker)

```bash
# Sobe um Postgres local na porta 5432 (credenciais: app/app)
docker compose up -d
```

4) Preparar o Prisma (gerar cliente, migrar e popular dados de exemplo)

```bash
pnpm prisma:generate
pnpm prisma:migrate
pnpm db:seed
```

5) Rodar em desenvolvimento

```bash
pnpm dev
```

O servidor iniciará em 0.0.0.0:PORT (padrão 3333). Logs do Fastify virão no terminal.


## Dicas de desenvolvimento

- Inspecionar o banco via Prisma Studio:
  ```bash
  pnpm prisma:studio
  ```
- Build de produção: `pnpm build` e iniciar com `pnpm start`.


## Modelos de Dados (Prisma)

Principais modelos (resumo):

- Sala: { id, nome, vagas, tokenEsp }
- Temperatura: { id, salaId, temperatura, timestamp }
- Internet: { id, salaId, velocidade, timestamp }
- Wifi: { id, salaId, velocidade, timestamp }
- PessoaEmSala: { id, numeroCartao, salaId, timestamp }
- Ocupacao: { id, salaId, ocupacao, timestamp }

Observação: o campo `tokenEsp` identifica o dispositivo da sala e é utilizado para autenticar os endpoints de `/esp`. Evite expor publicamente.


## Convenções da API

- Datas: envie e receba em ISO 8601 (ex.: `2025-11-09T12:30:00Z`). A API faz coerção (`z.coerce.date()`), mas prefira ISO.
- Números inteiros não negativos onde indicado (ex.: `vagas`, `ocupacao`).
- Códigos e mensagens de erro em português (ver seção “Erros”).


## Endpoints

### Salas (administração)

Prefixo: `/salas`

1) GET `/salas/`
- Lista todas as salas.
- Resposta 200 (exemplo):
```json
[
    { 
    "id": 1,
    "nome": "Laboratório 1",
    "vagas": 30,
    "tokenEsp": "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
    },
    { 
    "id": 2,
    "nome": "Laboratório 2",
    "vagas": 25,
    "tokenEsp": "BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB"
    }
]
```

2) POST `/salas/`
- Cria uma nova sala.
- Corpo (JSON):
```json
{
    "nome": "Laboratório 3",
    "vagas": 20,
    "tokenEsp": "<32 chars>" 
}
```
- Regras: `nome` (1..45), `vagas` (int ≥ 0), `tokenEsp` (string de 32 chars).
- Resposta 201: objeto da sala criada.

3) GET `/salas/:id`
- Retorna uma sala específica, incluindo a última ocupação registrada.
- Resposta 200 (exemplo):
```json
{
  "id": 1,
  "nome": "Laboratório 1",
  "vagas": 30,
  "tokenEsp": "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
  "ocupacoes": [
    { 
        "id": 10,
        "salaId": 1,
        "ocupacao": 12,
        "timestamp": "2025-11-09T12:30:00.000Z"
    }
  ]
}
```
- Resposta 404: `{ "message": "Sala não encontrada" }`

4) PATCH `/salas/:id`
- Atualiza parcialmente uma sala (mesmo schema do POST, porém todos os campos opcionais).
- Resposta 200: objeto atualizado.
- Resposta 404: `{ "message": "Sala não encontrada" }`

5) DELETE `/salas/:id`
- Remove a sala.
- Resposta 204 (sem corpo).
- Resposta 404: `{ "message": "Sala não encontrada" }`


### Resumo das salas

Prefixo: `/salas`

6) GET `/salas/:id/resumo?from=<iso>&to=<iso>`
- Retorna um painel resumido da sala com ocupação atual, últimas medições e médias no intervalo opcional.
- Query params:
  - `from` (ISO 8601) — opcional
  - `to` (ISO 8601) — opcional
- Resposta 200 (exemplo com médias):
```json
{
  "id": 1,
  "nome": "Laboratório 1",
  "vagas": 30,
  "ocupacaoAtual": 12,
  "ocupacaoPercent": 40.0,
  "ultimas": {
    "temperatura": { "valor": 24.8, "timestamp": "2025-11-09T12:30:00.000Z" },
    "internet": { "valor": 92.3, "timestamp": "2025-11-09T12:28:00.000Z" },
    "wifi": { "valor": 80.1, "timestamp": "2025-11-09T12:29:00.000Z" }
  },
  "mediasIntervalo": {
    "temperatura": 24.2,
    "internet": 88.5,
    "wifi": 76.4
  }
}
```
- Quando `from` e/ou `to` não são enviados, `mediasIntervalo` será `null`.
- Resposta 404: `{ "message": "Sala não encontrada" }`

7) GET `/salas/resumo`
- Retorna o resumo de todas as salas (sem médias por intervalo):
```json
[
  {
    "id": 1,
    "nome": "Laboratório 1",
    "vagas": 30,
    "ocupacaoAtual": 12,
    "ocupacaoPercent": 40.0,
    "ultimas": {
      "temperatura": { "valor": 24.8, "timestamp": "2025-11-09T12:30:00.000Z" },
      "internet": { "valor": 92.3, "timestamp": "2025-11-09T12:28:00.000Z" },
      "wifi": { "valor": 80.1, "timestamp": "2025-11-09T12:29:00.000Z" }
    }
  }
]
```

Observação: `ocupacaoAtual` é calculado via contagem de `PessoaEmSala`. `ocupacaoPercent` = `ocupacaoAtual / vagas * 100` (0 quando `vagas = 0`).


### Integração com ESP (telemetria e movimentação)

Prefixo: `/esp`

Autenticação por `tokenEsp` (string de 32 chars) associada à sala. Se o token for inválido, a API responde `401`.

8) POST `/esp/movimentacao`
- Registra entrada/saída de uma pessoa na sala (via número do cartão/badge).
- Corpo (JSON):
```json
{
  "tokenEsp": "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
  "numeroCartao": "1234567890",
  "acao": "enter", // ou "exit"
  "timestamp": "2025-11-09T12:30:00Z" // opcional; usa now() se ausente
}
```
- Regras e efeitos:
  - `enter`: se o cartão já estiver presente em outra sala, retorna 409 `CARTAO_EM_OUTRA_SALA`.
  - `exit`: se o cartão não estiver presente nesta sala, retorna 409 `NAO_ESTA_NA_SALA`.
  - Após a ação válida, a ocupação total é contada e um registro em `Ocupacao` é criado com o valor atual.
- Respostas:
  - 201: `{ "ok": true }`
  - 401: `{ "message": "Token inválido" }`
  - 409: `{ "message": "...", "code": "CARTAO_EM_OUTRA_SALA" | "NAO_ESTA_NA_SALA" }`
  - 500: `{ "message": "Erro interno" }`

9) POST `/esp/estado`
- Reporta medições/estado da sala no timestamp informado (ou `now`). Todos os campos de métricas são opcionais, envie apenas os presentes.
- Corpo (JSON):
```json
{
  "tokenEsp": "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
  "timestamp": "2025-11-09T12:30:00Z", // opcional
  "temperatura": 24.8,                 // opcional
  "internetVel": 92.3,                 // opcional
  "wifiVel": 80.1,                     // opcional
  "ocupacao": 12                       // opcional (int ≥ 0)
}
```
- Efeitos: cria registros em `Temperatura`, `Internet`, `Wifi` e/ou `Ocupacao` de acordo com os campos enviados.
- Respostas:
  - 201: `{ "ok": true }`
  - 401: `{ "message": "Token inválido" }`
  - 500: `{ "message": "Erro interno" }`


## Erros e códigos

- 401 Token inválido (quando `tokenEsp` não corresponde a nenhuma `Sala`).
- 404 Sala não encontrada (em rotas de `/salas`).
- 409 Conflitos em `/esp/movimentacao`:
  - `CARTAO_EM_OUTRA_SALA`: cartão presente em outra sala ao tentar `enter`.
  - `NAO_ESTA_NA_SALA`: cartão não está na sala ao tentar `exit`.
- 500 Erro interno (logado pelo servidor).


## Exemplos de uso (curl)

- Listar salas:
```bash
curl -s http://localhost:3333/salas/
```

- Criar sala:
```bash
curl -s -X POST http://localhost:3333/salas/ \
  -H 'Content-Type: application/json' \
  -d '{"nome":"Lab X","vagas":10,"tokenEsp":"1234567890ABCDEF1234567890ABCDEF"}'
```

- Resumo da sala 1 com médias em intervalo:
```bash
curl -s 'http://localhost:3333/salas/1/resumo?from=2025-11-09T00:00:00Z&to=2025-11-09T23:59:59Z'
```

- Reportar estado (ESP):
```bash
curl -s -X POST http://localhost:3333/esp/estado \
  -H 'Content-Type: application/json' \
  -d '{"tokenEsp":"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA","temperatura":24.5,"wifiVel":75.2}'
```

- Movimentação (entrada):
```bash
curl -s -X POST http://localhost:3333/esp/movimentacao \
  -H 'Content-Type: application/json' \
  -d '{"tokenEsp":"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA","numeroCartao":"123","acao":"enter"}'
```


## Seed (dados de exemplo)

Após `pnpm db:seed` serão criadas duas salas:

- `Laboratório 1` — tokenEsp: `AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA`
- `Laboratório 2` — tokenEsp: `BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB`

Use esses tokens para testar os endpoints de `/esp` em ambiente local.


## Observações de segurança

- Os endpoints de `/salas` retornam o campo `tokenEsp` da sala. Em produção, considere filtrar/ocultar esse campo em respostas públicas.
- Armazene `DATABASE_URL` e tokens apenas em variáveis de ambiente seguras.


## Licença

Este projeto é distribuído nos termos da licença escolhida pelo repositório (adapte esta seção conforme necessário).
