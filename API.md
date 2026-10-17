# 📡 AgriConnect API Documentation

Complete API reference for AgriConnect backend.

**Base URL:** `http://localhost:4000/api`

**Authentication:** Bearer token in `Authorization` header

## 📑 Table of Contents

- [Authentication](#authentication)
- [Listings](#listings)
- [Inquiries](#inquiries)
- [Market Prices](#market-prices)
- [Reference Data](#reference-data)
- [Dashboard](#dashboard)
- [Notifications](#notifications)
- [Admin](#admin)
- [Uploads](#uploads)

---

## 🔐 Authentication

### Register

Create a new user account.

**Endpoint:** `POST /auth/register`

**Body:**
```json
{
  "phone": "0966666666",
  "password": "password123",
  "full_name": "John Doe",
  "role": "farmer",
  "region_id": 1,
  "preferred_lang": "en"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "phone": "0966666666",
    "full_name": "John Doe",
    "role": "farmer",
    "is_verified": false
  },
  "token": "eyJhbGciOiJIUzI1..."
}
```

### Login

Authenticate existing user.

**Endpoint:** `POST /auth/login`

**Body:**
```json
{
  "phone": "0966666666",
  "password": "password123"
}
```

**Response:** Same as register

### Verify Token

Check if JWT token is valid.

**Endpoint:** `POST /auth/verify-token`

**Body:**
```json
{
  "token": "eyJhbGciOiJIUzI1..."
}
```

---

## 📦 Listings

### Get All Listings

Get active marketplace listings with optional filters.

**Endpoint:** `GET /listings`

**Query Parameters:**
- `crop_id` (number, optional)
- `region_id` (number, optional)
- `max_price` (number, optional)
- `search` (string, optional)

**Example:**
```
GET /listings?crop_id=1&region_id=2&max_price=3000&search=teff
```

**Response:**
```json
[
  {
    "id": "uuid",
    "title": "Premium White Teff",
    "crop": "Teff",
    "region": "Oromia",
    "quantity": 150,
    "unit": "quintal",
    "price_per_unit": 2800,
    "image_urls": ["/uploads/image1.jpg"],
    "farmer": "Abebe Kebede",
    "is_verified": true
  }
]
```

### Get My Listings

Get farmer's own listings (requires authentication).

**Endpoint:** `GET /listings/mine`

**Headers:** `Authorization: Bearer {token}`

**Response:** Array of listings with inquiry counts

### Get Single Listing

Get detailed listing information with market price comparison.

**Endpoint:** `GET /listings/:id`

**Headers:** `Authorization: Bearer {token}`

**Response:**
```json
{
  "id": "uuid",
  "title": "Premium White Teff",
  "description": "High-quality organic teff...",
  "crop": "Teff",
  "quantity": 150,
  "unit": "quintal",
  "price_per_unit": 2800,
  "market_avg": 2850,
  "farmer": "Abebe Kebede",
  "farmer_phone": "0922222222",
  "is_verified": true
}
```

### Create Listing

Post new produce listing (farmers only).

**Endpoint:** `POST /listings`

**Headers:** `Authorization: Bearer {token}`

**Body:**
```json
{
  "crop_id": 1,
  "title": "Fresh Teff 2026",
  "description": "Organic white teff...",
  "quantity": 100,
  "unit": "quintal",
  "price_per_unit": 2800,
  "region_id": 2,
  "location_detail": "Near Adama",
  "harvest_date": "2026-09-15",
  "image_urls": ["/uploads/img1.jpg"]
}
```

### Update Listing

Update existing listing (farmers only).

**Endpoint:** `PUT /listings/:id`

**Headers:** `Authorization: Bearer {token}`

**Body:**
```json
{
  "title": "Updated Title",
  "quantity": 120,
  "price_per_unit": 2750
}
```

### Change Listing Status

Mark listing as sold/removed/active.

**Endpoint:** `PATCH /listings/:id/status`

**Headers:** `Authorization: Bearer {token}`

**Body:**
```json
{
  "status": "sold"
}
```

**Valid statuses:** `active`, `sold`, `removed`

---

## 💬 Inquiries

### Send Inquiry

Send purchase inquiry to farmer (buyers only).

**Endpoint:** `POST /inquiries`

**Headers:** `Authorization: Bearer {token}`

**Body:**
```json
{
  "listing_id": "uuid",
  "quantity_wanted": 30,
  "offered_price": 2750,
  "message": "Can you deliver to Addis?"
}
```

### Get Received Inquiries

Get inquiries on farmer's listings (farmers only).

**Endpoint:** `GET /inquiries/received`

**Headers:** `Authorization: Bearer {token}`

### Get Sent Inquiries

Get buyer's sent inquiries (buyers only).

**Endpoint:** `GET /inquiries/sent`

**Headers:** `Authorization: Bearer {token}`

### Update Inquiry Status

Accept/reject/complete inquiry (farmers only).

**Endpoint:** `PATCH /inquiries/:id`

**Headers:** `Authorization: Bearer {token}`

**Body:**
```json
{
  "status": "accepted"
}
```

**Valid statuses:** `accepted`, `rejected`, `completed`

---

## 💰 Market Prices

### Get Price Series

Get historical price data for charts.

**Endpoint:** `GET /prices/series`

**Query Parameters:**
- `crop_id` (required)
- `days` (default: 7)

**Example:**
```
GET /prices/series?crop_id=1&days=14
```

**Response:**
```json
[
  {
    "date": "2026-10-15",
    "market": "Merkato",
    "price": 2850
  }
]
```

### Get Price Table

Get latest prices with trends.

**Endpoint:** `GET /prices/table`

**Query Parameters:**
- `crop_id` (required)

**Response:**
```json
[
  {
    "market": "Merkato",
    "price": 2850,
    "date": "2026-10-17",
    "change": 2.5
  }
]
```

### Record Price

Add new market price (admin/agronomist only).

**Endpoint:** `POST /prices`

**Headers:** `Authorization: Bearer {token}`

**Body:**
```json
{
  "crop_id": 1,
  "market_id": 1,
  "price": 2850,
  "unit": "quintal",
  "recorded_on": "2026-10-17"
}
```

---

## 📚 Reference Data

### Get Crops

**Endpoint:** `GET /crops`

**Response:**
```json
[
  {
    "id": 1,
    "name_en": "Teff",
    "name_am": "ጤፍ",
    "name_om": "Xaafii",
    "category": "cereals"
  }
]
```

### Get Regions

**Endpoint:** `GET /regions`

### Get Markets

**Endpoint:** `GET /markets`

### Get Units

**Endpoint:** `GET /units`

### Get Platform Stats

**Endpoint:** `GET /stats`

**Response:**
```json
{
  "total_users": 150,
  "farmers": 80,
  "buyers": 65,
  "active_listings": 45,
  "completed_deals": 120
}
```

### Universal Search

**Endpoint:** `GET /search?q=teff`

---

## 📊 Dashboard

### Get Dashboard Data

Role-specific dashboard statistics and data.

**Endpoint:** `GET /dashboard`

**Headers:** `Authorization: Bearer {token}`

**Response:**
```json
{
  "stats": {
    "listings": 5,
    "inquiries": 12,
    "sales": 8,
    "revenue": 45000
  },
  "prices": [
    {
      "id": 1,
      "crop": "Teff",
      "price": 2850,
      "change": 2.5
    }
  ],
  "recent": [...]
}
```

---

## 🔔 Notifications

### Get Notifications

**Endpoint:** `GET /notifications`

**Headers:** `Authorization: Bearer {token}`

### Mark All as Read

**Endpoint:** `PATCH /notifications/read-all`

**Headers:** `Authorization: Bearer {token}`

---

## 👑 Admin

### Get Admin Stats

**Endpoint:** `GET /admin/stats`

**Headers:** `Authorization: Bearer {token}` (admin only)

### Get All Users

**Endpoint:** `GET /admin/users`

### Update User

**Endpoint:** `PATCH /admin/users/:id`

**Body:**
```json
{
  "is_verified": true,
  "is_active": true
}
```

### Remove Listing

**Endpoint:** `PATCH /admin/listings/:id/remove`

---

## 📸 Uploads

### Upload Image

Upload produce image (farmers only).

**Endpoint:** `POST /uploads`

**Headers:** 
- `Authorization: Bearer {token}`
- `Content-Type: multipart/form-data`

**Body:** FormData with `image` field

**Response:**
```json
{
  "url": "/uploads/1697512345-789456.jpg"
}
```

**Constraints:**
- Max size: 2 MB
- Formats: JPG, PNG, WebP

---

## ⚠️ Error Responses

All endpoints return errors in this format:

```json
{
  "error": "Error message description"
}
```

**Common Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate data)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

---

## 🔑 Authentication Header

Include JWT token in all authenticated requests:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

**Built with ❤️ for AgriConnect**
