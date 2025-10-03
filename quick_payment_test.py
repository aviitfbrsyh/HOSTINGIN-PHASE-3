#!/usr/bin/env python3
"""
Quick test for payment status endpoint fix
"""

import requests
import json

BASE_URL = "https://domaincart.preview.emergentagent.com/api"
TEST_USER = {"email": "test@hostingin.com", "password": "password123"}

def test_payment_status():
    session = requests.Session()
    
    # Login
    response = session.post(f"{BASE_URL}/auth/login", data={
        "username": TEST_USER["email"],
        "password": TEST_USER["password"]
    })
    
    if response.status_code != 200:
        print(f"❌ Login failed: {response.status_code}")
        return False
    
    token = response.json()["access_token"]
    session.headers.update({"Authorization": f"Bearer {token}"})
    print("✅ Login successful")
    
    # Clear cart and add items
    session.delete(f"{BASE_URL}/cart/clear")
    
    domain_item = {
        "type": "domain",
        "name": "quicktest.com",
        "price_cents": 150000,
        "period": 12
    }
    
    response = session.post(f"{BASE_URL}/cart/add", json=domain_item)
    if response.status_code != 200:
        print(f"❌ Add to cart failed: {response.status_code}")
        return False
    print("✅ Added item to cart")
    
    # Checkout
    payment_method = {"method": "VA-BCA"}
    response = session.post(f"{BASE_URL}/checkout", json=payment_method)
    
    if response.status_code != 200:
        print(f"❌ Checkout failed: {response.status_code} - {response.text}")
        return False
    
    checkout_data = response.json()
    payment_id = checkout_data["payment_id"]
    print(f"✅ Checkout successful, payment_id: {payment_id}")
    
    # Start simulation
    response = session.post(f"{BASE_URL}/payment/{payment_id}/simulate")
    if response.status_code != 200:
        print(f"❌ Simulation start failed: {response.status_code}")
        return False
    print("✅ Payment simulation started")
    
    # Check status
    response = session.get(f"{BASE_URL}/payment/{payment_id}/status")
    if response.status_code != 200:
        print(f"❌ Status check failed: {response.status_code} - {response.text}")
        return False
    
    status_data = response.json()
    print(f"✅ Payment status check successful:")
    print(f"   Payment Status: {status_data['payment_status']}")
    print(f"   Order Status: {status_data['order_status']}")
    print(f"   Elapsed: {status_data['elapsed_seconds']}s")
    print(f"   Expires in: {status_data['expires_in_seconds']}s")
    
    return True

if __name__ == "__main__":
    test_payment_status()