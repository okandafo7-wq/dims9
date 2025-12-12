# Production Manager Account Fix

## Problem
Manager account in production has cooperative_id: `26a9413a-d526-4442-bff3-2e3739c21b6f` which doesn't exist.

## Solution Options

### Option 1: Call the Fix Endpoint (Recommended)

If your backend is deployed with the latest code, you can call:

```bash
# 1. Login as officer
curl -X POST https://agri-twins.emergent.host/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"officer@dims.com","password":"officer123"}'

# Copy the access_token from response

# 2. Call fix endpoint
curl -X POST https://agri-twins.emergent.host/api/fix-manager-cooperative \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

### Option 2: Direct Database Update

If you have access to the production MongoDB:

```javascript
// Connect to MongoDB
use dims_database

// Get first cooperative ID
const firstCoop = db.cooperatives.findOne()
print("First Cooperative ID:", firstCoop.id)
print("Cooperative Name:", firstCoop.name)

// Update manager's cooperative_id
db.users.updateOne(
  { email: "manager@dims.com" },
  { $set: { cooperative_id: firstCoop.id } }
)

print("Manager account updated!")
```

### Option 3: Recreate Manager User

Delete and recreate the manager with a valid cooperative_id:

```bash
# 1. Get list of cooperatives
curl https://agri-twins.emergent.host/api/cooperatives \
  -H "Authorization: Bearer YOUR_OFFICER_TOKEN"

# 2. Note the first cooperative's ID

# 3. In MongoDB, delete old manager
db.users.deleteOne({ email: "manager@dims.com" })

# 4. Register new manager via API with correct cooperative_id
curl -X POST https://agri-twins.emergent.host/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "manager@dims.com",
    "password": "manager123",
    "name": "Cooperative Manager",
    "role": "manager",
    "cooperative_id": "PASTE_FIRST_COOP_ID_HERE"
  }'
```

## Quick JavaScript Fix (Browser Console)

If you're logged in as officer in the browser:

```javascript
// Run this in browser console while logged in as officer
async function fixManager() {
  const token = localStorage.getItem('token');
  
  // Get cooperatives
  const coopsRes = await fetch('/api/cooperatives', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const coops = await coopsRes.json();
  const firstCoopId = coops[0].id;
  
  console.log('First cooperative:', coops[0].name, firstCoopId);
  
  // Call fix endpoint
  const fixRes = await fetch('/api/fix-manager-cooperative', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const result = await fixRes.json();
  
  console.log('Fix result:', result);
  return result;
}

// Run the fix
fixManager();
```
