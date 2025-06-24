import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

function App() {
  const [currentView, setCurrentView] = useState('login');
  const [user, setUser] = useState(null);
  const [words, setWords] = useState([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [quizMode, setQuizMode] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizQuestion, setQuizQuestion] = useState(0);
  const [adminUsers, setAdminUsers] = useState([]);

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
      // Try to load user from token
      loadUserData();
    }
  }, []);

  const loadUserData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/words`);
      if (response.data) {
        setWords(response.data);
        setCurrentView('flashcards');
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
      
      // Load words
      const wordsResponse = await axios.get(`${API_BASE_URL}/api/words`);
      setWords(wordsResponse.data);
      setCurrentView('flashcards');
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
      
      // Load words
      const wordsResponse = await axios.get(`${API_BASE_URL}/api/words`);
      setWords(wordsResponse.data);
      setCurrentView('flashcards');
    } catch (error) {
      alert('Registration failed: ' + (error.response?.data?.detail || 'Unknown error'));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setCurrentView('login');
    setWords([]);
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
      await axios.post(`${API_BASE_URL}/api/study-session`, {
        user_id: user.id,
        word_id: words[currentWordIndex].id,
        correct: correct,
        timestamp: new Date().toISOString()
      });
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
      alert(`Quiz completed! Score: ${correct ? quizScore + 1 : quizScore}/10`);
      setQuizMode(false);
    }
  };

  const recordQuizResult = async () => {
    if (!user) return;
    
    try {
      await axios.post(`${API_BASE_URL}/api/quiz-result`, {
        user_id: user.id,
        score: quizScore,
        total_questions: 10,
        timestamp: new Date().toISOString()
      });
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

  // Login View
  if (currentView === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">🏛️ Greek & Latin</h1>
            <p className="text-gray-600">Master Roots, Prefixes & Suffixes</p>
          </div>
          
          <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
            <button 
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                currentView === 'login' ? 'bg-white shadow-sm text-purple-600' : 'text-gray-600'
              }`}
              onClick={() => setCurrentView('login')}
            >
              Login
            </button>
            <button 
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                currentView === 'register' ? 'bg-white shadow-sm text-purple-600' : 'text-gray-600'
              }`}
              onClick={() => setCurrentView('register')}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              value={loginData.email}
              onChange={(e) => setLoginData({...loginData, email: e.target.value})}
              required
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              value={loginData.password}
              onChange={(e) => setLoginData({...loginData, password: e.target.value})}
              required
            />
            <button 
              type="submit"
              className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Register View
  if (currentView === 'register') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">🏛️ Greek & Latin</h1>
            <p className="text-gray-600">Join the Learning Adventure!</p>
          </div>
          
          <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
            <button 
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                currentView === 'login' ? 'bg-white shadow-sm text-purple-600' : 'text-gray-600'
              }`}
              onClick={() => setCurrentView('login')}
            >
              Login
            </button>
            <button 
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                currentView === 'register' ? 'bg-white shadow-sm text-purple-600' : 'text-gray-600'
              }`}
              onClick={() => setCurrentView('register')}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="First Name"
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                value={registerData.first_name}
                onChange={(e) => setRegisterData({...registerData, first_name: e.target.value})}
                required
              />
              <input
                type="text"
                placeholder="Last Name"
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                value={registerData.last_name}
                onChange={(e) => setRegisterData({...registerData, last_name: e.target.value})}
                required
              />
            </div>
            <input
              type="email"
              placeholder="Email"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              value={registerData.email}
              onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
              required
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              value={registerData.password}
              onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
              required
            />
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                checked={registerData.is_teacher}
                onChange={(e) => setRegisterData({...registerData, is_teacher: e.target.checked})}
              />
              <span className="text-sm text-gray-600">I am a teacher</span>
            </label>
            <button 
              type="submit"
              className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
            >
              Register
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Main App View
  if (words.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading words...</p>
        </div>
      </div>
    );
  }

  const currentWord = words[currentWordIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500">
      {/* Header */}
      <header className="bg-white shadow-lg p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-bold text-gray-800">🏛️ Greek & Latin Academy</h1>
            <span className="text-sm text-gray-600">Welcome, {user?.first_name}!</span>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setCurrentView('flashcards')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                currentView === 'flashcards' ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              📚 Study
            </button>
            {user?.is_teacher && (
              <button
                onClick={() => { setCurrentView('admin'); loadAdminData(); }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentView === 'admin' ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
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
      </header>

      {/* Admin View */}
      {currentView === 'admin' && user?.is_teacher && (
        <div className="max-w-6xl mx-auto p-6">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">👩‍🏫 Teacher Dashboard</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-gray-700 mb-4">📊 Student Overview</h3>
                <div className="space-y-3">
                  {adminUsers.map((student, index) => (
                    <div key={student.id} className="bg-gray-50 rounded-lg p-4 border-l-4 border-purple-500">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-800">
                            {student.first_name} {student.last_name}
                          </p>
                          <p className="text-sm text-gray-600">{student.email}</p>
                          <p className="text-xs text-gray-500">
                            Joined: {new Date(student.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            student.is_teacher ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {student.is_teacher ? 'Teacher' : 'Student'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-gray-700 mb-4">📈 Quick Stats</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{adminUsers.filter(u => !u.is_teacher).length}</div>
                    <div className="text-sm text-blue-600">Students</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{words.length}</div>
                    <div className="text-sm text-green-600">Word Cards</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">{adminUsers.filter(u => u.is_teacher).length}</div>
                    <div className="text-sm text-purple-600">Teachers</div>
                  </div>
                  <div className="bg-pink-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-pink-600">100%</div>
                    <div className="text-sm text-pink-600">Awesome</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Flashcards View */}
      {currentView === 'flashcards' && (
        <div className="max-w-4xl mx-auto p-6">
          {/* Study Controls */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <span className="text-lg font-medium text-gray-700">
                  Card {currentWordIndex + 1} of {words.length}
                </span>
                {quizMode && (
                  <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                    Quiz Mode - Question {quizQuestion + 1}/10 (Score: {quizScore})
                  </span>
                )}
              </div>
              <div className="flex space-x-2">
                {!quizMode && (
                  <button
                    onClick={startQuiz}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
                  >
                    🧠 Start Quiz
                  </button>
                )}
                {quizMode && (
                  <button
                    onClick={() => setQuizMode(false)}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Exit Quiz
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Flashcard */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 mb-6 min-h-96 flex flex-col justify-center items-center text-center transform transition-all duration-300 hover:scale-105">
            <div className="mb-6">
              <span className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wide ${
                currentWord.type === 'prefix' ? 'bg-blue-100 text-blue-800' :
                currentWord.type === 'suffix' ? 'bg-green-100 text-green-800' :
                'bg-purple-100 text-purple-800'
              }`}>
                {currentWord.type} • {currentWord.origin}
              </span>
            </div>
            
            <div className="text-6xl font-bold text-gray-800 mb-4">
              {currentWord.root}
            </div>
            
            {showAnswer ? (
              <div className="space-y-4 animate-fadeIn">
                <div className="text-2xl text-gray-700 font-semibold">
                  "{currentWord.meaning}"
                </div>
                <div className="text-lg text-gray-600 max-w-2xl">
                  {currentWord.definition}
                </div>
                <div className="mt-6">
                  <h4 className="text-lg font-semibold text-gray-700 mb-2">Examples:</h4>
                  <div className="flex flex-wrap justify-center gap-2">
                    {currentWord.examples.map((example, index) => (
                      <span key={index} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                        {example}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-xl text-gray-500 mb-8">
                  {quizMode ? "What does this mean?" : "Click 'Show Answer' to reveal the meaning"}
                </div>
                <button
                  onClick={() => setShowAnswer(true)}
                  className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-semibold hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105 shadow-lg"
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
              className="flex items-center space-x-2 px-6 py-3 bg-white text-gray-700 rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 font-medium"
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
                      className="px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-medium"
                    >
                      ❌ Incorrect
                    </button>
                    <button
                      onClick={() => answerQuiz(true)}
                      className="px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors font-medium"
                    >
                      ✅ Correct
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => { recordStudySession(false); nextCard(); }}
                      className="px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-medium"
                    >
                      😵 Hard
                    </button>
                    <button
                      onClick={() => { recordStudySession(true); nextCard(); }}
                      className="px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors font-medium"
                    >
                      😊 Easy
                    </button>
                  </>
                )}
              </div>
            )}

            <button
              onClick={nextCard}
              className="flex items-center space-x-2 px-6 py-3 bg-white text-gray-700 rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 font-medium"
            >
              <span>Next</span>
              <span>➡️</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;