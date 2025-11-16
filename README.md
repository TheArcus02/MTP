# Manager Terminów Pracowniczych (MTP)

System REST API do zarządzania wnioskami urlopowymi pracowników.

## Spis Treści

- [Opis Projektu](#opis-projektu)
- [Technologie](#technologie)
- [Wymagania Systemowe](#wymagania-systemowe)
- [Instalacja](#instalacja)
- [Konfiguracja](#konfiguracja)
- [Uruchomienie](#uruchomienie)
- [Baza Danych](#baza-danych)
- [Testowanie](#testowanie)
- [Korzystanie z API](#korzystanie-z-api)
- [Dokumentacja](#dokumentacja)

## Opis Projektu

MTP (Manager Terminów Pracowniczych) to backend REST API do zarządzania urlopami pracowników. System wspiera dwie role użytkowników:

- **Pracownik (employee)** - może składać, przeglądać, edytować i usuwać wnioski urlopowe
- **Administrator (admin)** - może przeglądać wszystkie wnioski oraz je zatwierdzać lub odrzucać

### Główne Funkcjonalności

- Autentykacja użytkowników (JWT)
- Zarządzanie wnioskami urlopowymi (CRUD)
- System zatwierdzania/odrzucania wniosków przez administratorów
- Integracja z zewnętrznym API świąt państwowych (Nager.Date)
- Walidacja danych wejściowych
- Kontrola dostępu oparta na rolach (RBAC)

## Technologie

- **Runtime:** Node.js 18+
- **Język:** TypeScript
- **Framework:** Express.js v5
- **Baza danych:** SQLite3
- **ORM:** Drizzle ORM
- **Autentykacja:** JWT + bcryptjs
- **Walidacja:** Zod
- **Testy:** Jest + Supertest
- **Linter/Formatter:** Biome

## Wymagania Systemowe

- Bun w wersji 1.0 lub wyższej

## Instalacja

1. Sklonuj repozytorium:

```bash
git clone <repository-url>
cd MTP
```

2. Zainstaluj zależności:

```bash
bun install
```

## Konfiguracja

System wymaga pliku `.env` w głównym katalogu projektu. Przykładowa konfiguracja:

```env
PORT=3000
DATABASE_PATH=./mtp.db
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
JWT_EXPIRATION=24h
NODE_ENV=development
```

**Zmienne środowiskowe:**

- `PORT` - Port na którym będzie działał serwer (domyślnie: 3000)
- `DATABASE_PATH` - Ścieżka do pliku bazy danych SQLite
- `JWT_SECRET` - Sekret do podpisywania tokenów JWT (minimum 32 znaki)
- `JWT_EXPIRATION` - Czas ważności tokenów JWT (np. 24h, 7d)
- `NODE_ENV` - Środowisko (development/production)

## Uruchomienie

### Tryb Deweloperski (hot reload)

```bash
bun run dev
```

Serwer uruchomi się na `http://localhost:3000` z automatycznym przeładowaniem przy zmianach w kodzie.

### Tryb Produkcyjny

```bash
# Zbuduj projekt
bun run build

# Uruchom zbudowaną wersję
bun start
```

### Sprawdzenie Działania

Po uruchomieniu serwera możesz sprawdzić jego status:

```bash
curl http://localhost:3000/health
```

Odpowiedź:

```json
{
  "status": "ok",
  "message": "MTP Server is running"
}
```

## Baza Danych

### Generowanie Migracji

Po zmianach w schemacie bazy danych (plik `src/db/schema.ts`):

```bash
bun run db:generate
```

Wygeneruje pliki migracji w katalogu `src/db/migrations/`.

### Wykonanie Migracji

Zastosuj migracje do bazy danych:

```bash
bun run db:migrate
```

### Push Schema (bez migracji)

Szybkie zastosowanie zmian w schemacie bez generowania migracji:

```bash
bun run db:push
```

⚠️ **Uwaga:** Użyj tylko w środowisku deweloperskim!

### Drizzle Studio (GUI do bazy danych)

Otwórz graficzny interfejs do przeglądania i edycji bazy danych:

```bash
bun run db:studio
```

Studio będzie dostępne pod adresem wyświetlonym w konsoli (zazwyczaj `https://local.drizzle.studio`).

### Seed Bazy Danych

Wypełnij bazę danych przykładowymi danymi:

```bash
bun run db:seed
```

**Utworzeni użytkownicy:**

| Rola     | Email              | Hasło       |
| -------- | ------------------ | ----------- |
| Admin    | admin@mtp.com      | password123 |
| Employee | john.doe@mtp.com   | password123 |
| Employee | jane.smith@mtp.com | password123 |

**Utworzone wnioski urlopowe:**

- 2 wnioski dla John Doe (1 pending, 1 approved)
- 1 wniosek dla Jane Smith (pending)

## Testowanie

### Uruchomienie Wszystkich Testów

```bash
bun test
```

Wykonuje wszystkie testy z raportem pokrycia kodu (coverage).

### Tryb Watch (automatyczne uruchamianie testów)

```bash
bun run test:watch
```

Testy będą uruchamiane automatycznie po każdej zmianie w plikach.

### Struktura Testów

```
src/
  modules/
    auth/
      __tests__/
        auth.integration.test.ts    # Testy E2E endpointów
        auth.service.test.ts        # Testy jednostkowe serwisu
        auth.utils.test.ts          # Testy funkcji pomocniczych
    leave-request/
      __tests__/
        integration.test.ts         # Testy E2E endpointów
        service.test.ts             # Testy jednostkowe serwisu
    holidays/
      __tests__/
        holidays.integration.test.ts # Testy E2E endpointów
```

## Korzystanie z API

### Endpointy Dostępne Bez Autoryzacji

#### Rejestracja Użytkownika

```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "fullName": "Jan Kowalski",
  "role": "employee"
}
```

#### Logowanie

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

Odpowiedź zawiera token JWT:

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "userId": 1,
      "email": "user@example.com",
      "fullName": "Jan Kowalski",
      "role": "employee",
      "createdAt": "2025-01-15T10:00:00.000Z"
    }
  }
}
```

### Endpointy Wymagające Autoryzacji

Wszystkie poniższe endpointy wymagają nagłówka:

```
Authorization: Bearer <token>
```

#### Wnioski Urlopowe (Pracownik)

**Złożenie wniosku:**

```bash
POST /api/leave-requests
Content-Type: application/json
Authorization: Bearer <token>

{
  "startDate": "2025-12-20T00:00:00.000Z",
  "endDate": "2025-12-27T00:00:00.000Z",
  "reason": "Wakacje świąteczne z rodziną"
}
```

**Pobranie własnych wniosków:**

```bash
GET /api/leave-requests
Authorization: Bearer <token>
```

**Pobranie konkretnego wniosku:**

```bash
GET /api/leave-requests/:id
Authorization: Bearer <token>
```

**Edycja wniosku (tylko pending):**

```bash
PUT /api/leave-requests/:id
Content-Type: application/json
Authorization: Bearer <token>

{
  "startDate": "2025-12-21T00:00:00.000Z",
  "endDate": "2025-12-28T00:00:00.000Z",
  "reason": "Zmieniony termin wakacji"
}
```

**Usunięcie wniosku (tylko pending):**

```bash
DELETE /api/leave-requests/:id
Authorization: Bearer <token>
```

#### Endpointy Administracyjne (tylko admin)

**Pobranie wszystkich wniosków:**

```bash
GET /api/admin/leave-requests
Authorization: Bearer <admin_token>
```

**Zatwierdzenie wniosku:**

```bash
PATCH /api/admin/leave-requests/:id/approve
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "adminComment": "Zatwierdzone - miłego urlopu!"
}
```

**Odrzucenie wniosku:**

```bash
PATCH /api/admin/leave-requests/:id/reject
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "adminComment": "Odrzucone - niewystarczająca obsada w tym terminie"
}
```

⚠️ **Uwaga:** Komentarz jest wymagany przy odrzucaniu wniosku!

#### Święta Państwowe

**Pobranie świąt dla kraju i roku:**

```bash
GET /api/holidays/:year/:countryCode
Authorization: Bearer <token>

# Przykład dla Polski 2025:
GET /api/holidays/2025/PL
```

**Popularne kody krajów:**

- PL - Polska
- US - Stany Zjednoczone
- GB - Wielka Brytania
- DE - Niemcy
- FR - Francja

## Dokumentacja

### Dokumentacja Projektu

Pełna dokumentacja projektu znajduje się w pliku:

```
docs/dokumentacja.md
```

Zawiera:

- Dokumentację bazy danych ze schematem
- User Stories
- Odbiorców systemu i korzyści
- Wzorce projektowe użyte w projekcie

### Dokumentacja Modułów

Każdy moduł posiada własną dokumentację w pliku `claude.md`:

- `src/modules/auth/claude.md` - Moduł autentykacji
- `src/modules/leave-request/claude.md` - Moduł wniosków urlopowych
- `src/modules/holidays/claude.md` - Moduł świąt państwowych

### Struktura Projektu

```
MTP/
├── src/
│   ├── modules/              # Moduły funkcjonalne
│   │   ├── auth/            # Autentykacja
│   │   ├── leave-request/   # Wnioski urlopowe
│   │   └── holidays/        # Święta państwowe
│   ├── shared/              # Współdzielone komponenty
│   │   ├── middleware/      # Middleware (błędy, walidacja)
│   │   ├── errors/          # Klasy błędów
│   │   └── utils/           # Funkcje pomocnicze
│   ├── db/                  # Baza danych
│   │   ├── schema.ts        # Schemat Drizzle
│   │   ├── client.ts        # Klient bazy danych
│   │   └── migrations/      # Migracje
│   ├── config/              # Konfiguracja
│   ├── app.ts               # Konfiguracja Express
│   ├── router.ts            # Główny router
│   └── index.ts             # Entry point
├── scripts/
│   └── db-seed.ts           # Skrypt do seedowania bazy
├── docs/
│   └── dokumentacja.md      # Pełna dokumentacja projektu
├── .env                     # Zmienne środowiskowe
└── package.json             # Zależności i skrypty
```

## Komendy Bun - Podsumowanie

| Komenda               | Opis                                               |
| --------------------- | -------------------------------------------------- |
| `bun run dev`         | Uruchom serwer w trybie deweloperskim (hot reload) |
| `bun run build`       | Zbuduj projekt TypeScript do JavaScript            |
| `bun start`           | Uruchom zbudowaną wersję produkcyjną               |
| `bun test`            | Uruchom wszystkie testy z coverage                 |
| `bun run test:watch`  | Uruchom testy w trybie watch                       |
| `bun run db:generate` | Wygeneruj migracje z schematu                      |
| `bun run db:migrate`  | Wykonaj migracje                                   |
| `bun run db:push`     | Push schema bez migracji (dev only)                |
| `bun run db:studio`   | Otwórz Drizzle Studio (GUI)                        |
| `bun run db:seed`     | Wypełnij bazę przykładowymi danymi                 |

## Quick Start

1. **Instalacja i konfiguracja:**

```bash
bun install
# Upewnij się że plik .env jest skonfigurowany
```

2. **Inicjalizacja bazy danych:**

```bash
bun run db:push
bun run db:seed
```

3. **Uruchomienie serwera:**

```bash
bun run dev
```

4. **Logowanie (w Postman/curl):**

```bash
# Zaloguj się jako admin
POST http://localhost:3000/api/auth/login
{
  "email": "admin@mtp.com",
  "password": "password123"
}
```

5. **Testuj API używając otrzymanego tokenu!**

## Wsparcie i Kontakt

W przypadku problemów sprawdź:

- Logi serwera w konsoli
- Plik `.env` - czy wszystkie zmienne są ustawione
- Bazę danych przez `bun run db:studio`
- Testy przez `bun test`

## Licencja

Projekt stworzony na potrzeby edukacyjne.
