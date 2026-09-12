# Data Model: GAM Parts Core Marketplace

**Feature**: specs/001-gam-parts-core/spec.md
**Date**: 2026-09-06

## Entities

### User

Represents a registered platform participant.

| Field        | Type                                          | Constraints                        |
|--------------|-----------------------------------------------|------------------------------------|
| id           | UUID                                          | PK, auto-generated                 |
| email        | varchar(255)                                  | unique, not null                   |
| passwordHash | varchar(255)                                  | not null                           |
| name         | varchar(255)                                  | not null                           |
| phone        | varchar(20)                                   | not null                           |
| role         | enum('vehicle_owner', 'mechanic', 'dealer')   | not null                           |
| townId       | integer                                       | FK → Town.id, not null             |
| createdAt    | timestamp                                     | not null, default now()            |
| updatedAt    | timestamp                                     | not null, default now()            |

**Validation rules**:
- Email must be valid format (Zod `z.string().email()`)
- Phone must be non-empty
- Role must be one of the three enum values
- Name must be at least 2 characters

**Notes**: Auth.js v5 manages session/account tables separately via the Drizzle adapter. This user table extends the default Auth.js user with marketplace-specific fields.

---

### Town

Static lookup table for Gambian towns/areas with approximate coordinates.

| Field     | Type         | Constraints            |
|-----------|--------------|------------------------|
| id        | serial       | PK                     |
| name      | varchar(100) | unique, not null        |
| region    | varchar(100) | not null               |
| latitude  | decimal(9,6) | not null               |
| longitude | decimal(9,6) | not null               |

**Notes**: Seeded at deployment time. ~50-100 rows covering major towns and areas in The Gambia.

---

### PartListing

A spare part listed by a dealer for sale.

| Field           | Type                                        | Constraints                     |
|-----------------|---------------------------------------------|---------------------------------|
| id              | UUID                                        | PK, auto-generated              |
| dealerId        | UUID                                        | FK → User.id, not null          |
| name            | varchar(255)                                | not null                        |
| description     | text                                        | nullable                        |
| price           | decimal(10,2)                               | not null, > 0                   |
| quantity         | integer                                     | not null, >= 0                  |
| condition       | enum('new', 'used', 'refurbished')          | not null                        |
| isActive        | boolean                                     | not null, default true          |
| fulfillmentDays | integer                                     | not null, default 1             |
| createdAt       | timestamp                                   | not null, default now()         |
| updatedAt       | timestamp                                   | not null, default now()         |

**State transitions**:
- Active (isActive=true, quantity>0) → visible in search
- Out of stock (isActive=true, quantity=0) → hidden from search, visible to dealer
- Deactivated (isActive=false) → hidden from search, visible to dealer as inactive
- Deleted → hard delete, removed from all views

**Validation rules**:
- Price must be positive
- Quantity must be non-negative
- Name must be non-empty
- dealerId must reference a user with role='dealer'

---

### PartListingImage

Photos associated with a part listing.

| Field        | Type         | Constraints                     |
|--------------|--------------|----------------------------------|
| id           | UUID         | PK, auto-generated               |
| listingId    | UUID         | FK → PartListing.id, not null    |
| url          | varchar(500) | not null                         |
| displayOrder | integer      | not null, default 0              |
| createdAt    | timestamp    | not null, default now()          |

**Constraints**: Maximum 4 images per listing. JPEG/PNG only, max 5MB each.

---

### PartVehicle

Junction table linking part listings to compatible vehicles.

| Field     | Type         | Constraints                     |
|-----------|--------------|---------------------------------|
| id        | serial       | PK                              |
| listingId | UUID         | FK → PartListing.id, not null   |
| make      | varchar(100) | not null                        |
| model     | varchar(100) | not null                        |
| yearFrom  | integer      | not null                        |
| yearTo    | integer      | not null                        |

**Validation rules**:
- yearFrom must be <= yearTo
- yearFrom and yearTo must be reasonable (1950-2030)
- make and model must be non-empty

---

### PartRequest

A request from a Vehicle Owner or Mechanic for a part they could not find.

| Field       | Type                                              | Constraints                     |
|-------------|---------------------------------------------------|---------------------------------|
| id          | UUID                                              | PK, auto-generated              |
| requesterId | UUID                                              | FK → User.id, not null          |
| partName    | varchar(255)                                      | not null                        |
| vehicleMake | varchar(100)                                      | nullable                        |
| vehicleModel| varchar(100)                                      | nullable                        |
| vehicleYear | integer                                           | nullable                        |
| urgency     | enum('low', 'medium', 'high')                     | not null, default 'medium'      |
| notes       | text                                              | nullable                        |
| status      | enum('open', 'quoted', 'accepted', 'fulfilled')   | not null, default 'open'        |
| createdAt   | timestamp                                         | not null, default now()         |
| updatedAt   | timestamp                                         | not null, default now()         |

**State transitions**:
- open → quoted (when first quote is received)
- quoted → accepted (when requester accepts a quote)
- accepted → fulfilled (when transaction is confirmed complete)
- Any state → open (if accepted quote is cancelled — edge case for future)

**Validation rules**:
- requesterId must reference a user with role='vehicle_owner' or 'mechanic'
- partName must be non-empty

---

### Quote

A dealer's response to a Part Request.

| Field          | Type                                        | Constraints                      |
|----------------|---------------------------------------------|----------------------------------|
| id             | UUID                                        | PK, auto-generated               |
| requestId      | UUID                                        | FK → PartRequest.id, not null    |
| dealerId       | UUID                                        | FK → User.id, not null           |
| price          | decimal(10,2)                               | not null, > 0                    |
| isAvailable    | boolean                                     | not null                         |
| fulfillmentDays| integer                                     | not null                         |
| notes          | text                                        | nullable                         |
| status         | enum('pending', 'accepted', 'declined')     | not null, default 'pending'      |
| createdAt      | timestamp                                   | not null, default now()          |

**Validation rules**:
- dealerId must reference a user with role='dealer'
- Cannot submit a quote on a PartRequest with status='accepted'
- One quote per dealer per request (unique constraint on requestId + dealerId)

---

### Notification

In-app notification for platform events.

| Field     | Type         | Constraints                     |
|-----------|--------------|---------------------------------|
| id        | UUID         | PK, auto-generated              |
| userId    | UUID         | FK → User.id, not null          |
| type      | varchar(50)  | not null                        |
| title     | varchar(255) | not null                        |
| message   | text         | not null                        |
| link      | varchar(500) | nullable                        |
| isRead    | boolean      | not null, default false         |
| createdAt | timestamp    | not null, default now()         |

**Notification types**: `new_quote`, `quote_accepted`, `new_part_request`, `no_quotes_received`, `inventory_review_reminder`

---

### DealerStats

Aggregated dealer performance metrics for smart matching.

| Field              | Type         | Constraints                     |
|--------------------|--------------|---------------------------------|
| dealerId           | UUID         | PK, FK → User.id               |
| totalQuotes        | integer      | not null, default 0             |
| acceptedQuotes     | integer      | not null, default 0             |
| avgResponseHours   | decimal(6,1) | nullable                        |
| avgFulfillmentDays | decimal(4,1) | nullable                        |
| updatedAt          | timestamp    | not null, default now()         |

**Notes**: Updated asynchronously after quote submissions and acceptances. Used by the smart dealer matching algorithm. New dealers have all metrics at 0/null (neutral score).

## Relationships

```
User (1) ──── (N) PartListing       [dealer lists parts]
User (1) ──── (N) PartRequest       [requester creates requests]
User (1) ──── (N) Quote             [dealer submits quotes]
User (1) ──── (N) Notification      [user receives notifications]
User (1) ──── (1) DealerStats       [dealer has performance stats]
User (N) ──── (1) Town              [user is located in a town]

PartListing (1) ──── (N) PartVehicle        [listing has compatible vehicles]
PartListing (1) ──── (N) PartListingImage   [listing has photos]

PartRequest (1) ──── (N) Quote      [request receives quotes]
```

## Indexes

| Table          | Columns                          | Type   | Purpose                          |
|----------------|----------------------------------|--------|----------------------------------|
| PartListing    | (name)                           | GIN (trgm) | Fuzzy text search on part names |
| PartListing    | (dealerId, isActive)             | btree  | Dealer inventory queries         |
| PartListing    | (isActive, quantity)             | btree  | Active listing search filter     |
| PartVehicle    | (make, model, yearFrom, yearTo)  | btree  | Vehicle compatibility search     |
| PartVehicle    | (listingId)                      | btree  | Join from listing to vehicles    |
| PartRequest    | (status, createdAt)              | btree  | Open request queries             |
| Quote          | (requestId, dealerId)            | unique | One quote per dealer per request |
| Notification   | (userId, isRead, createdAt)      | btree  | Unread notifications query       |
