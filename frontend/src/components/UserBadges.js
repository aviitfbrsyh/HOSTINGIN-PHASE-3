import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Lock } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const UserBadges = () => {
  const [badges, setBadges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    fetchBadges();
  }, []);
  
  const fetchBadges = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BACKEND_URL}/api/profile/badges`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBadges(response.data.badges || []);
    } catch (error) {
      console.error('Failed to fetch badges:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  const earnedCount = badges.filter(b => b.earned).length;
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            Achievements & Badges
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {earnedCount} of {badges.length} badges earned
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-blue-600">
            {Math.round((earnedCount / badges.length) * 100)}%
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Complete</div>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="relative w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(earnedCount / badges.length) * 100}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
        />
      </div>
      
      {/* Badges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {badges.map((badge, index) => (
          <motion.div
            key={badge.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className={`relative rounded-xl p-6 border-2 transition-all ${
              badge.earned
                ? 'bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-400 dark:border-yellow-600 shadow-md hover:shadow-lg'
                : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-60'
            }`}
          >
            {/* Badge Icon */}
            <div className={`text-5xl mb-3 ${badge.earned ? '' : 'grayscale'}`}>
              {badge.earned ? badge.name.split(' ')[0] : '🔒'}
            </div>
            
            {/* Badge Name */}
            <h3 className={`font-bold text-lg mb-2 ${
              badge.earned
                ? 'text-gray-900 dark:text-white'
                : 'text-gray-600 dark:text-gray-400'
            }`}>
              {badge.name.split(' ').slice(1).join(' ')}
            </h3>
            
            {/* Badge Description */}
            <p className={`text-sm ${
              badge.earned
                ? 'text-gray-700 dark:text-gray-300'
                : 'text-gray-500 dark:text-gray-500'
            }`}>
              {badge.description}
            </p>
            
            {/* Earned Badge */}
            {badge.earned && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="absolute top-4 right-4"
              >
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </motion.div>
            )}
            
            {/* Locked Badge */}
            {!badge.earned && (
              <div className="absolute top-4 right-4">
                <Lock className="w-6 h-6 text-gray-400" />
              </div>
            )}
          </motion.div>
        ))}
      </div>
      
      {/* Achievement Tip */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-900/50">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          How to Earn More Badges
        </h3>
        <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
          <li>• Complete your first order to earn "First Order" badge</li>
          <li>• Keep services active to unlock "Active User" badge</li>
          <li>• Refer friends to get "Referral" badges</li>
          <li>• Order multiple services to become a "Hosting Master"</li>
        </ul>
      </div>
    </div>
  );
};

export default UserBadges;
