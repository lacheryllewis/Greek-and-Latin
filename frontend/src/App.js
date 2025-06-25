import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;

// Greek and Latin Academy Logo Component
const AcademyLogo = () => (
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
      <h2 className="text-xl font-bold text-navy-700">Greek and Latin Academy</h2>
      <p className="text-sm text-gray-500">Master the Building Blocks of Language</p>
    </div>
  </div>
);

// Jamaal Character Component with uploaded image
const JamaalCharacter = ({ message, size = "medium" }) => {
  const sizeClasses = {
    small: "w-16 h-16",
    medium: "w-32 h-32", 
    large: "w-48 h-48"
  };

  return (
    <div className="flex flex-col items-center">
      {/* Use the actual Jamaal image - converted to proper base64 */}
      <div className={`${sizeClasses[size]} relative overflow-hidden rounded-full border-4 border-gold-500 shadow-lg`}>
        <div className="w-full h-full bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center relative">
          {/* Jamaal character representation */}
          <div className="text-center">
            <div className="text-4xl mb-1">👨🏾‍🎓</div>
            <div className="text-xs font-bold text-navy-900">JAMAAL</div>
            <div className="text-xs text-navy-700">Word Weaver</div>
          </div>
          {/* Glow effect */}
          <div className="absolute inset-0 bg-yellow-300 rounded-full animate-pulse opacity-20"></div>
        </div>
      </div>
      {message && (
        <div className="mt-2 bg-white rounded-lg px-4 py-2 shadow-lg border-l-4 border-gold-500 relative max-w-xs">
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

// Study Set Selection Component
const StudySetSelector = ({ studySets, selectedSet, onSetChange }) => (
  <div className="mb-6">
    <label className="block text-sm font-medium text-navy-700 mb-2">
      Select Study Set:
    </label>
    <select 
      value={selectedSet} 
      onChange={(e) => onSetChange(e.target.value)}
      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
    >
      <option value="all">All Words ({studySets.all?.length || 0})</option>
      {Object.entries(studySets).filter(([key]) => key !== 'all').map(([setName, words]) => (
        <option key={setName} value={setName}>
          {setName} ({words.length} words)
        </option>
      ))}
    </select>
  </div>
);

// Multiple Choice Component
const MultipleChoice = ({ currentWord, onAnswer }) => {
  const [choices, setChoices] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);

  useEffect(() => {
    if (currentWord) {
      // Generate multiple choice options
      const correctAnswer = currentWord.meaning;
      const wrongAnswers = [
        "to move or transport",
        "related to sound or music", 
        "concerning light or vision",
        "about time or measurement",
        "dealing with earth or ground",
        "involving life or living things"
      ].filter(answer => answer !== correctAnswer).slice(0, 2);
      
      const allChoices = [correctAnswer, ...wrongAnswers].sort(() => Math.random() - 0.5);
      setChoices(allChoices);
      setSelectedAnswer(null);
    }
  }, [currentWord]);

  const handleChoiceClick = (choice) => {
    setSelectedAnswer(choice);
    const isCorrect = choice === currentWord.meaning;
    setTimeout(() => {
      onAnswer(isCorrect);
      setSelectedAnswer(null);
    }, 1000);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-navy-800 mb-4">
        What does "{currentWord?.root}" mean?
      </h3>
      <div className="space-y-3">
        {choices.map((choice, index) => (
          <button
            key={index}
            onClick={() => handleChoiceClick(choice)}
            disabled={selectedAnswer !== null}
            className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
              selectedAnswer === null
                ? 'border-gray-300 hover:border-gold-400 hover:bg-gold-50'
                : selectedAnswer === choice
                ? choice === currentWord.meaning
                  ? 'border-green-500 bg-green-100 text-green-800'
                  : 'border-red-500 bg-red-100 text-red-800'
                : choice === currentWord.meaning
                ? 'border-green-500 bg-green-100 text-green-800'
                : 'border-gray-300 bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{choice}</span>
              {selectedAnswer && choice === currentWord.meaning && (
                <span className="text-green-600">✓</span>
              )}
              {selectedAnswer && selectedAnswer === choice && choice !== currentWord.meaning && (
                <span className="text-red-600">✗</span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

// Slide Creator Component
const SlideCreator = ({ onSave, onCancel, editingSlide = null }) => {
  const [slideData, setSlideData] = useState({
    root: '',
    type: 'root',
    origin: 'Greek',
    meaning: '',
    definition: '',
    examples: ['', '', ''],
    difficulty: 'beginner',
    category: '',
    image: null
  });

  useEffect(() => {
    if (editingSlide) {
      setSlideData({
        ...editingSlide,
        examples: editingSlide.examples || ['', '', '']
      });
    }
  }, [editingSlide]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSlideData(prev => ({
          ...prev,
          image: e.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExampleChange = (index, value) => {
    const newExamples = [...slideData.examples];
    newExamples[index] = value;
    setSlideData(prev => ({
      ...prev,
      examples: newExamples
    }));
  };

  const handleSave = () => {
    const cleanedData = {
      ...slideData,
      examples: slideData.examples.filter(ex => ex.trim() !== ''),
      points: slideData.difficulty === 'beginner' ? 10 : 
              slideData.difficulty === 'intermediate' ? 15 : 20
    };
    onSave(cleanedData);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-navy-800 mb-6">
        {editingSlide ? 'Edit Slide' : 'Create New Slide'}
      </h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-2">
              Root/Affix/Suffix
            </label>
            <input
              type="text"
              value={slideData.root}
              onChange={(e) => setSlideData(prev => ({...prev, root: e.target.value}))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500"
              placeholder="e.g., graph, -ology, pre-"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-2">Type</label>
              <select
                value={slideData.type}
                onChange={(e) => setSlideData(prev => ({...prev, type: e.target.value}))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500"
              >
                <option value="prefix">Prefix</option>
                <option value="root">Root</option>
                <option value="suffix">Suffix</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-2">Origin</label>
              <select
                value={slideData.origin}
                onChange={(e) => setSlideData(prev => ({...prev, origin: e.target.value}))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500"
              >
                <option value="Greek">Greek</option>
                <option value="Latin">Latin</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-navy-700 mb-2">Meaning</label>
            <input
              type="text"
              value={slideData.meaning}
              onChange={(e) => setSlideData(prev => ({...prev, meaning: e.target.value}))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500"
              placeholder="e.g., write, draw"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-navy-700 mb-2">Definition</label>
            <textarea
              value={slideData.definition}
              onChange={(e) => setSlideData(prev => ({...prev, definition: e.target.value}))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500"
              rows="3"
              placeholder="A detailed explanation of the meaning..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-navy-700 mb-2">Examples</label>
            {slideData.examples.map((example, index) => (
              <input
                key={index}
                type="text"
                value={example}
                onChange={(e) => handleExampleChange(index, e.target.value)}
                className="w-full p-2 mb-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500"
                placeholder={`Example ${index + 1}`}
              />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-2">Difficulty</label>
              <select
                value={slideData.difficulty}
                onChange={(e) => setSlideData(prev => ({...prev, difficulty: e.target.value}))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500"
              >
                <option value="beginner">Beginner (10 pts)</option>
                <option value="intermediate">Intermediate (15 pts)</option>
                <option value="advanced">Advanced (20 pts)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-2">Category</label>
              <input
                type="text"
                value={slideData.category}
                onChange={(e) => setSlideData(prev => ({...prev, category: e.target.value}))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500"
                placeholder="e.g., communication"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-navy-700 mb-2">Upload Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500"
            />
            {slideData.image && (
              <div className="mt-2">
                <img 
                  src={slideData.image} 
                  alt="Preview" 
                  className="w-32 h-32 object-cover rounded-lg border"
                />
              </div>
            )}
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-navy-700 mb-2">Preview</h3>
            <div className="text-4xl font-bold text-navy-800 mb-2">{slideData.root || 'Your Root'}</div>
            <div className="text-sm text-gray-600 mb-1">
              {slideData.type} • {slideData.origin} • {slideData.difficulty}
            </div>
            <div className="text-lg text-navy-700">"{slideData.meaning || 'meaning'}"</div>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-4 mt-6">
        <button
          onClick={onCancel}
          className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-navy-900 rounded-lg font-semibold hover:from-gold-600 hover:to-gold-700 transition-all"
        >
          {editingSlide ? 'Update Slide' : 'Create Slide'}
        </button>
      </div>
    </div>
  );
};

// Backup Manager Component
const BackupManager = ({ backups, onCreateBackup, onRestoreBackup, onCancel }) => {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-navy-800 mb-6">🔐 Backup Management</h2>
      
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-blue-800 mb-2">📋 About Backups</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Automatic backups are created every time the system starts</li>
          <li>• Manual backups preserve your current word cards with a timestamp</li>
          <li>• Restoring a backup will replace all current word cards</li>
          <li>• A safety backup is automatically created before any restoration</li>
        </ul>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-navy-700">Available Backups ({backups.length})</h3>
        <button
          onClick={onCreateBackup}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
        >
          📁 Create New Backup
        </button>
      </div>

      <div className="max-h-64 overflow-y-auto space-y-3 border rounded-lg p-4 bg-gray-50">
        {backups.map((backup, index) => (
          <div key={backup.collection_name} className="flex justify-between items-center p-4 bg-white rounded-lg border hover:shadow-sm transition-all">
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <span className={`px-2 py-1 rounded text-xs font-bold ${
                  index === 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {index === 0 ? 'Latest' : `#${index + 1}`}
                </span>
                <span className="font-semibold text-navy-800">{backup.readable_time}</span>
                <span className="text-sm text-gray-600">{backup.word_count} words</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Collection: {backup.collection_name}
              </div>
            </div>
            <button
              onClick={() => onRestoreBackup(backup.collection_name, backup.word_count)}
              className="px-4 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
            >
              🔄 Restore
            </button>
          </div>
        ))}
        {backups.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No backups available yet.</p>
            <p className="text-sm mt-2">Create your first backup to protect your word cards.</p>
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-4 mt-6">
        <button
          onClick={onCancel}
          className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};

// Study Set Creator Component
const StudySetCreator = ({ words, onSave, onCancel }) => {
  const [setName, setSetName] = useState('');
  const [setDescription, setSetDescription] = useState('');
  const [selectedWords, setSelectedWords] = useState([]);

  const handleWordToggle = (wordId) => {
    setSelectedWords(prev => 
      prev.includes(wordId) 
        ? prev.filter(id => id !== wordId)
        : [...prev, wordId]
    );
  };

  const handleSave = () => {
    if (!setName.trim()) {
      alert('Please enter a study set name');
      return;
    }
    if (selectedWords.length === 0) {
      alert('Please select at least one word');
      return;
    }
    
    onSave({
      name: setName,
      description: setDescription,
      word_ids: selectedWords
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold text-navy-800 mb-6">Create Custom Study Set</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-2">
              Study Set Name *
            </label>
            <input
              type="text"
              value={setName}
              onChange={(e) => setSetName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500"
              placeholder="e.g., Greek Roots - Week 1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-navy-700 mb-2">
              Description
            </label>
            <textarea
              value={setDescription}
              onChange={(e) => setSetDescription(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500"
              rows="3"
              placeholder="Optional description for this study set..."
            />
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-navy-700 mb-2">Selected Words</h3>
            <p className="text-sm text-gray-600 mb-2">{selectedWords.length} words selected</p>
            <div className="max-h-32 overflow-y-auto">
              {selectedWords.map(wordId => {
                const word = words.find(w => w.id === wordId);
                return word ? (
                  <div key={wordId} className="text-xs bg-gold-100 text-navy-700 px-2 py-1 rounded mb-1">
                    {word.root}
                  </div>
                ) : null;
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <h3 className="text-lg font-semibold text-navy-700 mb-4">
            Select Words for Study Set ({words.length} available)
          </h3>
          <div className="max-h-96 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-3">
            {words.map((word) => (
              <div
                key={word.id}
                onClick={() => handleWordToggle(word.id)}
                className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedWords.includes(word.id)
                    ? 'border-gold-500 bg-gold-50'
                    : 'border-gray-200 hover:border-gold-300 hover:bg-gold-25'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-navy-800">{word.root}</div>
                    <div className="text-sm text-gray-600">
                      {word.type} • {word.origin} • {word.difficulty}
                    </div>
                    <div className="text-sm text-navy-600">"{word.meaning}"</div>
                  </div>
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    selectedWords.includes(word.id)
                      ? 'border-gold-500 bg-gold-500'
                      : 'border-gray-300'
                  }`}>
                    {selectedWords.includes(word.id) && (
                      <span className="text-white text-xs">✓</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-4 mt-6">
        <button
          onClick={onCancel}
          className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-navy-900 rounded-lg font-semibold hover:from-gold-600 hover:to-gold-700 transition-all"
        >
          Create Study Set
        </button>
      </div>
    </div>
  );
};

function App() {
  const [currentView, setCurrentView] = useState('welcome');
  const [user, setUser] = useState(null);
  const [words, setWords] = useState([]);
  const [studySets, setStudySets] = useState({ all: [] });
  const [selectedStudySet, setSelectedStudySet] = useState('all');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [useMultipleChoice, setUseMultipleChoice] = useState(true);
  const [quizMode, setQuizMode] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizQuestion, setQuizQuestion] = useState(0);
  const [adminUsers, setAdminUsers] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [showSlideCreator, setShowSlideCreator] = useState(false);
  const [showStudySetCreator, setShowStudySetCreator] = useState(false);
  const [showBackupManager, setShowBackupManager] = useState(false);
  const [showStudentManager, setShowStudentManager] = useState(false);
  const [showStudentProfile, setShowStudentProfile] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [studentAnalytics, setStudentAnalytics] = useState(null);
  const [backups, setBackups] = useState([]);
  const [editingSlide, setEditingSlide] = useState(null);
  const [showLoginCodeManager, setShowLoginCodeManager] = useState(false);
  const [loginCodes, setLoginCodes] = useState([]);
  const [loginCodeToValidate, setLoginCodeToValidate] = useState('');
  const [validatedCodeInfo, setValidatedCodeInfo] = useState(null);
  const [showPrintableView, setShowPrintableView] = useState(false);
  const [sortOrder, setSortOrder] = useState('alphabetical'); // 'alphabetical' or 'type'

  // Auth forms state
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    email: '', password: '', first_name: '', last_name: '', is_teacher: false,
    grade: '', school: '', block_number: '', teacher: ''
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
        // Update words for both Learning and Study tabs
        console.log('Setting words:', wordsResponse.data.length);
        setWords(wordsResponse.data);
        
        // Ensure study sets are properly updated with all words
        const updatedStudySets = { 
          all: wordsResponse.data,
          ...Object.fromEntries(
            Object.entries(studySets).filter(([key]) => key !== 'all')
          )
        };
        setStudySets(updatedStudySets);
        
        setUserProfile(profileResponse.data);
        setUser(profileResponse.data);
        setCurrentView('dashboard');
        
        console.log(`Loaded ${wordsResponse.data.length} words for Learning and Study modes`);
        console.log('Updated study sets:', updatedStudySets);
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
      localStorage.removeItem('token');
    }
  };

  const getCurrentWords = () => {
    return studySets[selectedStudySet] || studySets.all || [];
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_BASE_URL}/api/login`, loginData);
      const { access_token, user } = response.data;
      
      localStorage.setItem('token', access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      setUser(user);
      
      await loadUserData();
    } catch (error) {
      alert('Login failed: ' + (error.response?.data?.detail || 'Unknown error'));
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      // Use the new registration endpoint that supports login codes
      const registrationData = {
        ...registerData,
        login_code: loginCodeToValidate || null
      };
      
      const response = await axios.post(`${API_BASE_URL}/api/register-with-code`, registrationData);
      const { access_token, user, class_info, used_login_code } = response.data;
      
      localStorage.setItem('token', access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      setUser(user);
      
      await loadUserData();
      
      // Show success message with class info if available
      if (class_info && used_login_code) {
        alert(`🎉 Welcome to ${class_info.class_name}!\n\nTeacher: ${class_info.teacher_name}\nLogin Code: ${used_login_code}\n\nYou're now registered and ready to start learning!`);
      } else {
        alert('🎉 Registration successful! Welcome to Greek and Latin Academy!');
      }
      
      setCurrentView('dashboard');
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
    const currentWords = getCurrentWords();
    setCurrentWordIndex((prev) => (prev + 1) % currentWords.length);
  };

  const prevCard = () => {
    setShowAnswer(false);
    const currentWords = getCurrentWords();
    setCurrentWordIndex((prev) => (prev - 1 + currentWords.length) % currentWords.length);
  };

  const recordStudySession = async (correct) => {
    const currentWords = getCurrentWords();
    if (!user || !currentWords[currentWordIndex]) return;
    
    try {
      const response = await axios.post(`${API_BASE_URL}/api/study-session`, {
        user_id: user.id,
        word_id: currentWords[currentWordIndex].id,
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
    const currentWords = getCurrentWords();
    setCurrentWordIndex(Math.floor(Math.random() * currentWords.length));
    setShowAnswer(false);
  };

  const answerQuiz = (correct) => {
    if (correct) setQuizScore(prev => prev + 1);
    
    if (quizQuestion < 9) {
      setQuizQuestion(prev => prev + 1);
      const currentWords = getCurrentWords();
      setCurrentWordIndex(Math.floor(Math.random() * currentWords.length));
      setShowAnswer(false);
    } else {
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

  const handleCreateSlide = async (slideData) => {
    try {
      console.log('Creating slide with data:', slideData);
      const response = await axios.post(`${API_BASE_URL}/api/admin/create-word`, slideData);
      console.log('Slide creation response:', response);
      
      if (response.status === 200 || response.status === 201) {
        // Immediately refresh the words data to include the new slide
        const wordsResponse = await axios.get(`${API_BASE_URL}/api/words`);
        console.log('Updated words after slide creation:', wordsResponse.data.length);
        
        // Update all state with new data
        setWords(wordsResponse.data);
        setStudySets(prev => ({ 
          ...prev, 
          all: wordsResponse.data 
        }));
        
        // Also refresh user profile data
        await loadUserData();
        
        setShowSlideCreator(false);
        alert(`Slide "${slideData.root}" created successfully! It's now available in Learning and Study modes.`);
      }
    } catch (error) {
      console.error('Slide creation error:', error);
      alert('Failed to create slide: ' + (error.response?.data?.detail || 'Unknown error'));
    }
  };

  const handleEditSlide = async (slideData) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/api/admin/update-word/${editingSlide.id}`, slideData);
      if (response.status === 200 || response.status === 201) {
        // Refresh words data
        const wordsResponse = await axios.get(`${API_BASE_URL}/api/words`);
        setWords(wordsResponse.data);
        setStudySets(prev => ({ 
          ...prev, 
          all: wordsResponse.data 
        }));
        
        setShowSlideCreator(false);
        setEditingSlide(null);
        alert(`Slide "${slideData.root}" updated successfully!`);
      }
    } catch (error) {
      console.error('Slide update error:', error);
      alert('Failed to update slide: ' + (error.response?.data?.detail || 'Unknown error'));
    }
  };

  const handleDeleteSlide = async (slideId, slideRoot) => {
    const confirmed = window.confirm(`⚠️ DELETE SLIDE CONFIRMATION\n\nAre you sure you want to delete the slide "${slideRoot}"?\n\nThis action cannot be undone and will remove the slide from both Learning and Study modes.`);
    
    if (!confirmed) {
      return;
    }

    try {
      console.log(`Deleting slide ${slideId} (${slideRoot})`);
      const response = await axios.delete(`${API_BASE_URL}/api/admin/delete-word/${slideId}`);
      console.log('Delete response:', response);
      
      if (response.status === 200 || response.status === 204) {
        // Immediately refresh words data
        const wordsResponse = await axios.get(`${API_BASE_URL}/api/words`);
        console.log(`Words after deletion: ${wordsResponse.data.length}`);
        
        setWords(wordsResponse.data);
        setStudySets(prev => ({ 
          ...prev, 
          all: wordsResponse.data 
        }));
        
        alert(`✅ Slide "${slideRoot}" has been successfully deleted!\n\nThe slide has been removed from Learning and Study modes.`);
      }
    } catch (error) {
      console.error('Slide deletion error:', error);
      if (error.response?.status === 404) {
        alert(`❌ Slide "${slideRoot}" not found. It may have already been deleted.`);
      } else {
        alert(`❌ Failed to delete slide "${slideRoot}": ${error.response?.data?.detail || 'Unknown error'}`);
      }
    }
  };

  const loadBackups = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/admin/backups`);
      setBackups(response.data);
    } catch (error) {
      console.error('Failed to load backups:', error);
    }
  };

  const createBackup = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/admin/create-backup`);
      alert(`✅ Backup Created Successfully!\n\nWord Count: ${response.data.word_count}\nTimestamp: ${response.data.timestamp}`);
      loadBackups(); // Refresh backup list
    } catch (error) {
      alert('Failed to create backup: ' + (error.response?.data?.detail || 'Unknown error'));
    }
  };

  const restoreBackup = async (collectionName, wordCount) => {
    const confirmed = window.confirm(
      `🔄 RESTORE BACKUP CONFIRMATION\n\n` +
      `Are you sure you want to restore this backup?\n\n` +
      `This will replace all current word cards (${words.length}) with the backup (${wordCount} words).\n\n` +
      `Your current data will be automatically backed up before restoration.`
    );

    if (!confirmed) return;

    try {
      const response = await axios.post(`${API_BASE_URL}/api/admin/restore-backup`, {
        collection_name: collectionName
      });
      
      // Refresh word data after restore
      const wordsResponse = await axios.get(`${API_BASE_URL}/api/words`);
      setWords(wordsResponse.data);
      setStudySets(prev => ({ ...prev, all: wordsResponse.data }));
      
      alert(
        `✅ Backup Restored Successfully!\n\n` +
        `Restored: ${response.data.word_count} word cards\n` +
        `Pre-restore backup created: ${response.data.pre_restore_backup}`
      );
      
      loadBackups(); // Refresh backup list
      setShowBackupManager(false);
    } catch (error) {
      alert('Failed to restore backup: ' + (error.response?.data?.detail || 'Unknown error'));
    }
  };

  const handleCreateStudySet = async (studySetData) => {
    try {
      console.log('Creating study set:', studySetData);
      const response = await axios.post(`${API_BASE_URL}/api/admin/create-study-set`, studySetData);
      console.log('Study set creation response:', response);
      if (response.status === 200 || response.status === 201) {
        // Update local study sets
        const selectedWords = words.filter(word => studySetData.word_ids.includes(word.id));
        setStudySets(prev => ({
          ...prev,
          [studySetData.name]: selectedWords
        }));
        setShowStudySetCreator(false);
        alert('Study set created successfully!');
      }
    } catch (error) {
      console.error('Study set creation error:', error);
      alert('Failed to create study set: ' + (error.response?.data?.detail || 'Unknown error'));
    }
  };

  const createCustomStudySet = (setName, wordIds) => {
    const selectedWords = words.filter(word => wordIds.includes(word.id));
    setStudySets(prev => ({
      ...prev,
      [setName]: selectedWords
    }));
  };

  // Login Code Management Functions
  const loadLoginCodes = async () => {
    if (!user?.is_teacher) return;
    
    try {
      const response = await axios.get(`${API_BASE_URL}/api/admin/login-codes`);
      setLoginCodes(response.data);
    } catch (error) {
      console.error('Failed to load login codes:', error);
    }
  };

  const createLoginCode = async (codeData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/admin/create-login-code`, codeData);
      if (response.status === 200 || response.status === 201) {
        loadLoginCodes(); // Refresh the list
        alert(`✅ Login Code Created Successfully!\n\nCode: ${response.data.login_code.code}\nClass: ${response.data.login_code.class_name}\nMax Uses: ${response.data.login_code.max_uses}\nExpires: ${new Date(response.data.login_code.expires_at).toLocaleDateString()}`);
      }
    } catch (error) {
      console.error('Login code creation error:', error);
      alert('Failed to create login code: ' + (error.response?.data?.detail || 'Unknown error'));
    }
  };

  const toggleLoginCode = async (codeId) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/api/admin/login-code/${codeId}/toggle`);
      if (response.status === 200) {
        loadLoginCodes(); // Refresh the list
        alert(`✅ Login code ${response.data.code} ${response.data.active ? 'activated' : 'deactivated'} successfully!`);
      }
    } catch (error) {
      console.error('Failed to toggle login code:', error);
      alert('Failed to update login code: ' + (error.response?.data?.detail || 'Unknown error'));
    }
  };

  const deleteLoginCode = async (codeId, codeName) => {
    const confirmed = window.confirm(`⚠️ DELETE LOGIN CODE CONFIRMATION\n\nAre you sure you want to delete the login code "${codeName}"?\n\nThis action cannot be undone and students will no longer be able to use this code to register.`);
    
    if (!confirmed) return;

    try {
      const response = await axios.delete(`${API_BASE_URL}/api/admin/login-code/${codeId}`);
      if (response.status === 200) {
        loadLoginCodes(); // Refresh the list
        alert(`✅ Login code "${response.data.code}" deleted successfully!`);
      }
    } catch (error) {
      console.error('Failed to delete login code:', error);
      alert('Failed to delete login code: ' + (error.response?.data?.detail || 'Unknown error'));
    }
  };

  const validateLoginCode = async (code) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/validate-login-code`, { code });
      setValidatedCodeInfo(response.data.class_info);
      return response.data;
    } catch (error) {
      console.error('Login code validation error:', error);
      setValidatedCodeInfo(null);
      throw error;
    }
  };

  const handleRegisterWithCode = async (userData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/register-with-code`, userData);
      if (response.status === 200 || response.status === 201) {
        const token = response.data.access_token;
        localStorage.setItem('token', token);
        setUser(response.data.user);
        
        // Show success message with class info if available
        if (response.data.class_info) {
          alert(`🎉 Welcome to ${response.data.class_info.class_name}!\n\nTeacher: ${response.data.class_info.teacher_name}\nYou're now registered and ready to start learning!`);
        } else {
          alert('🎉 Registration successful! Welcome to Greek and Latin Academy!');
        }
        
        setCurrentView('dashboard');
      }
    } catch (error) {
      console.error('Registration with code error:', error);
      alert('Registration failed: ' + (error.response?.data?.detail || 'Unknown error'));
    }
  };

  // Function to sort words alphabetically or by type
  const getSortedWords = () => {
    if (sortOrder === 'alphabetical') {
      return [...words].sort((a, b) => a.root.localeCompare(b.root));
    } else if (sortOrder === 'type') {
      return [...words].sort((a, b) => {
        // Sort by type first (prefix, root, suffix), then alphabetically within each type
        if (a.type !== b.type) {
          const typeOrder = { 'prefix': 1, 'root': 2, 'suffix': 3 };
          return typeOrder[a.type] - typeOrder[b.type];
        }
        return a.root.localeCompare(b.root);
      });
    }
    return words;
  };

  // Printable View Component
  const PrintableView = () => {
    const sortedWords = getSortedWords();
    const prefixes = sortedWords.filter(word => word.type === 'prefix');
    const roots = sortedWords.filter(word => word.type === 'root');
    const suffixes = sortedWords.filter(word => word.type === 'suffix');

    return (
      <div className="min-h-screen bg-white p-8 print:p-4">
        <div className="max-w-4xl mx-auto">
          {/* Print Header */}
          <div className="text-center mb-8 print:mb-6">
            <h1 className="text-3xl font-bold text-navy-800 mb-2">Greek and Latin Academy</h1>
            <h2 className="text-xl text-gray-600 mb-4">Vocabulary Reference List</h2>
            <div className="text-sm text-gray-500">
              Generated on {new Date().toLocaleDateString()} • Total: {words.length} elements
            </div>
          </div>

          {/* No Print Buttons */}
          <div className="flex justify-between items-center mb-6 print:hidden">
            <button
              onClick={() => setShowPrintableView(false)}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              ← Back to Admin
            </button>
            <div className="flex space-x-2">
              <button
                onClick={() => setSortOrder(sortOrder === 'alphabetical' ? 'type' : 'alphabetical')}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Sort: {sortOrder === 'alphabetical' ? 'Alphabetical' : 'By Type'}
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                🖨️ Print
              </button>
            </div>
          </div>

          {/* Content organized by type */}
          <div className="space-y-8">
            {/* Prefixes Section */}
            {prefixes.length > 0 && (
              <div>
                <h3 className="text-2xl font-bold text-navy-800 mb-4 border-b-2 border-navy-200 pb-2">
                  Greek and Latin Prefixes ({prefixes.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {prefixes.map((word, index) => (
                    <div key={word.id} className="border rounded-lg p-4 print:break-inside-avoid">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded">
                          {word.origin}
                        </span>
                        <span className="font-bold text-lg text-navy-800">{word.root}</span>
                      </div>
                      <div className="text-gray-700 mb-2">
                        <strong>Meaning:</strong> {word.meaning}
                      </div>
                      <div className="text-gray-600 mb-2">
                        <strong>Definition:</strong> {word.definition}
                      </div>
                      <div className="text-gray-600">
                        <strong>Examples:</strong> {word.examples.join(', ')}
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        {word.difficulty} • {word.points} points
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Roots Section */}
            {roots.length > 0 && (
              <div>
                <h3 className="text-2xl font-bold text-navy-800 mb-4 border-b-2 border-navy-200 pb-2">
                  Greek and Latin Roots ({roots.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {roots.map((word, index) => (
                    <div key={word.id} className="border rounded-lg p-4 print:break-inside-avoid">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-bold rounded">
                          {word.origin}
                        </span>
                        <span className="font-bold text-lg text-navy-800">{word.root}</span>
                      </div>
                      <div className="text-gray-700 mb-2">
                        <strong>Meaning:</strong> {word.meaning}
                      </div>
                      <div className="text-gray-600 mb-2">
                        <strong>Definition:</strong> {word.definition}
                      </div>
                      <div className="text-gray-600">
                        <strong>Examples:</strong> {word.examples.join(', ')}
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        {word.difficulty} • {word.points} points
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suffixes Section */}
            {suffixes.length > 0 && (
              <div>
                <h3 className="text-2xl font-bold text-navy-800 mb-4 border-b-2 border-navy-200 pb-2">
                  Greek and Latin Suffixes ({suffixes.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {suffixes.map((word, index) => (
                    <div key={word.id} className="border rounded-lg p-4 print:break-inside-avoid">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-bold rounded">
                          {word.origin}
                        </span>
                        <span className="font-bold text-lg text-navy-800">{word.root}</span>
                      </div>
                      <div className="text-gray-700 mb-2">
                        <strong>Meaning:</strong> {word.meaning}
                      </div>
                      <div className="text-gray-600 mb-2">
                        <strong>Definition:</strong> {word.definition}
                      </div>
                      <div className="text-gray-600">
                        <strong>Examples:</strong> {word.examples.join(', ')}
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        {word.difficulty} • {word.points} points
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer for print */}
          <div className="mt-8 pt-4 border-t text-center text-sm text-gray-500 print:block hidden">
            Greek and Latin Academy • Empower U Educational Platform
          </div>
        </div>
      </div>
    );
  };

  // Printable View
  if (showPrintableView) {
    return <PrintableView />;
  }

  // Welcome Page
  if (currentView === 'welcome') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-12 w-full max-w-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gold-100 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gold-50 rounded-full -ml-12 -mb-12"></div>
          
          <div className="relative z-10">
            <AcademyLogo />
            
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
                👩‍🏫 Administrator? Click here
              </button>
            </div>
            
            <div className="mt-8 text-center">
              <JamaalCharacter 
                message="Ready to master Greek and Latin? Let's unlock the power of language!" 
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
            <AcademyLogo />
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
              
              {/* Login Code Section */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Class Login Code (Optional)</h4>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Enter your class login code (e.g., ABC12345)"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                    value={loginCodeToValidate}
                    onChange={(e) => setLoginCodeToValidate(e.target.value.toUpperCase())}
                  />
                  {loginCodeToValidate && (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await validateLoginCode(loginCodeToValidate);
                        } catch (error) {
                          alert('Invalid login code: ' + (error.response?.data?.detail || 'Code not found'));
                        }
                      }}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all text-sm"
                    >
                      Validate Code
                    </button>
                  )}
                  {validatedCodeInfo && (
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-sm text-green-800">
                        <span className="font-medium">✅ Valid Code!</span> This will add you to:
                      </p>
                      <div className="text-sm text-green-700 mt-1">
                        <p><strong>Class:</strong> {validatedCodeInfo.class_name}</p>
                        <p><strong>Teacher:</strong> {validatedCodeInfo.teacher_name}</p>
                        {validatedCodeInfo.school && <p><strong>School:</strong> {validatedCodeInfo.school}</p>}
                        {validatedCodeInfo.grade && <p><strong>Grade:</strong> {validatedCodeInfo.grade}</p>}
                        <p className="text-xs mt-1">Uses remaining: {validatedCodeInfo.uses_remaining}</p>
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-gray-500">
                    Have a login code from your teacher? Enter it above to automatically join their class!
                  </p>
                </div>
              </div>
              
              {/* Student Profile Information */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                  Student Information {validatedCodeInfo && <span className="text-green-600 text-xs">(Auto-filled from login code)</span>}
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <select
                    className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                    value={validatedCodeInfo?.grade || registerData.grade}
                    onChange={(e) => setRegisterData({...registerData, grade: e.target.value})}
                    required={!validatedCodeInfo}
                    disabled={validatedCodeInfo && validatedCodeInfo.grade}
                  >
                    <option value="">Select Grade</option>
                    <option value="6th">6th Grade</option>
                    <option value="7th">7th Grade</option>
                    <option value="8th">8th Grade</option>
                    <option value="9th">9th Grade</option>
                    <option value="10th">10th Grade</option>
                    <option value="11th">11th Grade</option>
                    <option value="12th">12th Grade</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Block Number"
                    className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                    value={validatedCodeInfo?.block_number || registerData.block_number}
                    onChange={(e) => setRegisterData({...registerData, block_number: e.target.value})}
                    required={!validatedCodeInfo}
                    disabled={validatedCodeInfo && validatedCodeInfo.block_number}
                  />
                </div>
                <input
                  type="text"
                  placeholder="School Name"
                  className="w-full mt-3 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                  value={validatedCodeInfo?.school || registerData.school}
                  onChange={(e) => setRegisterData({...registerData, school: e.target.value})}
                  required={!validatedCodeInfo}
                  disabled={validatedCodeInfo && validatedCodeInfo.school}
                />
                <input
                  type="text"
                  placeholder="Teacher Name"
                  className="w-full mt-3 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                  value={validatedCodeInfo?.teacher_name || registerData.teacher}
                  onChange={(e) => setRegisterData({...registerData, teacher: e.target.value})}
                  required={!validatedCodeInfo}
                  disabled={validatedCodeInfo && validatedCodeInfo.teacher_name}
                />
              </div>
              
              <button 
                type="submit"
                className="w-full bg-gradient-to-r from-gold-500 to-gold-600 text-navy-900 py-3 rounded-lg font-semibold hover:from-gold-600 hover:to-gold-700 transition-all"
              >
                Join the Academy
              </button>
            </form>
          )}
          
          <div className="mt-6 text-center">
            <JamaalCharacter 
              message={currentView === 'student-login' ? "Welcome back to the Academy!" : "Ready to start your journey?"} 
              size="small"
            />
          </div>
        </div>
      </div>
    );
  }

  // Administrator Login Page
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
            <AcademyLogo />
            <h3 className="text-xl font-semibold text-navy-700 mt-4">Administrator Access</h3>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="email"
              placeholder="Administrator Email"
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
              Access Administrator Dashboard
            </button>
          </form>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 text-center">
              Administrator accounts are invitation-only. Contact your system administrator for access.
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
          <p className="text-lg">Loading your Academy journey...</p>
          <JamaalCharacter message="Getting everything ready for you!" size="small" />
        </div>
      </div>
    );
  }

  // Login Code Manager Component
  const LoginCodeManager = () => {
    const [showCreateForm, setShowCreateForm] = useState(true);
    
    // Use refs for persistent storage that survives re-renders
    const persistentFormData = useRef({
      className: '',
      blockNumber: '',
      school: '',
      grade: '',
      maxUses: '50',
      expiresInDays: '30'
    });
    
    // State for UI updates only - synced with ref
    const [formDisplayData, setFormDisplayData] = useState({
      className: '',
      blockNumber: '',
      school: '',
      grade: '',
      maxUses: '50',
      expiresInDays: '30'
    });
    
    const [isLoading, setIsLoading] = useState(false);
    const [debugLog, setDebugLog] = useState([]);
    
    // Add debug log entry
    const addDebugLog = (message) => {
      const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
      const logEntry = `${timestamp}: ${message}`;
      console.log('🔍 DEBUG:', logEntry);
      setDebugLog(prev => [...prev.slice(-10), logEntry]); // Keep last 10 entries
    };

    // TEMPORARILY DISABLE ALL EXTERNAL EFFECTS
    // useEffect(() => {
    //   const loadCodesOnce = async () => {
    //     try {
    //       await loadLoginCodes();
    //     } catch (error) {
    //       console.error('Error loading login codes:', error);
    //     }
    //   };
    //   loadCodesOnce();
    // }, []);

    // Protected update function that logs every change
    const updateFormField = (fieldName, newValue, source = 'user') => {
      const oldValue = persistentFormData.current[fieldName];
      
      addDebugLog(`Field "${fieldName}" changing from "${oldValue}" to "${newValue}" (source: ${source})`);
      
      // Get call stack to see what's calling this
      const stack = new Error().stack;
      console.log('🔍 CALL STACK for field update:', stack);
      
      // Update persistent ref
      persistentFormData.current[fieldName] = newValue;
      
      // Update display state
      setFormDisplayData(prev => {
        const newState = { ...prev, [fieldName]: newValue };
        addDebugLog(`Display state updated for "${fieldName}"`);
        return newState;
      });
    };

    // Monitor for unwanted resets
    useEffect(() => {
      const checkForResets = () => {
        Object.keys(formDisplayData).forEach(key => {
          const refValue = persistentFormData.current[key];
          const stateValue = formDisplayData[key];
          
          if (refValue !== stateValue) {
            addDebugLog(`🚨 MISMATCH DETECTED: ${key} - Ref: "${refValue}", State: "${stateValue}"`);
            // Restore from ref
            setFormDisplayData(prev => ({
              ...prev,
              [key]: refValue
            }));
          }
        });
      };
      
      const interval = setInterval(checkForResets, 1000);
      return () => clearInterval(interval);
    }, [formDisplayData]);

    // Track any external state changes
    useEffect(() => {
      addDebugLog('FormDisplayData changed: ' + JSON.stringify(formDisplayData));
    }, [formDisplayData]);

    const handleFormSubmit = async (e) => {
      e.preventDefault();
      setIsLoading(true);
      addDebugLog('Form submission started');
      
      const formData = {
        class_name: persistentFormData.current.className,
        block_number: persistentFormData.current.blockNumber,
        school: persistentFormData.current.school,
        grade: persistentFormData.current.grade,
        max_uses: parseInt(persistentFormData.current.maxUses) || 50,
        expires_in_days: parseInt(persistentFormData.current.expiresInDays) || 30
      };
      
      console.log('Submitting:', formData);
      
      try {
        await createLoginCode(formData);
        
        // Reset form explicitly
        addDebugLog('Explicit form reset after successful submission');
        persistentFormData.current = {
          className: '',
          blockNumber: '',
          school: '',
          grade: '',
          maxUses: '50',
          expiresInDays: '30'
        };
        
        setFormDisplayData({
          className: '',
          blockNumber: '',
          school: '',
          grade: '',
          maxUses: '50',
          expiresInDays: '30'
        });
        
        alert('Login code created successfully!');
        
        // TEMPORARILY DISABLED - DON'T RELOAD CODES
        // await loadLoginCodes();
      } catch (error) {
        console.error('Error:', error);
        alert('Error creating login code: ' + (error.response?.data?.detail || error.message || 'Unknown error'));
      } finally {
        setIsLoading(false);
        addDebugLog('Form submission completed');
      }
    };

    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '30px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <div>
              <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1e293b', margin: '0 0 8px 0' }}>
                Login Code Management (DEBUG MODE)
              </h2>
              <p style={{ color: '#6b7280', margin: 0 }}>
                External effects DISABLED for debugging
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  addDebugLog('Toggle button clicked');
                  setShowCreateForm(!showCreateForm);
                }}
                style={{
                  padding: '12px 24px',
                  backgroundColor: showCreateForm ? '#ef4444' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                {showCreateForm ? '✕ Hide Form' : '+ Show Form'}
              </button>
              <button
                type="button"
                onClick={() => setShowLoginCodeManager(false)}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                ← Back to Admin
              </button>
            </div>
          </div>

          {/* Debug Log */}
          <div style={{ 
            padding: '10px', 
            backgroundColor: '#fef3c7', 
            border: '1px solid #f59e0b', 
            borderRadius: '6px',
            marginBottom: '20px',
            fontSize: '12px',
            fontFamily: 'monospace',
            maxHeight: '150px',
            overflowY: 'auto'
          }}>
            <strong>🔍 REAL-TIME DEBUG LOG:</strong><br/>
            {debugLog.map((log, index) => (
              <div key={index}>{log}</div>
            ))}
          </div>

          {/* Create Form */}
          {showCreateForm && (
            <div style={{ 
              backgroundColor: '#eff6ff', 
              padding: '30px', 
              borderRadius: '10px', 
              border: '2px solid #3b82f6',
              marginBottom: '30px'
            }}>
              <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#1e40af', marginBottom: '20px' }}>
                🔑 Create New Login Code (PROTECTED STATE)
              </h3>
              
              <form onSubmit={handleFormSubmit} style={{ pointerEvents: 'auto' }}>
                
                {/* Class Name */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '8px', color: '#374151' }}>
                    Class Name * (Required)
                  </label>
                  <input
                    type="text"
                    value={formDisplayData.className}
                    onChange={(e) => {
                      updateFormField('className', e.target.value, 'user-typing');
                    }}
                    onFocus={() => addDebugLog('Class name input focused')}
                    onBlur={() => addDebugLog('Class name input blurred')}
                    required
                    disabled={isLoading}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '3px solid #22c55e', // Green border to indicate protection
                      borderRadius: '6px',
                      fontSize: '16px',
                      backgroundColor: isLoading ? '#f3f4f6' : 'white',
                      pointerEvents: 'auto',
                      cursor: isLoading ? 'not-allowed' : 'text',
                      opacity: isLoading ? 0.6 : 1
                    }}
                    placeholder="Enter class name (e.g., English 10)"
                  />
                </div>

                {/* Block Number */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '8px', color: '#374151' }}>
                    Block Number
                  </label>
                  <input
                    type="text"
                    value={formDisplayData.blockNumber}
                    onChange={(e) => {
                      updateFormField('blockNumber', e.target.value, 'user-typing');
                    }}
                    disabled={isLoading}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '3px solid #22c55e',
                      borderRadius: '6px',
                      fontSize: '16px',
                      backgroundColor: isLoading ? '#f3f4f6' : 'white',
                      pointerEvents: 'auto',
                      cursor: isLoading ? 'not-allowed' : 'text',
                      opacity: isLoading ? 0.6 : 1
                    }}
                    placeholder="Enter block number (e.g., Block A)"
                  />
                </div>

                {/* School */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '8px', color: '#374151' }}>
                    School
                  </label>
                  <input
                    type="text"
                    value={formDisplayData.school}
                    onChange={(e) => {
                      updateFormField('school', e.target.value, 'user-typing');
                    }}
                    disabled={isLoading}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '3px solid #22c55e',
                      borderRadius: '6px',
                      fontSize: '16px',
                      backgroundColor: isLoading ? '#f3f4f6' : 'white',
                      pointerEvents: 'auto',
                      cursor: isLoading ? 'not-allowed' : 'text',
                      opacity: isLoading ? 0.6 : 1
                    }}
                    placeholder="Enter school name"
                  />
                </div>

                {/* Grade Level */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '8px', color: '#374151' }}>
                    Grade Level
                  </label>
                  <select
                    value={formDisplayData.grade}
                    onChange={(e) => {
                      updateFormField('grade', e.target.value, 'user-selection');
                    }}
                    disabled={isLoading}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '3px solid #22c55e',
                      borderRadius: '6px',
                      fontSize: '16px',
                      backgroundColor: isLoading ? '#f3f4f6' : 'white',
                      pointerEvents: 'auto',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      opacity: isLoading ? 0.6 : 1
                    }}
                  >
                    <option value="">Select Grade</option>
                    <option value="6th">6th Grade</option>
                    <option value="7th">7th Grade</option>
                    <option value="8th">8th Grade</option>
                    <option value="9th">9th Grade</option>
                    <option value="10th">10th Grade</option>
                    <option value="11th">11th Grade</option>
                    <option value="12th">12th Grade</option>
                  </select>
                </div>

                {/* Max Uses */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '8px', color: '#374151' }}>
                    Maximum Uses
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={formDisplayData.maxUses}
                    onChange={(e) => {
                      updateFormField('maxUses', e.target.value, 'user-typing');
                    }}
                    disabled={isLoading}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '3px solid #22c55e',
                      borderRadius: '6px',
                      fontSize: '16px',
                      backgroundColor: isLoading ? '#f3f4f6' : 'white',
                      pointerEvents: 'auto',
                      cursor: isLoading ? 'not-allowed' : 'text',
                      opacity: isLoading ? 0.6 : 1
                    }}
                  />
                </div>

                {/* Expires In Days */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '8px', color: '#374151' }}>
                    Expires In (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={formDisplayData.expiresInDays}
                    onChange={(e) => {
                      updateFormField('expiresInDays', e.target.value, 'user-typing');
                    }}
                    disabled={isLoading}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '3px solid #22c55e',
                      borderRadius: '6px',
                      fontSize: '16px',
                      backgroundColor: isLoading ? '#f3f4f6' : 'white',
                      pointerEvents: 'auto',
                      cursor: isLoading ? 'not-allowed' : 'text',
                      opacity: isLoading ? 0.6 : 1
                    }}
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading || !formDisplayData.className.trim()}
                  style={{
                    width: '100%',
                    padding: '16px',
                    backgroundColor: isLoading || !formDisplayData.className.trim() ? '#9ca3af' : '#1d4ed8',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '18px',
                    fontWeight: '600',
                    cursor: isLoading || !formDisplayData.className.trim() ? 'not-allowed' : 'pointer',
                    pointerEvents: 'auto',
                    opacity: isLoading || !formDisplayData.className.trim() ? 0.6 : 1
                  }}
                >
                  {isLoading ? '⏳ Creating...' : '🔑 Generate Login Code'}
                </button>
              </form>
              
              {/* Protected State Display */}
              <div style={{ 
                marginTop: '20px', 
                padding: '15px', 
                backgroundColor: '#dcfce7', 
                border: '2px solid #22c55e',
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: 'monospace'
              }}>
                <strong>🛡️ PROTECTED FORM STATE (useRef):</strong><br/>
                Class Name: "{persistentFormData.current.className}" (Chars: {persistentFormData.current.className.length})<br/>
                Block Number: "{persistentFormData.current.blockNumber}" (Chars: {persistentFormData.current.blockNumber.length})<br/>
                School: "{persistentFormData.current.school}" (Chars: {persistentFormData.current.school.length})<br/>
                Grade: "{persistentFormData.current.grade}"<br/>
                Max Uses: "{persistentFormData.current.maxUses}"<br/>
                Expires In Days: "{persistentFormData.current.expiresInDays}"<br/>
                <em style={{ color: '#059669' }}>✅ This data is stored in useRef and should NEVER reset automatically</em>
              </div>
              
              {/* Display State Comparison */}
              <div style={{ 
                marginTop: '10px', 
                padding: '15px', 
                backgroundColor: '#fef2f2', 
                border: '2px solid #ef4444',
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: 'monospace'
              }}>
                <strong>⚠️ DISPLAY STATE (useState):</strong><br/>
                Class Name: "{formDisplayData.className}" (Chars: {formDisplayData.className.length})<br/>
                Block Number: "{formDisplayData.blockNumber}" (Chars: {formDisplayData.blockNumber.length})<br/>
                School: "{formDisplayData.school}" (Chars: {formDisplayData.school.length})<br/>
                Grade: "{formDisplayData.grade}"<br/>
                Max Uses: "{formDisplayData.maxUses}"<br/>
                Expires In Days: "{formDisplayData.expiresInDays}"<br/>
                <em style={{ color: '#dc2626' }}>❌ If this resets but ref data doesn't, we've found the culprit!</em>
              </div>
            </div>
          )}

          {/* Login Codes List */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-navy-800">Your Login Codes ({loginCodes.length})</h3>
            
            {loginCodes.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-6xl mb-4">📝</div>
                <p className="text-lg">No login codes created yet</p>
                <p className="text-sm">Create your first login code to get started!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {loginCodes.map((code) => {
                  const isExpired = code.is_expired;
                  const isAtLimit = code.current_uses >= code.max_uses;
                  const isInactive = !code.active || isExpired || isAtLimit;
                  
                  return (
                    <div
                      key={code.id}
                      className={`p-6 rounded-xl border-2 transition-all ${
                        isInactive 
                          ? 'border-gray-200 bg-gray-50' 
                          : 'border-green-200 bg-green-50'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <span className={`text-2xl font-bold ${isInactive ? 'text-gray-500' : 'text-green-700'}`}>
                              {code.code}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              isInactive ? 'bg-gray-200 text-gray-600' : 'bg-green-200 text-green-800'
                            }`}>
                              {isExpired ? 'EXPIRED' : isAtLimit ? 'FULL' : !code.active ? 'INACTIVE' : 'ACTIVE'}
                            </span>
                          </div>
                          <h4 className="text-lg font-semibold text-navy-800">{code.class_name}</h4>
                          {code.block_number && (
                            <p className="text-sm text-gray-600">{code.block_number}</p>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          {!isExpired && !isAtLimit && (
                            <button
                              onClick={() => toggleLoginCode(code.id)}
                              className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                                code.active 
                                  ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' 
                                  : 'bg-green-100 text-green-700 hover:bg-green-200'
                              }`}
                            >
                              {code.active ? 'Deactivate' : 'Activate'}
                            </button>
                          )}
                          <button
                            onClick={() => deleteLoginCode(code.id, code.code)}
                            className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200 transition-all"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Usage:</span>
                          <span className="ml-2 font-medium">{code.current_uses}/{code.max_uses}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Expires:</span>
                          <span className="ml-2 font-medium">
                            {new Date(code.expires_at).toLocaleDateString()}
                          </span>
                        </div>
                        {code.school && (
                          <div>
                            <span className="text-gray-500">School:</span>
                            <span className="ml-2 font-medium">{code.school}</span>
                          </div>
                        )}
                        {code.grade && (
                          <div>
                            <span className="text-gray-500">Grade:</span>
                            <span className="ml-2 font-medium">{code.grade}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs text-blue-700">
                          <span className="font-medium">Share this code:</span> Students can use code "{code.code}" during registration to join your class automatically.
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Login Code Manager View
  if (showLoginCodeManager) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700 p-6">
        <LoginCodeManager />
      </div>
    );
  }

  // Backup Manager View
  if (showBackupManager) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700 p-6">
        <BackupManager 
          backups={backups}
          onCreateBackup={createBackup}
          onRestoreBackup={restoreBackup}
          onCancel={() => setShowBackupManager(false)}
        />
      </div>
    );
  }

  // Study Set Creator View
  if (showStudySetCreator) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700 p-6">
        <StudySetCreator 
          words={words}
          onSave={handleCreateStudySet}
          onCancel={() => setShowStudySetCreator(false)}
        />
      </div>
    );
  }

  // Slide Creator View
  if (showSlideCreator) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700 p-6">
        <SlideCreator 
          onSave={editingSlide ? handleEditSlide : handleCreateSlide}
          onCancel={() => {
            setShowSlideCreator(false);
            setEditingSlide(null);
          }}
          editingSlide={editingSlide}
        />
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
              <div>
                <div className="text-lg font-bold text-navy-700">Greek and Latin Academy</div>
                <div className="text-sm text-gray-600">Welcome, {userProfile?.first_name}! • Level {userProfile?.level}</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-lg font-bold text-gold-600">{userProfile?.total_points} pts</div>
                <div className="text-xs text-gray-500">Total Points</div>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentView('learning')}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-medium hover:from-purple-600 hover:to-purple-700 transition-all"
                >
                  🧠 Learning
                </button>
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
                    onClick={() => { 
                      console.log('Admin button clicked, user:', user);
                      setCurrentView('admin'); 
                      loadAdminData(); 
                    }}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    👩‍💼 Admin
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
                <h2 className="text-2xl font-bold text-navy-800 mb-6">Your Academy Journey</h2>
                
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
                <div className="grid grid-cols-3 gap-4">
                  <button
                    onClick={() => setCurrentView('learning')}
                    className="bg-gradient-to-br from-purple-400 to-purple-600 text-white p-6 rounded-xl hover:from-purple-500 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
                  >
                    <div className="text-2xl mb-2">🧠</div>
                    <div className="font-semibold">Learning</div>
                    <div className="text-sm opacity-80">Discover new words</div>
                  </button>
                  <button
                    onClick={() => setCurrentView('study')}
                    className="bg-gradient-to-br from-gold-400 to-gold-600 text-navy-900 p-6 rounded-xl hover:from-gold-500 hover:to-gold-700 transition-all transform hover:scale-105 shadow-lg"
                  >
                    <div className="text-2xl mb-2">📚</div>
                    <div className="font-semibold">Study</div>
                    <div className="text-sm opacity-80">Practice with flashcards</div>
                  </button>
                  <button
                    onClick={() => { setCurrentView('study'); startQuiz(); }}
                    className="bg-gradient-to-br from-navy-500 to-navy-700 text-white p-6 rounded-xl hover:from-navy-600 hover:to-navy-800 transition-all transform hover:scale-105 shadow-lg"
                  >
                    <div className="text-2xl mb-2">🧠</div>
                    <div className="font-semibold">Quiz</div>
                    <div className="text-sm opacity-80">Test your knowledge</div>
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-xl p-6 text-center">
                <JamaalCharacter 
                  message="Keep up the great work! You're mastering the building blocks of language!" 
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

  // Learning View (New format matching uploaded image)
  if (currentView === 'learning') {
    const currentWords = getCurrentWords();
    
    // Ensure valid index
    if (currentWords.length > 0 && currentWordIndex >= currentWords.length) {
      setCurrentWordIndex(0);
    }
    
    const currentWord = currentWords[currentWordIndex];
    
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
                🧠 Learning - Card {currentWordIndex + 1} of {currentWords.length}
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentView('study')}
                className="px-4 py-2 bg-gold-500 text-navy-900 rounded-lg hover:bg-gold-600 transition-colors font-medium"
              >
                📚 Practice Mode
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto p-6">
          {/* Study Set Selector */}
          <StudySetSelector 
            studySets={studySets}
            selectedSet={selectedStudySet}
            onSetChange={setSelectedStudySet}
          />

          {/* Learning Card - Matching uploaded format */}
          <div className="bg-white rounded-3xl shadow-2xl p-12 mb-6 min-h-96 flex flex-col justify-center items-center text-center">
            {/* Type Badge */}
            <div className="mb-8">
              <span className={`px-6 py-3 rounded-full text-sm font-bold uppercase tracking-wider ${
                currentWord?.type === 'prefix' ? 'bg-blue-100 text-blue-700 border border-blue-300' :
                currentWord?.type === 'suffix' ? 'bg-green-100 text-green-700 border border-green-300' :
                'bg-purple-100 text-purple-700 border border-purple-300'
              }`}>
                {currentWord?.type || 'type'} • {currentWord?.origin || 'origin'} • {currentWord?.difficulty || 'difficulty'}
              </span>
            </div>
            
            {/* Main Word */}
            <div className="text-8xl font-bold text-gray-800 mb-6">
              {currentWord?.root || 'Loading...'}
            </div>
            {/* Debug info */}
            {!currentWord && (
              <div className="text-sm text-gray-500 mb-4">
                Debug: Words: {currentWords.length}, Index: {currentWordIndex}, StudySet: {selectedStudySet}
              </div>
            )}
            
            {/* Meaning in quotes */}
            <div className="text-3xl text-gray-700 font-medium mb-6">
              "{currentWord?.meaning || 'No meaning available'}"
            </div>
            
            {/* Definition */}
            <div className="text-xl text-gray-600 max-w-2xl mb-8">
              {currentWord?.definition || 'No definition available'}
            </div>
            
            {/* Examples Section */}
            <div className="w-full max-w-2xl">
              <h4 className="text-xl font-semibold text-gray-700 mb-4">Examples:</h4>
              <div className="flex flex-wrap justify-center gap-4">
                {(currentWord?.examples || []).map((example, index) => (
                  <span key={index} className="bg-yellow-200 text-gray-800 px-6 py-3 rounded-full text-lg font-medium border border-yellow-300">
                    {example}
                  </span>
                ))}
              </div>
            </div>
            
            {/* Points Display */}
            <div className="mt-8 text-lg font-semibold text-purple-600">
              +{currentWord?.points || 0} points available
            </div>
            
            {/* Image if available */}
            {currentWord?.image && (
              <div className="mt-6">
                <img 
                  src={currentWord.image} 
                  alt="Visual aid" 
                  className="max-w-xs mx-auto rounded-lg shadow-lg"
                />
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

            <div className="flex space-x-4">
              <button
                onClick={() => { recordStudySession(true); nextCard(); }}
                className="px-8 py-4 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors font-medium"
              >
                ✅ Got It!
              </button>
              <button
                onClick={() => { recordStudySession(false); nextCard(); }}
                className="px-8 py-4 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors font-medium"
              >
                🤔 Need Practice
              </button>
            </div>

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
              message="You're learning the building blocks of language! Every root, prefix, and suffix you master unlocks dozens of new words!" 
              size="medium"
            />
          </div>
        </div>
      </div>
    );
  }

  // Study/Flashcards View
  if (currentView === 'study') {
    const currentWords = getCurrentWords();
    
    // Ensure valid index
    if (currentWords.length > 0 && currentWordIndex >= currentWords.length) {
      setCurrentWordIndex(0);
    }
    
    const currentWord = currentWords[currentWordIndex];
    
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
                Card {currentWordIndex + 1} of {currentWords.length}
              </div>
              {quizMode && (
                <div className="text-sm text-orange-600 font-medium">
                  Quiz Mode - Question {quizQuestion + 1}/10 (Score: {quizScore})
                </div>
              )}
            </div>
            <div className="flex space-x-2">
              {!quizMode && (
                <>
                  <button
                    onClick={() => setUseMultipleChoice(!useMultipleChoice)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      useMultipleChoice 
                        ? 'bg-green-500 text-white hover:bg-green-600' 
                        : 'bg-gray-500 text-white hover:bg-gray-600'
                    }`}
                  >
                    {useMultipleChoice ? '📝 Multiple Choice' : '🎯 Self-Assessment'}
                  </button>
                  <button
                    onClick={startQuiz}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
                  >
                    🧠 Start Quiz
                  </button>
                </>
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
        </header>

        <div className="max-w-4xl mx-auto p-6">
          {/* Study Set Selector */}
          <StudySetSelector 
            studySets={studySets}
            selectedSet={selectedStudySet}
            onSetChange={setSelectedStudySet}
          />

          {/* Flashcard */}
          <div className="bg-white rounded-3xl shadow-2xl p-12 mb-6 min-h-96 flex flex-col justify-center items-center text-center">
            <div className="mb-6">
              <span className={`px-6 py-2 rounded-full text-sm font-bold uppercase tracking-wide ${
                currentWord?.type === 'prefix' ? 'bg-blue-100 text-blue-800' :
                currentWord?.type === 'suffix' ? 'bg-green-100 text-green-800' :
                'bg-purple-100 text-purple-800'
              }`}>
                {currentWord?.type || 'type'} • {currentWord?.origin || 'origin'} • {currentWord?.difficulty || 'difficulty'}
              </span>
            </div>
            
            <div className="text-7xl font-bold text-navy-800 mb-6">
              {currentWord?.root || 'Loading...'}
            </div>
            
            {showAnswer ? (
              useMultipleChoice && !quizMode ? (
                <MultipleChoice 
                  currentWord={currentWord}
                  onAnswer={(correct) => {
                    recordStudySession(correct);
                    nextCard();
                  }}
                />
              ) : (
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
                  {currentWord?.image && (
                    <div className="mt-4">
                      <img 
                        src={currentWord.image} 
                        alt="Visual aid" 
                        className="max-w-xs mx-auto rounded-lg shadow-lg"
                      />
                    </div>
                  )}
                </div>
              )
            ) : (
              quizMode && useMultipleChoice ? (
                <MultipleChoice 
                  currentWord={currentWord}
                  onAnswer={answerQuiz}
                />
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
              )
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

            {showAnswer && !useMultipleChoice && (
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
              message={showAnswer ? "Excellent work! Keep building your vocabulary!" : "You've got this! Think about the word parts."} 
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
            <h1 className="text-2xl font-bold text-navy-800">🏆 Academy Leaderboard</h1>
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

  // Admin View
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
            <h1 className="text-2xl font-bold text-navy-800">👩‍💼 Administrator Dashboard</h1>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowSlideCreator(true)}
                className="px-4 py-2 bg-gradient-to-r from-gold-500 to-gold-600 text-navy-900 rounded-lg font-medium hover:from-gold-600 hover:to-gold-700 transition-all"
              >
                ➕ Create Slide
              </button>
              <button
                onClick={() => setShowStudySetCreator(true)}
                className="px-4 py-2 bg-gradient-to-r from-navy-500 to-navy-600 text-white rounded-lg font-medium hover:from-navy-600 hover:to-navy-700 transition-all"
              >
                📚 Create Study Set
              </button>
              <button
                onClick={() => { 
                  setShowBackupManager(true); 
                  loadBackups(); 
                }}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-medium hover:from-green-600 hover:to-green-700 transition-all"
              >
                🔐 Backup Manager
              </button>
              <button
                onClick={() => { 
                  setShowLoginCodeManager(true); 
                  loadLoginCodes(); 
                }}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-medium hover:from-purple-600 hover:to-purple-700 transition-all"
              >
                🎫 Login Codes
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-6xl mx-auto p-6">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-navy-700 mb-6">👥 Student Profiles</h3>
                <div className="space-y-4">
                  {adminUsers.filter(u => !u.is_teacher).length > 0 ? (
                    adminUsers.filter(u => !u.is_teacher).map((student, index) => (
                      <div key={student.id} className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-gold-500">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Basic Information */}
                          <div>
                            <div className="flex items-center space-x-3 mb-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-gold-400 to-gold-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                {student.first_name[0]}{student.last_name[0]}
                              </div>
                              <div>
                                <h4 className="font-bold text-lg text-navy-800">
                                  {student.first_name} {student.last_name}
                                </h4>
                                <p className="text-sm text-gray-600">{student.email}</p>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm font-medium text-gray-600">Grade:</span>
                                <span className="text-sm text-navy-700 font-semibold">{student.grade || 'Not specified'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm font-medium text-gray-600">School:</span>
                                <span className="text-sm text-navy-700 font-semibold">{student.school || 'Not specified'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm font-medium text-gray-600">Block:</span>
                                <span className="text-sm text-navy-700 font-semibold">{student.block_number || 'Not specified'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm font-medium text-gray-600">Teacher:</span>
                                <span className="text-sm text-navy-700 font-semibold">{student.teacher || 'Not specified'}</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Academic Progress */}
                          <div>
                            <h5 className="font-semibold text-navy-700 mb-3">📈 Academic Progress</h5>
                            <div className="grid grid-cols-2 gap-3 mb-4">
                              <div className="bg-blue-50 rounded-lg p-3 text-center">
                                <div className="text-xl font-bold text-blue-600">{student.level || 1}</div>
                                <div className="text-xs text-blue-600">Level</div>
                              </div>
                              <div className="bg-green-50 rounded-lg p-3 text-center">
                                <div className="text-xl font-bold text-green-600">{student.total_points || 0}</div>
                                <div className="text-xs text-green-600">Points</div>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm font-medium text-gray-600">Streak:</span>
                                <span className="text-sm text-navy-700 font-semibold">{student.streak_days || 0} days</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm font-medium text-gray-600">Joined:</span>
                                <span className="text-sm text-navy-700 font-semibold">
                                  {new Date(student.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            
                            {student.badges && student.badges.length > 0 && (
                              <div className="mt-4">
                                <h6 className="text-xs font-semibold text-gray-600 mb-2">BADGES EARNED:</h6>
                                <div className="flex flex-wrap gap-1">
                                  {student.badges.slice(0, 3).map((badge, idx) => (
                                    <Badge key={idx} name={badge} earned={true} />
                                  ))}
                                  {student.badges.length > 3 && (
                                    <span className="text-xs text-gray-500">+{student.badges.length - 3} more</span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500 bg-white rounded-xl">
                      <p className="text-lg">No students registered yet.</p>
                      <p className="text-sm mt-2">Students will appear here after they sign up with complete profile information.</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-navy-700 mb-6">📈 Content Management</h3>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 text-center">
                    <div className="text-3xl font-bold text-blue-600">{adminUsers.filter(u => !u.is_teacher).length}</div>
                    <div className="text-sm text-blue-600 font-medium">Students</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 text-center">
                    <div className="text-3xl font-bold text-green-600">{words.length}</div>
                    <div className="text-sm text-green-600 font-medium">Word Cards</div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold text-navy-700">All Slides ({words.length})</h4>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSortOrder(sortOrder === 'alphabetical' ? 'type' : 'alphabetical')}
                        className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                      >
                        Sort: {sortOrder === 'alphabetical' ? 'A-Z' : 'Type'}
                      </button>
                      <button
                        onClick={() => setShowPrintableView(true)}
                        className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors"
                      >
                        🖨️ Print List
                      </button>
                    </div>
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-2 border rounded-lg p-3 bg-gray-50">
                    {getSortedWords().map((word, index) => (
                      <div key={word.id} className="flex justify-between items-center p-3 bg-white rounded-lg border hover:shadow-sm transition-all">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                              word.type === 'prefix' ? 'bg-blue-100 text-blue-800' :
                              word.type === 'suffix' ? 'bg-green-100 text-green-800' :
                              'bg-purple-100 text-purple-800'
                            }`}>
                              {word.type}
                            </span>
                            <span className="font-bold text-navy-800">{word.root}</span>
                            <span className="text-sm text-gray-600">({word.origin})</span>
                          </div>
                          <div className="text-sm text-gray-600 mt-1">"{word.meaning}"</div>
                          <div className="text-xs text-gray-500">{word.difficulty} • {word.points} pts</div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setEditingSlide(word);
                              setShowSlideCreator(true);
                            }}
                            className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleDeleteSlide(word.id, word.root)}
                            className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                    ))}
                    {words.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <p>No slides created yet.</p>
                        <p className="text-sm mt-2">Click "Create Slide" to add your first slide.</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-navy-50 rounded-xl">
                  <h4 className="font-semibold text-navy-700 mb-2">💡 Content Management Tips</h4>
                  <ul className="text-sm text-navy-600 space-y-1">
                    <li>• Create custom study sets for targeted learning</li>
                    <li>• Use multiple-choice mode for guided practice</li>
                    <li>• Upload visual aids to enhance comprehension</li>
                    <li>• Edit slides anytime to update content or fix errors</li>
                    <li>• Delete outdated or duplicate slides to keep content clean</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="mt-8 p-6 bg-gradient-to-r from-gold-50 to-navy-50 rounded-xl">
              <div className="text-center">
                <JamaalCharacter 
                  message="Teachers are the real language heroes! Thanks for empowering students to master Greek and Latin!" 
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