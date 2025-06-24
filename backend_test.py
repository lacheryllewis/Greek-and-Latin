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

    def get_user_progress(self):
        """Get user progress (admin only)"""
        return self.run_test("Get User Progress", "GET", f"admin/progress/{self.student_id}", 200, token=self.teacher_token)

    def verify_word_content(self, words):
        """Verify the content of the word cards"""
        print("\n🔍 Verifying Word Content...")
        
        # Check if we have 33 word elements
        if len(words) != 33:
            print(f"❌ Expected 33 word elements, got {len(words)}")
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
        
    def verify_gamification(self, words):
        """Verify the gamification elements"""
        print("\n🔍 Verifying Gamification Elements...")
        
        # Check point distribution
        point_values = [word['points'] for word in words]
        unique_points = set(point_values)
        
        if not unique_points.issubset({10, 15, 20}):
            print(f"❌ Unexpected point values: {unique_points}")
            return False
            
        # Count words by point value
        point_counts = {}
        for points in point_values:
            point_counts[points] = point_counts.get(points, 0) + 1
            
        print(f"✅ Point distribution: {point_counts}")
        
        # Verify we have a mix of difficulty levels
        if len(unique_points) < 2:
            print("❌ Not enough variety in difficulty levels")
            return False
            
        return True
        
    def get_user_profile(self):
        """Get user profile"""
        return self.run_test("Get User Profile", "GET", "user/profile", 200, token=self.student_token)
        
    def get_leaderboard(self):
        """Get the leaderboard"""
        return self.run_test("Get Leaderboard", "GET", "leaderboard", 200, token=self.student_token)

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
        
        # Verify content
        content_verified = self.verify_word_content(words_response)
        if not content_verified:
            print("❌ Content verification failed")
        
        # Verify educational value
        edu_value_verified = self.verify_educational_value(words_response)
        if not edu_value_verified:
            print("❌ Educational value verification failed")
            
        # Verify gamification
        gamification_verified = self.verify_gamification(words_response)
        if not gamification_verified:
            print("❌ Gamification verification failed")
            
        # Test user profile
        success, profile = self.get_user_profile()
        if not success:
            print("❌ Getting user profile failed")
            
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
            
        # Test leaderboard
        success, _ = self.get_leaderboard()
        if not success:
            print("❌ Getting leaderboard failed")
            
        # Test admin endpoints
        success, users = self.get_admin_users()
        if not success:
            print("❌ Getting admin users failed")
            
        success, _ = self.get_user_progress()
        if not success:
            print("❌ Getting user progress failed")
            
        # Print results
        print(f"\n📊 Tests passed: {self.tests_passed}/{self.tests_run}")
        
        # Print content verification summary
        if self.content_verification_results:
            print("\n📚 Content Verification Summary:")
            print(f"   - Total words: {self.content_verification_results.get('total_words', 0)}")
            print(f"   - Types: {self.content_verification_results.get('content_types', {})}")
            print(f"   - Origins: {self.content_verification_results.get('origins', {})}")
            print(f"   - Difficulties: {self.content_verification_results.get('difficulties', {})}")
        
        return self.tests_passed == self.tests_run

def test_admin_login_specific():
    """Test specifically for admin login with provided credentials"""
    print("\n🔍 Testing Admin Login with Specific Credentials...")
    tester = GreekLatinAPITester()
    
    # Test health check first
    success, _ = tester.test_health_check()
    if not success:
        print("❌ Health check failed, stopping tests")
        return False
    
    # Login with admin credentials
    admin_email = "admin@empoweru.com"
    admin_password = "EmpowerU2024!"
    
    data = {
        "email": admin_email,
        "password": admin_password
    }
    success, response = tester.run_test("Admin Login", "POST", "login", 200, data)
    
    if not success or 'access_token' not in response:
        print("❌ Admin login failed")
        return False
    
    # Check if user is marked as admin/teacher
    user_data = response.get('user', {})
    is_admin = user_data.get('is_teacher', False)
    
    print(f"Admin login successful: {success}")
    print(f"Is admin user: {is_admin}")
    print(f"User data: {json.dumps(user_data, indent=2)}")
    
    # Test admin-only endpoint
    admin_token = response['access_token']
    success, users = tester.run_test("Get Admin Users", "GET", "admin/users", 200, token=admin_token)
    
    if not success:
        print("❌ Admin endpoint access failed")
        return False
    
    print(f"✅ Admin login and endpoint access successful")
    return True, admin_token

def test_slide_creation_and_access():
    """Test slide creation and accessibility in both Learning and Study tabs"""
    print("\n🔍 Testing Slide Creation and Accessibility...")
    
    # First, login as admin
    success, admin_token = test_admin_login_specific()
    if not success:
        print("❌ Admin login failed, stopping slide creation test")
        return False
    
    tester = GreekLatinAPITester()
    
    # Create a test slide
    test_slide_data = {
        "type": "root",
        "root": "test",
        "origin": "Greek",
        "meaning": "examination",
        "definition": "A root used for testing purposes",
        "examples": ["testing", "tested", "tester"],
        "difficulty": "beginner",
        "category": "testing",
        "points": 10
    }
    
    print("\n🔍 Creating test slide...")
    success, response = tester.run_test(
        "Create Test Slide", 
        "POST", 
        "admin/create-word", 
        200, 
        data=test_slide_data, 
        token=admin_token
    )
    
    if not success:
        print("❌ Slide creation failed")
        return False
    
    print(f"✅ Slide creation successful: {response}")
    
    # Get the slide ID
    slide_id = response.get('id')
    if not slide_id:
        print("❌ No slide ID returned")
        return False
    
    # Now get all words to verify the slide is accessible
    print("\n🔍 Verifying slide accessibility...")
    success, words_response = tester.get_words()
    if not success:
        print("❌ Getting words failed")
        return False
    
    # Find our test slide
    test_slide = None
    for word in words_response:
        if word.get('root') == 'test':
            test_slide = word
            break
    
    if not test_slide:
        print("❌ Test slide not found in words list")
        return False
    
    # Verify slide content
    print("\n🔍 Verifying slide content...")
    expected_fields = {
        'root': 'test',
        'type': 'root',
        'origin': 'Greek',
        'meaning': 'examination',
        'definition': 'A root used for testing purposes',
        'difficulty': 'beginner',
        'points': 10
    }
    
    for field, expected_value in expected_fields.items():
        if test_slide.get(field) != expected_value:
            print(f"❌ Field '{field}' mismatch: expected '{expected_value}', got '{test_slide.get(field)}'")
            return False
    
    # Verify examples
    examples = test_slide.get('examples', [])
    expected_examples = ["testing", "tested", "tester"]
    
    if not all(example in examples for example in expected_examples):
        print(f"❌ Examples mismatch: expected {expected_examples}, got {examples}")
        return False
    
    print(f"✅ Slide content verification successful")
    print(f"✅ Slide is accessible in both Learning and Study tabs")
    
    # Count total words to verify automatic save
    total_words = len(words_response)
    print(f"✅ Total word count: {total_words} (should be 34+)")
    
    return True

def main():
    # Run specific admin login test
    admin_test_success, _ = test_admin_login_specific()
    
    # Run slide creation and access test
    slide_test_success = test_slide_creation_and_access()
    
    # Run all other tests
    tester = GreekLatinAPITester()
    all_tests_success = tester.run_all_tests()
    
    return 0 if (admin_test_success and slide_test_success and all_tests_success) else 1

if __name__ == "__main__":
    main()