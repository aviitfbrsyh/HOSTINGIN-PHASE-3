#!/usr/bin/env python3
"""
Backend Testing for Phase 4A - HostingIn API
Tests all core transaction and lifecycle endpoints
"""

import requests
import json
import time
from datetime import datetime, timedelta
import sys

# Configuration
BASE_URL = "https://nav-restoration.preview.emergentagent.com/api"
TEST_USER = {"email": "test@hostingin.com", "password": "password123"}
ADMIN_USER = {"email": "admin@hostingin.com", "password": "admin123"}

class HostingInTester:
    def __init__(self):
        self.session = requests.Session()
        self.user_token = None
        self.admin_token = None
        self.test_results = []
        
    def log_result(self, test_name, success, details="", error=""):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        result = {
            "test": test_name,
            "status": status,
            "details": details,
            "error": error,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        if error:
            print(f"   Error: {error}")
        print()
    
    def login_user(self):
        """Login as test user"""
        try:
            response = self.session.post(f"{BASE_URL}/auth/login", data={
                "username": TEST_USER["email"],
                "password": TEST_USER["password"]
            })
            
            if response.status_code == 200:
                data = response.json()
                self.user_token = data["access_token"]
                self.session.headers.update({"Authorization": f"Bearer {self.user_token}"})
                self.log_result("User Login", True, f"Logged in as {data['user']['email']}")
                return True
            else:
                self.log_result("User Login", False, error=f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_result("User Login", False, error=str(e))
            return False
    
    def test_domain_check(self):
        """Test domain check API with TLD pricing"""
        try:
            test_domain = "mywebsite"
            response = self.session.get(f"{BASE_URL}/domain/check?q={test_domain}")
            
            if response.status_code == 200:
                data = response.json()
                
                # Check structure
                if "query" not in data or "results" not in data:
                    self.log_result("Domain Check API", False, error="Missing query or results in response")
                    return False
                
                # Check if we have all 8 TLDs
                expected_tlds = [".com", ".id", ".co.id", ".net", ".org", ".store", ".tech", ".ai"]
                results = data["results"]
                
                if len(results) != 8:
                    self.log_result("Domain Check API", False, error=f"Expected 8 TLDs, got {len(results)}")
                    return False
                
                # Verify each TLD has required fields
                for result in results:
                    if not all(key in result for key in ["tld", "domain", "price_cents", "available"]):
                        self.log_result("Domain Check API", False, error=f"Missing required fields in result: {result}")
                        return False
                    
                    if result["tld"] not in expected_tlds:
                        self.log_result("Domain Check API", False, error=f"Unexpected TLD: {result['tld']}")
                        return False
                
                # Check pricing consistency
                pricing_details = []
                for result in results:
                    pricing_details.append(f"{result['tld']}: {result['price_cents']} cents, available: {result['available']}")
                
                self.log_result("Domain Check API", True, f"All 8 TLDs returned with pricing: {', '.join(pricing_details)}")
                return True
            else:
                self.log_result("Domain Check API", False, error=f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_result("Domain Check API", False, error=str(e))
            return False
    
    def test_cart_operations(self):
        """Test cart operations: get, add, remove, clear"""
        try:
            # 1. Get empty cart
            response = self.session.get(f"{BASE_URL}/cart")
            if response.status_code != 200:
                self.log_result("Cart - Get Empty", False, error=f"Status: {response.status_code}")
                return False
            
            cart_data = response.json()
            if cart_data["total_cents"] != 0 or len(cart_data["items"]) != 0:
                # Clear cart first
                self.session.delete(f"{BASE_URL}/cart/clear")
                response = self.session.get(f"{BASE_URL}/cart")
                cart_data = response.json()
            
            self.log_result("Cart - Get Empty", True, f"Empty cart: {cart_data['total_cents']} cents, {len(cart_data['items'])} items")
            
            # 2. Add domain to cart
            domain_item = {
                "type": "domain",
                "name": "mywebsite.com",
                "price_cents": 150000,
                "period": 12
            }
            
            response = self.session.post(f"{BASE_URL}/cart/add", json=domain_item)
            if response.status_code != 200:
                self.log_result("Cart - Add Domain", False, error=f"Status: {response.status_code}, Response: {response.text}")
                return False
            
            cart_data = response.json()
            if cart_data["total_cents"] != 150000:
                self.log_result("Cart - Add Domain", False, error=f"Expected 150000 cents, got {cart_data['total_cents']}")
                return False
            
            self.log_result("Cart - Add Domain", True, f"Domain added, total: {cart_data['total_cents']} cents")
            
            # 3. Add hosting to cart
            hosting_item = {
                "type": "hosting",
                "name": "Basic Hosting",
                "slug": "basic",
                "package_id": "507f1f77bcf86cd799439011",  # Dummy package ID
                "price_cents": 500,
                "period": 12
            }
            
            response = self.session.post(f"{BASE_URL}/cart/add", json=hosting_item)
            if response.status_code != 200:
                self.log_result("Cart - Add Hosting", False, error=f"Status: {response.status_code}, Response: {response.text}")
                return False
            
            cart_data = response.json()
            expected_total = 150000 + 500
            if cart_data["total_cents"] != expected_total:
                self.log_result("Cart - Add Hosting", False, error=f"Expected {expected_total} cents, got {cart_data['total_cents']}")
                return False
            
            self.log_result("Cart - Add Hosting", True, f"Hosting added, total: {cart_data['total_cents']} cents")
            
            # 4. Remove first item (index 0)
            response = self.session.delete(f"{BASE_URL}/cart/remove/0")
            if response.status_code != 200:
                self.log_result("Cart - Remove Item", False, error=f"Status: {response.status_code}, Response: {response.text}")
                return False
            
            cart_data = response.json()
            if cart_data["total_cents"] != 500:  # Only hosting should remain
                self.log_result("Cart - Remove Item", False, error=f"Expected 500 cents after removal, got {cart_data['total_cents']}")
                return False
            
            self.log_result("Cart - Remove Item", True, f"Item removed, total: {cart_data['total_cents']} cents")
            
            # 5. Clear cart
            response = self.session.delete(f"{BASE_URL}/cart/clear")
            if response.status_code != 200:
                self.log_result("Cart - Clear", False, error=f"Status: {response.status_code}")
                return False
            
            # Verify cart is empty
            response = self.session.get(f"{BASE_URL}/cart")
            cart_data = response.json()
            if cart_data["total_cents"] != 0:
                self.log_result("Cart - Clear", False, error=f"Cart not empty after clear: {cart_data['total_cents']} cents")
                return False
            
            self.log_result("Cart - Clear", True, "Cart cleared successfully")
            return True
            
        except Exception as e:
            self.log_result("Cart Operations", False, error=str(e))
            return False
    
    def test_checkout_and_payment(self):
        """Test checkout and payment simulation flow"""
        try:
            # First, add items to cart
            domain_item = {
                "type": "domain",
                "name": "testdomain.com",
                "price_cents": 150000,
                "period": 12
            }
            
            hosting_item = {
                "type": "hosting",
                "name": "Basic Hosting",
                "slug": "basic",
                "package_id": "507f1f77bcf86cd799439011",
                "price_cents": 500,
                "period": 12
            }
            
            # Add items to cart
            self.session.post(f"{BASE_URL}/cart/add", json=domain_item)
            self.session.post(f"{BASE_URL}/cart/add", json=hosting_item)
            
            # Test checkout
            payment_method = {"method": "VA-BCA"}
            response = self.session.post(f"{BASE_URL}/checkout", json=payment_method)
            
            if response.status_code != 200:
                self.log_result("Checkout", False, error=f"Status: {response.status_code}, Response: {response.text}")
                return False
            
            checkout_data = response.json()
            required_fields = ["order_id", "payment_id", "amount_cents", "method", "payment_reference", "status", "expires_in_seconds"]
            
            for field in required_fields:
                if field not in checkout_data:
                    self.log_result("Checkout", False, error=f"Missing field in checkout response: {field}")
                    return False
            
            # Verify payment reference format for VA
            payment_ref = checkout_data["payment_reference"]
            if not payment_ref.startswith("BCA"):
                self.log_result("Checkout", False, error=f"Invalid VA payment reference format: {payment_ref}")
                return False
            
            # Verify expires_in_seconds is 900 (15 minutes)
            if checkout_data["expires_in_seconds"] != 900:
                self.log_result("Checkout", False, error=f"Expected 900 seconds expiry, got {checkout_data['expires_in_seconds']}")
                return False
            
            self.log_result("Checkout", True, f"Order created: {checkout_data['order_id']}, Payment: {checkout_data['payment_id']}, Reference: {payment_ref}")
            
            # Store for next tests
            self.order_id = checkout_data["order_id"]
            self.payment_id = checkout_data["payment_id"]
            
            return True
            
        except Exception as e:
            self.log_result("Checkout", False, error=str(e))
            return False
    
    def test_payment_simulation(self):
        """Test payment simulation and status updates"""
        try:
            if not hasattr(self, 'payment_id'):
                self.log_result("Payment Simulation", False, error="No payment_id from checkout test")
                return False
            
            # Start payment simulation
            response = self.session.post(f"{BASE_URL}/payment/{self.payment_id}/simulate")
            
            if response.status_code != 200:
                self.log_result("Payment Simulation Start", False, error=f"Status: {response.status_code}, Response: {response.text}")
                return False
            
            sim_data = response.json()
            if sim_data["status"] != "pending":
                self.log_result("Payment Simulation Start", False, error=f"Expected pending status, got {sim_data['status']}")
                return False
            
            self.log_result("Payment Simulation Start", True, f"Payment simulation started for order {sim_data['order_id']}")
            
            # Check initial status
            response = self.session.get(f"{BASE_URL}/payment/{self.payment_id}/status")
            if response.status_code != 200:
                self.log_result("Payment Status Check", False, error=f"Status: {response.status_code}")
                return False
            
            status_data = response.json()
            required_fields = ["payment_id", "order_id", "payment_status", "order_status", "elapsed_seconds", "expires_in_seconds"]
            
            for field in required_fields:
                if field not in status_data:
                    self.log_result("Payment Status Check", False, error=f"Missing field: {field}")
                    return False
            
            initial_elapsed = status_data["elapsed_seconds"]
            initial_expires = status_data["expires_in_seconds"]
            
            self.log_result("Payment Status Check", True, f"Initial status: payment={status_data['payment_status']}, order={status_data['order_status']}, elapsed={initial_elapsed}s")
            
            # Wait a few seconds and check again
            print("Waiting 5 seconds to test timer progression...")
            time.sleep(5)
            
            response = self.session.get(f"{BASE_URL}/payment/{self.payment_id}/status")
            status_data = response.json()
            
            new_elapsed = status_data["elapsed_seconds"]
            new_expires = status_data["expires_in_seconds"]
            
            if new_elapsed <= initial_elapsed:
                self.log_result("Payment Timer Progression", False, error=f"Timer not progressing: {initial_elapsed} -> {new_elapsed}")
                return False
            
            if new_expires >= initial_expires:
                self.log_result("Payment Timer Progression", False, error=f"Expiry timer not decreasing: {initial_expires} -> {new_expires}")
                return False
            
            self.log_result("Payment Timer Progression", True, f"Timer progressing correctly: elapsed {initial_elapsed}s -> {new_elapsed}s, expires {initial_expires}s -> {new_expires}s")
            
            return True
            
        except Exception as e:
            self.log_result("Payment Simulation", False, error=str(e))
            return False
    
    def test_payment_auto_success(self):
        """Test payment auto-success after 3 minutes (180 seconds)"""
        try:
            if not hasattr(self, 'payment_id'):
                self.log_result("Payment Auto-Success", False, error="No payment_id available")
                return False
            
            print("Testing payment auto-success (this will take 3+ minutes)...")
            
            # Wait for auto-success (180 seconds + buffer)
            wait_time = 185
            print(f"Waiting {wait_time} seconds for auto-success...")
            
            start_time = time.time()
            while time.time() - start_time < wait_time:
                remaining = wait_time - (time.time() - start_time)
                print(f"Waiting... {remaining:.0f} seconds remaining", end='\r')
                time.sleep(10)  # Check every 10 seconds
                
                # Check status
                response = self.session.get(f"{BASE_URL}/payment/{self.payment_id}/status")
                if response.status_code == 200:
                    status_data = response.json()
                    if status_data["payment_status"] == "success":
                        elapsed = time.time() - start_time
                        self.log_result("Payment Auto-Success", True, f"Payment succeeded after {elapsed:.0f} seconds. Order status: {status_data['order_status']}")
                        
                        # Verify order is now active
                        if status_data["order_status"] != "active":
                            self.log_result("Order Status Update", False, error=f"Expected active order, got {status_data['order_status']}")
                            return False
                        
                        self.log_result("Order Status Update", True, f"Order status correctly updated to {status_data['order_status']}")
                        return True
            
            # If we get here, auto-success didn't happen
            response = self.session.get(f"{BASE_URL}/payment/{self.payment_id}/status")
            if response.status_code == 200:
                status_data = response.json()
                self.log_result("Payment Auto-Success", False, error=f"Payment still {status_data['payment_status']} after {wait_time} seconds")
            else:
                self.log_result("Payment Auto-Success", False, error="Could not check payment status")
            
            return False
            
        except Exception as e:
            self.log_result("Payment Auto-Success", False, error=str(e))
            return False
    
    def test_my_services(self):
        """Test My Services endpoints"""
        try:
            # Get user's services
            response = self.session.get(f"{BASE_URL}/services/my")
            
            if response.status_code != 200:
                self.log_result("My Services - Get", False, error=f"Status: {response.status_code}, Response: {response.text}")
                return False
            
            services = response.json()
            
            if not isinstance(services, list):
                self.log_result("My Services - Get", False, error="Expected list of services")
                return False
            
            # Should have at least one service from our test
            if len(services) == 0:
                self.log_result("My Services - Get", False, error="No services found")
                return False
            
            # Check service structure
            service = services[0]
            required_fields = ["id", "domain", "package", "status", "created_at", "expires_at", "price_cents", "period_months"]
            
            for field in required_fields:
                if field not in service:
                    self.log_result("My Services - Get", False, error=f"Missing field in service: {field}")
                    return False
            
            self.log_result("My Services - Get", True, f"Found {len(services)} services. First service: {service['domain']} ({service['status']})")
            
            # Test service renewal
            service_id = service["id"]
            response = self.session.post(f"{BASE_URL}/services/{service_id}/renew")
            
            if response.status_code != 200:
                self.log_result("My Services - Renew", False, error=f"Status: {response.status_code}, Response: {response.text}")
                return False
            
            renew_data = response.json()
            if "expires_at" not in renew_data:
                self.log_result("My Services - Renew", False, error="Missing expires_at in renewal response")
                return False
            
            self.log_result("My Services - Renew", True, f"Service renewed, new expiry: {renew_data['expires_at']}")
            
            return True
            
        except Exception as e:
            self.log_result("My Services", False, error=str(e))
            return False
    
    def test_notifications(self):
        """Test notification endpoints"""
        try:
            # Get notifications
            response = self.session.get(f"{BASE_URL}/notifications")
            
            if response.status_code != 200:
                self.log_result("Notifications - Get", False, error=f"Status: {response.status_code}")
                return False
            
            notifications = response.json()
            
            if not isinstance(notifications, list):
                self.log_result("Notifications - Get", False, error="Expected list of notifications")
                return False
            
            # Should have notifications from our order/payment flow
            if len(notifications) == 0:
                self.log_result("Notifications - Get", False, error="No notifications found")
                return False
            
            # Check notification structure
            notification = notifications[0]
            required_fields = ["id", "title", "message", "type", "is_read", "created_at"]
            
            for field in required_fields:
                if field not in notification:
                    self.log_result("Notifications - Get", False, error=f"Missing field in notification: {field}")
                    return False
            
            self.log_result("Notifications - Get", True, f"Found {len(notifications)} notifications. Latest: {notification['title']}")
            
            # Test mark as read
            notification_id = notification["id"]
            response = self.session.patch(f"{BASE_URL}/notifications/{notification_id}/read")
            
            if response.status_code != 200:
                self.log_result("Notifications - Mark Read", False, error=f"Status: {response.status_code}")
                return False
            
            self.log_result("Notifications - Mark Read", True, f"Notification {notification_id} marked as read")
            
            # Test mark all read
            response = self.session.post(f"{BASE_URL}/notifications/read-all")
            
            if response.status_code != 200:
                self.log_result("Notifications - Mark All Read", False, error=f"Status: {response.status_code}")
                return False
            
            read_data = response.json()
            self.log_result("Notifications - Mark All Read", True, f"Response: {read_data.get('message', 'Success')}")
            
            return True
            
        except Exception as e:
            self.log_result("Notifications", False, error=str(e))
            return False
    
    def test_edge_cases(self):
        """Test edge cases and error conditions"""
        try:
            # Test empty cart checkout
            self.session.delete(f"{BASE_URL}/cart/clear")  # Ensure cart is empty
            
            response = self.session.post(f"{BASE_URL}/checkout", json={"method": "VA-BCA"})
            
            if response.status_code == 200:
                self.log_result("Edge Case - Empty Cart Checkout", False, error="Empty cart checkout should fail")
                return False
            elif response.status_code == 400:
                self.log_result("Edge Case - Empty Cart Checkout", True, "Empty cart checkout correctly rejected")
            else:
                self.log_result("Edge Case - Empty Cart Checkout", False, error=f"Unexpected status: {response.status_code}")
                return False
            
            # Test invalid payment method
            # Add item to cart first
            domain_item = {"type": "domain", "name": "test.com", "price_cents": 150000}
            self.session.post(f"{BASE_URL}/cart/add", json=domain_item)
            
            response = self.session.post(f"{BASE_URL}/checkout", json={"method": "INVALID-METHOD"})
            
            # This should still work as backend accepts any method, but let's check
            if response.status_code == 200:
                self.log_result("Edge Case - Invalid Payment Method", True, "Invalid payment method handled gracefully")
            else:
                self.log_result("Edge Case - Invalid Payment Method", False, error=f"Status: {response.status_code}")
            
            # Test non-existent payment status
            response = self.session.get(f"{BASE_URL}/payment/nonexistent123/status")
            
            if response.status_code == 404:
                self.log_result("Edge Case - Non-existent Payment", True, "Non-existent payment correctly returns 404")
            else:
                self.log_result("Edge Case - Non-existent Payment", False, error=f"Expected 404, got {response.status_code}")
            
            return True
            
        except Exception as e:
            self.log_result("Edge Cases", False, error=str(e))
            return False
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        print("=" * 80)
        print("HOSTINGIN PHASE 4A BACKEND TESTING")
        print("=" * 80)
        print()
        
        # Login first
        if not self.login_user():
            print("❌ Cannot proceed without login")
            return False
        
        # Run tests in order
        tests = [
            ("Domain Check API", self.test_domain_check),
            ("Cart Operations", self.test_cart_operations),
            ("Checkout & Payment", self.test_checkout_and_payment),
            ("Payment Simulation", self.test_payment_simulation),
            ("Payment Auto-Success", self.test_payment_auto_success),
            ("My Services", self.test_my_services),
            ("Notifications", self.test_notifications),
            ("Edge Cases", self.test_edge_cases)
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            print(f"Running {test_name}...")
            if test_func():
                passed += 1
            print("-" * 40)
        
        # Summary
        print("=" * 80)
        print("TEST SUMMARY")
        print("=" * 80)
        print(f"Passed: {passed}/{total}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        print()
        
        # Detailed results
        for result in self.test_results:
            print(f"{result['status']} {result['test']}")
            if result['error']:
                print(f"   Error: {result['error']}")
        
        return passed == total

if __name__ == "__main__":
    tester = HostingInTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)