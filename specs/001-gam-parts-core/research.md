# Research: GAM Parts Core Marketplace

**Feature**: specs/001-gam-parts-core/spec.md
**Date**: 2026-09-06

## R-001: Auth.js v5 with Role-Based Access

**Decision**: Use Auth.js v5 (NextAuth v5) with the Drizzle adapter and a custom `role` field on the user table. Session strategy: database sessions (not JWT) per constitution.

**Rationale**: Auth.js v5 is the mandated authentication solution (constitution). The Drizzle adapter integrates directly with our ORM. Database sessions allow role to be read server-side without token refresh issues. Edge middleware route guards enforce role-based access at the routing layer.

**Alternatives considered**:
- JWT sessions: Rejected — role changes would require token refresh/revocation logic, adding complexity
- Custom auth: Rejected — violates constitution mandate for Auth.js v5
- Clerk/Supabase Auth: Rejected — external dependency not in constitution stack

## R-002: Fuzzy Search Implementation

**Decision**: Use PostgreSQL `pg_trgm` extension with `similarity()` and `ILIKE` for fuzzy part name matching. Combine with Drizzle's SQL template literals for type-safe queries.

**Rationale**: `pg_trgm` is a built-in PostgreSQL extension requiring no external service. It handles misspellings, partial matches, and can power "Did you mean?" suggestions by returning similarity scores. No additional infrastructure needed.

**Alternatives considered**:
- Elasticsearch/Meilisearch: Rejected — adds infrastructure complexity for v1; pg_trgm sufficient for 50,000 listings
- Application-level fuzzy matching (Fuse.js): Rejected — requires loading all parts into memory; does not scale
- PostgreSQL full-text search (`tsvector`): Considered as complement but `pg_trgm` better handles misspellings

## R-003: Location & Distance Sorting

**Decision**: Use a predefined lookup table of Gambian towns/areas with approximate coordinates. Distance calculated server-side using Haversine formula on town centroids. No GPS or geocoding API required.

**Rationale**: The spec scopes location to "area/town within The Gambia" — a small, well-defined geography (~50-100 distinct towns). A static lookup is simpler and more reliable than geocoding APIs, especially given potential connectivity constraints in The Gambia.

**Alternatives considered**:
- Google Maps/Mapbox geocoding: Rejected — adds external API dependency, cost, and latency for a small geographic area
- PostGIS: Considered but overkill for town-level proximity with <100 points
- User-entered coordinates: Rejected — poor UX, spec explicitly says town-based

## R-004: Smart Dealer Matching Algorithm

**Decision**: Weighted scoring model combining: inventory match accuracy (40%), geographic proximity (30%), dealer response rate (15%), and fulfillment reliability (15%). Scores computed at query time using Drizzle SQL. New dealers start with neutral scores (0.5 for response rate and reliability).

**Rationale**: A simple weighted score is transparent, debuggable, and sufficient for v1. The weights can be tuned based on user behavior data post-launch. No ML infrastructure needed.

**Alternatives considered**:
- Machine learning ranking: Rejected — no training data exists, premature for v1
- Collaborative filtering: Rejected — requires usage history that does not exist yet
- Fixed sort (price only): Rejected — spec explicitly requires multi-factor ranking

## R-005: Image Upload for Part Listings

**Decision**: Store images on the filesystem via Next.js public uploads directory for v1, with a path reference in the database. Accept JPEG and PNG, max 5MB per image, max 4 images per listing. Use `sharp` for server-side resizing/optimization.

**Rationale**: Simplest approach for v1 that avoids external service dependencies. File size and count limits prevent abuse. `sharp` is already commonly used in Next.js image optimization pipelines.

**Alternatives considered**:
- Cloudinary/S3: Better for production scale but adds external dependency and configuration for v1
- Base64 in database: Rejected — bloats database, poor performance
- Vercel Blob: Good option but adds vendor lock-in; can migrate later

## R-006: In-App Notification System

**Decision**: Database-backed notifications table with a `notifications` model (recipient, type, message, read status, link, created_at). Polled via Server Component data fetching on page load and dashboard views. No real-time push for v1.

**Rationale**: Server Component polling aligns with the RSC-first architecture. Real-time notifications (WebSockets/SSE) add significant complexity for v1. Users will see notifications on dashboard load, which is sufficient for the initial marketplace where response times are measured in hours, not seconds.

**Alternatives considered**:
- WebSocket/SSE real-time: Rejected for v1 — spec measures dealer response in hours (24h target), making real-time unnecessary
- Email/SMS: Explicitly out of scope per spec assumptions
- Push notifications: Requires service worker setup, out of scope for web-only v1

## R-007: Part-Vehicle Compatibility Model

**Decision**: Junction table approach — a `part_vehicles` table linking part listings to vehicle makes/models/years. Vehicle data stored as structured fields (make, model, year_from, year_to) rather than free text.

**Rationale**: Structured vehicle data enables accurate search filtering. Year ranges (year_from to year_to) reduce data entry burden versus listing every individual year. The flat structure (no hierarchical taxonomy) aligns with spec assumptions.

**Alternatives considered**:
- Free-text vehicle field: Rejected — cannot be reliably searched or filtered
- Separate vehicles reference table: Considered but adds complexity; inline fields on the junction table are sufficient for v1 since there is no canonical vehicle database to reference
- JSON array on part listing: Rejected — cannot be efficiently queried with SQL
