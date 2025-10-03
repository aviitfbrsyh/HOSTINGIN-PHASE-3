import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Gift, Users, TrendingUp, Copy, ExternalLink, Trophy, Target, Zap } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const ReferralRewards = () => {
  const [referralData, setReferralData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  
  useEffect(() => {
    fetchReferralData();
  }, []);
  
  const fetchReferralData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BACKEND_URL}/api/referral/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReferralData(response.data);
    } catch (error) {
      console.error('Failed to fetch referral data:', error);
      toast.error('Failed to load referral data');
    } finally {
      setIsLoading(false);
    }
  };
  
  const copyReferralLink = () => {
    if (referralData?.link) {
      navigator.clipboard.writeText(referralData.link);
      setIsCopied(true);
      toast.success('Referral link copied!');
      setTimeout(() => setIsCopied(false), 2000);
    }
  };
  
  const simulateClick = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${BACKEND_URL}/api/referral/simulate-click`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchReferralData();
      toast.success('Referral activity simulated!');
    } catch (error) {
      console.error('Simulation failed:', error);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  const stats = referralData?.stats || {};
  const rewards = referralData?.rewards_available || [];
  const nextMilestone = referralData?.next_milestone || {};
  const progress = nextMilestone.target ? (nextMilestone.current / nextMilestone.target) * 100 : 0;
  
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-violet-600 rounded-full mb-4"
        >
          <Gift className="w-10 h-10 text-white" />
        </motion.div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Referral & Rewards
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Ajak teman, dapatkan reward! Semakin banyak teman yang bergabung, semakin banyak hadiah yang kamu dapat.
        </p>
      </div>
      
      {/* Referral Link */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 to-violet-600 rounded-2xl p-8 text-white"
      >
        <h2 className="text-xl font-bold mb-4">Your Referral Link</h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={referralData?.link || ''}
            readOnly
            className="flex-1 px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
          />
          <button
            onClick={copyReferralLink}
            className="px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition font-medium flex items-center gap-2"
          >
            {isCopied ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" />
                Copy
              </>
            )}
          </button>
        </div>
        <p className="mt-4 text-sm text-white/80">
          Bagikan link ini ke teman-teman Anda. Untuk setiap referral yang berhasil, Anda akan mendapat reward!
        </p>
      </motion.div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium">Total Clicks</h3>
            <ExternalLink className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.clicks || 0}</p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">Link clicks</p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium">Sign Ups</h3>
            <Users className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.signups || 0}</p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">New registrations</p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium">Conversions</h3>
            <TrendingUp className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.conversions || 0}</p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">Successful referrals</p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium">Rewards Earned</h3>
            <Trophy className="w-5 h-5 text-yellow-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            Rp {((stats.rewards_earned || 0) / 100).toLocaleString('id-ID')}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">Total value</p>
        </motion.div>
      </div>
      
      {/* Next Milestone Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border dark:border-gray-700"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Target className="w-6 h-6 text-blue-600" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Next Milestone</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{nextMilestone.reward}</p>
            </div>
          </div>
          <span className="text-2xl font-bold text-blue-600">
            {nextMilestone.current || 0} / {nextMilestone.target || 3}
          </span>
        </div>
        <div className="relative w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-600 to-violet-600 rounded-full"
          />
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
          {nextMilestone.target - nextMilestone.current > 0
            ? `${nextMilestone.target - nextMilestone.current} more conversion${nextMilestone.target - nextMilestone.current > 1 ? 's' : ''} to unlock reward!`
            : 'Milestone achieved! 🎉'}
        </p>
      </motion.div>
      
      {/* Available Rewards */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Available Rewards</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {rewards.map((reward) => (
            <motion.div
              key={reward.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.02 }}
              className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border-2 transition ${
                reward.available
                  ? 'border-green-500 dark:border-green-600'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Zap className={`w-5 h-5 ${reward.available ? 'text-green-600' : 'text-gray-400'}`} />
                  <span className={`text-xs font-semibold ${reward.available ? 'text-green-600' : 'text-gray-400'}`}>
                    {reward.cost_points} conversions
                  </span>
                </div>
                {reward.available && (
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold rounded-full">
                    Available
                  </span>
                )}
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">{reward.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{reward.description}</p>
              <button
                disabled={!reward.available}
                className={`w-full py-2 rounded-lg font-medium transition ${
                  reward.available
                    ? 'bg-gradient-to-r from-blue-600 to-violet-600 hover:opacity-90 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              >
                {reward.available ? 'Claim Reward' : 'Locked'}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Leaderboard Teaser */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl p-8 text-white text-center"
      >
        <Trophy className="w-12 h-12 mx-auto mb-4" />
        <h3 className="text-2xl font-bold mb-2">You're Ranked #{referralData?.leaderboard_position || 'N/A'}</h3>
        <p className="mb-4">in the referral leaderboard this month!</p>
        <button className="px-6 py-2 bg-white text-orange-600 rounded-lg hover:bg-orange-50 transition font-medium">
          View Leaderboard
        </button>
      </motion.div>
      
      {/* Demo Button */}
      <div className="text-center">
        <button
          onClick={simulateClick}
          className="px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition"
        >
          🎮 Simulate Referral Activity (Demo)
        </button>
      </div>
    </div>
  );
};

export default ReferralRewards;
