# Dokumentacja Systemu MTP (Manager Terminów Pracowniczych)

## Spis Treści
1. [Opis Systemu](#opis-systemu)
2. [Odbiorcy Systemu](#odbiorcy-systemu)
3. [Korzyści dla Użytkowników](#korzyści-dla-użytkowników)
4. [Dokumentacja Bazy Danych](#dokumentacja-bazy-danych)
5. [User Stories](#user-stories)
6. [Architektura i Wzorce Projektowe](#architektura-i-wzorce-projektowe)

---

## Opis Systemu

**Manager Terminów Pracowniczych (MTP)** to system REST API do zarządzania wnioskami urlopowymi pracowników. System umożliwia pracownikom składanie wniosków urlopowych oraz administratorom ich zatwierdzanie lub odrzucanie.

### Funkcjonalności Główne

**Dla Pracowników:**
- Rejestracja i logowanie do systemu
- Składanie wniosków urlopowych z określeniem daty rozpoczęcia, zakończenia i powodu
- Przeglądanie własnych wniosków urlopowych
- Edycja wniosków oczekujących
- Usuwanie wniosków oczekujących
- Sprawdzanie dni wolnych od pracy (integracja z API świąt państwowych)

**Dla Administratorów:**
- Przeglądanie wszystkich wniosków urlopowych
- Zatwierdzanie wniosków z opcjonalnym komentarzem
- Odrzucanie wniosków z obowiązkowym komentarzem wyjaśniającym

### Technologie
- Backend: Node.js + TypeScript + Express.js v5
- Baza danych: SQLite3 z Drizzle ORM
- Autentykacja: JWT (JSON Web Tokens)
- Walidacja: Zod
- Testy: Jest + Supertest

---

## Odbiorcy Systemu

### 1. Pracownicy

**Charakterystyka:**
- Wszyscy zatrudnieni w organizacji
- Potrzebują prostego i szybkiego sposobu składania wniosków urlopowych
- Oczekują przejrzystości w procesie zatwierdzania
- Chcą mieć dostęp do historii swoich wniosków

**Potrzeby:**
- Łatwy dostęp do systemu (24/7)
- Intuicyjny interfejs API
- Szybkie informacje zwrotne o statusie wniosku
- Możliwość edycji wniosków przed zatwierdzeniem

### 2. Administratorzy/Kadra Kierownicza

**Charakterystyka:**
- Osoby odpowiedzialne za zarządzanie zespołem
- Podejmują decyzje o urlopach pracowników
- Muszą koordynować absencje w zespole
- Potrzebują przeglądu wszystkich wniosków

**Potrzeby:**
- Centralny widok wszystkich wniosków
- Możliwość szybkiej akceptacji lub odrzucenia
- System komunikacji z pracownikami (komentarze)
- Przejrzysty proces zatwierdzania

---

## Korzyści dla Użytkowników

### Korzyści dla Pracowników

1. **Oszczędność Czasu**
   - Brak konieczności wypełniania papierowych formularzy
   - Możliwość złożenia wniosku w dowolnym momencie
   - Dostęp do systemu z dowolnego miejsca

2. **Przejrzystość Procesu**
   - Widoczność statusu wniosku (oczekujący/zatwierdzony/odrzucony)
   - Otrzymywanie informacji zwrotnej od przełożonych poprzez komentarze
   - Dostęp do historii wszystkich wniosków

3. **Elastyczność**
   - Możliwość edycji wniosku przed zatwierdzeniem
   - Możliwość anulowania wniosku
   - Planowanie urlopu z uwzględnieniem dni wolnych od pracy

4. **Wygoda**
   - Brak konieczności osobistego kontaktu z przełożonym
   - Eliminacja komunikacji e-mailowej
   - Automatyczna walidacja dat i konfliktów

### Korzyści dla Administratorów

1. **Efektywność Zarządzania**
   - Centralizacja wszystkich wniosków w jednym miejscu
   - Możliwość szybkiego przeglądania i zatwierdzania
   - Eliminacja papierowej dokumentacji

2. **Lepsza Organizacja**
   - Przegląd wszystkich wniosków zespołu
   - Łatwiejsze planowanie obsady
   - Unikanie konfliktów w harmonogramie

3. **Komunikacja**
   - Możliwość dodawania komentarzy do wniosków
   - Jasna informacja zwrotna dla pracowników
   - Udokumentowana historia decyzji

4. **Kontrola**
   - Egzekwowanie reguł biznesowych (np. jeden wniosek oczekujący na raz)
   - Ochrona przed retroaktywnymi wnioskami
   - Niemożność modyfikacji zatwierdzonych wniosków

---

## Dokumentacja Bazy Danych

System wykorzystuje bazę danych SQLite z dwoma głównymi tabelami połączonymi relacją.

### Struktura Bazy Danych

```
┌─────────────────────────┐
│        users            │
├─────────────────────────┤
│ id (PK)                 │
│ email (UNIQUE)          │
│ passwordHash            │
│ fullName                │
│ role                    │
│ createdAt               │
└─────────────────────────┘
           │
           │ 1:N
           │
           ▼
┌─────────────────────────┐
│    leave_requests       │
├─────────────────────────┤
│ id (PK)                 │
│ userId (FK)             │─────┐
│ startDate               │     │
│ endDate                 │     │ CASCADE DELETE
│ reason                  │     │
│ status                  │     │
│ adminComment            │     │
│ createdAt               │     │
│ updatedAt               │─────┘
└─────────────────────────┘
```

### Tabela: users

Przechowuje informacje o użytkownikach systemu (pracownikach i administratorach).

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| id | INTEGER | PRIMARY KEY, AUTO INCREMENT | Unikalny identyfikator użytkownika |
| email | TEXT | NOT NULL, UNIQUE | Adres email (login) |
| passwordHash | TEXT | NOT NULL | Zahaszowane hasło (bcrypt) |
| fullName | TEXT | NOT NULL | Imię i nazwisko |
| role | TEXT | NOT NULL, ENUM | Rola: 'employee' lub 'admin' |
| createdAt | TIMESTAMP | NOT NULL, DEFAULT: CURRENT_TIMESTAMP | Data utworzenia konta |

**Indeksy:**
- Unikalny indeks na kolumnie `email`

**Reguły walidacji:**
- Email musi być w poprawnym formacie
- Hasło minimum 8 znaków (przed zahaszowaniem)
- Imię i nazwisko minimum 2 znaki
- Rola musi być 'employee' lub 'admin'

### Tabela: leave_requests

Przechowuje wnioski urlopowe pracowników.

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| id | INTEGER | PRIMARY KEY, AUTO INCREMENT | Unikalny identyfikator wniosku |
| userId | INTEGER | NOT NULL, FOREIGN KEY → users.id | Właściciel wniosku |
| startDate | TIMESTAMP | NOT NULL | Data rozpoczęcia urlopu |
| endDate | TIMESTAMP | NOT NULL | Data zakończenia urlopu |
| reason | TEXT | NOT NULL | Powód/cel urlopu |
| status | TEXT | NOT NULL, ENUM, DEFAULT: 'pending' | Status: 'pending', 'approved', 'rejected' |
| adminComment | TEXT | NULLABLE | Komentarz administratora |
| createdAt | TIMESTAMP | NOT NULL, DEFAULT: CURRENT_TIMESTAMP | Data utworzenia wniosku |
| updatedAt | TIMESTAMP | NOT NULL, DEFAULT: CURRENT_TIMESTAMP | Data ostatniej modyfikacji |

**Relacje:**
- `userId` → FOREIGN KEY do `users.id` z CASCADE DELETE (usunięcie użytkownika usuwa jego wnioski)

**Indeksy:**
- Indeks na kolumnie `userId` (dla szybszego wyszukiwania wniosków użytkownika)
- Indeks na kolumnie `status` (dla filtrowania po statusie)

**Reguły walidacji:**
- Data rozpoczęcia nie może być w przeszłości
- Data zakończenia musi być późniejsza niż data rozpoczęcia
- Powód minimum 10 znaków
- Status może być tylko: 'pending', 'approved', 'rejected'
- Komentarz administratora jest wymagany przy odrzuceniu

**Reguły biznesowe:**
- Użytkownik może mieć tylko jeden wniosek ze statusem 'pending' jednocześnie
- Tylko wnioski 'pending' mogą być edytowane przez pracownika
- Tylko wnioski 'pending' mogą być zatwierdzane/odrzucane przez administratora
- Wnioski 'approved' i 'rejected' są niemutowalne

### Diagram ERD (Entity Relationship Diagram)

```
USERS ||--o{ LEAVE_REQUESTS : "składa"
  - Jeden użytkownik może mieć wiele wniosków
  - Każdy wniosek należy do dokładnie jednego użytkownika
  - Usunięcie użytkownika usuwa wszystkie jego wnioski (CASCADE DELETE)
```

---

## User Stories

### Moduł Autentykacji

**US-1: Rejestracja Pracownika**
```
JAKO nowy pracownik
CHCĘ zarejestrować się w systemie
ABY móc składać wnioski urlopowe

Kryteria akceptacji:
- Podaję email, hasło, imię i nazwisko
- Email musi być unikalny w systemie
- Hasło musi mieć minimum 8 znaków
- Otrzymuję potwierdzenie utworzenia konta
- Moje konto ma domyślnie rolę 'employee'
```

**US-2: Rejestracja Administratora**
```
JAKO administrator systemu
CHCĘ utworzyć konto z rolą 'admin'
ABY móc zarządzać wnioskami urlopowymi

Kryteria akceptacji:
- Podaję email, hasło, imię i nazwisko oraz rolę 'admin'
- Moje konto jest utworzone z uprawnieniami administratora
- Mogę logować się i zarządzać wnioskami
```

**US-3: Logowanie do Systemu**
```
JAKO zarejestrowany użytkownik
CHCĘ zalogować się do systemu
ABY uzyskać dostęp do moich funkcjonalności

Kryteria akceptacji:
- Podaję email i hasło
- System weryfikuje moje dane
- Otrzymuję token JWT ważny 24 godziny
- Token zawiera mój identyfikator i rolę
- Mogę używać tokenu do autoryzacji zapytań
```

### Moduł Wniosków Urlopowych (Pracownik)

**US-4: Składanie Wniosku Urlopowego**
```
JAKO pracownik
CHCĘ złożyć wniosek urlopowy
ABY formalnie zaplanować urlop

Kryteria akceptacji:
- Podaję datę rozpoczęcia, datę zakończenia i powód
- Data rozpoczęcia nie może być w przeszłości
- Data zakończenia musi być późniejsza niż data rozpoczęcia
- Powód musi mieć minimum 10 znaków
- Mogę mieć tylko jeden wniosek ze statusem 'pending'
- Wniosek jest automatycznie ustawiony na status 'pending'
- Otrzymuję potwierdzenie złożenia wniosku
```

**US-5: Przeglądanie Własnych Wniosków**
```
JAKO pracownik
CHCĘ zobaczyć listę wszystkich moich wniosków urlopowych
ABY śledzić ich status i historię

Kryteria akceptacji:
- Widzę tylko swoje wnioski
- Widzę datę rozpoczęcia, zakończenia, powód, status
- Widzę ewentualny komentarz administratora
- Lista jest posortowana od najnowszych
- Widzę wnioski o wszystkich statusach (pending, approved, rejected)
```

**US-6: Wyświetlanie Szczegółów Wniosku**
```
JAKO pracownik
CHCĘ zobaczyć szczegóły konkretnego wniosku
ABY sprawdzić jego status i komentarze

Kryteria akceptacji:
- Mogę pobrać szczegóły wniosku po ID
- Widzę wszystkie informacje o wniosku
- Mogę zobaczyć tylko własne wnioski
- Otrzymuję błąd przy próbie dostępu do cudzego wniosku
```

**US-7: Edycja Wniosku Oczekującego**
```
JAKO pracownik
CHCĘ edytować swój wniosek urlopowy
ABY skorygować daty lub powód przed zatwierdzeniem

Kryteria akceptacji:
- Mogę edytować tylko wnioski ze statusem 'pending'
- Mogę zmienić datę rozpoczęcia, datę zakończenia i powód
- Obowiązują te same reguły walidacji co przy tworzeniu
- Data modyfikacji jest aktualizowana
- Otrzymuję błąd przy próbie edycji zatwierdzonego/odrzuconego wniosku
```

**US-8: Usuwanie Wniosku Oczekującego**
```
JAKO pracownik
CHCĘ usunąć swój wniosek urlopowy
ABY anulować planowany urlop

Kryteria akceptacji:
- Mogę usunąć tylko wnioski ze statusem 'pending'
- Wniosek jest trwale usuwany z systemu
- Otrzymuję potwierdzenie usunięcia
- Otrzymuję błąd przy próbie usunięcia zatwierdzonego/odrzuconego wniosku
```

### Moduł Administracyjny

**US-9: Przeglądanie Wszystkich Wniosków**
```
JAKO administrator
CHCĘ zobaczyć wszystkie wnioski urlopowe w systemie
ABY zarządzać urlopami zespołu

Kryteria akceptacji:
- Widzę wnioski wszystkich pracowników
- Widzę identyfikator pracownika, daty, powód, status
- Lista zawiera wnioski o wszystkich statusach
- Lista jest posortowana od najnowszych
- Tylko użytkownicy z rolą 'admin' mają dostęp
```

**US-10: Zatwierdzanie Wniosku**
```
JAKO administrator
CHCĘ zatwierdzić wniosek urlopowy
ABY wyrazić zgodę na urlop pracownika

Kryteria akceptacji:
- Mogę zatwierdzić tylko wnioski ze statusem 'pending'
- Status zmienia się na 'approved'
- Mogę opcjonalnie dodać komentarz
- Data modyfikacji jest aktualizowana
- Otrzymuję potwierdzenie zatwierdzenia
- Otrzymuję błąd przy próbie zatwierdzenia już rozpatrzonego wniosku
```

**US-11: Odrzucanie Wniosku**
```
JAKO administrator
CHCĘ odrzucić wniosek urlopowy
ABY odmówić zgody na urlop z podaniem przyczyny

Kryteria akceptacji:
- Mogę odrzucić tylko wnioski ze statusem 'pending'
- Status zmienia się na 'rejected'
- MUSZĘ podać komentarz (wymagany)
- Data modyfikacji jest aktualizowana
- Pracownik może zobaczyć powód odrzucenia
- Otrzymuję błąd jeśli nie podam komentarza
- Otrzymuję błąd przy próbie odrzucenia już rozpatrzonego wniosku
```

### Moduł Świąt Państwowych

**US-12: Sprawdzanie Świąt Państwowych**
```
JAKO pracownik
CHCĘ sprawdzić dni wolne od pracy w danym roku
ABY planować urlop z uwzględnieniem świąt

Kryteria akceptacji:
- Podaję rok (YYYY) i kod kraju (np. PL, US)
- Otrzymuję listę świąt państwowych
- Każde święto zawiera datę, nazwę lokalną i angielską
- Rok musi być w zakresie 2000 - bieżący rok + 10
- Kod kraju musi być dwuliterowy (ISO 3166-1 alpha-2)
- Otrzymuję błąd dla nieistniejącego kodu kraju
- Dane pochodzą z zewnętrznego API (Nager.Date)
```

### User Stories Bezpieczeństwa

**US-13: Ochrona Hasła**
```
JAKO użytkownik
CHCĘ mieć pewność że moje hasło jest bezpieczne
ABY chronić dostęp do mojego konta

Kryteria akceptacji:
- Hasło jest przechowywane jako hash (bcrypt)
- Hasło nie jest nigdy zwracane w odpowiedziach API
- Używane są 10 rund soli przy hashowaniu
```

**US-14: Autoryzacja Zapytań**
```
JAKO system
CHCĘ wymagać autoryzacji dla chronionych zasobów
ABY zapewnić bezpieczeństwo danych

Kryteria akceptacji:
- Wszystkie endpointy poza /register i /login wymagają tokenu JWT
- Token musi być przesłany w nagłówku Authorization: Bearer
- Token jest weryfikowany przed przetworzeniem zapytania
- Nieważny/brakujący token zwraca błąd 401
```

**US-15: Kontrola Dostępu**
```
JAKO system
CHCĘ egzekwować kontrolę dostępu opartą na rolach
ABY chronić funkcje administracyjne

Kryteria akceptacji:
- Endpointy /api/admin/* są dostępne tylko dla użytkowników z rolą 'admin'
- Pracownicy próbujący uzyskać dostęp do funkcji admin otrzymują błąd 403
- Pracownicy widzą tylko własne wnioski
- Administratorzy widzą wszystkie wnioski
```

---

## Architektura i Wzorce Projektowe

### Wzorzec Architektoniczny: Layered Architecture (Architektura Warstwowa)

System wykorzystuje **architekturę warstwową z podziałem na warstwy**, co zapewnia separację odpowiedzialności i ułatwia testowanie oraz rozwój aplikacji.

#### Struktura Warstw

```
┌──────────────────────────────┐
│   WARSTWA ROUTINGU           │  ← Definicje endpointów
├──────────────────────────────┤
│   WARSTWA MIDDLEWARE         │  ← Autentykacja, walidacja, obsługa błędów
├──────────────────────────────┤
│   WARSTWA KONTROLERÓW        │  ← Obsługa HTTP request/response
├──────────────────────────────┤
│   WARSTWA SERWISÓW           │  ← Logika biznesowa
├──────────────────────────────┤
│   WARSTWA DOSTĘPU DO DANYCH  │  ← ORM (Drizzle) i schemat bazy
└──────────────────────────────┘
```

#### Przepływ Żądania

```
Request → Router → Middleware → Controller → Service → Database
                      ↓
                  Validation
                  Authentication
                  Authorization
                      ↓
Response ← Controller ← Service ← Database
```

### Zastosowane Wzorce Projektowe

#### 1. **Service Layer Pattern (Wzorzec Warstwy Serwisów)**

**Opis:** Logika biznesowa jest oddzielona od kontrolerów i umieszczona w dedykowanych klasach serwisowych.

**Implementacja:**
- Każdy moduł posiada klasę serwisową (np. `AuthService`, `LeaveRequestService`)
- Serwisy są eksportowane jako singletony
- Kontrolery delegują logikę biznesową do serwisów
- Serwisy są łatwe do testowania w izolacji

**Korzyści:**
- Separacja odpowiedzialności (kontrolery obsługują HTTP, serwisy obsługują logikę)
- Reużywalność logiki biznesowej
- Łatwiejsze testowanie jednostkowe
- Centralizacja reguł biznesowych

**Przykład przepływu:**
```
POST /api/leave-requests
    ↓
LeaveRequestController.createLeaveRequest()
    ↓
LeaveRequestService.createLeaveRequest()
    ↓
- Walidacja reguł biznesowych
- Sprawdzenie istniejących wniosków pending
- Zapis do bazy danych
- Zwrócenie wyniku
    ↓
Controller formatuje odpowiedź HTTP
    ↓
Response (201 Created)
```

#### 2. **Dependency Injection (Wstrzykiwanie Zależności)**

**Opis:** Zależności są przekazywane do klas zamiast być tworzonymi wewnątrz nich.

**Implementacja:**
- Połączenie z bazą danych jest importowane, nie tworzone lokalnie
- Serwisy są instancjonowane jako singletony i importowane gdzie potrzeba
- Middleware są przekazywane do routerów

**Korzyści:**
- Łatwiejsze testowanie (możliwość mockowania zależności)
- Luźniejsze powiązanie między modułami
- Większa elastyczność w konfiguracji

#### 3. **Middleware Pattern (Wzorzec Middleware)**

**Opis:** Przetwarzanie żądań odbywa się przez łańcuch funkcji middleware przed dotarciem do kontrolera.

**Implementacja:**
- `authedMiddleware` - weryfikacja tokenu JWT
- `requireAdmin` - sprawdzenie roli administratora
- `validate` - walidacja danych wejściowych za pomocą schematów Zod
- `errorMiddleware` - centralna obsługa błędów
- `asyncMiddleware` - obsługa asynchronicznych kontrolerów

**Korzyści:**
- Modularność i reużywalność
- Czytelny kod (separacja kroków przetwarzania)
- Łatwe dodawanie nowych funkcjonalności cross-cutting (np. logging)

**Przykład łańcucha middleware:**
```
Request
  → authedMiddleware (weryfikacja tokenu)
  → requireAdmin (sprawdzenie roli)
  → validate (walidacja danych)
  → asyncMiddleware(controller) (wykonanie logiki)
  → errorMiddleware (obsługa błędów)
Response
```

#### 4. **Repository Pattern (ukryty w Drizzle ORM)**

**Opis:** Dostęp do danych jest abstraowany przez ORM, co ukrywa szczegóły implementacji bazy danych.

**Implementacja:**
- Drizzle ORM działa jako warstwa abstrakcji nad SQLite
- Schemat bazy jest zdefiniowany w TypeScript
- Zapytania są tworzone za pomocą type-safe API Drizzle
- Brak surowego SQL w kodzie aplikacji

**Korzyści:**
- Ochrona przed SQL Injection
- Type safety na poziomie TypeScript
- Łatwiejsza migracja do innej bazy danych w przyszłości
- Automatyczne mapowanie typów

#### 5. **Singleton Pattern (Wzorzec Singletonu)**

**Opis:** Instancje serwisów i połączenie z bazą danych są tworzone raz i reużywane.

**Implementacja:**
```typescript
class AuthService {
  // metody serwisu
}
export const authService = new AuthService(); // singleton
```

**Korzyści:**
- Wydajność (jedna instancja serwisu)
- Spójność stanu
- Łatwy dostęp z różnych miejsc aplikacji

#### 6. **Validation Pattern (Wzorzec Walidacji)**

**Opis:** Dane wejściowe są walidowane za pomocą schematów Zod przed przetworzeniem.

**Implementacja:**
- Każdy moduł definiuje schematy walidacji w osobnym pliku
- Middleware `validate` wykorzystuje schematy do weryfikacji danych
- Błędy walidacji są zwracane w standardowym formacie

**Korzyści:**
- Wczesne wykrywanie błędnych danych
- Spójna walidacja w całej aplikacji
- Samodokumentujący się kod (schematy opisują strukturę danych)
- Type safety dzięki inferencji typów z Zod

#### 7. **Error Handling Pattern (Wzorzec Obsługi Błędów)**

**Opis:** Błędy są rzucane jako własne klasy wyjątków i przechwytywane przez centralne middleware.

**Implementacja:**
- Klasy błędów: `ConflictError`, `NotFoundError`, `UnauthorizedError`, `ForbiddenError`
- Centralne `errorMiddleware` przechwytuje wszystkie błędy
- Błędy są formatowane w standardowy sposób
- Różne statusy HTTP dla różnych typów błędów

**Korzyści:**
- Spójna obsługa błędów w całej aplikacji
- Łatwe debugowanie
- Przyjazne komunikaty dla użytkownika
- Separacja logiki biznesowej od obsługi błędów

### Organizacja Kodu: Feature-Based Modules

System jest podzielony na **moduły funkcjonalne** zamiast podziału na warstwy techniczne.

**Struktura modułu:**
```
modules/
  auth/
    - auth.controller.ts
    - auth.service.ts
    - auth.routes.ts
    - auth.validators.ts
    - auth.middleware.ts
    - auth.types.ts
    - auth.utils.ts
    - __tests__/
```

**Korzyści:**
- Wysoka spójność (wszystko związane z funkcją w jednym miejscu)
- Łatwiejsze utrzymanie i rozwój
- Możliwość pracy nad modułami niezależnie
- Przejrzysty podział odpowiedzialności

### Test-Driven Development (TDD)

System został zbudowany z wykorzystaniem metodyki TDD:

1. **Test First** - najpierw pisany test
2. **Implementation** - implementacja funkcjonalności
3. **Refactor** - refaktoryzacja kodu
4. **Repeat** - powtarzanie cyklu

**Rodzaje testów:**
- Testy jednostkowe (unit tests) - serwisy, utils
- Testy integracyjne (integration tests) - endpointy API end-to-end
- Pokrycie testami krytycznych ścieżek (autentykacja, autoryzacja, logika biznesowa)

### Bezpieczeństwo

System implementuje następujące mechanizmy bezpieczeństwa:

1. **Autentykacja JWT**
   - Tokeny JWT z datą wygaśnięcia
   - Tokeny przesyłane w nagłówku Authorization

2. **Hashowanie Haseł**
   - Bcrypt z 10 rundami soli
   - Hasła nigdy nie są przechowywane w plain text

3. **Autoryzacja Oparta na Rolach (RBAC)**
   - Dwie role: employee i admin
   - Middleware sprawdzające uprawnienia

4. **Walidacja Danych Wejściowych**
   - Wszystkie dane są walidowane przez schematy Zod
   - Ochrona przed nieprawidłowymi typami danych

5. **Ochrona przed SQL Injection**
   - Drizzle ORM używa parametryzowanych zapytań
   - Brak surowego SQL w kodzie

6. **Kontrola Dostępu do Zasobów**
   - Użytkownicy widzą tylko swoje wnioski
   - Weryfikacja właściciela zasobu

### Podsumowanie Wzorców

| Wzorzec | Zastosowanie | Korzyść |
|---------|--------------|---------|
| Layered Architecture | Struktura aplikacji | Separacja odpowiedzialności |
| Service Layer | Logika biznesowa | Reużywalność, testowalność |
| Middleware | Przetwarzanie zapytań | Modularność, cross-cutting concerns |
| Dependency Injection | Zarządzanie zależnościami | Testowanie, luźne powiązanie |
| Repository (ORM) | Dostęp do danych | Abstrakcja, type safety |
| Singleton | Instancje serwisów | Wydajność, spójność |
| Validation | Weryfikacja danych | Bezpieczeństwo, type safety |
| Error Handling | Obsługa błędów | Spójność, debugowanie |

---

## Podsumowanie

System MTP został zaprojektowany z naciskiem na:
- **Prostotę** - kod jest czytelny i zrozumiały
- **Bezpieczeństwo** - wielowarstwowa ochrona danych
- **Testowalność** - TDD i wysoka separacja odpowiedzialności
- **Skalowalność** - modularna architektura umożliwiająca rozwój
- **Użyteczność** - rozwiązuje rzeczywiste problemy użytkowników

Dzięki zastosowaniu sprawdzonych wzorców projektowych system jest łatwy w utrzymaniu i gotowy do rozbudowy o nowe funkcjonalności.
