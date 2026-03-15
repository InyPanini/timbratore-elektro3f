#!/usr/bin/env python3
"""
Backend API Testing for Employee Attendance App
Tests all backend endpoints according to the review request
"""

import requests
import json
import base64
from datetime import datetime, timedelta
import uuid
import os
from pathlib import Path

# Load environment variables
def load_env():
    env_path = Path("/app/frontend/.env")
    env_vars = {}
    if env_path.exists():
        with open(env_path) as f:
            for line in f:
                if '=' in line and not line.startswith('#'):
                    key, value = line.strip().split('=', 1)
                    env_vars[key] = value.strip('"')
    return env_vars

env_vars = load_env()
BASE_URL = env_vars.get('EXPO_PUBLIC_BACKEND_URL', 'http://localhost:8001')
API_BASE = f"{BASE_URL}/api"

print(f"Testing backend at: {API_BASE}")

class AttendanceAPITester:
    def __init__(self):
        self.admin_token = None
        self.employee_token = None
        self.employee_id = None
        self.test_employee_email = f"test.employee.{uuid.uuid4().hex[:8]}@elektro3f.it"
        self.test_employee_name = "Marco Rossi"
        self.test_password = "TestPassword123!"
        self.results = []
        
    def log_result(self, test_name, success, message, details=None):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        if details:
            print(f"   Details: {details}")
        self.results.append({
            'test': test_name,
            'success': success,
            'message': message,
            'details': details
        })
        
    def test_health_check(self):
        """Test health endpoint"""
        try:
            response = requests.get(f"{API_BASE}/health", timeout=10)
            if response.status_code == 200:
                data = response.json()
                self.log_result("Health Check", True, f"Backend is healthy - {data.get('status')}")
                return True
            else:
                self.log_result("Health Check", False, f"Health check failed with status {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Health Check", False, f"Connection failed: {str(e)}")
            return False
    
    def test_admin_login(self):
        """Test admin login"""
        try:
            payload = {
                "email": "info@elektro3f.it",
                "password": "Elektro3F2026!"
            }
            response = requests.post(f"{API_BASE}/auth/login", json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.admin_token = data['access_token']
                user_info = data['user']
                if user_info['role'] == 'admin':
                    self.log_result("Admin Login", True, f"Admin logged in successfully - {user_info['name']}")
                    return True
                else:
                    self.log_result("Admin Login", False, f"User role is {user_info['role']}, expected admin")
                    return False
            else:
                self.log_result("Admin Login", False, f"Login failed with status {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_result("Admin Login", False, f"Login request failed: {str(e)}")
            return False
    
    def test_employee_registration(self):
        """Test employee registration"""
        try:
            payload = {
                "email": self.test_employee_email,
                "name": self.test_employee_name,
                "password": self.test_password
            }
            response = requests.post(f"{API_BASE}/auth/register", json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.employee_token = data['access_token']
                self.employee_id = data['user']['id']
                user_info = data['user']
                if user_info['role'] == 'employee':
                    self.log_result("Employee Registration", True, f"Employee registered successfully - {user_info['name']}")
                    return True
                else:
                    self.log_result("Employee Registration", False, f"User role is {user_info['role']}, expected employee")
                    return False
            else:
                self.log_result("Employee Registration", False, f"Registration failed with status {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_result("Employee Registration", False, f"Registration request failed: {str(e)}")
            return False
    
    def test_employee_login(self):
        """Test employee login with registered account"""
        try:
            payload = {
                "email": self.test_employee_email,
                "password": self.test_password
            }
            response = requests.post(f"{API_BASE}/auth/login", json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.employee_token = data['access_token']
                user_info = data['user']
                self.log_result("Employee Login", True, f"Employee logged in successfully - {user_info['name']}")
                return True
            else:
                self.log_result("Employee Login", False, f"Login failed with status {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_result("Employee Login", False, f"Login request failed: {str(e)}")
            return False
    
    def test_forgot_password(self):
        """Test forgot password (MOCKED)"""
        try:
            payload = {"email": self.test_employee_email}
            response = requests.post(f"{API_BASE}/auth/forgot-password", json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if 'reset_code' in data:
                    self.log_result("Forgot Password (MOCKED)", True, f"Reset code generated: {data['reset_code']}")
                    return True, data['reset_code']
                else:
                    self.log_result("Forgot Password (MOCKED)", True, "Reset request processed (no code returned)")
                    return True, None
            else:
                self.log_result("Forgot Password (MOCKED)", False, f"Request failed with status {response.status_code}: {response.text}")
                return False, None
        except Exception as e:
            self.log_result("Forgot Password (MOCKED)", False, f"Request failed: {str(e)}")
            return False, None
    
    def test_reset_password(self, reset_code):
        """Test password reset with code"""
        if not reset_code:
            self.log_result("Password Reset", False, "No reset code available")
            return False
            
        try:
            new_password = "NewPassword123!"
            payload = {
                "email": self.test_employee_email,
                "reset_code": reset_code,
                "new_password": new_password
            }
            response = requests.post(f"{API_BASE}/auth/reset-password", json=payload, timeout=10)
            
            if response.status_code == 200:
                self.log_result("Password Reset", True, "Password reset successfully")
                # Update our test password
                self.test_password = new_password
                return True
            else:
                self.log_result("Password Reset", False, f"Reset failed with status {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_result("Password Reset", False, f"Reset request failed: {str(e)}")
            return False
    
    def test_shift_start(self):
        """Test shift start action"""
        if not self.employee_token:
            self.log_result("Shift Start", False, "No employee token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.employee_token}"}
            payload = {
                "action_type": "start",
                "latitude": 46.4983,
                "longitude": 11.3547,
                "address": "Bolzano, Italy",
                "notes": "Starting work at office"
            }
            response = requests.post(f"{API_BASE}/shifts/action", json=payload, headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.log_result("Shift Start", True, f"Shift started at {data['timestamp']}")
                return True
            else:
                self.log_result("Shift Start", False, f"Request failed with status {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_result("Shift Start", False, f"Request failed: {str(e)}")
            return False
    
    def test_current_status(self):
        """Test current shift status"""
        if not self.employee_token:
            self.log_result("Current Status", False, "No employee token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.employee_token}"}
            response = requests.get(f"{API_BASE}/shifts/current-status", headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                status = "in shift" if data.get('in_shift') else "not in shift"
                self.log_result("Current Status", True, f"Status retrieved: {status}")
                return True
            else:
                self.log_result("Current Status", False, f"Request failed with status {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_result("Current Status", False, f"Request failed: {str(e)}")
            return False
    
    def test_today_shifts(self):
        """Test today's shifts"""
        if not self.employee_token:
            self.log_result("Today Shifts", False, "No employee token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.employee_token}"}
            response = requests.get(f"{API_BASE}/shifts/today", headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.log_result("Today Shifts", True, f"Retrieved {len(data)} shift actions for today")
                return True
            else:
                self.log_result("Today Shifts", False, f"Request failed with status {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_result("Today Shifts", False, f"Request failed: {str(e)}")
            return False
    
    def test_shift_history(self):
        """Test shift history"""
        if not self.employee_token:
            self.log_result("Shift History", False, "No employee token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.employee_token}"}
            response = requests.get(f"{API_BASE}/shifts/history", headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.log_result("Shift History", True, f"Retrieved shift history with {len(data)} days")
                return True
            else:
                self.log_result("Shift History", False, f"Request failed with status {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_result("Shift History", False, f"Request failed: {str(e)}")
            return False
    
    def test_daily_summary(self):
        """Test daily summary"""
        if not self.employee_token:
            self.log_result("Daily Summary", False, "No employee token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.employee_token}"}
            today = datetime.now().strftime("%Y-%m-%d")
            response = requests.get(f"{API_BASE}/shifts/daily-summary/{today}", headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.log_result("Daily Summary", True, f"Retrieved daily summary for {today}")
                return True
            else:
                self.log_result("Daily Summary", False, f"Request failed with status {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_result("Daily Summary", False, f"Request failed: {str(e)}")
            return False
    
    def test_monthly_report(self):
        """Test monthly report generation"""
        if not self.employee_token:
            self.log_result("Monthly Report", False, "No employee token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.employee_token}"}
            now = datetime.now()
            response = requests.get(f"{API_BASE}/reports/monthly/{now.year}/{now.month}", headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.log_result("Monthly Report", True, f"Generated report for {now.month}/{now.year} - {data.get('total_hours', 0)} hours")
                return True, data.get('id')
            else:
                self.log_result("Monthly Report", False, f"Request failed with status {response.status_code}: {response.text}")
                return False, None
        except Exception as e:
            self.log_result("Monthly Report", False, f"Request failed: {str(e)}")
            return False, None
    
    def test_sign_monthly_report(self, report_id=None):
        """Test employee signature on monthly report"""
        if not self.employee_token:
            self.log_result("Employee Signature", False, "No employee token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.employee_token}"}
            now = datetime.now()
            
            # Create a dummy base64 signature
            signature_data = f"Employee Signature - {self.test_employee_name} - {datetime.now().isoformat()}"
            signature_b64 = base64.b64encode(signature_data.encode()).decode()
            
            payload = {"signature": signature_b64}
            response = requests.post(f"{API_BASE}/reports/monthly/{now.year}/{now.month}/sign", 
                                   json=payload, headers=headers, timeout=10)
            
            if response.status_code == 200:
                self.log_result("Employee Signature", True, "Monthly report signed successfully")
                return True
            else:
                self.log_result("Employee Signature", False, f"Request failed with status {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_result("Employee Signature", False, f"Request failed: {str(e)}")
            return False
    
    def test_user_profile(self):
        """Test get user profile"""
        if not self.employee_token:
            self.log_result("User Profile", False, "No employee token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.employee_token}"}
            response = requests.get(f"{API_BASE}/users/me", headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.log_result("User Profile", True, f"Profile retrieved for {data['name']}")
                return True
            else:
                self.log_result("User Profile", False, f"Request failed with status {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_result("User Profile", False, f"Request failed: {str(e)}")
            return False
    
    def test_update_profile(self):
        """Test update user profile"""
        if not self.employee_token:
            self.log_result("Update Profile", False, "No employee token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.employee_token}"}
            
            # Create a dummy base64 profile picture
            picture_data = f"Profile Picture Data - {datetime.now().isoformat()}"
            picture_b64 = base64.b64encode(picture_data.encode()).decode()
            
            payload = {
                "name": "Marco Rossi Updated",
                "language": "en",
                "profile_picture": picture_b64
            }
            response = requests.put(f"{API_BASE}/users/me", json=payload, headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.log_result("Update Profile", True, f"Profile updated: {data['name']}, language: {data['language']}")
                return True
            else:
                self.log_result("Update Profile", False, f"Request failed with status {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_result("Update Profile", False, f"Request failed: {str(e)}")
            return False
    
    def test_change_password(self):
        """Test change password"""
        if not self.employee_token:
            self.log_result("Change Password", False, "No employee token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.employee_token}"}
            new_password = "UpdatedPassword123!"
            payload = {
                "current_password": self.test_password,
                "new_password": new_password
            }
            response = requests.put(f"{API_BASE}/users/me/password", json=payload, headers=headers, timeout=10)
            
            if response.status_code == 200:
                self.log_result("Change Password", True, "Password changed successfully")
                self.test_password = new_password
                return True
            else:
                self.log_result("Change Password", False, f"Request failed with status {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_result("Change Password", False, f"Request failed: {str(e)}")
            return False
    
    def test_admin_employees(self):
        """Test admin get all employees"""
        if not self.admin_token:
            self.log_result("Admin Employees", False, "No admin token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.get(f"{API_BASE}/admin/employees", headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.log_result("Admin Employees", True, f"Retrieved {len(data)} employees")
                return True
            else:
                self.log_result("Admin Employees", False, f"Request failed with status {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_result("Admin Employees", False, f"Request failed: {str(e)}")
            return False
    
    def test_admin_employee_shifts(self):
        """Test admin get employee shifts"""
        if not self.admin_token or not self.employee_id:
            self.log_result("Admin Employee Shifts", False, "No admin token or employee ID available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.get(f"{API_BASE}/admin/employees/{self.employee_id}/shifts", headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.log_result("Admin Employee Shifts", True, f"Retrieved {len(data)} shift actions for employee")
                return True
            else:
                self.log_result("Admin Employee Shifts", False, f"Request failed with status {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_result("Admin Employee Shifts", False, f"Request failed: {str(e)}")
            return False
    
    def test_admin_employee_locations(self):
        """Test admin get employee locations"""
        if not self.admin_token or not self.employee_id:
            self.log_result("Admin Employee Locations", False, "No admin token or employee ID available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            today = datetime.now().strftime("%Y-%m-%d")
            response = requests.get(f"{API_BASE}/admin/employees/{self.employee_id}/locations?date={today}", 
                                  headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.log_result("Admin Employee Locations", True, f"Retrieved {len(data)} location records")
                return True
            else:
                self.log_result("Admin Employee Locations", False, f"Request failed with status {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_result("Admin Employee Locations", False, f"Request failed: {str(e)}")
            return False
    
    def test_admin_unsigned_reports(self):
        """Test admin get unsigned reports"""
        if not self.admin_token:
            self.log_result("Admin Unsigned Reports", False, "No admin token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.get(f"{API_BASE}/admin/reports/unsigned", headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.log_result("Admin Unsigned Reports", True, f"Retrieved {len(data)} unsigned reports")
                return True, data
            else:
                self.log_result("Admin Unsigned Reports", False, f"Request failed with status {response.status_code}: {response.text}")
                return False, []
        except Exception as e:
            self.log_result("Admin Unsigned Reports", False, f"Request failed: {str(e)}")
            return False, []
    
    def test_admin_countersign(self, report_id):
        """Test admin counter-sign report"""
        if not self.admin_token or not report_id:
            self.log_result("Admin Counter-sign", False, "No admin token or report ID available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            # Create a dummy admin signature
            signature_data = f"Admin Counter-signature - {datetime.now().isoformat()}"
            signature_b64 = base64.b64encode(signature_data.encode()).decode()
            
            payload = {"signature": signature_b64}
            response = requests.post(f"{API_BASE}/admin/reports/{report_id}/countersign", 
                                   json=payload, headers=headers, timeout=10)
            
            if response.status_code == 200:
                self.log_result("Admin Counter-sign", True, "Report counter-signed successfully")
                return True
            else:
                self.log_result("Admin Counter-sign", False, f"Request failed with status {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_result("Admin Counter-sign", False, f"Request failed: {str(e)}")
            return False
    
    def test_admin_today_activity(self):
        """Test admin get today's activity"""
        if not self.admin_token:
            self.log_result("Admin Today Activity", False, "No admin token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.get(f"{API_BASE}/admin/today-activity", headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.log_result("Admin Today Activity", True, f"Retrieved activity for {len(data)} employees")
                return True
            else:
                self.log_result("Admin Today Activity", False, f"Request failed with status {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_result("Admin Today Activity", False, f"Request failed: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        print("=" * 60)
        print("EMPLOYEE ATTENDANCE APP - BACKEND API TESTING")
        print("=" * 60)
        
        # Basic connectivity
        if not self.test_health_check():
            print("❌ Backend is not accessible. Stopping tests.")
            return
        
        # Authentication tests
        print("\n--- AUTHENTICATION TESTS ---")
        self.test_admin_login()
        self.test_employee_registration()
        self.test_employee_login()
        
        # Password reset flow
        print("\n--- PASSWORD RESET TESTS ---")
        success, reset_code = self.test_forgot_password()
        if success and reset_code:
            self.test_reset_password(reset_code)
            # Re-login with new password
            self.test_employee_login()
        
        # Shift management tests
        print("\n--- SHIFT MANAGEMENT TESTS ---")
        self.test_shift_start()
        self.test_current_status()
        self.test_today_shifts()
        self.test_shift_history()
        self.test_daily_summary()
        
        # Monthly reports tests
        print("\n--- MONTHLY REPORTS TESTS ---")
        success, report_id = self.test_monthly_report()
        if success:
            self.test_sign_monthly_report(report_id)
        
        # User profile tests
        print("\n--- USER PROFILE TESTS ---")
        self.test_user_profile()
        self.test_update_profile()
        self.test_change_password()
        
        # Admin tests
        print("\n--- ADMIN TESTS ---")
        self.test_admin_employees()
        self.test_admin_employee_shifts()
        self.test_admin_employee_locations()
        success, unsigned_reports = self.test_admin_unsigned_reports()
        if success and unsigned_reports:
            # Try to counter-sign the first unsigned report
            first_report = unsigned_reports[0]
            self.test_admin_countersign(first_report.get('id'))
        self.test_admin_today_activity()
        
        # Summary
        print("\n" + "=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for r in self.results if r['success'])
        total = len(self.results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        if total - passed > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['message']}")
        
        return passed, total

if __name__ == "__main__":
    tester = AttendanceAPITester()
    passed, total = tester.run_all_tests()
    
    # Exit with error code if any tests failed
    exit(0 if passed == total else 1)