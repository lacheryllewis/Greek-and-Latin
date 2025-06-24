import requests
import unittest
import uuid
from datetime import datetime
import json

class EnhancedStudentTester:
    def __init__(self, base_url="https://5bfa331b-eeb3-4d9a-b920-01c65ef78380.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.student_email = f"student_{uuid.uuid4().hex[:8]}@test.com"
        self.admin_email = "admin@empoweru.com"
        self.admin_password = "EmpowerU2024!"
        self.student_token = None
        self.admin_token = None
        self.student_id = None
        self.admin_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, token=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    print(f"Response: {response.json()}")
                except:
                    print(f"Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test the health check endpoint"""
        return self.run_test("Health Check", "GET", "health", 200)

    def register_enhanced_student(self):
        """Register a student account with enhanced profile fields"""
        data = {
            "email": self.student_email,
            "password": "TestPass123",
            "first_name": "Test",
            "last_name": "Student",
            "is_teacher": False,
            "grade": "7th Grade",
            "school": "Washington Middle School",
            "block_number": "A3",
            "teacher": "Ms. Johnson"
        }
        success, response = self.run_test("Register Enhanced Student", "POST", "register", 200, data)
        if success and 'access_token' in response:
            self.student_token = response['access_token']
            self.student_id = response['user']['id']
            print(f"Student registered with email: {self.student_email}")
            
            # Verify the enhanced profile fields were saved
            if 'user' in response:
                user = response['user']
                profile_fields = {
                    'grade': '7th Grade',
                    'school': 'Washington Middle School',
                    'block_number': 'A3',
                    'teacher': 'Ms. Johnson'
                }
                
                for field, expected_value in profile_fields.items():
                    if field in user and user[field] == expected_value:
                        print(f"✅ Enhanced profile field '{field}' saved correctly")
                    else:
                        print(f"❌ Enhanced profile field '{field}' not saved correctly. Expected: '{expected_value}', Got: '{user.get(field, 'missing')}'")
                        return False
            
            return True
        return False

    def admin_login(self):
        """Login with admin credentials"""
        data = {
            "email": self.admin_email,
            "password": self.admin_password
        }
        success, response = self.run_test("Admin Login", "POST", "login", 200, data)
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
            self.admin_id = response['user']['id']
            return True
        return False

    def verify_admin_dashboard_student_profiles(self):
        """Verify student profiles in admin dashboard"""
        success, users = self.run_test("Get Admin Users", "GET", "admin/users", 200, token=self.admin_token)
        
        if success and users:
            # Find our test student
            test_student = None
            for user in users:
                if user.get('email') == self.student_email:
                    test_student = user
                    break
            
            if test_student:
                print("\n🔍 Verifying enhanced student profile in admin dashboard...")
                
                # Verify enhanced profile fields
                profile_fields = {
                    'grade': '7th Grade',
                    'school': 'Washington Middle School',
                    'block_number': 'A3',
                    'teacher': 'Ms. Johnson'
                }
                
                for field, expected_value in profile_fields.items():
                    if field in test_student and test_student[field] == expected_value:
                        print(f"✅ Admin dashboard shows enhanced profile field '{field}' correctly")
                    else:
                        print(f"❌ Admin dashboard missing or incorrect enhanced profile field '{field}'. Expected: '{expected_value}', Got: '{test_student.get(field, 'missing')}'")
                
                # Verify academic progress fields
                academic_fields = ['level', 'total_points', 'streak_days', 'badges']
                for field in academic_fields:
                    if field in test_student:
                        print(f"✅ Admin dashboard shows academic field '{field}' correctly")
                    else:
                        print(f"❌ Admin dashboard missing academic field '{field}'")
                
                return True
            else:
                print("❌ Test student not found in admin users list")
                return False
        
        return False

    def test_data_persistence(self):
        """Test data persistence by creating multiple students"""
        # Create additional test students with different information
        additional_students = [
            {
                "email": f"student_{uuid.uuid4().hex[:8]}@test.com",
                "password": "TestPass123",
                "first_name": "Jane",
                "last_name": "Doe",
                "is_teacher": False,
                "grade": "8th Grade",
                "school": "Lincoln Middle School",
                "block_number": "B2",
                "teacher": "Mr. Smith"
            },
            {
                "email": f"student_{uuid.uuid4().hex[:8]}@test.com",
                "password": "TestPass123",
                "first_name": "John",
                "last_name": "Smith",
                "is_teacher": False,
                "grade": "6th Grade",
                "school": "Jefferson Elementary",
                "block_number": "C4",
                "teacher": "Mrs. Davis"
            }
        ]
        
        student_ids = []
        
        for i, student_data in enumerate(additional_students):
            print(f"\n🔍 Registering additional test student #{i+1}...")
            success, response = self.run_test(
                f"Register Additional Student #{i+1}", 
                "POST", 
                "register", 
                200, 
                data=student_data
            )
            
            if not success:
                print(f"❌ Additional student #{i+1} registration failed")
                continue
            
            print(f"✅ Additional student #{i+1} registered successfully")
            student_ids.append(response['user']['id'])
            
            # Verify profile data was saved correctly
            if 'user' in response:
                user = response['user']
                for field in ['grade', 'school', 'block_number', 'teacher']:
                    if field in user and user[field] == student_data[field]:
                        print(f"✅ Profile field '{field}' saved correctly for student #{i+1}")
                    else:
                        print(f"❌ Profile field '{field}' not saved correctly for student #{i+1}")
        
        # Get updated admin users list to verify all students are visible
        print("\n🔍 Verifying all students are visible in admin dashboard...")
        success, updated_users = self.run_test(
            "Get Updated Admin Users", 
            "GET", 
            "admin/users", 
            200, 
            token=self.admin_token
        )
        
        if not success:
            print("❌ Failed to get updated admin users")
            return False
        
        # Count students in admin dashboard
        students = [user for user in updated_users if not user.get('is_teacher', False)]
        print(f"✅ Admin dashboard shows {len(students)} students (should be at least 3)")
        
        # Verify all our test students are in the dashboard
        found_students = 0
        for student_id in [self.student_id] + student_ids:
            for user in updated_users:
                if user.get('id') == student_id:
                    found_students += 1
                    break
        
        print(f"✅ Found {found_students} of our test students in admin dashboard (should be {len(student_ids) + 1})")
        
        return found_students == len(student_ids) + 1

    def run_all_tests(self):
        """Run all tests for enhanced student registration and admin profile management"""
        print("🚀 Starting Enhanced Student Registration and Admin Profile Management Tests")
        
        # Test health check
        self.test_health_check()
        
        # Test enhanced student registration
        if not self.register_enhanced_student():
            print("❌ Enhanced student registration failed, stopping tests")
            return False
        
        # Test admin login
        if not self.admin_login():
            print("❌ Admin login failed, stopping tests")
            return False
        
        # Test admin dashboard student profiles
        if not self.verify_admin_dashboard_student_profiles():
            print("❌ Admin dashboard student profiles verification failed")
            return False
        
        # Test data persistence
        if not self.test_data_persistence():
            print("❌ Data persistence test failed")
            return False
        
        # Print results
        print(f"\n📊 Tests passed: {self.tests_passed}/{self.tests_run}")
        print("✅ Enhanced student registration and admin profile management tests completed successfully")
        
        return self.tests_passed == self.tests_run

def main():
    tester = EnhancedStudentTester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    main()