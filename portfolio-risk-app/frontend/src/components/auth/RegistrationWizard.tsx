'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserCircleIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { useRegistration } from '@/hooks/useRegistration';
import { RegistrationStep1 } from './steps/RegistrationStep1';
import { EmailVerification } from './steps/EmailVerification';
import { PhoneVerification } from './steps/PhoneVerification';
import { TOTPSetup } from './steps/TOTPSetup';
import { TOTPVerification } from './steps/TOTPVerification';
import { RegistrationComplete } from './steps/RegistrationComplete';

const steps = [
  {
    id: 1,
    title: 'Create Account',
    description: 'Basic information',
    icon: UserCircleIcon,
  },
  {
    id: 2,
    title: 'Verify Email',
    description: 'Check your inbox',
    icon: EnvelopeIcon,
  },
  {
    id: 3,
    title: 'Verify Phone',
    description: 'SMS verification',
    icon: DevicePhoneMobileIcon,
  },
  {
    id: 4,
    title: 'Setup 2FA',
    description: 'Authenticator app',
    icon: ShieldCheckIcon,
  },
  {
    id: 5,
    title: 'Verify 2FA',
    description: 'Enter code',
    icon: ShieldCheckIcon,
  },
  {
    id: 6,
    title: 'Complete',
    description: 'All done!',
    icon: CheckCircleIcon,
  },
];

interface RegistrationWizardProps {
  onComplete?: () => void;
  onBack?: () => void;
}

export const RegistrationWizard: React.FC<RegistrationWizardProps> = ({
  onComplete,
  onBack,
}) => {
  const registration = useRegistration();
  const { state } = registration;
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    // Only allow going back on step 1 or after completion
    setCanGoBack(state.currentStep === 1 || state.currentStep === 6);
  }, [state.currentStep]);

  const getCurrentStepComponent = () => {
    switch (state.currentStep) {
      case 1:
        return <RegistrationStep1 registration={registration} />;
      case 2:
        return <EmailVerification registration={registration} />;
      case 3:
        return <PhoneVerification registration={registration} />;
      case 4:
        return <TOTPSetup registration={registration} />;
      case 5:
        return <TOTPVerification registration={registration} />;
      case 6:
        return <RegistrationComplete registration={registration} onComplete={onComplete} />;
      default:
        return <RegistrationStep1 registration={registration} />;
    }
  };

  const handleBack = () => {
    if (state.currentStep === 1) {
      onBack?.();
    } else if (state.currentStep === 6) {
      registration.resetRegistration();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center mb-4"
          >
            {canGoBack && (
              <button
                onClick={handleBack}
                className="absolute left-0 top-0 p-2 text-gray-600 hover:text-gray-900 transition-colors"
                aria-label="Go back"
              >
                <ArrowLeftIcon className="h-6 w-6" />
              </button>
            )}
            <h1 className="text-3xl font-bold text-gray-900">
              {state.currentStep === 6 ? 'Welcome!' : 'Create Your Account'}
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-gray-600 max-w-2xl mx-auto"
          >
            {state.currentStep === 6
              ? 'Your account has been created successfully and is ready to use.'
              : 'Set up your secure account with multi-factor authentication to protect your portfolio data.'
            }
          </motion.p>
        </div>

        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const isCompleted = state.currentStep > step.id;
              const isCurrent = state.currentStep === step.id;
              const isUpcoming = state.currentStep < step.id;

              return (
                <div key={step.id} className="flex flex-col items-center flex-1">
                  {/* Step Icon */}
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={`
                      relative flex items-center justify-center w-12 h-12 rounded-full border-2
                      ${isCompleted
                        ? 'bg-green-500 border-green-500 text-white'
                        : isCurrent
                        ? 'bg-blue-500 border-blue-500 text-white animate-pulse'
                        : 'bg-gray-100 border-gray-300 text-gray-400'
                      }
                      transition-all duration-300
                    `}
                  >
                    <step.icon className="h-6 w-6" />

                    {/* Loading indicator for current step */}
                    {isCurrent && state.isLoading && (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 border-2 border-transparent border-t-white rounded-full"
                      />
                    )}
                  </motion.div>

                  {/* Step Info */}
                  <div className="mt-3 text-center">
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.1 + 0.2 }}
                      className={`
                        text-sm font-medium
                        ${isCurrent ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'}
                      `}
                    >
                      {step.title}
                    </motion.p>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.1 + 0.3 }}
                      className="text-xs text-gray-400 mt-1"
                    >
                      {step.description}
                    </motion.p>
                  </div>

                  {/* Connection Line */}
                  {index < steps.length - 1 && (
                    <div
                      className={`
                        absolute top-6 left-1/2 w-full h-0.5 -translate-y-1/2 z-[-1]
                        ${state.currentStep > step.id ? 'bg-green-500' : 'bg-gray-300'}
                        transition-colors duration-300
                      `}
                      style={{
                        left: `calc(50% + 24px)`,
                        width: `calc(100% - 48px)`,
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Error Display */}
        <AnimatePresence>
          {state.error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"
            >
              <div className="flex">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{state.error}</p>
                </div>
                <div className="ml-auto pl-3">
                  <button
                    onClick={() => registration.setError(null)}
                    className="text-red-400 hover:text-red-600"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step Content */}
        <motion.div
          key={state.currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-xl shadow-xl p-8"
        >
          {getCurrentStepComponent()}
        </motion.div>

        {/* Help Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center"
        >
          <p className="text-sm text-gray-500">
            Need help? Contact our{' '}
            <a href="/support" className="text-blue-600 hover:text-blue-800 font-medium">
              support team
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

// Missing icons import
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';