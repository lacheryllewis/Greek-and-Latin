import requests
import unittest
import uuid
from datetime import datetime
import json

class GreekLatinAPITester:
    def __init__(self, base_url="https://5bfa331b-eeb3-4d9a-b920-01c65ef78380.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.student_email = f"student_{uuid.uuid4().hex[:8]}@test.com"
        self.teacher_email = f"teacher_{uuid.uuid4().hex[:8]}@test.com"
        self.password = "Test123!"
        self.student_token = None
        self.teacher_token = None
        self.student_id = None
        self.teacher_id = None
        self.content_verification_results = {}

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

    def register_student(self):
        """Register a student account"""
        data = {
            "email": self.student_email,
            "password": self.password,
            "first_name": "Test",
            "last_name": "Student",
            "is_teacher": False
        }
        success, response = self.run_test("Register Student", "POST", "register", 200, data)
        if success and 'access_token' in response:
            self.student_token = response['access_token']
            self.student_id = response['user']['id']
            print(f"Student registered with email: {self.student_email}")
            return True
        return False

    def register_teacher(self):
        """Register a teacher account"""
        data = {
            "email": self.teacher_email,
            "password": self.password,
            "first_name": "Test",
            "last_name": "Teacher",
            "is_teacher": True
        }
        success, response = self.run_test("Register Teacher", "POST", "register", 200, data)
        if success and 'access_token' in response:
            self.teacher_token = response['access_token']
            self.teacher_id = response['user']['id']
            print(f"Teacher registered with email: {self.teacher_email}")
            return True
        return False

    def login_student(self):
        """Login with student account"""
        data = {
            "email": self.student_email,
            "password": self.password
        }
        success, response = self.run_test("Student Login", "POST", "login", 200, data)
        if success and 'access_token' in response:
            self.student_token = response['access_token']
            return True
        return False

    def login_teacher(self):
        """Login with teacher account"""
        data = {
            "email": self.teacher_email,
            "password": self.password
        }
        success, response = self.run_test("Teacher Login", "POST", "login", 200, data)
        if success and 'access_token' in response:
            self.teacher_token = response['access_token']
            return True
        return False

    def get_words(self):
        """Get all words"""
        return self.run_test("Get Words", "GET", "words", 200, token=self.student_token)

    def record_study_session(self, word_id, correct=True):
        """Record a study session"""
        data = {
            "user_id": self.student_id,
            "word_id": word_id,
            "correct": correct,
            "timestamp": datetime.utcnow().isoformat()
        }
        return self.run_test("Record Study Session", "POST", "study-session", 200, data, self.student_token)

    def record_quiz_result(self, score=8, total=10):
        """Record a quiz result"""
        data = {
            "user_id": self.student_id,
            "score": score,
            "total_questions": total,
            "timestamp": datetime.utcnow().isoformat()
        }
        return self.run_test("Record Quiz Result", "POST", "quiz-result", 200, data, self.student_token)

    def get_admin_users(self):
        """Get all users (admin only)"""
        return self.run_test("Get Admin Users", "GET", "admin/users", 200, token=self.teacher_token)

    def verify_word_content(self, words):
        """Verify the content of the word cards"""
        print("\n🔍 Verifying Word Content...")
        
        # Check if we have 30 word elements
        if len(words) != 30:
            print(f"❌ Expected 30 word elements, got {len(words)}")
            return False
            
        # Check content types
        content_types = {}
        origins = {}
        difficulties = {}
        
        for word in words:
            # Check required fields
            required_fields = ['id', 'type', 'root', 'origin', 'meaning', 'examples', 
                              'definition', 'difficulty', 'points', 'category']
            
            for field in required_fields:
                if field not in word:
                    print(f"❌ Missing required field '{field}' in word: {word['root']}")
                    return False
            
            # Count content types
            content_types[word['type']] = content_types.get(word['type'], 0) + 1
            origins[word['origin']] = origins.get(word['origin'], 0) + 1
            difficulties[word['difficulty']] = difficulties.get(word['difficulty'], 0) + 1
            
            # Check points match difficulty
            expected_points = 10 if word['difficulty'] == 'beginner' else (15 if word['difficulty'] == 'intermediate' else 20)
            if word['points'] != expected_points:
                print(f"❌ Points don't match difficulty for {word['root']}: expected {expected_points}, got {word['points']}")
                return False
                
            # Check examples
            if not word['examples'] or len(word['examples']) < 1:
                print(f"❌ No examples for {word['root']}")
                return False
        
        # Store verification results
        self.content_verification_results = {
            'total_words': len(words),
            'content_types': content_types,
            'origins': origins,
            'difficulties': difficulties
        }
        
        print("✅ Word content verification passed")
        print(f"📊 Content breakdown:")
        print(f"   - Total words: {len(words)}")
        print(f"   - Types: {content_types}")
        print(f"   - Origins: {origins}")
        print(f"   - Difficulties: {difficulties}")
        
        return True
        
    def verify_educational_value(self, words):
        """Verify the educational value of the content"""
        print("\n🔍 Verifying Educational Value...")
        
        # Check for specific important roots
        important_roots = ['graph', 'port', '-ology']
        found_roots = {}
        
        for root in important_roots:
            for word in words:
                if word['root'] == root:
                    found_roots[root] = word
                    break
        
        # Check if all important roots were found
        for root in important_roots:
            if root not in found_roots:
                print(f"❌ Important root '{root}' not found")
            else:
                print(f"✅ Found important root '{root}': {found_roots[root]['meaning']}")
                
        # Check if examples are relevant
        for root, word in found_roots.items():
            print(f"   - Examples for '{root}': {', '.join(word['examples'])}")
            
        return len(found_roots) == len(important_roots)

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting API Tests for Greek & Latin Learning App")
        
        # Test health check
        self.test_health_check()
        
        # Test registration
        if not self.register_student():
            print("❌ Student registration failed, stopping tests")
            return False
            
        if not self.register_teacher():
            print("❌ Teacher registration failed, stopping tests")
            return False
            
        # Test login
        if not self.login_student():
            print("❌ Student login failed, stopping tests")
            return False
            
        if not self.login_teacher():
            print("❌ Teacher login failed, stopping tests")
            return False
            
        # Test getting words
        success, words_response = self.get_words()
        if not success:
            print("❌ Getting words failed, stopping tests")
            return False
            
        # Test recording study session
        if len(words_response) > 0:
            word_id = words_response[0]['id']
            success, _ = self.record_study_session(word_id)
            if not success:
                print("❌ Recording study session failed")
                
        # Test recording quiz result
        success, _ = self.record_quiz_result()
        if not success:
            print("❌ Recording quiz result failed")
            
        # Test admin endpoints
        success, users = self.get_admin_users()
        if not success:
            print("❌ Getting admin users failed")
            
        success, _ = self.get_user_progress()
        if not success:
            print("❌ Getting user progress failed")
            
        # Print results
        print(f"\n📊 Tests passed: {self.tests_passed}/{self.tests_run}")
        return self.tests_passed == self.tests_run

def main():
    tester = GreekLatinAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    main()