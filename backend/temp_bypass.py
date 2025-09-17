#!/usr/bin/env python3
"""
Temporary bypass script for authentication testing
Creates a test user session to bypass OAuth issues during development
"""

import asyncio
import sys
import os
from pathlib import Path

# Add the backend directory to the path
sys.path.append(str(Path(__file__).parent))

from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone, timedelta
import uuid

async def create_test_session():
    """Create a test user and session for development testing"""
    
    # Connect to MongoDB
    mongo_url = "mongodb://localhost:27017"
    client = AsyncIOMotorClient(mongo_url)
    db = client["test_database"]
    
    # Create test user
    test_user = {
        "id": "test-user-12345",
        "email": "test@marchands-de-biens.dev",
        "name": "Test User - Dev",
        "picture": None,
        "role": "OWNER",
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
        "is_active": True,
        "kyc_status": "VALIDE",
        "risk_level": "FAIBLE"
    }
    
    # Insert or update test user
    await db.users.replace_one({"id": test_user["id"]}, test_user, upsert=True)
    
    # Create test session
    session_token = f"dev_session_{int(datetime.now().timestamp())}"
    test_session = {
        "id": str(uuid.uuid4()),
        "user_id": test_user["id"],
        "session_token": session_token,
        "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
        "created_at": datetime.now(timezone.utc)
    }
    
    # Insert test session
    await db.user_sessions.replace_one(
        {"user_id": test_user["id"]}, 
        test_session, 
        upsert=True
    )
    
    print("✅ Test user and session created!")
    print(f"📧 Email: {test_user['email']}")
    print(f"🔑 Session Token: {session_token}")
    print(f"⏰ Expires: {test_session['expires_at']}")
    print(f"\n🍪 To set cookie manually:")
    print(f"   - Name: session_token")
    print(f"   - Value: {session_token}")
    print(f"   - Domain: .preview.emergentagent.com")
    print(f"   - Path: /")
    print(f"   - HttpOnly: true")
    
    client.close()
    return session_token

if __name__ == "__main__":
    asyncio.run(create_test_session())