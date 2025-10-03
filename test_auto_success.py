#!/usr/bin/env python3
"""
Test payment auto-success after 3 minutes
"""

import requests
import time
from datetime import datetime

BASE_URL = "https://domaincart.preview.emergentagent.com/api"
TEST_USER = {"email": "test@hostingin.com", "password": "password123"}

def test_auto_success():
    session = requests.Session()
    
    # Login
    response = session.post(f"{BASE_URL}/auth/login", data={
        "username": TEST_USER["email"],
        "password": TEST_USER["password"]
    })
    
    if response.status_code != 200:
        print(f"❌ Login failed")
        return False
    
    token = response.json()["access_token"]
    session.headers.update({"Authorization": f"Bearer {token}"})
    print("✅ Login successful")
    
    # Clear cart and add item
    session.delete(f"{BASE_URL}/cart/clear")
    
    domain_item = {
        "type": "domain",
        "name": "autosuccess.com",
        "price_cents": 150000,
        "period": 12
    }
    
    session.post(f"{BASE_URL}/cart/add", json=domain_item)
    print("✅ Added item to cart")
    
    # Checkout
    payment_method = {"method": "VA-BCA"}
    response = session.post(f"{BASE_URL}/checkout", json=payment_method)
    
    if response.status_code != 200:
        print(f"❌ Checkout failed")
        return False
    
    checkout_data = response.json()
    payment_id = checkout_data["payment_id"]
    print(f"✅ Checkout successful, payment_id: {payment_id}")
    
    # Start simulation
    response = session.post(f"{BASE_URL}/payment/{payment_id}/simulate")
    if response.status_code != 200:
        print(f"❌ Simulation start failed")
        return False
    print("✅ Payment simulation started")
    
    # Wait for auto-success (180 seconds + buffer)
    print("⏳ Waiting for auto-success (3+ minutes)...")
    start_time = time.time()
    
    while time.time() - start_time < 200:  # 200 seconds max wait
        elapsed = time.time() - start_time
        print(f"⏳ Waiting... {elapsed:.0f}s elapsed", end='\r')
        
        # Check status every 10 seconds
        if int(elapsed) % 10 == 0:
            response = session.get(f"{BASE_URL}/payment/{payment_id}/status")
            if response.status_code == 200:
                status_data = response.json()
                
                if status_data["payment_status"] == "success":
                    print(f"\n✅ Payment auto-succeeded after {elapsed:.0f} seconds!")
                    print(f"   Payment Status: {status_data['payment_status']}")
                    print(f"   Order Status: {status_data['order_status']}")
                    print(f"   Elapsed: {status_data['elapsed_seconds']}s")
                    
                    # Verify order is active
                    if status_data['order_status'] == 'active':
                        print("✅ Order status correctly updated to active")
                        return True
                    else:
                        print(f"❌ Order status should be active, got: {status_data['order_status']}")
                        return False
        
        time.sleep(1)
    
    print(f"\n❌ Auto-success did not occur within 200 seconds")
    return False

if __name__ == "__main__":
    test_auto_success()