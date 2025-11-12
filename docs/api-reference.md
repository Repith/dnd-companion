# API Reference

This document provides comprehensive documentation for all API endpoints in the D&D Companion backend.

## Base URL

```
http://localhost:3002 (development)
```

## Authentication

All API endpoints except authentication require a JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Response Format

All responses follow this structure:

```json
{
  "data": <response_data>,
  "message": "Optional message",
  "statusCode": 200
}
```

Error responses:

```json
{
  "message": "Error description",
  "error": "ErrorType",
  "statusCode": 400
}
```

## Endpoints

### Authentication

#### POST /auth/login

Authenticate a user and return JWT token.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "access_token": "jwt_token_here",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "username",
    "roles": ["PLAYER"],
    "subscriptionTier": "FREE"
  }
}
```

#### POST /auth/demo

Create and login with a demo user for testing.

**Response:** Same as login endpoint.

#### POST /users/register

Register a new user account.

**Request Body:**

```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "password123",
  "displayName": "Display Name"
}
```

**Response:** Same as login endpoint.

#### GET /users/profile

Get current user profile information.

**Response:**

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "username": "username",
  "roles": ["PLAYER"],
  "subscriptionTier": "FREE",
  "profile": {
    "displayName": "Display Name",
    "locale": "en"
  }
}
```

#### PUT /users/profile

Update user profile information.

**Request Body:**

```json
{
  "displayName": "New Display Name",
  "locale": "pl"
}
```

### Characters

#### GET /characters

Get all characters owned by the authenticated user.

**Response:**

```json
[
  {
    "id": "uuid",
    "name": "Character Name",
    "race": "HUMAN",
    "class": "FIGHTER",
    "level": 3,
    "experiencePoints": 2700,
    "hitPoints": {
      "max": 24,
      "current": 24,
      "temporary": 0
    },
    "currency": {
      "cp": 0,
      "sp": 10,
      "ep": 0,
      "gp": 50,
      "pp": 0
    }
  }
]
```

#### GET /characters/:id

Get a specific character by ID.

**Parameters:**

- `id` (string): Character UUID

**Response:** Single character object (same structure as above, with full details)

#### POST /characters

Create a new character.

**Request Body:**

```json
{
  "name": "Character Name",
  "race": "HUMAN",
  "subrace": null,
  "class": "FIGHTER",
  "level": 1,
  "background": "Soldier",
  "alignment": "LAWFUL_GOOD",
  "abilityScores": {
    "strength": 16,
    "dexterity": 14,
    "constitution": 15,
    "intelligence": 10,
    "wisdom": 12,
    "charisma": 13
  },
  "personalityTraits": "I always have a plan",
  "ideals": "Justice",
  "bonds": "My comrades",
  "flaws": "I am suspicious of strangers"
}
```

#### PATCH /characters/:id

Update an existing character.

**Parameters:**

- `id` (string): Character UUID

**Request Body:** Partial character object with fields to update.

#### DELETE /characters/:id

Delete a character.

**Parameters:**

- `id` (string): Character UUID

### Character Spells

#### POST /characters/:id/spells/learn

Add a spell to character's known spells.

**Parameters:**

- `id` (string): Character UUID

**Request Body:**

```json
{
  "spellId": "spell-uuid"
}
```

#### DELETE /characters/:id/spells/learn/:spellId

Remove a spell from character's known spells.

**Parameters:**

- `id` (string): Character UUID
- `spellId` (string): Spell UUID

#### POST /characters/:id/spells/prepare

Prepare a spell for casting.

**Parameters:**

- `id` (string): Character UUID

**Request Body:**

```json
{
  "spellId": "spell-uuid"
}
```

#### DELETE /characters/:id/spells/prepare/:spellId

Unprepare a spell.

**Parameters:**

- `id` (string): Character UUID
- `spellId` (string): Spell UUID

#### PUT /characters/:id/spell-slots

Update remaining spell slots.

**Parameters:**

- `id` (string): Character UUID

**Request Body:**

```json
{
  "remainingSlots": {
    "1": 3,
    "2": 2,
    "3": 1
  }
}
```

### Campaigns

#### GET /campaigns

Get all campaigns for the authenticated user.

**Response:**

```json
[
  {
    "id": "uuid",
    "name": "The Lost Mines of Phandelver",
    "description": "A classic D&D adventure",
    "dmId": "dm-uuid",
    "playerIds": ["player1-uuid", "player2-uuid"],
    "questIds": ["quest1-uuid"],
    "currentSessionId": "session-uuid"
  }
]
```

#### GET /campaigns/:id

Get a specific campaign by ID.

#### POST /campaigns

Create a new campaign.

**Request Body:**

```json
{
  "name": "Campaign Name",
  "description": "Campaign description"
}
```

#### PATCH /campaigns/:id

Update a campaign.

#### DELETE /campaigns/:id

Delete a campaign.

### Quests

#### GET /campaigns/:campaignId/quests

Get all quests for a campaign.

**Parameters:**

- `campaignId` (string): Campaign UUID

**Response:**

```json
[
  {
    "id": "uuid",
    "name": "Retrieve the Lost Artifact",
    "summary": "Find the ancient artifact",
    "description": "Detailed quest description",
    "status": "IN_PROGRESS",
    "experienceReward": 1000,
    "loot": ["item1-uuid", "item2-uuid"],
    "npcIds": ["npc1-uuid"],
    "locationIds": ["location1-uuid"]
  }
]
```

#### POST /campaigns/:campaignId/quests

Create a new quest.

#### PATCH /campaigns/:campaignId/quests/:id

Update a quest.

#### DELETE /campaigns/:campaignId/quests/:id

Delete a quest.

### Sessions

#### GET /campaigns/:campaignId/sessions

Get all sessions for a campaign.

#### POST /campaigns/:campaignId/sessions

Create a new session.

**Request Body:**

```json
{
  "notes": "Session notes",
  "playerCharacterIds": ["char1-uuid", "char2-uuid"]
}
```

### Inventory

#### GET /inventory/:ownerType/:ownerId

Get inventory for a character or session.

**Parameters:**

- `ownerType` (string): "CHARACTER" or "SESSION"
- `ownerId` (string): Owner UUID

**Response:**

```json
{
  "id": "uuid",
  "ownerType": "CHARACTER",
  "ownerId": "character-uuid",
  "items": [
    {
      "id": "uuid",
      "itemId": "item-uuid",
      "quantity": 1,
      "equipped": true,
      "notes": "Custom engraving"
    }
  ],
  "encumbrance": {
    "current": 45.5,
    "capacity": 150
  }
}
```

#### POST /inventory/:ownerType/:ownerId/items

Add an item to inventory.

**Request Body:**

```json
{
  "itemId": "item-uuid",
  "quantity": 1,
  "equipped": false,
  "notes": "Optional notes"
}
```

#### PATCH /inventory/items/:id

Update an inventory item.

#### DELETE /inventory/items/:id

Remove an item from inventory.

### Items

#### GET /items

Get all items (with optional filtering).

**Query Parameters:**

- `type` (string): Filter by item type
- `rarity` (string): Filter by rarity
- `search` (string): Search in name/description

#### GET /items/:id

Get a specific item.

#### POST /items

Create a new item (admin only).

#### PATCH /items/:id

Update an item.

#### DELETE /items/:id

Delete an item.

### Spells

#### GET /spells

Get all spells (with optional filtering).

**Query Parameters:**

- `level` (number): Filter by spell level
- `school` (string): Filter by spell school
- `class` (string): Filter by character class
- `search` (string): Search in name/description

#### GET /spells/:id

Get a specific spell.

### Generator

#### POST /generator/generate

Generate content using AI or templates.

**Request Body:**

```json
{
  "type": "NPC",
  "tags": ["medieval", "warrior"],
  "prompt": "A grizzled veteran soldier"
}
```

**Response:**

```json
{
  "id": "uuid",
  "entityType": "NPC",
  "data": {
    "name": "Captain Thorne",
    "race": "HUMAN",
    "class": "FIGHTER",
    "level": 5
  }
}
```

### Events

#### GET /events/campaign/:campaignId

Get event feed for a campaign.

**Query Parameters:**

- `limit` (number): Number of events to return (default: 50)
- `before` (string): Get events before this timestamp

**Response:**

```json
[
  {
    "id": "uuid",
    "type": "DAMAGE_APPLIED",
    "timestamp": "2024-01-01T12:00:00Z",
    "actorId": "character-uuid",
    "targetId": "monster-uuid",
    "payload": {
      "damage": 15,
      "damageType": "slashing"
    },
    "sessionId": "session-uuid"
  }
]
```

## Error Codes

- `400` - Bad Request: Invalid input data
- `401` - Unauthorized: Missing or invalid JWT token
- `403` - Forbidden: Insufficient permissions
- `404` - Not Found: Resource doesn't exist
- `409` - Conflict: Resource already exists
- `422` - Validation Error: Input validation failed
- `429` - Too Many Requests: Rate limit exceeded
- `500` - Internal Server Error: Server-side error

## Rate Limiting

API endpoints are rate limited to prevent abuse:

- Authenticated requests: 1000 per hour
- Unauthenticated requests: 100 per hour
- Demo login: 10 per hour per IP

## WebSocket Events

Real-time updates are available via WebSocket connection:

```javascript
const ws = new WebSocket("ws://localhost:3002/events");

// Listen for campaign events
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log("Event:", data.type, data.payload);
};
```

Supported event types:

- `CHARACTER_UPDATED`
- `CAMPAIGN_UPDATED`
- `QUEST_COMPLETED`
- `SESSION_STARTED`
- `INVENTORY_CHANGED`
