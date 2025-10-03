#!/usr/bin/env python3
"""
Backend Testing for HostingIn Dashboard Features
Tests specific endpoints as requested in review:
- Login & Authentication
- Notifications API (with category field)
- Activity Timeline API
- Referral & Rewards API
"""

import requests
import json
import time
from datetime import datetime
import sys

# Configuration
BASE_URL = "https://nav-restoration.preview.emergentagent.com/api"
TEST_USER = {"email": "test@hostingin.com", "password": "password123"}

class DashboardTester:
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
    
    def test_login_and_get_token(self):
        """Test POST /api/auth/login and get access token"""
        try:
            response = self.session.post(f"{BASE_URL}/auth/login", data={
                "username": TEST_USER["email"],
                "password": TEST_USER["password"]
            })
            
            if response.status_code == 200:
                data = response.json()
                
                # Check required fields
                required_fields = ["access_token", "token_type", "user"]
                for field in required_fields:
                    if field not in data:
                        self.log_result("Login API", False, error=f"Missing field: {field}")
                        return False
                
                # Check user object
                user = data["user"]
                user_fields = ["id", "name", "email", "role"]
                for field in user_fields:
                    if field not in user:
                        self.log_result("Login API", False, error=f"Missing user field: {field}")
                        return False
                
                # Store token for subsequent requests
                self.user_token = data["access_token"]
                self.session.headers.update({"Authorization": f"Bearer {self.user_token}"})
                
                self.log_result("Login API", True, f"Successfully logged in as {user['email']}, token type: {data['token_type']}")
                return True
            else:
                self.log_result("Login API", False, error=f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Login API", False, error=str(e))
            return False
    
    def test_notifications_list(self):
        """Test GET /api/notifications - should return list with category field"""
        try:
            response = self.session.get(f"{BASE_URL}/notifications")
            
            if response.status_code == 200:
                notifications = response.json()
                
                if not isinstance(notifications, list):
                    self.log_result("Notifications List API", False, error="Response is not a list")
                    return False
                
                if len(notifications) == 0:
                    self.log_result("Notifications List API", False, error="No notifications found - expected sample notifications to be seeded")
                    return False
                
                # Check first notification structure
                notification = notifications[0]
                required_fields = ["id", "title", "message", "type", "category", "is_read", "created_at"]
                
                for field in required_fields:
                    if field not in notification:
                        self.log_result("Notifications List API", False, error=f"Missing field: {field}")
                        return False
                
                # Verify category field has valid values
                valid_categories = ["promo", "system", "payment", "expiry"]
                if notification["category"] not in valid_categories:
                    self.log_result("Notifications List API", False, error=f"Invalid category: {notification['category']}, expected one of {valid_categories}")
                    return False
                
                # Check for different categories in the list
                categories_found = set()
                for notif in notifications:
                    if "category" in notif:
                        categories_found.add(notif["category"])
                
                self.log_result("Notifications List API", True, f"Found {len(notifications)} notifications with categories: {list(categories_found)}")
                
                # Store first notification ID for next test
                self.notification_id = notification["id"]
                return True
                
            else:
                self.log_result("Notifications List API", False, error=f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Notifications List API", False, error=str(e))
            return False
    
    def test_mark_notification_read(self):
        """Test PATCH /api/notifications/{notification_id}/read"""
        try:
            if not hasattr(self, 'notification_id'):
                self.log_result("Mark Notification Read API", False, error="No notification_id from previous test")
                return False
            
            response = self.session.patch(f"{BASE_URL}/notifications/{self.notification_id}/read")
            
            if response.status_code == 200:
                data = response.json()
                
                if "message" not in data:
                    self.log_result("Mark Notification Read API", False, error="Missing message in response")
                    return False
                
                # Verify notification is actually marked as read
                verify_response = self.session.get(f"{BASE_URL}/notifications")
                if verify_response.status_code == 200:
                    notifications = verify_response.json()
                    target_notif = next((n for n in notifications if n["id"] == self.notification_id), None)
                    
                    if target_notif and target_notif["is_read"]:
                        self.log_result("Mark Notification Read API", True, f"Notification {self.notification_id} successfully marked as read")
                        return True
                    else:
                        self.log_result("Mark Notification Read API", False, error="Notification not actually marked as read")
                        return False
                else:
                    self.log_result("Mark Notification Read API", True, f"API responded successfully: {data['message']}")
                    return True
                
            else:
                self.log_result("Mark Notification Read API", False, error=f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Mark Notification Read API", False, error=str(e))
            return False
    
    def test_mark_all_notifications_read(self):
        """Test POST /api/notifications/read-all"""
        try:
            response = self.session.post(f"{BASE_URL}/notifications/read-all")
            
            if response.status_code == 200:
                data = response.json()
                
                if "message" not in data:
                    self.log_result("Mark All Notifications Read API", False, error="Missing message in response")
                    return False
                
                # The message should indicate how many notifications were marked as read
                message = data["message"]
                if "marked as read" not in message:
                    self.log_result("Mark All Notifications Read API", False, error=f"Unexpected message format: {message}")
                    return False
                
                self.log_result("Mark All Notifications Read API", True, f"Response: {message}")
                return True
                
            else:
                self.log_result("Mark All Notifications Read API", False, error=f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Mark All Notifications Read API", False, error=str(e))
            return False
    
    def test_unread_count(self):
        """Test GET /api/notifications/unread-count"""
        try:
            response = self.session.get(f"{BASE_URL}/notifications/unread-count")
            
            if response.status_code == 200:
                data = response.json()
                
                if "count" not in data:
                    self.log_result("Unread Count API", False, error="Missing count field in response")
                    return False
                
                count = data["count"]
                if not isinstance(count, int) or count < 0:
                    self.log_result("Unread Count API", False, error=f"Invalid count value: {count}")
                    return False
                
                self.log_result("Unread Count API", True, f"Unread count: {count}")
                return True
                
            else:
                self.log_result("Unread Count API", False, error=f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Unread Count API", False, error=str(e))
            return False
    
    def test_activity_timeline(self):
        """Test GET /api/history/timeline - should return activity timeline with order events, payment events, support tickets"""
        try:
            response = self.session.get(f"{BASE_URL}/history/timeline")
            
            if response.status_code == 200:
                timeline = response.json()
                
                if not isinstance(timeline, list):
                    self.log_result("Activity Timeline API", False, error="Response is not a list")
                    return False
                
                if len(timeline) == 0:
                    self.log_result("Activity Timeline API", False, error="No timeline events found")
                    return False
                
                # Check timeline event structure
                event = timeline[0]
                required_fields = ["type", "icon", "title", "description", "meta", "timestamp"]
                
                for field in required_fields:
                    if field not in event:
                        self.log_result("Activity Timeline API", False, error=f"Missing field in timeline event: {field}")
                        return False
                
                # Check for different event types
                event_types = set()
                for evt in timeline:
                    if "type" in evt:
                        event_types.add(evt["type"])
                
                # Expected event types based on the backend code
                expected_types = ["order_created", "payment_success", "service_active", "support_ticket"]
                found_expected = any(et in event_types for et in expected_types)
                
                if not found_expected:
                    self.log_result("Activity Timeline API", False, error=f"No expected event types found. Got: {list(event_types)}")
                    return False
                
                self.log_result("Activity Timeline API", True, f"Found {len(timeline)} timeline events with types: {list(event_types)}")
                return True
                
            else:
                self.log_result("Activity Timeline API", False, error=f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Activity Timeline API", False, error=str(e))
            return False
    
    def test_referral_info(self):
        """Test GET /api/referral/me - should return referral info with code, link, stats, etc."""
        try:
            response = self.session.get(f"{BASE_URL}/referral/me")
            
            if response.status_code == 200:
                referral = response.json()
                
                # Check required fields
                required_fields = ["code", "link", "stats", "rewards_available", "leaderboard_position", "next_milestone"]
                
                for field in required_fields:
                    if field not in referral:
                        self.log_result("Referral Info API", False, error=f"Missing field: {field}")
                        return False
                
                # Check stats structure
                stats = referral["stats"]
                stats_fields = ["clicks", "signups", "conversions", "rewards_earned"]
                
                for field in stats_fields:
                    if field not in stats:
                        self.log_result("Referral Info API", False, error=f"Missing stats field: {field}")
                        return False
                
                # Verify referral code format (should be REF + user ID prefix)
                code = referral["code"]
                if not code.startswith("REF"):
                    self.log_result("Referral Info API", False, error=f"Invalid referral code format: {code}")
                    return False
                
                # Verify link contains the code
                link = referral["link"]
                if code not in link:
                    self.log_result("Referral Info API", False, error=f"Referral code {code} not found in link {link}")
                    return False
                
                self.log_result("Referral Info API", True, f"Referral code: {code}, Stats: {stats}, Rewards available: {referral['rewards_available']}")
                
                # Store stats for next test
                self.initial_clicks = stats["clicks"]
                return True
                
            else:
                self.log_result("Referral Info API", False, error=f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Referral Info API", False, error=str(e))
            return False
    
    def test_referral_simulate_click(self):
        """Test POST /api/referral/simulate-click - should update stats"""
        try:
            response = self.session.post(f"{BASE_URL}/referral/simulate-click")
            
            if response.status_code == 200:
                data = response.json()
                
                if "message" not in data:
                    self.log_result("Referral Simulate Click API", False, error="Missing message in response")
                    return False
                
                # Verify stats were updated by checking referral info again
                verify_response = self.session.get(f"{BASE_URL}/referral/me")
                if verify_response.status_code == 200:
                    updated_referral = verify_response.json()
                    new_clicks = updated_referral["stats"]["clicks"]
                    
                    if hasattr(self, 'initial_clicks'):
                        if new_clicks > self.initial_clicks:
                            self.log_result("Referral Simulate Click API", True, f"Click count updated from {self.initial_clicks} to {new_clicks}")
                            return True
                        else:
                            self.log_result("Referral Simulate Click API", False, error=f"Click count not updated: {self.initial_clicks} -> {new_clicks}")
                            return False
                    else:
                        self.log_result("Referral Simulate Click API", True, f"Simulate click successful, current clicks: {new_clicks}")
                        return True
                else:
                    self.log_result("Referral Simulate Click API", True, f"API responded successfully: {data['message']}")
                    return True
                
            else:
                self.log_result("Referral Simulate Click API", False, error=f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Referral Simulate Click API", False, error=str(e))
            return False
    
    def run_dashboard_tests(self):
        """Run all dashboard-specific tests"""
        print("=" * 80)
        print("HOSTINGIN DASHBOARD FEATURES TESTING")
        print("=" * 80)
        print()
        
        # Test sequence as requested
        tests = [
            ("Login & Get Token", self.test_login_and_get_token),
            ("Notifications List (with category)", self.test_notifications_list),
            ("Mark Notification Read", self.test_mark_notification_read),
            ("Mark All Notifications Read", self.test_mark_all_notifications_read),
            ("Unread Count", self.test_unread_count),
            ("Activity Timeline", self.test_activity_timeline),
            ("Referral Info", self.test_referral_info),
            ("Referral Simulate Click", self.test_referral_simulate_click)
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
        
        return passed, total, self.test_results

if __name__ == "__main__":
    tester = DashboardTester()
    passed, total, results = tester.run_dashboard_tests()
    sys.exit(0 if passed == total else 1)