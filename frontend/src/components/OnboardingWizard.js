import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Check, Rocket, Package, Gift, Settings } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const OnboardingWizard = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();
  
  const steps = [
    {
      icon: Rocket,
      title: 'Welcome to HostingIn!',
      description: 'Mari kita mulai perjalanan hosting Anda dengan beberapa langkah mudah.',
      content: (
        <div className="text-center py-8">
          <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-r from-blue-600 to-violet-600 rounded-full flex items-center justify-center">
            <Rocket className="w-16 h-16 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            Selamat Datang!
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            Dalam beberapa langkah sederhana, Anda akan siap untuk memulai hosting website Anda dengan HostingIn.
          </p>
        </div>
      )
    },
    {
      icon: Package,
      title: 'Pilih Paket Hosting',
      description: 'Kami memiliki berbagai paket yang sesuai dengan kebutuhan Anda.',
      content: (
        <div className="py-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 text-center">
            Paket Hosting Kami
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-600 transition cursor-pointer">
              <h4 className="font-semibold mb-2">Starter</h4>
              <p className="text-2xl font-bold text-blue-600 mb-2">Rp 50K/mo</p>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>✓ 1 GB Storage</li>
                <li>✓ 10 GB Bandwidth</li>
                <li>✓ 1 Domain</li>
              </ul>
            </div>
            <div className="border-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <div className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full inline-block mb-2">Popular</div>
              <h4 className="font-semibold mb-2">Pro</h4>
              <p className="text-2xl font-bold text-blue-600 mb-2">Rp 100K/mo</p>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>✓ 5 GB Storage</li>
                <li>✓ 50 GB Bandwidth</li>
                <li>✓ 5 Domains</li>
              </ul>
            </div>
            <div className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-600 transition cursor-pointer">
              <h4 className="font-semibold mb-2">Business</h4>
              <p className="text-2xl font-bold text-blue-600 mb-2">Rp 200K/mo</p>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>✓ 20 GB Storage</li>
                <li>✓ Unlimited Bandwidth</li>
                <li>✓ Unlimited Domains</li>
              </ul>
            </div>
          </div>
          <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
            Anda bisa memilih paket nanti dari menu Packages
          </p>
        </div>
      )
    },
    {
      icon: Gift,
      title: 'Referral & Rewards',
      description: 'Ajak teman dan dapatkan reward menarik!',
      content: (
        <div className="py-6 text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
            <Gift className="w-12 h-12 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
            Dapatkan Reward!
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
            Bagikan link referral Anda ke teman-teman. Setiap teman yang mendaftar dan berlangganan, Anda akan mendapat reward!
          </p>
          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <p className="text-2xl font-bold text-blue-600">3</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">referrals = Diskon 50%</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <p className="text-2xl font-bold text-green-600">5</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">referrals = 1 Month Free</p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
              <p className="text-2xl font-bold text-purple-600">10</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">referrals = Free Domain</p>
            </div>
          </div>
        </div>
      )
    },
    {
      icon: Settings,
      title: 'Anda Siap!',
      description: 'Sekarang Anda siap untuk memulai dengan HostingIn.',
      content: (
        <div className="text-center py-8">
          <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
            <Check className="w-16 h-16 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            Semua Siap!
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
            Anda telah menyelesaikan onboarding. Sekarang Anda bisa mulai menjelajahi dashboard dan order paket hosting pertama Anda!
          </p>
          <div className="flex flex-col gap-3 max-w-sm mx-auto">
            <button
              onClick={() => navigate('/dashboard/packages')}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-lg font-medium hover:opacity-90 transition"
            >
              Lihat Paket Hosting
            </button>
            <button
              onClick={() => navigate('/dashboard/referral')}
              className="w-full py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            >
              Setup Referral
            </button>
          </div>
        </div>
      )
    }
  ];
  
  const completeOnboarding = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${BACKEND_URL}/api/profile/complete-onboarding`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Onboarding completed! 🎉');
      if (onComplete) onComplete();
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      toast.error('Failed to save onboarding status');
    }
  };
  
  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };
  
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const skip = () => {
    completeOnboarding();
  };
  
  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl mx-4 overflow-hidden"
      >
        {/* Progress Bar */}
        <div className="h-2 bg-gray-200 dark:bg-gray-700">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            className="h-full bg-gradient-to-r from-blue-600 to-violet-600"
            transition={{ duration: 0.3 }}
          />
        </div>
        
        {/* Content */}
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {currentStepData.title}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {currentStepData.description}
              </p>
            </div>
            <button
              onClick={skip}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Skip
            </button>
          </div>
          
          {/* Step Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {currentStepData.content}
            </motion.div>
          </AnimatePresence>
          
          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t dark:border-gray-700">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
              Previous
            </button>
            
            <div className="flex gap-2">
              {steps.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-2 h-2 rounded-full transition ${
                    idx === currentStep
                      ? 'bg-blue-600 w-8'
                      : idx < currentStep
                      ? 'bg-blue-400'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              ))}
            </div>
            
            <button
              onClick={nextStep}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-lg font-medium hover:opacity-90 transition"
            >
              {currentStep === steps.length - 1 ? (
                <>
                  Complete
                  <Check className="w-5 h-5" />
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default OnboardingWizard;
