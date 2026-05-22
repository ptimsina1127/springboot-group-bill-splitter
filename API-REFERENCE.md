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
