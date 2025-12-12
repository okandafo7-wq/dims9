# URGENT: Production Database Fix for Manager Account

## Problem
Manager account in production is trying to access cooperative ID: `26a9413a-d526-4442-bff3-2e3739c21b6f`
This cooperative doesn't exist in production database.

## Valid Cooperative IDs in Production:
1. `a494cc2e-600c-4722-acc6-e44231a88d44` - Green Valley Coffee Cooperative (Ethiopia)
2. `2487f703-bf4b-4ec8-91a9-2f4b666e0e04` - Mediterranean Olive Oil Cooperative (Tunisia)
3. `06c11512-23df-45bd-8f4a-2caa61529f66` - Himalayan Tea Women's Collective (Nepal)
4. `bb4544f4-c4c0-4efd-8301-638bf6362a12` - Andean Quinoa Farmers Alliance (Peru)

---

## Solution: Direct MongoDB Update

### Method 1: MongoDB Shell Commands

Connect to your production MongoDB and run:

```javascript
// Use the DIMS database
use dims_database

// Update manager's cooperative_id to Green Valley Coffee
db.users.updateOne(
  { email: "manager@dims.com" },
  { $set: { cooperative_id: "a494cc2e-600c-4722-acc6-e44231a88d44" } }
)

// Verify the update
db.users.findOne(
  { email: "manager@dims.com" },
  { email: 1, name: 1, cooperative_id: 1, _id: 0 }
)
```

Expected output:
```javascript
{
  "email": "manager@dims.com",
  "name": "Cooperative Manager",
  "cooperative_id": "a494cc2e-600c-4722-acc6-e44231a88d44"
}
```

---

### Method 2: MongoDB Compass

1. Connect to production MongoDB using MongoDB Compass
2. Select database: `dims_database`
3. Select collection: `users`
4. Find document with: `{ "email": "manager@dims.com" }`
5. Edit the document
6. Change `cooperative_id` to: `a494cc2e-600c-4722-acc6-e44231a88d44`
7. Save

---

### Method 3: Python Script (If you have access to production server)

```python
#!/usr/bin/env python3
import pymongo

# Update these with your production MongoDB credentials
MONGO_URL = "your-production-mongo-url"  # e.g., mongodb://localhost:27017 or mongodb+srv://...
DB_NAME = "dims_database"

# Valid cooperative ID from production
NEW_COOP_ID = "a494cc2e-600c-4722-acc6-e44231a88d44"

client = pymongo.MongoClient(MONGO_URL)
db = client[DB_NAME]

result = db.users.update_one(
    {"email": "manager@dims.com"},
    {"$set": {"cooperative_id": NEW_COOP_ID}}
)

print(f"Modified: {result.modified_count} document(s)")
print(f"Matched: {result.matched_count} document(s)")

# Verify
manager = db.users.find_one({"email": "manager@dims.com"}, {"_id": 0, "email": 1, "cooperative_id": 1})
print(f"\nManager cooperative_id: {manager['cooperative_id']}")

client.close()
```

---

### Method 4: Via Azure Portal (if using Azure Cosmos DB)

1. Go to Azure Portal
2. Navigate to your Cosmos DB / MongoDB instance
3. Go to Data Explorer
4. Select database: `dims_database`
5. Select collection: `users`
6. Click "New Query"
7. Run:
```javascript
db.users.updateOne(
  { "email": "manager@dims.com" },
  { "$set": { "cooperative_id": "a494cc2e-600c-4722-acc6-e44231a88d44" } }
)
```

---

## Verification

After running the update, verify it worked:

```bash
# Test manager login and cooperative access
curl -s -X POST https://agri-twins.emergent.host/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"manager@dims.com","password":"manager123"}' \
  | jq -r .access_token | xargs -I {} \
  curl -s https://agri-twins.emergent.host/api/auth/me \
  -H "Authorization: Bearer {}" \
  | jq '{email, cooperative_id}'
```

Should return:
```json
{
  "email": "manager@dims.com",
  "cooperative_id": "a494cc2e-600c-4722-acc6-e44231a88d44"
}
```

---

## Quick Fix: One-Line MongoDB Command

```javascript
db.users.updateOne({email:"manager@dims.com"},{$set:{cooperative_id:"a494cc2e-600c-4722-acc6-e44231a88d44"}})
```

---

## After Fix

Manager account will be assigned to:
- **Cooperative**: Green Valley Coffee Cooperative
- **Country**: Ethiopia  
- **Product**: Coffee
- **ID**: a494cc2e-600c-4722-acc6-e44231a88d44

Manager should then be able to:
- ✅ Login successfully
- ✅ View cooperative dashboard
- ✅ Access production logs
- ✅ Create data entries
- ✅ View KPIs and analytics

---

## Need Help?

If you don't have direct MongoDB access, you'll need to:
1. Contact your database administrator
2. Or deploy the updated code which includes the Admin Tools page
3. Or provide me with production MongoDB connection details (securely)
