
# Flask Medical API

## Features

- JWT validation with Keycloak
- MongoDB auto database creation
- MongoDB auto collections creation
- User CRUD
- Doctor CRUD
- Schedule CRUD
- PDF medical records upload
- Role-based access

## Roles

- admin
- doctor
- usuario

## Run

Copy env:

```bash
cp .env.example .env
```

Start:

```bash
docker compose up --build
```

API:

http://localhost:5000
