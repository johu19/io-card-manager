# IO Card Manager

## What this repo does

`io-card-manager` is a NestJS service that manages a simple card issuance flow.

At a high level it:

- accepts card issuance requests over HTTP
- stores customer and product data in PostgreSQL
- publishes a Kafka event when a card is requested
- consumes that event in a processor flow
- simulates card generation
- updates the product status and metadata
- publishes a follow-up Kafka event when a card is issued
- sends failed processing attempts to a DLQ after the configured retry limit

## Tech stack

- Node.js 22
- NestJS 11
- TypeScript
- PostgreSQL 16
- TypeORM
- Kafka + ZooKeeper
- KafkaJS
- Kafka UI
- Swagger / OpenAPI
- Docker Compose for local development
- Jest for unit tests

## Local prerequisites

Install these on your machine before starting:

- Docker Desktop or Docker Engine with Compose support
- Node.js 22
- npm

Optional but useful:

- `psql` for inspecting PostgreSQL locally
- a REST client like Postman, Insomnia, or curl

## Local setup

1. Install dependencies if you want to run the app outside Docker:

```bash
npm install
```

2. Create your local environment file:

```bash
cp .env.example .env
```

3. Review `.env` and adjust any credentials or ports you want to change.

4. Start the full local environment:

```bash
docker compose up --build
```

## What starts locally

When Docker Compose starts successfully, these services are available:

- API: `http://localhost:3000`
- Swagger UI: `http://localhost:3000/docs`
- Kafka UI: `http://localhost:8080`
- Kafka from host: `localhost:29092`
- PostgreSQL from host: `localhost:5432`
- ZooKeeper from host: `localhost:2181`

Inside Docker networking, the app talks to:

- Kafka at `kafka:9092`
- PostgreSQL at `postgres:5432`
- ZooKeeper at `zookeeper:2181`

## Local tools

### Swagger UI

Swagger UI is available at `http://localhost:3000/docs`.

You can use it to:

- inspect the available HTTP endpoints
- view request and response payload shapes
- authenticate with Basic Auth from the browser
- execute `POST /cards/issue` without a separate REST client
- execute `GET /customers/:documentNumber/products` to inspect stored customer/product data

### Kafka UI

Kafka UI is available at `http://localhost:8080`.

You can use it to:

- inspect Kafka topics created by the app
- browse messages published to request, issued, and DLQ topics
- confirm whether the processor consumed or dead-lettered an event
- validate the event payloads being emitted by issuer and processor flows
- monitor local Kafka activity during end-to-end testing

## Authentication

The issuer endpoints are protected with HTTP Basic Auth.

Credentials come from:

- `AUTH_BASIC_USERNAME`
- `AUTH_BASIC_PASSWORD`

You can set them in `.env`.

## Main API endpoints

### `POST /cards/issue`

Creates a card issuance request.

- requires Basic Auth
- persists customer and product data
- publishes a Kafka message to `io.card.requested.v1`

### `GET /customers/:documentNumber/products`

Returns a customer and all products associated with that document number.

- requires Basic Auth

Example response shape:

```json
{
  "id": 1,
  "documentType": "DNI",
  "documentNumber": "12345678",
  "fullName": "Jane Doe",
  "age": 30,
  "email": "jane@example.com",
  "products": [
    {
      "network": "VISA",
      "currency": "PEN",
      "type": "CARD",
      "status": "ISSUED",
      "metadata": {
        "card_number": "4111111111111111",
        "card_expiration_date": "12/30",
        "card_cvc": "123"
      }
    }
  ]
}
```

## Event flow

### Request topic

- issuer publishes to `io.card.requested.v1`
- processor consumes from `io.card.requested.v1`

### Issued topic

- processor publishes successful completions to `io.cards.issued.v1`

### Dead-letter topic

- processor publishes exhausted failures to `io.card.requested.v1.dlq`

## Database

The local environment uses PostgreSQL and runs migrations automatically on app startup.

Current main tables:

- `customer`
- `product`

If you change an already-applied migration locally, you may need to reset your local database volume:

```bash
docker compose down -v
docker compose up --build
```

## Useful commands

Run the app locally without Docker:

```bash
npm run start:dev
```

Run migrations manually:

```bash
npm run migration:run
```

Revert the latest migration:

```bash
npm run migration:revert
```

Create a blank migration:

```bash
npm run migration:create
```

Generate a migration from entity changes:

```bash
npm run migration:generate
```

Run unit tests:

```bash
npm test -- --runInBand
```

Build the project:

```bash
npm run build
```

## Troubleshooting

### Kafka or ZooKeeper won’t start cleanly

Local Kafka state can get stuck after crashes or abrupt restarts. Reset local volumes:

```bash
docker compose down -v
docker compose up --build
```

### Migration changes are not reflected in PostgreSQL

If a migration already ran once, editing the file will not rerun it automatically. Either:

- create a new migration, or
- reset the local Postgres volume

### Swagger page does not load

Make sure the API container is healthy and then open:

`http://localhost:3000/docs`

## Repo notes

- local environment variables live in `.env`
- starter values live in `.env.example`
- Docker services are defined in `docker-compose.yml`
- Swagger is mounted by the Nest app at `/docs`
