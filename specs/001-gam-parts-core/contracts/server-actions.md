# Server Action Contracts: GAM Parts Core Marketplace

**Feature**: specs/001-gam-parts-core/spec.md
**Date**: 2026-09-06

All Server Actions follow the constitution's discriminated union pattern:

```
ActionResponse<T> = { success: true; data: T } | { success: false; error: string; fieldErrors?: Record<string, string[]> }
```

All inputs validated via Zod schemas. All actions call `revalidatePath()` or `revalidateTag()` after mutations.

---

## Authentication Actions

### registerUser

**Input**:
- email: string (valid email)
- password: string (min 8 characters)
- name: string (min 2 characters)
- phone: string (non-empty)
- role: 'vehicle_owner' | 'mechanic' | 'dealer'
- townId: number (valid Town.id)

**Output (success)**: `{ id: string; email: string; role: string }`

**Errors**: "Email already in use", field validation errors

**Revalidation**: `/dashboard`

---

### loginUser

**Input**:
- email: string
- password: string

**Output (success)**: `{ id: string; email: string; role: string }`

**Errors**: "Invalid email or password"

**Notes**: Delegates to Auth.js `signIn()` under the hood.

---

## Part Search Actions

### searchParts

**Input**:
- query: string (part name, min 1 character)
- vehicleMake: string (optional)
- vehicleModel: string (optional)
- vehicleYear: number (optional)
- sortBy: 'price' | 'distance' | 'availability' (default: 'relevance')
- userTownId: number (from session, for distance sorting)
- page: number (default: 1)
- limit: number (default: 20, max: 50)

**Output (success)**:
```
{
  results: Array<{
    listingId: string
    partName: string
    dealerName: string
    dealerTown: string
    price: number
    quantity: number
    condition: 'new' | 'used' | 'refurbished'
    isAvailable: boolean
    fulfillmentDays: number
    updatedAt: string (ISO date)
    matchScore: number
    distanceKm: number | null
    images: Array<{ url: string }>
  }>
  total: number
  page: number
  totalPages: number
  suggestion: string | null  // "Did you mean...?" for fuzzy matches
}
```

**Notes**: Uses `pg_trgm` for fuzzy matching. Smart dealer matching applied to `matchScore`. Distance computed via Haversine on town coordinates.

---

## Part Request Actions

### createPartRequest

**Input**:
- partName: string (non-empty)
- vehicleMake: string (optional)
- vehicleModel: string (optional)
- vehicleYear: number (optional)
- urgency: 'low' | 'medium' | 'high' (default: 'medium')
- notes: string (optional)

**Output (success)**: `{ id: string; status: 'open' }`

**Authorization**: Role must be 'vehicle_owner' or 'mechanic'

**Side effects**: Creates notifications for relevant dealers

**Revalidation**: `/dashboard`, `/requests`

---

### submitQuote

**Input**:
- requestId: string (valid PartRequest.id)
- price: number (positive)
- isAvailable: boolean
- fulfillmentDays: number (positive integer)
- notes: string (optional)

**Output (success)**: `{ id: string; status: 'pending' }`

**Authorization**: Role must be 'dealer'

**Errors**: "Request is no longer accepting quotes" (if status is 'accepted'), "You have already quoted on this request"

**Side effects**: Updates PartRequest status to 'quoted' if first quote. Creates notification for requester.

**Revalidation**: `/requests/[id]`

---

### acceptQuote

**Input**:
- quoteId: string (valid Quote.id)

**Output (success)**: `{ requestId: string; dealerId: string; status: 'accepted' }`

**Authorization**: Must be the requester who owns the PartRequest

**Side effects**: Sets Quote status to 'accepted', sets all other quotes on same request to 'declined', sets PartRequest status to 'accepted'. Creates notification for accepted dealer. Updates DealerStats.

**Revalidation**: `/requests/[id]`

---

## Inventory Management Actions

### addPartListing

**Input**:
- name: string (non-empty)
- description: string (optional)
- price: number (positive)
- quantity: number (non-negative)
- condition: 'new' | 'used' | 'refurbished'
- fulfillmentDays: number (positive integer, default: 1)
- vehicles: Array<{ make: string; model: string; yearFrom: number; yearTo: number }> (at least one)
- images: File[] (optional, max 4, JPEG/PNG, max 5MB each)

**Output (success)**: `{ id: string }`

**Authorization**: Role must be 'dealer'

**Revalidation**: `/inventory`

---

### updatePartListing

**Input**:
- listingId: string (valid PartListing.id owned by current user)
- name: string (optional)
- description: string (optional)
- price: number (optional, positive)
- quantity: number (optional, non-negative)
- condition: 'new' | 'used' | 'refurbished' (optional)
- fulfillmentDays: number (optional, positive integer)
- isActive: boolean (optional)
- vehicles: Array<{ make: string; model: string; yearFrom: number; yearTo: number }> (optional, replaces all)

**Output (success)**: `{ id: string; updatedAt: string }`

**Authorization**: Role must be 'dealer', must own the listing

**Revalidation**: `/inventory`, `/inventory/[id]`

---

### deletePartListing

**Input**:
- listingId: string (valid PartListing.id owned by current user)

**Output (success)**: `{ deleted: true }`

**Authorization**: Role must be 'dealer', must own the listing

**Revalidation**: `/inventory`

---

## Notification Actions

### getNotifications

**Input**:
- unreadOnly: boolean (default: false)
- page: number (default: 1)
- limit: number (default: 20)

**Output (success)**:
```
{
  notifications: Array<{
    id: string
    type: string
    title: string
    message: string
    link: string | null
    isRead: boolean
    createdAt: string
  }>
  unreadCount: number
}
```

---

### markNotificationRead

**Input**:
- notificationId: string (valid Notification.id owned by current user)

**Output (success)**: `{ id: string; isRead: true }`

**Revalidation**: `/dashboard`
