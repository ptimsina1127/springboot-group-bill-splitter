# Bill Splitter API Reference

Base URL: `https://khoipaisa.duckdns.org/spring-api`

All requests and responses use `Content-Type: application/json`.

IDs are UUID strings (e.g. `"a1b2c3d4-e5f6-7890-abcd-ef1234567890"`). Dates are ISO-8601.

---

## Health

### `GET /healthz`

Check if the API is running.

**Response `200`**

```json
{
  "status": "ok"
}
```

---

## Sessions

### `POST /sessions`

Create a new bill-splitting session. This creates the session and all initial participants in one call.

**Request body**

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | yes | Session name (e.g. "Trip to Pokhara") |
| `participantNames` | array of strings | yes | At least one name required |

**Example request**

```json
{
  "name": "Trip to Pokhara",
  "participantNames": ["Alice", "Bob", "Charlie"]
}
```

**Response `201`**

```json
{
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "name": "Trip to Pokhara",
  "createdAt": "2026-05-22T10:30:00",
  "participantCount": 3
}
```

**Error `400`** — validation failed

```json
{
  "error": "Session name is required"
}
```

---

### `GET /sessions/{sessionId}`

Get full session details including all participants and expense items.

**Path parameter:** `sessionId` — the session's UUID

**Response `200`**

```json
{
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "name": "Trip to Pokhara",
  "createdAt": "2026-05-22T10:30:00",
  "participants": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "sessionId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "name": "Alice",
      "displayOrder": 0
    },
    {
      "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "sessionId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "name": "Bob",
      "displayOrder": 1
    }
  ],
  "items": [
    {
      "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
      "sessionId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "paidByParticipantId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "description": "Dinner",
      "amount": 45.50,
      "sharedWithParticipantIds": ["a1b2c3d4-e5f6-7890-abcd-ef1234567890", "b2c3d4e5-f6a7-8901-bcde-f12345678901"]
    }
  ]
}
```

**Response `404`** — session not found

---

### `PUT /sessions/{sessionId}`

Rename a session.

**Request body**

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | yes | New session name |

**Example request**

```json
{
  "name": "Pokhara Trip 2026"
}
```

**Response `200`** — same shape as create session response

```json
{
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "name": "Pokhara Trip 2026",
  "createdAt": "2026-05-22T10:30:00",
  "participantCount": 3
}
```

---

## Participants

### `POST /sessions/{sessionId}/participants`

Add a participant to a session.

**Request body**

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | yes | Participant name |

```json
{
  "name": "Diana"
}
```

**Response `201`**

```json
{
  "id": "d4e5f6a7-b8c9-0123-defa-234567890123",
  "sessionId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "name": "Diana",
  "displayOrder": 3
}
```

---

### `PUT /sessions/{sessionId}/participants/{participantId}`

Rename a participant.

**Request body**

```json
{
  "name": "Dee"
}
```

**Response `200`** — same shape as add participant

---

### `DELETE /sessions/{sessionId}/participants/{participantId}`

Remove a participant from a session.

**Response `204`** — no content (success)

**Response `404`** — session or participant not found

---

## Expense Items

### `POST /sessions/{sessionId}/items`

Add an expense item to a session.

**Request body**

| Field | Type | Required | Description |
|---|---|---|---|
| `paidByParticipantId` | string | yes | UUID of the person who paid |
| `description` | string | yes | What the expense was for |
| `amount` | number | yes | Positive decimal (e.g. 45.50) |
| `sharedWithParticipantIds` | array of strings | no | Who shares this cost. If null or empty, **everyone** in the session splits equally |

```json
{
  "paidByParticipantId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "description": "Dinner at MoMo House",
  "amount": 60.00,
  "sharedWithParticipantIds": ["a1b2c3d4-e5f6-7890-abcd-ef1234567890", "b2c3d4e5-f6a7-8901-bcde-f12345678901"]
}
```

**Response `201`**

```json
{
  "id": "e5f6a7b8-c9d0-1234-efab-345678901234",
  "sessionId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "paidByParticipantId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "description": "Dinner at MoMo House",
  "amount": 60.00,
  "sharedWithParticipantIds": ["a1b2c3d4-e5f6-7890-abcd-ef1234567890", "b2c3d4e5-f6a7-8901-bcde-f12345678901"]
}
```

---

### `PUT /sessions/{sessionId}/items/{itemId}`

Update an expense item.

**Request body** — same shape as add item

**Response `200`** — same shape as add item response

---

### `DELETE /sessions/{sessionId}/items/{itemId}`

Delete an expense item.

**Response `204`** — no content (success)

---

## Settlement & Summary

### `POST /sessions/{sessionId}/calculate`

Calculate who owes whom. This runs the settlement algorithm and returns a list of debts.

**Response `200`**

```json
{
  "sessionId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "sessionName": "Trip to Pokhara",
  "debts": [
    {
      "fromParticipantId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "fromParticipantName": "Bob",
      "toParticipantId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "toParticipantName": "Alice",
      "amount": 10.00
    },
    {
      "fromParticipantId": "c3d4e5f6-a7b8-9012-cdef-123456789012",
      "fromParticipantName": "Charlie",
      "toParticipantId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "toParticipantName": "Alice",
      "amount": 12.75
    }
  ],
  "totalExpenses": 45.50
}
```

Each `debt` means: *fromParticipant owes toParticipant the amount.*

The algorithm minimizes the number of transactions (ideally N-1 for N people with non-zero balances).

---

### `GET /sessions/{sessionId}/summary`

Get a per-person breakdown showing how much each person paid, how much they owe, and their net balance.

**Response `200`**

```json
{
  "sessionId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "sessionName": "Trip to Pokhara",
  "totalExpenses": 60.00,
  "participantCount": 3,
  "itemCount": 1,
  "balances": [
    {
      "participantId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "participantName": "Alice",
      "totalPaid": 60.00,
      "totalOwed": 20.00,
      "netBalance": 40.00
    },
    {
      "participantId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "participantName": "Bob",
      "totalPaid": 0.00,
      "totalOwed": 20.00,
      "netBalance": -20.00
    },
    {
      "participantId": "c3d4e5f6-a7b8-9012-cdef-123456789012",
      "participantName": "Charlie",
      "totalPaid": 0.00,
      "totalOwed": 20.00,
      "netBalance": -20.00
    }
  ]
}
```

- `totalPaid`: how much this person paid for expenses
- `totalOwed`: how much this person's share of all expenses is
- `netBalance`: `totalPaid - totalOwed`. Positive means they're owed money. Negative means they owe money.

---

## Error Reference

| Status | Meaning | Body |
|---|---|---|
| `200` | Success | Response object |
| `201` | Created | The created resource |
| `204` | No Content (delete success) | Empty |
| `400` | Validation error | `{ "error": "field: message" }` |
| `404` | Resource not found | Empty body |
| `500` | Internal server error | `{ "error": "..." }` (rare) |

Validation error messages:

| Message | When |
|---|---|
| `Session name is required` | `name` is blank or missing |
| `At least one participant is required` | `participantNames` is empty |
| `Participant name is required` | Participant `name` is blank |
| `paidByParticipantId is required` | `paidByParticipantId` is blank |
| `Description is required` | `description` is blank |
| `must be a positive number` | `amount` is negative |

---

## Typical Usage Flow

A mobile app would typically follow this sequence:

```
1. POST /sessions
   Create a session → get back sessionId and participant IDs

2. POST /sessions/{id}/participants  (optional)
   Add more people later

3. POST /sessions/{id}/items
   Log each expense as it happens

4. GET /sessions/{id}
   View current state (people + expenses)

5. POST /sessions/{id}/calculate
   When ready, compute who owes whom

6. GET /sessions/{id}/summary
   Get per-person breakdown
```

### State diagram

```
                ┌──────────────┐
                │  Create      │
                │  Session     │
                └──────┬───────┘
                       │
                       ▼
                ┌──────────────┐
         ┌──────│  Add People  │◄──────┐
         │      └──────┬───────┘       │
         │             │               │
         │             ▼               │
         │      ┌──────────────┐       │
         │      │  Add Items   │───────┘
         │      └──────┬───────┘  (add more items)
         │             │
         │             ▼
         │      ┌──────────────┐
         │      │  Calculate   │
         │      └──────┬───────┘
         │             │
         │             ▼
         │      ┌──────────────┐
         └──────│  View Result │
                └──────────────┘
```

---

## Curl Examples

```bash
# Health check
curl https://khoipaisa.duckdns.org/spring-api/healthz

# Create a session
curl -X POST https://khoipaisa.duckdns.org/spring-api/sessions \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","participantNames":["Alice","Bob"]}'

# Add an expense item
curl -X POST https://khoipaisa.duckdns.org/spring-api/sessions/{sessionId}/items \
  -H "Content-Type: application/json" \
  -d '{"paidByParticipantId":"...","description":"Lunch","amount":30.00}'

# Calculate settlements
curl -X POST https://khoipaisa.duckdns.org/spring-api/sessions/{sessionId}/calculate
```

---

## Quick Reference

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/healthz` | Check API is alive |
| `POST` | `/sessions` | Create session + initial participants |
| `GET` | `/sessions/{id}` | Get session with all participants and items |
| `PUT` | `/sessions/{id}` | Rename session |
| `POST` | `/sessions/{id}/participants` | Add participant |
| `PUT` | `/sessions/{id}/participants/{pid}` | Rename participant |
| `DELETE` | `/sessions/{id}/participants/{pid}` | Remove participant |
| `POST` | `/sessions/{id}/items` | Add expense item |
| `PUT` | `/sessions/{id}/items/{iid}` | Update expense item |
| `DELETE` | `/sessions/{id}/items/{iid}` | Delete expense item |
| `POST` | `/sessions/{id}/calculate` | Calculate who owes whom |
| `GET` | `/sessions/{id}/summary` | Get per-person balance summary |

> Last verified: 2026-05-24 12:15 UTC
