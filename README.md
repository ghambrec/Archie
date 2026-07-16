# Archie

Description missing.



## Ports
- **Caddy:** 8080 (ditribute to other containers (/api -> backend, everything else -> frontend))
- **Angular Frontend:** 4200
- **NestJS Backend:** 3000 (:8080/api) -> documentation available at /docs
- **Postgres:** 5432
- **MinIO API:** 9000
- **MinIO Web Console:** 9001


## Technical Stack

### Database
- **System:** PostgreSQL
- **Version:** Postgres 18
- **ORM:** Prisma

The pgvector extension allows vector search without separate db. Postgres 18 because of its async I/O -> good for RAG.
