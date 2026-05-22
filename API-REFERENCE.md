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
