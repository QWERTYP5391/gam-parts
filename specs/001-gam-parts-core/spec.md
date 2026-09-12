# Feature Specification: GAM Parts Core Marketplace

**Feature Branch**: `001-gam-parts-core`

**Created**: 2026-09-05

**Status**: Draft

**Input**: User description: "A digital automotive marketplace for the Gambia connecting Vehicle Owners, Mechanics, and Spare Parts Dealers. Users can find parts, request parts, manage dealer inventory, and get smart dealer matching."

## User Scenarios & Testing

### User Story 1 - Account Registration by Role (Priority: P1)

A new user visits the GAM Parts platform and creates an account by selecting one of three roles: Vehicle Owner, Mechanic, or Spare Parts Dealer. Each role determines the user's dashboard experience and available features. A Vehicle Owner sees part search and request tools. A Mechanic sees part search, request tools, and the ability to act on behalf of clients. A Spare Parts Dealer sees inventory management and incoming request/order views.

**Why this priority**: Without user accounts and role differentiation, no other feature can function. This is the foundational capability that unlocks the entire platform.

**Independent Test**: Can be fully tested by registering three separate accounts (one per role) and verifying each sees the correct dashboard and feature set.

**Acceptance Scenarios**:

1. **Given** an unregistered visitor, **When** they complete the registration form selecting "Vehicle Owner", **Then** an account is created and they are redirected to a Vehicle Owner dashboard showing part search and request options.
2. **Given** an unregistered visitor, **When** they complete the registration form selecting "Mechanic", **Then** an account is created and they are redirected to a Mechanic dashboard showing part search, request options, and client management.
3. **Given** an unregistered visitor, **When** they complete the registration form selecting "Spare Parts Dealer", **Then** an account is created and they are redirected to a Dealer dashboard showing inventory management and incoming requests.
4. **Given** a registered user, **When** they attempt to register with the same email, **Then** the system displays an error indicating the email is already in use.
5. **Given** a registered user, **When** they log in with valid credentials, **Then** they are redirected to their role-specific dashboard.

---

### User Story 2 - Find a Part (Priority: P1)

A Vehicle Owner or Mechanic needs a specific spare part. They enter search criteria (part name, vehicle make, model, year) into the search interface. The system returns a list of matching parts from dealer inventories, showing: the dealer's name, location, price, availability status, and estimated fulfillment time. Results are sortable by price, distance, and availability.

**Why this priority**: This is the core value proposition of the platform — connecting people who need parts with dealers who have them. Without search, the marketplace has no utility.

**Independent Test**: Can be fully tested by searching for a known part that exists in at least one dealer's inventory and verifying results display all required information.

**Acceptance Scenarios**:

1. **Given** a logged-in Vehicle Owner or Mechanic, **When** they search for a part by name and vehicle details, **Then** the system returns a list of matching results showing dealer name, location, price, availability, and estimated fulfillment time.
2. **Given** search results are displayed, **When** the user sorts by price, **Then** results reorder from lowest to highest price.
3. **Given** search results are displayed, **When** the user sorts by distance, **Then** results reorder from nearest to farthest dealer.
4. **Given** no dealers have the searched part, **When** the search completes, **Then** the system displays a "No results found" message and suggests creating a Part Request.
5. **Given** a search query with only a part name (no vehicle details), **When** the search executes, **Then** the system returns all matching parts regardless of vehicle compatibility, with a note to verify fitment.

---

### User Story 3 - Part Request System (Priority: P2)

When a Vehicle Owner or Mechanic cannot find a part through search, they create a Part Request describing what they need (part name, vehicle details, urgency level, and any additional notes). The request is broadcast to relevant Spare Parts Dealers who can respond with quotes (price, availability, fulfillment time). The requester can review all quotes and accept one.

**Why this priority**: Complements the search feature by handling cases where parts are not currently listed in any inventory, ensuring no user leaves the platform empty-handed.

**Independent Test**: Can be fully tested by creating a part request, having a dealer submit a quote, and having the requester accept it.

**Acceptance Scenarios**:

1. **Given** a logged-in Vehicle Owner or Mechanic, **When** they submit a Part Request with part name, vehicle make/model/year, and urgency level, **Then** the request is created and visible to relevant Spare Parts Dealers.
2. **Given** an active Part Request, **When** a Spare Parts Dealer views it, **Then** they can submit a quote including price, availability status, and estimated fulfillment time.
3. **Given** a Part Request with multiple quotes, **When** the requester reviews the quotes, **Then** they see all quotes side by side with dealer information, price, and fulfillment details.
4. **Given** a Part Request with quotes, **When** the requester accepts a quote, **Then** the accepted dealer is notified and the request status changes to "Accepted."
5. **Given** a Part Request, **When** no dealer responds within 48 hours, **Then** the requester is notified that no quotes have been received yet.

---

### User Story 4 - Dealer Inventory Management (Priority: P2)

A Spare Parts Dealer manages their inventory through the platform. They can add parts (with name, compatible vehicles, price, quantity, condition, and photos), edit existing listings, mark items as out of stock, and remove listings. Their inventory is searchable by other users through the Find a Part feature.

**Why this priority**: Dealers need to list their inventory before buyers can find parts. This is the supply side of the marketplace and must exist for search to return results.

**Independent Test**: Can be fully tested by a dealer adding a part to inventory, editing its price, and verifying it appears in search results for another user.

**Acceptance Scenarios**:

1. **Given** a logged-in Spare Parts Dealer, **When** they add a new part with name, compatible vehicles, price, quantity, and condition, **Then** the part is saved and appears in their inventory list.
2. **Given** a dealer with existing inventory, **When** they edit a part's price or quantity, **Then** the changes are reflected immediately in their inventory and in search results.
3. **Given** a dealer with existing inventory, **When** they mark a part as out of stock, **Then** the part no longer appears in search results but remains in their inventory as inactive.
4. **Given** a dealer with existing inventory, **When** they delete a listing, **Then** the part is permanently removed from their inventory and search results.
5. **Given** a dealer adding a part, **When** they upload photos, **Then** the photos are displayed alongside the part listing in search results.

---

### User Story 5 - Smart Dealer Matching (Priority: P3)

When a user searches for a part or creates a Part Request, the system intelligently ranks dealers based on relevance factors: inventory match accuracy, geographic proximity to the requester, dealer response history, pricing competitiveness, and fulfillment reliability. The best-matching dealers appear first in search results and are prioritized for Part Request notifications.

**Why this priority**: Enhances user experience by surfacing the most relevant dealers first, but the platform functions without it (basic search and requests work with simple listing).

**Independent Test**: Can be fully tested by verifying that search results for a part prioritize a nearby dealer with the exact part in stock over a distant dealer with a loosely matching part.

**Acceptance Scenarios**:

1. **Given** a user searching for a part, **When** multiple dealers have the part, **Then** results are ranked with dealers closer to the user and with exact inventory matches appearing first.
2. **Given** a new Part Request, **When** the system notifies dealers, **Then** dealers with relevant inventory and strong fulfillment history are notified first.
3. **Given** two dealers with the same part at the same price, **When** one is geographically closer, **Then** the closer dealer ranks higher in results.

---

### Edge Cases

- What happens when a dealer's inventory data is stale (e.g., part sold externally but not updated on the platform)? The system MUST display the last-updated timestamp on listings so buyers can judge freshness. Dealers receive periodic reminders to review inventory accuracy.
- What happens when a user searches with misspelled part names? The system MUST provide fuzzy matching and suggest corrections (e.g., "Did you mean 'alternator'?").
- What happens when a dealer submits a quote on a Part Request that the requester has already accepted from another dealer? The system MUST prevent new quotes on accepted requests and display the request's current status.
- What happens when a user attempts to access features outside their role (e.g., a Vehicle Owner tries to manage inventory)? The system MUST deny access and display an appropriate message.

## Requirements

### Functional Requirements

- **FR-001**: System MUST support three distinct user roles: Vehicle Owner, Mechanic, and Spare Parts Dealer, each with role-specific dashboards and permissions.
- **FR-002**: System MUST allow user registration with email, password, full name, phone number, role selection, and location (area/town within The Gambia).
- **FR-003**: System MUST allow users to log in and log out with session persistence across browser tabs.
- **FR-004**: System MUST provide a part search interface accepting part name, vehicle make, model, and year as search criteria.
- **FR-005**: System MUST return search results showing dealer name, location, price, availability status, estimated fulfillment time, and last-updated timestamp.
- **FR-006**: System MUST allow sorting search results by price, distance, and availability.
- **FR-007**: System MUST support fuzzy matching on part name searches to handle misspellings and partial names.
- **FR-008**: System MUST allow Vehicle Owners and Mechanics to create Part Requests with part name, vehicle details, urgency level (low, medium, high), and optional notes.
- **FR-009**: System MUST notify relevant Spare Parts Dealers when a new Part Request is created.
- **FR-010**: System MUST allow Spare Parts Dealers to submit quotes on Part Requests, including price, availability, and estimated fulfillment time.
- **FR-011**: System MUST allow requesters to compare quotes side by side and accept one.
- **FR-012**: System MUST allow Spare Parts Dealers to add, edit, deactivate, and delete inventory listings.
- **FR-013**: Each inventory listing MUST include: part name, compatible vehicles (make/model/year), price, quantity, condition (new/used/refurbished), and optional photos.
- **FR-014**: System MUST rank search results and Part Request notifications using smart dealer matching based on inventory match accuracy, geographic proximity, dealer response history, pricing, and fulfillment reliability.
- **FR-015**: System MUST enforce role-based access control so users can only access features appropriate to their role.
- **FR-016**: System MUST display a "last updated" timestamp on all inventory listings.

### Key Entities

- **User**: Represents a registered platform participant. Has a role (Vehicle Owner, Mechanic, or Spare Parts Dealer), contact information, and location within The Gambia.
- **Part Listing**: A spare part listed by a Dealer. Includes part details, compatible vehicles, pricing, quantity, condition, photos, and availability status.
- **Part Request**: A request from a Vehicle Owner or Mechanic for a specific part they could not find. Includes part details, vehicle information, urgency, and status (open, quoted, accepted, fulfilled).
- **Quote**: A dealer's response to a Part Request. Includes price, availability, estimated fulfillment time, and status (pending, accepted, declined).
- **Vehicle**: Represents vehicle compatibility information (make, model, year) associated with Part Listings and Part Requests.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Users can complete account registration and reach their role-specific dashboard in under 2 minutes.
- **SC-002**: A part search returns results within 2 seconds for inventories of up to 50,000 listed parts.
- **SC-003**: 80% of part searches return at least one relevant result when the part exists in any dealer's inventory.
- **SC-004**: Part Requests receive at least one dealer quote within 24 hours for 60% of requests.
- **SC-005**: Users can compare quotes and accept one in under 1 minute.
- **SC-006**: Dealers can add a new inventory listing in under 3 minutes.
- **SC-007**: Smart dealer matching surfaces the most relevant dealer (by proximity and inventory match) in the top 3 results for 85% of searches.
- **SC-008**: The platform supports at least 500 concurrent users without degradation.

## Assumptions

- Users are located within The Gambia and have access to a modern web browser with internet connectivity (mobile or desktop).
- The platform is web-only for the initial version; native mobile apps are out of scope.
- Location data is based on user-provided area/town within The Gambia, not GPS coordinates. Distance-based sorting uses town-level proximity.
- Part categorization uses a flat structure (part name + vehicle compatibility) rather than a hierarchical taxonomy for the initial version.
- Photos are optional for inventory listings. The system accepts common image formats (JPEG, PNG) with a reasonable file size limit.
- Notifications for Part Requests and quotes are delivered via the platform's in-app notification system. Email or SMS notifications are out of scope for the initial version.
- Payment processing is out of scope. Transactions (payment, delivery) happen off-platform between buyer and dealer.
- The platform operates in English as the primary language.
- Dealer response history and fulfillment reliability metrics for smart matching are accumulated over time; new dealers start with a neutral score.
