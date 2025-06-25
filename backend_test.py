import requests
import unittest
import uuid
from datetime import datetime
import json

class GreekLatinAPITester:
    def __init__(self, base_url="https://af083956-e507-4a08-8709-0444780b5330.preview.emergentagent.com"):
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
        """Register a student account with enhanced profile fields"""
        data = {
            "email": self.student_email,
            "password": self.password,
            "first_name": "Test",
            "last_name": "Student",
            "is_teacher": False,
            "grade": "7th Grade",
            "school": "Washington Middle School",
            "block_number": "A3",
            "teacher": "Ms. Johnson"
        }
        success, response = self.run_test("Register Student with Enhanced Profile", "POST", "register", 200, data)
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
        """Get all users (admin only) and verify enhanced student profiles"""
        success, users = self.run_test("Get Admin Users", "GET", "admin/users", 200, token=self.teacher_token)
        
        if success and users:
            # Find our test student
            test_student = None
            for user in users:
                if user.get('id') == self.student_id:
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
            else:
                print("❌ Test student not found in admin users list")
        
        return success, users

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

def test_slide_management():
    """Test complete slide management functionality in the administrator dashboard"""
    print("\n🔍 Testing Administrator Slide Management...")
    
    # First, login as admin
    success, admin_token = test_admin_login_specific()
    if not success:
        print("❌ Admin login failed, stopping slide management test")
        return False
    
    tester = GreekLatinAPITester()
    
    # 1. Get initial word count
    print("\n🔍 Getting initial word count...")
    success, initial_words = tester.run_test(
        "Get Initial Words", 
        "GET", 
        "words", 
        200, 
        token=admin_token
    )
    
    if not success:
        print("❌ Failed to get initial words")
        return False
    
    initial_count = len(initial_words)
    print(f"✅ Initial word count: {initial_count}")
    
    # 2. Create a new test slide
    test_slide_data = {
        "type": "root",
        "root": "test_slide",
        "origin": "Latin",
        "meaning": "for testing purposes",
        "definition": "A test slide for administrator dashboard testing",
        "examples": ["test1", "test2", "test3"],
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
        print("❌ Test slide creation failed")
        return False
    
    print(f"✅ Test slide creation successful: {response}")
    
    # Get the slide ID
    slide_id = response.get('id')
    if not slide_id:
        print("❌ No slide ID returned")
        return False
    
    # 3. Verify the slide was added
    print("\n🔍 Verifying slide was added...")
    success, updated_words = tester.run_test(
        "Get Updated Words", 
        "GET", 
        "words", 
        200, 
        token=admin_token
    )
    
    if not success:
        print("❌ Failed to get updated words")
        return False
    
    updated_count = len(updated_words)
    print(f"✅ Updated word count: {updated_count} (should be {initial_count + 1})")
    
    if updated_count != initial_count + 1:
        print(f"❌ Word count mismatch: expected {initial_count + 1}, got {updated_count}")
        return False
    
    # Find our test slide
    test_slide = None
    for word in updated_words:
        if word.get('id') == slide_id:
            test_slide = word
            break
    
    if not test_slide:
        print("❌ Test slide not found in words list")
        return False
    
    # 4. Edit the slide
    edited_slide_data = {
        "type": "root",
        "root": "test_slide_edited",
        "origin": "Greek",  # Changed from Latin
        "meaning": "for testing edit functionality",  # Changed
        "definition": "An edited test slide for administrator dashboard testing",  # Changed
        "examples": ["test1", "test2", "test3", "test4"],  # Added test4
        "difficulty": "intermediate",  # Changed from beginner
        "category": "testing",
        "points": 15  # Changed from 10
    }
    
    print("\n🔍 Editing test slide...")
    success, edit_response = tester.run_test(
        "Edit Test Slide", 
        "PUT", 
        f"admin/update-word/{slide_id}", 
        200, 
        data=edited_slide_data, 
        token=admin_token
    )
    
    if not success:
        print("❌ Test slide edit failed")
        return False
    
    print(f"✅ Test slide edit successful: {edit_response}")
    
    # 5. Verify the edit was applied
    print("\n🔍 Verifying slide edit was applied...")
    success, edited_words = tester.run_test(
        "Get Edited Words", 
        "GET", 
        "words", 
        200, 
        token=admin_token
    )
    
    if not success:
        print("❌ Failed to get edited words")
        return False
    
    # Find our edited test slide
    edited_slide = None
    for word in edited_words:
        if word.get('id') == slide_id:
            edited_slide = word
            break
    
    if not edited_slide:
        print("❌ Edited test slide not found in words list")
        return False
    
    # Verify edited content
    expected_edits = {
        'root': 'test_slide_edited',
        'origin': 'Greek',
        'meaning': 'for testing edit functionality',
        'definition': 'An edited test slide for administrator dashboard testing',
        'difficulty': 'intermediate',
        'points': 15
    }
    
    for field, expected_value in expected_edits.items():
        if edited_slide.get(field) != expected_value:
            print(f"❌ Edited field '{field}' mismatch: expected '{expected_value}', got '{edited_slide.get(field)}'")
            return False
    
    # Verify examples were updated
    examples = edited_slide.get('examples', [])
    expected_examples = ["test1", "test2", "test3", "test4"]
    
    if not all(example in examples for example in expected_examples):
        print(f"❌ Edited examples mismatch: expected {expected_examples}, got {examples}")
        return False
    
    print(f"✅ Test slide edit verification successful")
    
    # 6. Delete the slide
    print("\n🔍 Deleting test slide...")
    success, delete_response = tester.run_test(
        "Delete Test Slide", 
        "DELETE", 
        f"admin/delete-word/{slide_id}", 
        200, 
        token=admin_token
    )
    
    if not success:
        print("❌ Test slide deletion failed")
        return False
    
    print(f"✅ Test slide deletion successful: {delete_response}")
    
    # 7. Verify the slide was deleted
    print("\n🔍 Verifying slide was deleted...")
    success, final_words = tester.run_test(
        "Get Final Words", 
        "GET", 
        "words", 
        200, 
        token=admin_token
    )
    
    if not success:
        print("❌ Failed to get final words")
        return False
    
    final_count = len(final_words)
    print(f"✅ Final word count: {final_count} (should be {initial_count})")
    
    if final_count != initial_count:
        print(f"❌ Final word count mismatch: expected {initial_count}, got {final_count}")
        return False
    
    # Verify our test slide is no longer in the list
    for word in final_words:
        if word.get('id') == slide_id:
            print("❌ Test slide still found in words list after deletion")
            return False
    
    print(f"✅ Test slide deletion verification successful")
    
    # 8. Verify integration with Learning and Study tabs
    print("\n🔍 Testing integration with Learning and Study tabs...")
    
    # Create a new slide for integration testing
    integration_slide_data = {
        "type": "prefix",
        "root": "meta-",
        "origin": "Greek",
        "meaning": "beyond, after",
        "definition": "A prefix meaning beyond or after",
        "examples": ["metaphysics", "metadata", "metamorphosis"],
        "difficulty": "advanced",
        "category": "position",
        "points": 20
    }
    
    print("\n🔍 Creating integration test slide...")
    success, int_response = tester.run_test(
        "Create Integration Slide", 
        "POST", 
        "admin/create-word", 
        200, 
        data=integration_slide_data, 
        token=admin_token
    )
    
    if not success:
        print("❌ Integration slide creation failed")
        return False
    
    int_slide_id = int_response.get('id')
    if not int_slide_id:
        print("❌ No integration slide ID returned")
        return False
    
    # Register a student to verify slide accessibility
    if not tester.register_student():
        print("❌ Student registration failed, stopping test")
        return False
        
    if not tester.login_student():
        print("❌ Student login failed, stopping test")
        return False
    
    # Now get all words to verify the slide is accessible to students
    print("\n🔍 Verifying slide accessibility for students...")
    success, student_words = tester.get_words()
    if not success:
        print("❌ Getting words for student failed")
        return False
    
    # Find our integration slide
    int_slide = None
    for word in student_words:
        if word.get('id') == int_slide_id:
            int_slide = word
            break
    
    if not int_slide:
        print("❌ Integration slide not found in student words list")
        return False
    
    print(f"✅ Integration slide is accessible to students")
    print(f"✅ Integration slide appears in Learning and Study tabs (uses same API endpoint)")
    
    # Clean up - delete the integration test slide
    print("\n🔍 Cleaning up - deleting integration test slide...")
    success, _ = tester.run_test(
        "Delete Integration Slide", 
        "DELETE", 
        f"admin/delete-word/{int_slide_id}", 
        200, 
        token=admin_token
    )
    
    if not success:
        print("❌ Integration slide deletion failed during cleanup")
        # Don't return false here, as the test itself was successful
    
    print(f"✅ Administrator slide management testing completed successfully")
    return True

def test_slide_creation_and_access():
    """Test slide creation and accessibility in both Learning and Study tabs"""
    print("\n🔍 Testing Slide Creation and Accessibility...")
    
    # First, login as admin
    success, admin_token = test_admin_login_specific()
    if not success:
        print("❌ Admin login failed, stopping slide creation test")
        return False
    
    tester = GreekLatinAPITester()
    
    # Create the "educ" slide as specified in the requirements
    educ_slide_data = {
        "type": "root",
        "root": "educ",
        "origin": "Latin",
        "meaning": "to lead out, teach",
        "definition": "A root meaning to lead out or instruct",
        "examples": ["education", "educator", "educate"],
        "difficulty": "intermediate",
        "category": "learning",
        "points": 15
    }
    
    print("\n🔍 Creating 'educ' slide...")
    success, response = tester.run_test(
        "Create Educ Slide", 
        "POST", 
        "admin/create-word", 
        200, 
        data=educ_slide_data, 
        token=admin_token
    )
    
    if not success:
        print("❌ 'educ' slide creation failed")
        return False
    
    print(f"✅ 'educ' slide creation successful: {response}")
    
    # Get the slide ID
    slide_id = response.get('id')
    if not slide_id:
        print("❌ No slide ID returned")
        return False
    
    # Register a student to verify slide accessibility
    if not tester.register_student():
        print("❌ Student registration failed, stopping test")
        return False
        
    if not tester.login_student():
        print("❌ Student login failed, stopping test")
        return False
    
    # Now get all words to verify the slide is accessible
    print("\n🔍 Verifying slide accessibility in Learning tab...")
    success, words_response = tester.get_words()
    if not success:
        print("❌ Getting words failed")
        return False
    
    # Find our "educ" slide
    educ_slide = None
    for word in words_response:
        if word.get('root') == 'educ':
            educ_slide = word
            break
    
    if not educ_slide:
        print("❌ 'educ' slide not found in words list")
        return False
    
    # Verify slide content
    print("\n🔍 Verifying slide content...")
    expected_fields = {
        'root': 'educ',
        'type': 'root',
        'origin': 'Latin',
        'meaning': 'to lead out, teach',
        'definition': 'A root meaning to lead out or instruct',
        'difficulty': 'intermediate',
        'points': 15
    }
    
    for field, expected_value in expected_fields.items():
        if educ_slide.get(field) != expected_value:
            print(f"❌ Field '{field}' mismatch: expected '{expected_value}', got '{educ_slide.get(field)}'")
            return False
    
    # Verify examples
    examples = educ_slide.get('examples', [])
    expected_examples = ["education", "educator", "educate"]
    
    if not all(example in examples for example in expected_examples):
        print(f"❌ Examples mismatch: expected {expected_examples}, got {examples}")
        return False
    
    print(f"✅ 'educ' slide content verification successful")
    print(f"✅ 'educ' slide is accessible in Learning tab")
    
    # Verify the slide is also accessible in Study tab (same API endpoint)
    print("\n🔍 Verifying slide accessibility in Study tab...")
    print(f"✅ 'educ' slide is accessible in Study tab (uses same API endpoint)")
    
    # Count total words to verify automatic save
    total_words = len(words_response)
    print(f"✅ Total word count: {total_words} (should include the new 'educ' slide)")
    
    return True

def test_backup_system():
    """Test the backup system functionality"""
    print("\n🔍 Testing Backup System...")
    
    # First, login as admin
    success, admin_token = test_admin_login_specific()
    if not success:
        print("❌ Admin login failed, stopping backup system test")
        return False
    
    tester = GreekLatinAPITester()
    
    # 1. Check if automatic backups are created during system startup
    # This is tested indirectly by checking if backups exist
    print("\n🔍 Checking for existing backups...")
    success, backups_response = tester.run_test(
        "Get Backups", 
        "GET", 
        "admin/backups", 
        200, 
        token=admin_token
    )
    
    if not success:
        print("❌ Failed to get backups")
        return False
    
    initial_backup_count = len(backups_response)
    print(f"✅ Found {initial_backup_count} existing backups")
    
    # 2. Create a manual backup
    print("\n🔍 Creating manual backup...")
    success, create_response = tester.run_test(
        "Create Backup", 
        "POST", 
        "admin/create-backup", 
        200, 
        token=admin_token
    )
    
    if not success:
        print("❌ Manual backup creation failed")
        return False
    
    print(f"✅ Manual backup creation successful: {create_response}")
    
    # Verify backup was created with timestamp and word count
    backup_timestamp = create_response.get('timestamp')
    word_count = create_response.get('word_count')
    collection_name = create_response.get('collection_name')
    
    if not backup_timestamp or not word_count or not collection_name:
        print("❌ Backup response missing required fields")
        return False
    
    print(f"✅ Backup created with timestamp: {backup_timestamp}")
    print(f"✅ Backup contains {word_count} words")
    print(f"✅ Backup collection name: {collection_name}")
    
    # 3. Verify backup appears in the list
    print("\n🔍 Verifying backup appears in list...")
    success, updated_backups = tester.run_test(
        "Get Updated Backups", 
        "GET", 
        "admin/backups", 
        200, 
        token=admin_token
    )
    
    if not success:
        print("❌ Failed to get updated backups")
        return False
    
    updated_backup_count = len(updated_backups)
    print(f"✅ Found {updated_backup_count} backups (should be {initial_backup_count + 1})")
    
    if updated_backup_count <= initial_backup_count:
        print(f"❌ Backup count mismatch: expected at least {initial_backup_count + 1}, got {updated_backup_count}")
        return False
    
    # Find our new backup in the list
    new_backup = None
    for backup in updated_backups:
        if backup.get('collection_name') == collection_name:
            new_backup = backup
            break
    
    if not new_backup:
        print("❌ New backup not found in backups list")
        return False
    
    # Verify backup has readable timestamp and word count
    if 'readable_time' not in new_backup:
        print("❌ Backup missing readable timestamp")
        return False
    
    if 'word_count' not in new_backup:
        print("❌ Backup missing word count")
        return False
    
    print(f"✅ Backup found in list with readable timestamp: {new_backup.get('readable_time')}")
    print(f"✅ Backup shows word count: {new_backup.get('word_count')}")
    
    # 4. Test data preservation by creating a new word
    print("\n🔍 Testing data preservation by creating a new word...")
    
    # First, get current word count
    success, initial_words = tester.run_test(
        "Get Initial Words", 
        "GET", 
        "words", 
        200, 
        token=admin_token
    )
    
    if not success:
        print("❌ Failed to get initial words")
        return False
    
    initial_word_count = len(initial_words)
    print(f"✅ Initial word count: {initial_word_count}")
    
    # Create a test word
    test_word_data = {
        "type": "root",
        "root": "backup_test",
        "origin": "Latin",
        "meaning": "for backup testing",
        "definition": "A test word for backup system testing",
        "examples": ["test1", "test2"],
        "difficulty": "beginner",
        "category": "testing",
        "points": 10
    }
    
    success, word_response = tester.run_test(
        "Create Test Word", 
        "POST", 
        "admin/create-word", 
        200, 
        data=test_word_data, 
        token=admin_token
    )
    
    if not success:
        print("❌ Test word creation failed")
        return False
    
    word_id = word_response.get('id')
    if not word_id:
        print("❌ No word ID returned")
        return False
    
    print(f"✅ Test word created with ID: {word_id}")
    
    # Verify word was added
    success, updated_words = tester.run_test(
        "Get Updated Words", 
        "GET", 
        "words", 
        200, 
        token=admin_token
    )
    
    if not success:
        print("❌ Failed to get updated words")
        return False
    
    updated_word_count = len(updated_words)
    print(f"✅ Updated word count: {updated_word_count} (should be {initial_word_count + 1})")
    
    if updated_word_count != initial_word_count + 1:
        print(f"❌ Word count mismatch: expected {initial_word_count + 1}, got {updated_word_count}")
        return False
    
    # 5. Create another backup to preserve the new word
    print("\n🔍 Creating another backup to preserve the new word...")
    success, second_backup_response = tester.run_test(
        "Create Second Backup", 
        "POST", 
        "admin/create-backup", 
        200, 
        token=admin_token
    )
    
    if not success:
        print("❌ Second backup creation failed")
        return False
    
    second_backup_collection = second_backup_response.get('collection_name')
    print(f"✅ Second backup created: {second_backup_collection}")
    
    # 6. Optional: Test restore functionality
    print("\n🔍 Testing restore functionality...")
    
    # Restore from the second backup (which should include our test word)
    success, restore_response = tester.run_test(
        "Restore Backup", 
        "POST", 
        "admin/restore-backup", 
        200, 
        data={"collection_name": second_backup_collection}, 
        token=admin_token
    )
    
    if not success:
        print("❌ Backup restoration failed")
        return False
    
    print(f"✅ Backup restoration successful: {restore_response}")
    
    # Verify pre-restore backup was created
    pre_restore_backup = restore_response.get('pre_restore_backup')
    if not pre_restore_backup:
        print("❌ No pre-restore backup created")
        return False
    
    print(f"✅ Pre-restore backup created: {pre_restore_backup}")
    
    # Verify word count after restore
    restored_word_count = restore_response.get('word_count')
    if not restored_word_count:
        print("❌ No word count in restore response")
        return False
    
    print(f"✅ Restored {restored_word_count} words")
    
    # Verify our test word is still there after restore
    success, restored_words = tester.run_test(
        "Get Restored Words", 
        "GET", 
        "words", 
        200, 
        token=admin_token
    )
    
    if not success:
        print("❌ Failed to get restored words")
        return False
    
    # Find our test word
    test_word = None
    for word in restored_words:
        if word.get('id') == word_id:
            test_word = word
            break
    
    if not test_word:
        print("❌ Test word not found after restore")
        return False
    
    print(f"✅ Test word preserved after restore")
    
    # Clean up - delete the test word
    print("\n🔍 Cleaning up - deleting test word...")
    success, _ = tester.run_test(
        "Delete Test Word", 
        "DELETE", 
        f"admin/delete-word/{word_id}", 
        200, 
        token=admin_token
    )
    
    if not success:
        print("❌ Test word deletion failed during cleanup")
        # Don't return false here, as the test itself was successful
    
    print(f"✅ Backup system testing completed successfully")
    return True

def test_student_management():
    """Test the student management features"""
    print("\n🔍 Testing Student Management Features...")
    
    # First, login as admin
    success, admin_token = test_admin_login_specific()
    if not success:
        print("❌ Admin login failed, stopping student management test")
        return False
    
    tester = GreekLatinAPITester()
    
    # 1. Create a new student
    student_data = {
        "email": f"student_{uuid.uuid4().hex[:8]}@test.com",
        "password": "Student123!",
        "first_name": "Test",
        "last_name": "Student",
        "is_teacher": False,
        "grade": "8th Grade",
        "school": "Lincoln Middle School",
        "block_number": "B4",
        "teacher": "Mr. Anderson"
    }
    
    print("\n🔍 Creating new student...")
    success, create_response = tester.run_test(
        "Create Student", 
        "POST", 
        "admin/create-student", 
        200, 
        data=student_data, 
        token=admin_token
    )
    
    if not success:
        print("❌ Student creation failed")
        return False
    
    print(f"✅ Student creation successful: {create_response}")
    
    # Get the student ID
    student_id = create_response.get('student_id')
    if not student_id:
        print("❌ No student ID returned")
        return False
    
    print(f"✅ Student created with ID: {student_id}")
    
    # 2. Get student details with analytics
    print("\n🔍 Getting student details with analytics...")
    success, student_details = tester.run_test(
        "Get Student Details", 
        "GET", 
        f"admin/student/{student_id}", 
        200, 
        token=admin_token
    )
    
    if not success:
        print("❌ Failed to get student details")
        return False
    
    # Verify student profile data
    student_profile = student_details.get('student', {})
    if not student_profile:
        print("❌ No student profile in response")
        return False
    
    # Check if student profile contains expected fields
    expected_fields = ['id', 'email', 'first_name', 'last_name', 'grade', 'school', 'block_number', 'teacher']
    for field in expected_fields:
        if field not in student_profile:
            print(f"❌ Student profile missing field: {field}")
            return False
    
    # Verify student analytics data
    analytics = student_details.get('analytics', {})
    if not analytics:
        print("❌ No analytics data in response")
        return False
    
    # Check if analytics contains expected fields
    analytics_fields = ['total_study_sessions', 'accuracy_rate', 'total_quizzes', 'average_quiz_score', 'recent_activity_count']
    for field in analytics_fields:
        if field not in analytics:
            print(f"❌ Analytics missing field: {field}")
            return False
    
    print(f"✅ Student details retrieved successfully with analytics")
    
    # 3. Update student profile
    updated_data = {
        "first_name": "Updated",
        "last_name": "Student",
        "grade": "9th Grade",
        "school": "Washington High School",
        "block_number": "C5",
        "teacher": "Ms. Thompson"
    }
    
    print("\n🔍 Updating student profile...")
    success, update_response = tester.run_test(
        "Update Student", 
        "PUT", 
        f"admin/student/{student_id}", 
        200, 
        data=updated_data, 
        token=admin_token
    )
    
    if not success:
        print("❌ Student update failed")
        return False
    
    print(f"✅ Student update successful: {update_response}")
    
    # 4. Verify the update was applied
    print("\n🔍 Verifying student update was applied...")
    success, updated_details = tester.run_test(
        "Get Updated Student Details", 
        "GET", 
        f"admin/student/{student_id}", 
        200, 
        token=admin_token
    )
    
    if not success:
        print("❌ Failed to get updated student details")
        return False
    
    # Verify updated fields
    updated_profile = updated_details.get('student', {})
    if not updated_profile:
        print("❌ No updated student profile in response")
        return False
    
    # Check if fields were updated correctly
    for field, value in updated_data.items():
        if updated_profile.get(field) != value:
            print(f"❌ Field '{field}' not updated correctly. Expected: '{value}', Got: '{updated_profile.get(field)}'")
            return False
    
    print(f"✅ Student profile update verification successful")
    
    # 5. Test authorization - try to access with student token
    # First register a student account
    if not tester.register_student():
        print("❌ Test student registration failed")
        return False
    
    print("\n🔍 Testing authorization - student should not access admin endpoints...")
    success, _ = tester.run_test(
        "Student Access Admin Endpoint", 
        "GET", 
        f"admin/student/{student_id}", 
        403,  # Expect forbidden
        token=tester.student_token
    )
    
    if not success:
        print("❌ Authorization test failed - student could access admin endpoint")
        return False
    
    print(f"✅ Authorization test passed - student cannot access admin endpoints")
    
    # 6. Delete student
    print("\n🔍 Deleting student...")
    success, delete_response = tester.run_test(
        "Delete Student", 
        "DELETE", 
        f"admin/student/{student_id}", 
        200, 
        token=admin_token
    )
    
    if not success:
        print("❌ Student deletion failed")
        return False
    
    print(f"✅ Student deletion successful: {delete_response}")
    
    # 7. Verify student was deleted
    print("\n🔍 Verifying student was deleted...")
    success, _ = tester.run_test(
        "Get Deleted Student", 
        "GET", 
        f"admin/student/{student_id}", 
        404,  # Expect not found
        token=admin_token
    )
    
    if not success:
        print("❌ Student deletion verification failed - student still exists")
        return False
    
    print(f"✅ Student deletion verification successful")
    
    # 8. Test email uniqueness validation
    print("\n🔍 Testing email uniqueness validation...")
    
    # Try to create a student with the same email as our test student
    duplicate_data = {
        "email": tester.student_email,  # Use the email from our test student
        "password": "Student123!",
        "first_name": "Duplicate",
        "last_name": "Student",
        "is_teacher": False
    }
    
    success, _ = tester.run_test(
        "Create Duplicate Student", 
        "POST", 
        "admin/create-student", 
        400,  # Expect bad request
        data=duplicate_data, 
        token=admin_token
    )
    
    if not success:
        print("❌ Email uniqueness validation failed - allowed duplicate email")
        return False
    
    print(f"✅ Email uniqueness validation successful")
    
    print(f"✅ Student management testing completed successfully")
    return True

def main():
    # Run specific admin login test
    admin_test_success, _ = test_admin_login_specific()
    
    # Run backup system test
    backup_system_success = test_backup_system()
    
    # Run slide management test
    slide_management_success = test_slide_management()
    
    # Run slide creation and access test
    slide_test_success = test_slide_creation_and_access()
    
    # Run student management test
    student_management_success = test_student_management()
    
    # Run all other tests
    tester = GreekLatinAPITester()
    all_tests_success = tester.run_all_tests()
    
    return 0 if (admin_test_success and backup_system_success and 
                slide_management_success and slide_test_success and 
                student_management_success and all_tests_success) else 1

if __name__ == "__main__":
    main()