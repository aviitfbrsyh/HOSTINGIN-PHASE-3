import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Rocket, Package, Globe, CreditCard, CheckCircle, 
  ChevronRight, ChevronLeft, Sparkles, X
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';

export default function Onboarding({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [domain, setDomain] = useState('');
  const navigate = useNavigate();

  const steps = [
    {
      id: 'welcome',
      title: 'Welcome to HostingIn! 🎉',
      description: 'Let\'s get you started with your perfect hosting solution in just a few steps.',
      icon: Rocket,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'package',
      title: 'Choose Your Package',
      description: 'Select a hosting plan that fits your needs. You can always upgrade later.',
      icon: Package,
      color: 'from-violet-500 to-purple-500'
    },
    {
      id: 'domain',
      title: 'Enter Your Domain',
      description: 'What domain would you like to use for your hosting?',
      icon: Globe,
      color: 'from-green-500 to-emerald-500'
    },
    {
      id: 'payment',
      title: 'Complete Payment',
      description: 'Choose your payment method and complete your first order.',
      icon: CreditCard,
      color: 'from-orange-500 to-red-500'
    },
    {
      id: 'done',
      title: 'All Set! 🚀',
      description: 'Your hosting is ready. Start building your amazing website!',
      icon: CheckCircle,
      color: 'from-blue-500 to-violet-500'
    }
  ];

  const packages = [
    { id: 'starter', name: 'Starter', price: 50000, features: ['10 GB Storage', '100 GB Bandwidth', 'Free SSL'] },
    { id: 'professional', name: 'Professional', price: 150000, features: ['50 GB Storage', '500 GB Bandwidth', 'Free SSL', 'Daily Backup'], popular: true },
    { id: 'business', name: 'Business', price: 300000, features: ['Unlimited Storage', 'Unlimited Bandwidth', 'Free SSL', 'Daily Backup', 'Priority Support'] }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    localStorage.setItem('onboarding_completed', 'true');
    if (onComplete) {
      onComplete();
    }
    navigate('/dashboard');
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return true; // Welcome
      case 1: return selectedPackage !== null; // Package selection
      case 2: return domain.trim().length > 0; // Domain entry
      case 3: return true; // Payment (dummy)
      case 4: return true; // Done
      default: return false;
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;
  const currentStepData = steps[currentStep];
  const StepIcon = currentStepData.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-violet-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.03, 0.05, 0.03]
          }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-500 to-violet-500 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [90, 0, 90],
            opacity: [0.03, 0.05, 0.03]
          }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-violet-500 to-purple-500 rounded-full blur-3xl"
        />
      </div>

      <Card className="relative w-full max-w-4xl border-0 shadow-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
        <CardContent className="p-8 md:p-12">
          {/* Skip Button */}
          <div className="flex justify-between items-center mb-6">
            <Badge variant="outline" className="px-3 py-1">
              Step {currentStep + 1} of {steps.length}
            </Badge>
            {currentStep < steps.length - 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                className="text-slate-600 dark:text-slate-400"
              >
                Skip Tutorial
                <X className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              {/* Step Header */}
              <div className="text-center space-y-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                  className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${currentStepData.color} mx-auto`}
                >
                  <StepIcon className="w-12 h-12 text-white" />
                </motion.div>
                <h2 className="text-3xl md:text-4xl font-bold">{currentStepData.title}</h2>
                <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                  {currentStepData.description}
                </p>
              </div>

              {/* Step-specific content */}
              <div className="min-h-[300px] flex items-center justify-center">
                {currentStep === 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-center space-y-6"
                  >
                    <div className="flex items-center justify-center gap-4 text-6xl">
                      <motion.span
                        animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }}
                        transition={{ duration: 1, delay: 0.5 }}
                      >
                        👋
                      </motion.span>
                    </div>
                    <p className="text-xl text-slate-700 dark:text-slate-300">
                      We're excited to have you here!
                    </p>
                    <div className="flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <Sparkles className="w-4 h-4" />
                      <span>This will only take 2 minutes</span>
                    </div>
                  </motion.div>
                )}

                {currentStep === 1 && (
                  <div className="w-full grid md:grid-cols-3 gap-4">
                    {packages.map((pkg, index) => (
                      <motion.div
                        key={pkg.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                        onClick={() => setSelectedPackage(pkg.id)}
                        className={`relative p-6 border-2 rounded-xl cursor-pointer transition-all ${
                          selectedPackage === pkg.id
                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 scale-105'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                        } ${pkg.popular ? 'ring-2 ring-violet-500' : ''}`}
                      >
                        {pkg.popular && (
                          <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-violet-600">
                            Popular
                          </Badge>
                        )}
                        <h3 className="text-xl font-bold mb-2">{pkg.name}</h3>
                        <p className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                          Rp {(pkg.price / 1000).toFixed(0)}K
                        </p>
                        <ul className="space-y-2 text-sm">
                          {pkg.features.map((feature, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    ))}
                  </div>
                )}

                {currentStep === 2 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="w-full max-w-md mx-auto space-y-4"
                  >
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Domain Name</label>
                      <input
                        type="text"
                        value={domain}
                        onChange={(e) => setDomain(e.target.value)}
                        placeholder="example.com"
                        className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 dark:border-slate-700 focus:border-blue-600 dark:focus:border-blue-500 outline-none bg-white dark:bg-slate-900 text-lg"
                      />
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Enter your domain without http:// or www
                      </p>
                    </div>
                  </motion.div>
                )}

                {currentStep === 3 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="w-full max-w-md mx-auto space-y-4"
                  >
                    <div className="p-6 border-2 border-dashed rounded-xl text-center space-y-3">
                      <CreditCard className="w-12 h-12 mx-auto text-slate-400" />
                      <p className="text-slate-600 dark:text-slate-400">
                        Payment integration would appear here
                      </p>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={handleNext}
                      >
                        Simulate Payment Success
                      </Button>
                    </div>
                  </motion.div>
                )}

                {currentStep === 4 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-center space-y-6"
                  >
                    <motion.div
                      animate={{ 
                        scale: [1, 1.2, 1],
                        rotate: [0, 360]
                      }}
                      transition={{ 
                        duration: 1,
                        repeat: Infinity,
                        repeatDelay: 2
                      }}
                      className="inline-block"
                    >
                      <CheckCircle className="w-24 h-24 text-green-500" />
                    </motion.div>
                    <p className="text-xl text-slate-700 dark:text-slate-300">
                      Your hosting environment is ready!
                    </p>
                    <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                      <p>✓ Package activated</p>
                      <p>✓ Domain configured</p>
                      <p>✓ SSL certificate installed</p>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
              className="min-w-[100px]"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex gap-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentStep
                      ? 'w-8 bg-gradient-to-r from-blue-600 to-violet-600'
                      : index < currentStep
                      ? 'bg-blue-600'
                      : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                />
              ))}
            </div>
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="min-w-[100px] bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700"
            >
              {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}