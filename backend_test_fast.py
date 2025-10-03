#!/usr/bin/env python3
"""
Fast Backend Testing for Phase 4A - HostingIn API
Tests all core endpoints without long waits
"""

import requests
import json
import time
from datetime import datetime, timedelta
import sys

# Configuration
BASE_URL = "https://domaincart.preview.emergentagent.com/api"
TEST_USER = {"email": "test@hostingin.com", "password": "password123"}

class HostingInTester:
    def __init__(self):
        self.session = requests.Session()
        self.user_token = None
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
                
                # Check pricing details
                pricing_summary = []
                for result in results:
                    pricing_summary.append(f"{result['tld']}: {result['price_cents']} cents")
                
                self.log_result("Domain Check API", True, f"All 8 TLDs returned with pricing: {', '.join(pricing_summary)}")
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
            # Clear cart first
            self.session.delete(f"{BASE_URL}/cart/clear")
            
            # 1. Get empty cart
            response = self.session.get(f"{BASE_URL}/cart")
            if response.status_code != 200:
                self.log_result("Cart Operations", False, error=f"Get cart failed: {response.status_code}")
                return False
            
            cart_data = response.json()
            if cart_data["total_cents"] != 0:
                self.log_result("Cart Operations", False, error=f"Cart not empty: {cart_data['total_cents']} cents")
                return False
            
            # 2. Add domain to cart
            domain_item = {
                "type": "domain",
                "name": "testdomain.com",
                "price_cents": 150000,
                "period": 12
            }
            
            response = self.session.post(f"{BASE_URL}/cart/add", json=domain_item)
            if response.status_code != 200:
                self.log_result("Cart Operations", False, error=f"Add domain failed: {response.status_code}")
                return False
            
            cart_data = response.json()
            if cart_data["total_cents"] != 150000:
                self.log_result("Cart Operations", False, error=f"Wrong total after adding domain: {cart_data['total_cents']}")
                return False
            
            # 3. Add hosting to cart
            hosting_item = {
                "type": "hosting",
                "name": "Basic Hosting",
                "slug": "basic",
                "price_cents": 500,
                "period": 12
            }
            
            response = self.session.post(f"{BASE_URL}/cart/add", json=hosting_item)
            if response.status_code != 200:
                self.log_result("Cart Operations", False, error=f"Add hosting failed: {response.status_code}")
                return False
            
            cart_data = response.json()
            expected_total = 150000 + 500
            if cart_data["total_cents"] != expected_total:
                self.log_result("Cart Operations", False, error=f"Wrong total after adding hosting: {cart_data['total_cents']}")
                return False
            
            # 4. Remove first item
            response = self.session.delete(f"{BASE_URL}/cart/remove/0")
            if response.status_code != 200:
                self.log_result("Cart Operations", False, error=f"Remove item failed: {response.status_code}")
                return False
            
            cart_data = response.json()
            if cart_data["total_cents"] != 500:
                self.log_result("Cart Operations", False, error=f"Wrong total after removal: {cart_data['total_cents']}")
                return False
            
            # 5. Clear cart
            response = self.session.delete(f"{BASE_URL}/cart/clear")
            if response.status_code != 200:
                self.log_result("Cart Operations", False, error=f"Clear cart failed: {response.status_code}")
                return False
            
            # Verify empty
            response = self.session.get(f"{BASE_URL}/cart")
            cart_data = response.json()
            if cart_data["total_cents"] != 0:
                self.log_result("Cart Operations", False, error=f"Cart not empty after clear: {cart_data['total_cents']}")
                return False
            
            self.log_result("Cart Operations", True, "All cart operations working correctly")
            return True
            
        except Exception as e:
            self.log_result("Cart Operations", False, error=str(e))
            return False
    
    def test_checkout_and_payment(self):
        """Test checkout and payment simulation flow"""
        try:
            # Add items to cart
            domain_item = {
                "type": "domain",
                "name": "checkouttest.com",
                "price_cents": 150000,
                "period": 12
            }
            
            hosting_item = {
                "type": "hosting",
                "name": "Basic Hosting",
                "slug": "basic",
                "price_cents": 500,
                "period": 12
            }
            
            self.session.post(f"{BASE_URL}/cart/add", json=domain_item)
            self.session.post(f"{BASE_URL}/cart/add", json=hosting_item)
            
            # Test checkout with VA-BCA
            payment_method = {"method": "VA-BCA"}
            response = self.session.post(f"{BASE_URL}/checkout", json=payment_method)
            
            if response.status_code != 200:
                self.log_result("Checkout & Payment", False, error=f"Checkout failed: {response.status_code} - {response.text}")
                return False
            
            checkout_data = response.json()
            required_fields = ["order_id", "payment_id", "amount_cents", "method", "payment_reference", "status", "expires_in_seconds"]
            
            for field in required_fields:
                if field not in checkout_data:
                    self.log_result("Checkout & Payment", False, error=f"Missing field: {field}")
                    return False
            
            # Verify payment reference format
            payment_ref = checkout_data["payment_reference"]
            if not payment_ref.startswith("BCA"):
                self.log_result("Checkout & Payment", False, error=f"Invalid VA reference: {payment_ref}")
                return False
            
            # Verify expires_in_seconds is 900 (15 minutes)
            if checkout_data["expires_in_seconds"] != 900:
                self.log_result("Checkout & Payment", False, error=f"Wrong expiry time: {checkout_data['expires_in_seconds']}")
                return False
            
            # Store for next tests
            self.order_id = checkout_data["order_id"]
            self.payment_id = checkout_data["payment_id"]
            
            # Start payment simulation
            response = self.session.post(f"{BASE_URL}/payment/{self.payment_id}/simulate")
            if response.status_code != 200:
                self.log_result("Checkout & Payment", False, error=f"Simulation failed: {response.status_code}")
                return False
            
            # Check payment status
            response = self.session.get(f"{BASE_URL}/payment/{self.payment_id}/status")
            if response.status_code != 200:
                self.log_result("Checkout & Payment", False, error=f"Status check failed: {response.status_code}")
                return False
            
            status_data = response.json()
            required_status_fields = ["payment_id", "order_id", "payment_status", "order_status", "elapsed_seconds", "expires_in_seconds"]
            
            for field in required_status_fields:
                if field not in status_data:
                    self.log_result("Checkout & Payment", False, error=f"Missing status field: {field}")
                    return False
            
            self.log_result("Checkout & Payment", True, f"Order: {checkout_data['order_id']}, Payment: {payment_ref}, Status: {status_data['payment_status']}")
            return True
            
        except Exception as e:
            self.log_result("Checkout & Payment", False, error=str(e))
            return False
    
    def test_payment_timer_logic(self):
        """Test payment timer progression"""
        try:
            if not hasattr(self, 'payment_id'):
                self.log_result("Payment Timer Logic", False, error="No payment_id available")
                return False
            
            # Get initial status
            response = self.session.get(f"{BASE_URL}/payment/{self.payment_id}/status")
            if response.status_code != 200:
                self.log_result("Payment Timer Logic", False, error=f"Status check failed: {response.status_code}")
                return False
            
            initial_status = response.json()
            initial_elapsed = initial_status["elapsed_seconds"]
            initial_expires = initial_status["expires_in_seconds"]
            
            # Wait 3 seconds
            time.sleep(3)
            
            # Check again
            response = self.session.get(f"{BASE_URL}/payment/{self.payment_id}/status")
            if response.status_code != 200:
                self.log_result("Payment Timer Logic", False, error=f"Second status check failed: {response.status_code}")
                return False
            
            new_status = response.json()
            new_elapsed = new_status["elapsed_seconds"]
            new_expires = new_status["expires_in_seconds"]
            
            # Verify timer progression
            if new_elapsed <= initial_elapsed:
                self.log_result("Payment Timer Logic", False, error=f"Elapsed time not increasing: {initial_elapsed} -> {new_elapsed}")
                return False
            
            if new_expires >= initial_expires:
                self.log_result("Payment Timer Logic", False, error=f"Expiry time not decreasing: {initial_expires} -> {new_expires}")
                return False
            
            # Verify the math
            elapsed_diff = new_elapsed - initial_elapsed
            expires_diff = initial_expires - new_expires
            
            if abs(elapsed_diff - expires_diff) > 2:  # Allow 2 second tolerance
                self.log_result("Payment Timer Logic", False, error=f"Timer math incorrect: elapsed +{elapsed_diff}, expires -{expires_diff}")
                return False
            
            self.log_result("Payment Timer Logic", True, f"Timer progressing correctly: elapsed {initial_elapsed}s -> {new_elapsed}s, expires {initial_expires}s -> {new_expires}s")
            return True
            
        except Exception as e:
            self.log_result("Payment Timer Logic", False, error=str(e))
            return False
    
    def test_my_services(self):
        """Test My Services endpoints"""
        try:
            # Get user's services
            response = self.session.get(f"{BASE_URL}/services/my")
            
            if response.status_code != 200:
                self.log_result("My Services", False, error=f"Get services failed: {response.status_code}")
                return False
            
            services = response.json()
            
            if not isinstance(services, list):
                self.log_result("My Services", False, error="Services response not a list")
                return False
            
            if len(services) == 0:
                self.log_result("My Services", False, error="No services found")
                return False
            
            # Check service structure
            service = services[0]
            required_fields = ["id", "domain", "package", "status", "created_at", "price_cents", "period_months"]
            
            for field in required_fields:
                if field not in service:
                    self.log_result("My Services", False, error=f"Missing service field: {field}")
                    return False
            
            # Test service renewal
            service_id = service["id"]
            response = self.session.post(f"{BASE_URL}/services/{service_id}/renew")
            
            if response.status_code != 200:
                self.log_result("My Services", False, error=f"Renewal failed: {response.status_code}")
                return False
            
            renew_data = response.json()
            if "expires_at" not in renew_data:
                self.log_result("My Services", False, error="Missing expires_at in renewal response")
                return False
            
            self.log_result("My Services", True, f"Found {len(services)} services, renewal working")
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
                self.log_result("Notifications", False, error=f"Get notifications failed: {response.status_code}")
                return False
            
            notifications = response.json()
            
            if not isinstance(notifications, list):
                self.log_result("Notifications", False, error="Notifications response not a list")
                return False
            
            if len(notifications) == 0:
                self.log_result("Notifications", False, error="No notifications found")
                return False
            
            # Check notification structure
            notification = notifications[0]
            required_fields = ["id", "title", "message", "type", "is_read", "created_at"]
            
            for field in required_fields:
                if field not in notification:
                    self.log_result("Notifications", False, error=f"Missing notification field: {field}")
                    return False
            
            # Test mark as read
            notification_id = notification["id"]
            response = self.session.patch(f"{BASE_URL}/notifications/{notification_id}/read")
            
            if response.status_code != 200:
                self.log_result("Notifications", False, error=f"Mark read failed: {response.status_code}")
                return False
            
            # Test mark all read
            response = self.session.post(f"{BASE_URL}/notifications/read-all")
            
            if response.status_code != 200:
                self.log_result("Notifications", False, error=f"Mark all read failed: {response.status_code}")
                return False
            
            self.log_result("Notifications", True, f"Found {len(notifications)} notifications, mark read working")
            return True
            
        except Exception as e:
            self.log_result("Notifications", False, error=str(e))
            return False
    
    def test_edge_cases(self):
        """Test edge cases"""
        try:
            # Test empty cart checkout
            self.session.delete(f"{BASE_URL}/cart/clear")
            
            response = self.session.post(f"{BASE_URL}/checkout", json={"method": "VA-BCA"})
            
            if response.status_code == 200:
                self.log_result("Edge Cases", False, error="Empty cart checkout should fail")
                return False
            elif response.status_code == 400:
                # Good, it should fail
                pass
            else:
                self.log_result("Edge Cases", False, error=f"Unexpected status for empty cart: {response.status_code}")
                return False
            
            # Test non-existent payment status
            response = self.session.get(f"{BASE_URL}/payment/nonexistent123/status")
            
            if response.status_code != 404:
                self.log_result("Edge Cases", False, error=f"Expected 404 for non-existent payment, got {response.status_code}")
                return False
            
            self.log_result("Edge Cases", True, "Edge cases handled correctly")
            return True
            
        except Exception as e:
            self.log_result("Edge Cases", False, error=str(e))
            return False
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        print("=" * 80)
        print("HOSTINGIN PHASE 4A BACKEND TESTING (FAST VERSION)")
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
            ("Payment Timer Logic", self.test_payment_timer_logic),
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
        
        # Show failed tests
        failed_tests = [r for r in self.test_results if "FAIL" in r["status"]]
        if failed_tests:
            print("FAILED TESTS:")
            for result in failed_tests:
                print(f"❌ {result['test']}: {result['error']}")
        else:
            print("🎉 ALL TESTS PASSED!")
        
        return passed == total

if __name__ == "__main__":
    tester = HostingInTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)