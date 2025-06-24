import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;

// Empower U Logo Component
const EmpowerULogo = () => (
  <div className="flex flex-col items-center mb-8">
    <div className="relative">
      {/* Logo simulation - replace with actual image */}
      <div className="bg-navy-900 text-white px-8 py-3 rounded-full border-4 border-gold-500 mb-2">
        <span className="text-2xl font-bold tracking-wider">EMPOWER</span>
      </div>
      <div className="bg-gold-500 text-navy-900 w-16 h-16 rounded-lg flex items-center justify-center mx-auto border-4 border-navy-900 -mt-2">
        <span className="text-2xl font-black">U</span>
      </div>
    </div>
    <div className="text-center mt-4">
      <h2 className="text-lg font-medium text-gray-700">Greek and Latin Affixes</h2>
      <p className="text-sm text-gray-500">Word Weaver Learning Platform</p>
    </div>
  </div>
);

// Jamaal Character Component
const JamaalCharacter = ({ message, size = "medium" }) => {
  const sizeClasses = {
    small: "w-16 h-16",
    medium: "w-32 h-32",
    large: "w-48 h-48"
  };

  return (
    <div className="flex flex-col items-center">
      {/* Character placeholder - replace with actual image */}
      <div className={`${sizeClasses[size]} bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center border-4 border-gold-500 shadow-lg relative`}>
        <div className="text-center">
          <div className="text-2xl">👨🏾‍🎓</div>
          <div className="text-xs font-bold text-navy-900">JAMAAL</div>
        </div>
        {/* Glow effect */}
        <div className="absolute inset-0 bg-yellow-300 rounded-full animate-pulse opacity-20"></div>
      </div>
      {message && (
        <div className="mt-2 bg-white rounded-lg px-4 py-2 shadow-lg border-l-4 border-gold-500 relative">
          <p className="text-sm text-gray-700 font-medium">{message}</p>
          <div className="absolute -top-2 left-4 w-4 h-4 bg-white transform rotate-45 border-l border-t border-gray-200"></div>
        </div>
      )}
    </div>
  );
};

// Progress Bar Component
const ProgressBar = ({ current, max, label }) => (
  <div className="mb-4">
    <div className="flex justify-between text-sm text-gray-600 mb-1">
      <span>{label}</span>
      <span>{current} / {max}</span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-3">
      <div 
        className="bg-gradient-to-r from-gold-400 to-gold-600 h-3 rounded-full transition-all duration-300"
        style={{ width: `${(current / max) * 100}%` }}
      ></div>
    </div>
  </div>
);

// Badge Component
const Badge = ({ name, earned = false }) => (
  <div className={`px-3 py-1 rounded-full text-xs font-bold ${earned ? 'bg-gold-500 text-navy-900' : 'bg-gray-200 text-gray-500'}`}>
    {name}
  </div>
);

function App() {
  const [currentView, setCurrentView] = useState('welcome');
  const [user, setUser] = useState(null);
  const [words, setWords] = useState([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [quizMode, setQuizMode] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizQuestion, setQuizQuestion] = useState(0);
  const [adminUsers, setAdminUsers] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);

  // Auth forms state
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    email: '', password: '', first_name: '', last_name: '', is_teacher: false
  });

  // Set up axios defaults
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      loadUserData();
    }
  }, []);

  const loadUserData = async () => {
    try {
      const [wordsResponse, profileResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/words`),
        axios.get(`${API_BASE_URL}/api/user/profile`)
      ]);
      
      if (wordsResponse.data && profileResponse.data) {
        setWords(wordsResponse.data);
        setUserProfile(profileResponse.data);
        setUser(profileResponse.data);
        setCurrentView('dashboard');
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
      localStorage.removeItem('token');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_BASE_URL}/api/login`, loginData);
      const { access_token, user } = response.data;
      
      localStorage.setItem('token', access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      setUser(user);
      
      // Load user data
      await loadUserData();
    } catch (error) {
      alert('Login failed: ' + (error.response?.data?.detail || 'Unknown error'));
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_BASE_URL}/api/register`, registerData);
      const { access_token, user } = response.data;
      
      localStorage.setItem('token', access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      setUser(user);
      
      // Load user data
      await loadUserData();
    } catch (error) {
      alert('Registration failed: ' + (error.response?.data?.detail || 'Unknown error'));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setCurrentView('welcome');
    setWords([]);
    setUserProfile(null);
  };

  const nextCard = () => {
    setShowAnswer(false);
    setCurrentWordIndex((prev) => (prev + 1) % words.length);
  };

  const prevCard = () => {
    setShowAnswer(false);
    setCurrentWordIndex((prev) => (prev - 1 + words.length) % words.length);
  };

  const recordStudySession = async (correct) => {
    if (!user || !words[currentWordIndex]) return;
    
    try {
      const response = await axios.post(`${API_BASE_URL}/api/study-session`, {
        user_id: user.id,
        word_id: words[currentWordIndex].id,
        correct: correct,
        timestamp: new Date().toISOString()
      });
      
      if (response.data.points_earned > 0) {
        setUserProfile(prev => ({
          ...prev,
          total_points: prev.total_points + response.data.points_earned
        }));
      }
    } catch (error) {
      console.error('Failed to record study session:', error);
    }
  };

  const startQuiz = () => {
    setQuizMode(true);
    setQuizScore(0);
    setQuizQuestion(0);
    setCurrentWordIndex(Math.floor(Math.random() * words.length));
    setShowAnswer(false);
  };

  const answerQuiz = (correct) => {
    if (correct) setQuizScore(prev => prev + 1);
    
    if (quizQuestion < 9) { // 10 questions total
      setQuizQuestion(prev => prev + 1);
      setCurrentWordIndex(Math.floor(Math.random() * words.length));
      setShowAnswer(false);
    } else {
      // Quiz finished
      recordQuizResult();
      setQuizMode(false);
    }
  };

  const recordQuizResult = async () => {
    if (!user) return;
    
    try {
      const response = await axios.post(`${API_BASE_URL}/api/quiz-result`, {
        user_id: user.id,
        score: quizScore,
        total_questions: 10,
        timestamp: new Date().toISOString()
      });
      
      if (response.data.points_earned > 0) {
        setUserProfile(prev => ({
          ...prev,
          total_points: prev.total_points + response.data.points_earned
        }));
      }
      
      alert(`🎉 Quiz Completed!\nScore: ${quizScore}/10\nPoints Earned: ${response.data.points_earned}`);
    } catch (error) {
      console.error('Failed to record quiz result:', error);
    }
  };

  const loadAdminData = async () => {
    if (!user?.is_teacher) return;
    
    try {
      const response = await axios.get(`${API_BASE_URL}/api/admin/users`);
      setAdminUsers(response.data);
    } catch (error) {
      console.error('Failed to load admin data:', error);
    }
  };

  const loadLeaderboard = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/leaderboard`);
      setLeaderboard(response.data);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    }
  };

  // Welcome Page
  if (currentView === 'welcome') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-12 w-full max-w-md relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gold-100 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gold-50 rounded-full -ml-12 -mb-12"></div>
          
          <div className="relative z-10">
            <EmpowerULogo />
            
            <div className="space-y-4">
              <button
                onClick={() => setCurrentView('student-login')}
                className="w-full bg-gradient-to-r from-gold-500 to-gold-600 text-navy-900 py-4 rounded-xl font-bold text-lg hover:from-gold-600 hover:to-gold-700 transition-all transform hover:scale-105 shadow-lg"
              >
                🎓 Student Login
              </button>
              
              <button
                onClick={() => setCurrentView('teacher-login')}
                className="w-full bg-transparent border-2 border-navy-200 text-navy-600 py-3 rounded-xl font-medium text-sm hover:bg-navy-50 transition-all"
              >
                👩‍🏫 Teacher? Click here
              </button>
            </div>
            
            <div className="mt-8 text-center">
              <JamaalCharacter 
                message="Ready to become a Word Weaver? Let's unlock the power of language!" 
                size="medium"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Student Login/Register Page
  if (currentView === 'student-login' || currentView === 'student-register') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <button 
              onClick={() => setCurrentView('welcome')}
              className="absolute top-4 left-4 text-gray-400 hover:text-gray-600"
            >
              ← Back
            </button>
            <EmpowerULogo />
          </div>
          
          <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
            <button 
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                currentView === 'student-login' ? 'bg-white shadow-sm text-navy-600' : 'text-gray-600'
              }`}
              onClick={() => setCurrentView('student-login')}
            >
              Login
            </button>
            <button 
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                currentView === 'student-register' ? 'bg-white shadow-sm text-navy-600' : 'text-gray-600'
              }`}
              onClick={() => setCurrentView('student-register')}
            >
              Sign Up
            </button>
          </div>

          {currentView === 'student-login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="email"
                placeholder="Email"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                value={loginData.email}
                onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                required
              />
              <input
                type="password"
                placeholder="Password"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                value={loginData.password}
                onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                required
              />
              <button 
                type="submit"
                className="w-full bg-gradient-to-r from-gold-500 to-gold-600 text-navy-900 py-3 rounded-lg font-semibold hover:from-gold-600 hover:to-gold-700 transition-all"
              >
                Login & Start Learning
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="First Name"
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                  value={registerData.first_name}
                  onChange={(e) => setRegisterData({...registerData, first_name: e.target.value})}
                  required
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                  value={registerData.last_name}
                  onChange={(e) => setRegisterData({...registerData, last_name: e.target.value})}
                  required
                />
              </div>
              <input
                type="email"
                placeholder="Email"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                value={registerData.email}
                onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                required
              />
              <input
                type="password"
                placeholder="Password"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                value={registerData.password}
                onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                required
              />
              <button 
                type="submit"
                className="w-full bg-gradient-to-r from-gold-500 to-gold-600 text-navy-900 py-3 rounded-lg font-semibold hover:from-gold-600 hover:to-gold-700 transition-all"
              >
                Join the Word Weavers
              </button>
            </form>
          )}
          
          <div className="mt-6 text-center">
            <JamaalCharacter 
              message={currentView === 'student-login' ? "Welcome back, Word Weaver!" : "Ready to start your journey?"} 
              size="small"
            />
          </div>
        </div>
      </div>
    );
  }

  // Teacher Login Page
  if (currentView === 'teacher-login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <button 
              onClick={() => setCurrentView('welcome')}
              className="absolute top-4 left-4 text-gray-400 hover:text-gray-600"
            >
              ← Back
            </button>
            <EmpowerULogo />
            <h3 className="text-xl font-semibold text-navy-700 mt-4">Teacher Access</h3>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="email"
              placeholder="Teacher Email"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
              value={loginData.email}
              onChange={(e) => setLoginData({...loginData, email: e.target.value})}
              required
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
              value={loginData.password}
              onChange={(e) => setLoginData({...loginData, password: e.target.value})}
              required
            />
            <button 
              type="submit"
              className="w-full bg-gradient-to-r from-navy-600 to-navy-700 text-white py-3 rounded-lg font-semibold hover:from-navy-700 hover:to-navy-800 transition-all"
            >
              Access Teacher Dashboard
            </button>
          </form>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 text-center">
              Teacher accounts are invitation-only. Contact your administrator for access.
            </p>
            <p className="text-xs text-gray-500 text-center mt-2">
              Demo: admin@empoweru.com / EmpowerU2024!
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (words.length === 0 && currentView === 'dashboard') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-navy-900 to-navy-700 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500 mx-auto mb-4"></div>
          <p className="text-lg">Loading your Word Weaver journey...</p>
          <JamaalCharacter message="Getting everything ready for you!" size="small" />
        </div>
      </div>
    );
  }

  // Main Dashboard
  if (currentView === 'dashboard') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700">
        {/* Header */}
        <header className="bg-white shadow-lg p-4">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="bg-navy-900 text-white px-4 py-1 rounded-full">
                  <span className="font-bold">EMPOWER</span>
                </div>
                <div className="bg-gold-500 text-navy-900 w-8 h-8 rounded flex items-center justify-center">
                  <span className="font-black text-sm">U</span>
                </div>
              </div>
              <div className="text-navy-700">
                <span className="font-semibold">Welcome back, {userProfile?.first_name}!</span>
                <div className="text-sm text-gray-600">Level {userProfile?.level} Word Weaver</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-lg font-bold text-gold-600">{userProfile?.total_points} pts</div>
                <div className="text-xs text-gray-500">Total Points</div>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentView('study')}
                  className="px-4 py-2 bg-gradient-to-r from-gold-500 to-gold-600 text-navy-900 rounded-lg font-medium hover:from-gold-600 hover:to-gold-700 transition-all"
                >
                  📚 Study
                </button>
                <button
                  onClick={() => { setCurrentView('leaderboard'); loadLeaderboard(); }}
                  className="px-4 py-2 bg-navy-600 text-white rounded-lg hover:bg-navy-700 transition-colors"
                >
                  🏆 Leaderboard
                </button>
                {user?.is_teacher && (
                  <button
                    onClick={() => { setCurrentView('admin'); loadAdminData(); }}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    👩‍🏫 Admin
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-6xl mx-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Dashboard Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Progress Overview */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h2 className="text-2xl font-bold text-navy-800 mb-6">Your Word Weaver Journey</h2>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-gold-100 to-gold-200 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-gold-700">{userProfile?.level}</div>
                    <div className="text-sm text-gold-600">Current Level</div>
                  </div>
                  <div className="bg-gradient-to-br from-navy-100 to-navy-200 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-navy-700">{userProfile?.total_points}</div>
                    <div className="text-sm text-navy-600">Total Points</div>
                  </div>
                </div>

                <ProgressBar 
                  current={userProfile?.total_points || 0} 
                  max={Math.max((userProfile?.level || 1) * 100, 100)} 
                  label="Progress to Next Level" 
                />

                <div className="flex flex-wrap gap-2 mt-4">
                  {['First Century', 'Word Warrior', 'Scholar Supreme', 'Level Master'].map(badge => (
                    <Badge 
                      key={badge} 
                      name={badge} 
                      earned={userProfile?.badges?.includes(badge)} 
                    />
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-xl font-semibold text-navy-800 mb-4">Ready to Learn?</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setCurrentView('study')}
                    className="bg-gradient-to-br from-gold-400 to-gold-600 text-navy-900 p-6 rounded-xl hover:from-gold-500 hover:to-gold-700 transition-all transform hover:scale-105 shadow-lg"
                  >
                    <div className="text-2xl mb-2">📚</div>
                    <div className="font-semibold">Study Mode</div>
                    <div className="text-sm opacity-80">Practice with flashcards</div>
                  </button>
                  <button
                    onClick={() => { setCurrentView('study'); startQuiz(); }}
                    className="bg-gradient-to-br from-navy-500 to-navy-700 text-white p-6 rounded-xl hover:from-navy-600 hover:to-navy-800 transition-all transform hover:scale-105 shadow-lg"
                  >
                    <div className="text-2xl mb-2">🧠</div>
                    <div className="font-semibold">Quiz Mode</div>
                    <div className="text-sm opacity-80">Test your knowledge</div>
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-xl p-6 text-center">
                <JamaalCharacter 
                  message="Keep up the great work! You're becoming a true Word Weaver!" 
                  size="large"
                />
              </div>
              
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-lg font-semibold text-navy-800 mb-4">Quick Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Words Available</span>
                    <span className="font-semibold text-navy-700">{words.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Badges Earned</span>
                    <span className="font-semibold text-gold-600">{userProfile?.badges?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current Streak</span>
                    <span className="font-semibold text-green-600">{userProfile?.streak_days || 0} days</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Study/Flashcards View - This continues your existing flashcard logic but with new styling
  if (currentView === 'study') {
    const currentWord = words[currentWordIndex];
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700">
        {/* Header */}
        <header className="bg-white shadow-lg p-4">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <button
              onClick={() => setCurrentView('dashboard')}
              className="flex items-center space-x-2 text-navy-600 hover:text-navy-800"
            >
              <span>←</span>
              <span>Back to Dashboard</span>
            </button>
            <div className="text-center">
              <div className="text-lg font-semibold text-navy-800">
                Card {currentWordIndex + 1} of {words.length}
              </div>
              {quizMode && (
                <div className="text-sm text-orange-600 font-medium">
                  Quiz Mode - Question {quizQuestion + 1}/10 (Score: {quizScore})
                </div>
              )}
            </div>
            <div className="flex space-x-2">
              {!quizMode ? (
                <button
                  onClick={startQuiz}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
                >
                  🧠 Start Quiz
                </button>
              ) : (
                <button
                  onClick={() => setQuizMode(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Exit Quiz
                </button>
              )}
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto p-6">
          {/* Flashcard */}
          <div className="bg-white rounded-3xl shadow-2xl p-12 mb-6 min-h-96 flex flex-col justify-center items-center text-center">
            <div className="mb-6">
              <span className={`px-6 py-2 rounded-full text-sm font-bold uppercase tracking-wide ${
                currentWord.type === 'prefix' ? 'bg-blue-100 text-blue-800' :
                currentWord.type === 'suffix' ? 'bg-green-100 text-green-800' :
                'bg-purple-100 text-purple-800'
              }`}>
                {currentWord.type} • {currentWord.origin} • {currentWord.difficulty}
              </span>
            </div>
            
            <div className="text-7xl font-bold text-navy-800 mb-6">
              {currentWord?.root || 'Loading...'}
            </div>
            
            {showAnswer ? (
              <div className="space-y-6 animate-fadeIn">
                <div className="text-3xl text-navy-700 font-semibold">
                  "{currentWord?.meaning || 'No meaning available'}"
                </div>
                <div className="text-xl text-gray-600 max-w-2xl">
                  {currentWord?.definition || 'No definition available'}
                </div>
                <div className="mt-8">
                  <h4 className="text-lg font-semibold text-navy-700 mb-3">Examples:</h4>
                  <div className="flex flex-wrap justify-center gap-3">
                    {(currentWord?.examples || []).map((example, index) => (
                      <span key={index} className="bg-gold-100 text-navy-700 px-4 py-2 rounded-full font-medium">
                        {example}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-lg font-semibold text-gold-600">
                  +{currentWord?.points || 0} points available
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-xl text-gray-500 mb-8">
                  {quizMode ? "What does this mean?" : "Click 'Show Answer' to reveal the meaning"}
                </div>
                <button
                  onClick={() => setShowAnswer(true)}
                  className="px-12 py-4 bg-gradient-to-r from-gold-500 to-gold-600 text-navy-900 rounded-full font-semibold hover:from-gold-600 hover:to-gold-700 transition-all transform hover:scale-105 shadow-lg text-lg"
                >
                  👁️ Show Answer
                </button>
              </div>
            )}
          </div>

          {/* Navigation Controls */}
          <div className="flex justify-between items-center">
            <button
              onClick={prevCard}
              className="flex items-center space-x-2 px-8 py-4 bg-white text-navy-700 rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 font-medium"
            >
              <span>⬅️</span>
              <span>Previous</span>
            </button>

            {showAnswer && (
              <div className="flex space-x-4">
                {quizMode ? (
                  <>
                    <button
                      onClick={() => answerQuiz(false)}
                      className="px-8 py-4 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-medium"
                    >
                      ❌ Incorrect
                    </button>
                    <button
                      onClick={() => answerQuiz(true)}
                      className="px-8 py-4 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors font-medium"
                    >
                      ✅ Correct
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => { recordStudySession(false); nextCard(); }}
                      className="px-8 py-4 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-medium"
                    >
                      😵 Too Hard
                    </button>
                    <button
                      onClick={() => { recordStudySession(true); nextCard(); }}
                      className="px-8 py-4 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors font-medium"
                    >
                      😊 Got It!
                    </button>
                  </>
                )}
              </div>
            )}

            <button
              onClick={nextCard}
              className="flex items-center space-x-2 px-8 py-4 bg-white text-navy-700 rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 font-medium"
            >
              <span>Next</span>
              <span>➡️</span>
            </button>
          </div>

          {/* Jamaal encouragement */}
          <div className="mt-8 text-center">
            <JamaalCharacter 
              message={showAnswer ? "Great job! Keep weaving those words!" : "You've got this, Word Weaver!"} 
              size="medium"
            />
          </div>
        </div>
      </div>
    );
  }

  // Leaderboard View
  if (currentView === 'leaderboard') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700">
        <header className="bg-white shadow-lg p-4">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <button
              onClick={() => setCurrentView('dashboard')}
              className="flex items-center space-x-2 text-navy-600 hover:text-navy-800"
            >
              <span>←</span>
              <span>Back to Dashboard</span>
            </button>
            <h1 className="text-2xl font-bold text-navy-800">🏆 Word Weaver Leaderboard</h1>
            <div></div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="space-y-4">
              {leaderboard.map((student, index) => (
                <div key={index} className={`flex items-center space-x-4 p-4 rounded-xl ${
                  index === 0 ? 'bg-gradient-to-r from-gold-100 to-gold-200 border-2 border-gold-400' :
                  index === 1 ? 'bg-gray-100 border-gray-300' :
                  index === 2 ? 'bg-orange-100 border-orange-300' :
                  'bg-gray-50'
                }`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                    index === 0 ? 'bg-gold-500 text-white' :
                    index === 1 ? 'bg-gray-400 text-white' :
                    index === 2 ? 'bg-orange-400 text-white' :
                    'bg-navy-600 text-white'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-navy-800">
                      {student.first_name} {student.last_name}
                    </div>
                    <div className="text-sm text-gray-600">
                      Level {student.level} • {student.total_points} points
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {student.badges.slice(0, 3).map((badge, idx) => (
                      <Badge key={idx} name={badge} earned={true} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Admin View (keep existing admin functionality with new styling)
  if (currentView === 'admin' && user?.is_teacher) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700">
        <header className="bg-white shadow-lg p-4">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <button
              onClick={() => setCurrentView('dashboard')}
              className="flex items-center space-x-2 text-navy-600 hover:text-navy-800"
            >
              <span>←</span>
              <span>Back to Dashboard</span>
            </button>
            <h1 className="text-2xl font-bold text-navy-800">👩‍🏫 Teacher Dashboard</h1>
            <div></div>
          </div>
        </header>

        <div className="max-w-6xl mx-auto p-6">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-navy-700 mb-6">📊 Student Overview</h3>
                <div className="space-y-4">
                  {adminUsers.filter(u => !u.is_teacher).length > 0 ? (
                    adminUsers.filter(u => !u.is_teacher).map((student, index) => (
                      <div key={student.id} className="bg-gray-50 rounded-xl p-4 border-l-4 border-gold-500">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-semibold text-navy-800">
                              {student.first_name} {student.last_name}
                            </p>
                            <p className="text-sm text-gray-600">{student.email}</p>
                            <p className="text-sm text-gold-600">
                              Level {student.level || 1} • {student.total_points || 0} points
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="flex flex-wrap gap-1">
                              {(student.badges || []).slice(0, 2).map((badge, idx) => (
                                <Badge key={idx} name={badge} earned={true} />
                              ))}
                              {(student.badges || []).length === 0 && (
                                <span className="text-xs text-gray-400">No badges yet</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>No students registered yet.</p>
                      <p className="text-sm mt-2">Students will appear here after they sign up.</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-navy-700 mb-6">📈 Quick Stats</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 text-center">
                    <div className="text-3xl font-bold text-blue-600">{adminUsers.filter(u => !u.is_teacher).length}</div>
                    <div className="text-sm text-blue-600 font-medium">Students</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 text-center">
                    <div className="text-3xl font-bold text-green-600">{words.length}</div>
                    <div className="text-sm text-green-600 font-medium">Word Cards</div>
                  </div>
                  <div className="bg-gradient-to-br from-gold-50 to-gold-100 rounded-xl p-6 text-center">
                    <div className="text-3xl font-bold text-gold-600">{adminUsers.filter(u => u.is_teacher).length}</div>
                    <div className="text-sm text-gold-600 font-medium">Teachers</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 text-center">
                    <div className="text-3xl font-bold text-purple-600">
                      {adminUsers.filter(u => !u.is_teacher && (u.total_points || 0) > 0).length}
                    </div>
                    <div className="text-sm text-purple-600 font-medium">Active Learners</div>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-navy-50 rounded-xl">
                  <h4 className="font-semibold text-navy-700 mb-2">💡 Teaching Tips</h4>
                  <ul className="text-sm text-navy-600 space-y-1">
                    <li>• Encourage daily practice for better retention</li>
                    <li>• Monitor student progress through individual sessions</li>
                    <li>• Celebrate badge achievements to motivate learners</li>
                    <li>• Use quiz results to identify challenging concepts</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="mt-8 p-6 bg-gradient-to-r from-gold-50 to-navy-50 rounded-xl">
              <div className="text-center">
                <JamaalCharacter 
                  message="Teachers are the real Word Weaver heroes! Thanks for empowering students!" 
                  size="medium"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default App;