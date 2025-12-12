#!/usr/bin/env python3
"""
Production Manager Fix Script
This script updates the manager account's cooperative_id to the first valid cooperative
"""

import pymongo
import os
from dotenv import load_dotenv

# Load production environment variables
load_dotenv('/app/backend/.env')

# Valid cooperative ID from production
FIRST_COOP_ID = "a494cc2e-600c-4722-acc6-e44231a88d44"
FIRST_COOP_NAME = "Green Valley Coffee Cooperative"

def fix_manager():
    try:
        # Connect to MongoDB
        mongo_url = os.environ.get('MONGO_URL')
        db_name = os.environ.get('DB_NAME')
        
        print(f"Connecting to MongoDB...")
        print(f"Database: {db_name}")
        
        client = pymongo.MongoClient(mongo_url)
        db = client[db_name]
        
        # Update manager's cooperative_id
        print(f"\nUpdating manager account...")
        print(f"New Cooperative: {FIRST_COOP_NAME}")
        print(f"New Cooperative ID: {FIRST_COOP_ID}")
        
        result = db.users.update_one(
            {"email": "manager@dims.com"},
            {"$set": {"cooperative_id": FIRST_COOP_ID}}
        )
        
        if result.modified_count > 0:
            print(f"\n✅ SUCCESS: Manager account updated!")
            print(f"   Modified {result.modified_count} document(s)")
        else:
            print(f"\n⚠️  WARNING: No documents modified")
            print(f"   Matched {result.matched_count} document(s)")
            
            # Check if manager exists
            manager = db.users.find_one({"email": "manager@dims.com"})
            if manager:
                print(f"\n   Manager found with cooperative_id: {manager.get('cooperative_id')}")
                if manager.get('cooperative_id') == FIRST_COOP_ID:
                    print(f"   ✅ Already set to correct cooperative!")
            else:
                print(f"\n   ❌ Manager account not found in database!")
        
        # Verify the update
        print(f"\nVerifying update...")
        manager = db.users.find_one({"email": "manager@dims.com"}, {"_id": 0, "email": 1, "name": 1, "cooperative_id": 1})
        if manager:
            print(f"   Email: {manager['email']}")
            print(f"   Name: {manager['name']}")
            print(f"   Cooperative ID: {manager['cooperative_id']}")
        
        client.close()
        print(f"\n✅ Done!")
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("=" * 60)
    print("Production Manager Fix Script")
    print("=" * 60)
    fix_manager()
