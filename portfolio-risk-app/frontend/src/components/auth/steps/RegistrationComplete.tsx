'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircleIcon,
  ShieldCheckIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  ArrowRightIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { UseRegistrationReturn } from '@/hooks/useRegistration';

interface RegistrationCompleteProps {
  registration: UseRegistrationReturn;
  onComplete?: () => void;
}

const features = [
  {
    icon: ShieldCheckIcon,
    title: 'Enterprise Security',
    description: 'Your account is protected with military-grade encryption and 2FA',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  {
    icon: EnvelopeIcon,
    title: 'Email Verified',
    description: 'Receive important notifications and security alerts',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  {
    icon: DevicePhoneMobileIcon,
    title: 'Phone Verified',
    description: 'SMS notifications and backup authentication method',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
];

export const RegistrationComplete: React.FC<RegistrationCompleteProps> = ({
  registration,
  onComplete,
}) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [animationStep, setAnimationStep] = useState(0);

  useEffect(() => {
    setShowConfetti(true);

    // Animate features one by one
    const timer = setInterval(() => {
      setAnimationStep(prev => {
        if (prev < features.length - 1) {
          return prev + 1;
        }
        clearInterval(timer);
        return prev;
      });
    }, 500);

    return () => clearInterval(timer);
  }, []);

  const handleContinue = () => {
    if (onComplete) {
      onComplete();
    } else {
      // Redirect to login or dashboard
      window.location.href = '/login';
    }
  };

  const handleNewRegistration = () => {
    registration.resetRegistration();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 text-center relative"
    >
      {/* Confetti Effect */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              initial={{
                y: -100,
                x: Math.random() * 400 - 200,
                rotation: 0,
                opacity: 1
              }}
              animate={{
                y: 600,
                rotation: 360 * (Math.random() > 0.5 ? 1 : -1),
                opacity: 0
              }}
              transition={{
                duration: 3,
                delay: Math.random() * 2,
                ease: "easeOut"
              }}
              className={`absolute w-3 h-3 ${
                ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-yellow-500', 'bg-pink-500'][i % 5]
              } rounded-full`}
              style={{
                left: '50%',
                transform: `translateX(${Math.random() * 400 - 200}px)`
              }}
            />
          ))}
        </div>
      )}

      {/* Success Icon */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="relative"
      >
        <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center relative">
          <CheckCircleIcon className="h-12 w-12 text-green-600" />

          {/* Pulsing ring */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute inset-0 rounded-full border-4 border-green-500"
          />
        </div>

        {/* Sparkles */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="absolute -top-2 -right-2"
        >
          <SparklesIcon className="h-6 w-6 text-yellow-500" />
        </motion.div>
      </motion.div>

      {/* Main Message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-4"
      >
        <h1 className="text-3xl font-bold text-gray-900">
          🎉 Welcome to Portfolio Risk!
        </h1>
        <p className="text-lg text-gray-600 max-w-md mx-auto">
          Your secure account has been created successfully. You're now ready to start building your optimized portfolio.
        </p>
      </motion.div>

      {/* Feature List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="space-y-4"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Your account includes:
        </h3>

        <div className="space-y-4 max-w-md mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{
                opacity: animationStep >= index ? 1 : 0.3,
                x: animationStep >= index ? 0 : -20,
                scale: animationStep >= index ? 1 : 0.95
              }}
              transition={{ delay: 0.8 + (index * 0.2) }}
              className={`flex items-start space-x-4 p-4 rounded-lg border transition-all duration-300 ${
                animationStep >= index
                  ? 'bg-white border-gray-200 shadow-sm'
                  : 'bg-gray-50 border-gray-100'
              }`}
            >
              <div className={`p-2 rounded-lg ${feature.bgColor}`}>
                <feature.icon className={`h-5 w-5 ${feature.color}`} />
              </div>

              <div className="flex-1 text-left">
                <h4 className="font-medium text-gray-900">{feature.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{feature.description}</p>
              </div>

              {animationStep >= index && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 1 + (index * 0.2) }}
                >
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2 }}
        className="space-y-4"
      >
        <motion.button
          onClick={handleContinue}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 flex items-center justify-center space-x-2"
        >
          <span>Start Building Your Portfolio</span>
          <ArrowRightIcon className="h-5 w-5" />
        </motion.button>

        <button
          onClick={handleNewRegistration}
          className="w-full py-2 px-4 text-gray-600 hover:text-gray-800 transition-colors text-sm"
        >
          Register Another Account
        </button>
      </motion.div>

      {/* Security Notice */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5 }}
        className="bg-blue-50 rounded-lg p-4 border border-blue-200"
      >
        <div className="flex items-start space-x-3">
          <ShieldCheckIcon className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-left">
            <h4 className="font-medium text-blue-900 text-sm">Security Reminder</h4>
            <p className="text-xs text-blue-700 mt-1">
              Keep your authenticator app safe and store your backup codes in a secure location.
              You can manage your security settings anytime in your account preferences.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Next Steps */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3 }}
        className="border-t pt-6"
      >
        <h4 className="font-medium text-gray-900 mb-3">What's next?</h4>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center justify-center space-x-2">
            <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
            <span>Connect your investment accounts</span>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
            <span>Set your risk preferences</span>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
            <span>Get your optimized portfolio recommendations</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};