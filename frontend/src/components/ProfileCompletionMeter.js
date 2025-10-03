import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, CheckCircle, Circle } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const ProfileCompletionMeter = () => {
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    fetchProfileCompletion();
  }, []);
  
  const fetchProfileCompletion = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BACKEND_URL}/api/profile/completion`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfileData(response.data);
    } catch (error) {
      console.error('Failed to fetch profile completion:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading || !profileData) {
    return null;
  }
  
  // Don't show if profile is complete
  if (profileData.completion >= 100) {
    return null;
  }
  
  const getCompletionColor = (percentage) => {
    if (percentage >= 80) return 'from-green-500 to-emerald-500';
    if (percentage >= 50) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-rose-500';
  };
  
  const getCompletionText = (percentage) => {
    if (percentage >= 80) return 'Almost there!';
    if (percentage >= 50) return 'Good progress!';
    return 'Let\'s complete your profile';
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-blue-50 to-violet-50 dark:from-blue-900/20 dark:to-violet-900/20 rounded-xl p-6 border-2 border-blue-200 dark:border-blue-900/50"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${getCompletionColor(profileData.completion)} flex items-center justify-center text-white font-bold text-lg`}>
              {profileData.completion}%
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">
                Profile Completion
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {getCompletionText(profileData.completion)}
              </p>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="relative w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${profileData.completion}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className={`absolute inset-y-0 left-0 bg-gradient-to-r ${getCompletionColor(profileData.completion)} rounded-full`}
            />
          </div>
          
          {/* Suggestions */}
          {isExpanded && profileData.suggestions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 space-y-2"
            >
              {profileData.suggestions.map((suggestion, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 text-sm"
                >
                  {suggestion.done ? (
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  )}
                  <span className={suggestion.done ? 'text-gray-500 dark:text-gray-500 line-through' : 'text-gray-700 dark:text-gray-300'}>
                    {suggestion.text}
                  </span>
                </div>
              ))}
            </motion.div>
          )}
        </div>
        
        {/* Toggle Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-lg transition"
        >
          <ChevronRight className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
        </button>
      </div>
      
      {/* Action Buttons */}
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-2 mt-4 pt-4 border-t border-blue-200 dark:border-blue-900/50"
        >
          <button
            onClick={() => navigate('/dashboard/packages')}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-lg text-sm font-medium hover:opacity-90 transition"
          >
            Browse Packages
          </button>
          <button
            onClick={() => navigate('/dashboard/referral')}
            className="flex-1 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            Setup Referral
          </button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ProfileCompletionMeter;
