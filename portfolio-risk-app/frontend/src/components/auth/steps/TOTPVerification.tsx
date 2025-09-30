'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheckIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { UseRegistrationReturn } from '@/hooks/useRegistration';

interface TOTPVerificationProps {
  registration: UseRegistrationReturn;
}

export const TOTPVerification: React.FC<TOTPVerificationProps> = ({ registration }) => {
  const [code, setCode] = useState<string[]>(['', '', '', '', '', '']);
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [attempts, setAttempts] = useState(0);
  const [showBackupOption, setShowBackupOption] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Simulate TOTP timer (30-second intervals)
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          return 30; // Reset to 30 seconds
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all fields are filled
    if (newCode.every(digit => digit !== '') && value) {
      handleSubmit(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '');
    if (pastedData.length === 6) {
      const newCode = pastedData.split('');
      setCode(newCode);
      handleSubmit(pastedData);
    }
  };

  const handleSubmit = async (verificationCode?: string) => {
    const codeToSubmit = verificationCode || code.join('');
    if (codeToSubmit.length !== 6) return;

    setAttempts(prev => prev + 1);
    const success = await registration.verifyTOTP(codeToSubmit);

    if (!success) {
      // Clear the code on failure
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();

      // Show backup codes option after 2 failed attempts
      if (attempts >= 1) {
        setShowBackupOption(true);
      }
    }
  };

  const handleBackupCode = async () => {
    const backupCode = prompt('Enter one of your backup codes:');
    if (backupCode) {
      const success = await registration.verifyTOTP(backupCode.trim());
      if (!success) {
        alert('Invalid backup code. Please try again.');
      }
    }
  };

  const getProgressColor = (remaining: number): string => {
    if (remaining > 20) return 'text-green-600';
    if (remaining > 10) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressWidth = (remaining: number): string => {
    return `${(remaining / 30) * 100}%`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 text-center"
    >
      {/* Header */}
      <div className="space-y-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="mx-auto w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center"
        >
          <ShieldCheckIcon className="h-10 w-10 text-purple-600" />
        </motion.div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Verify Your Authenticator
          </h2>
          <p className="text-gray-600 max-w-md mx-auto">
            Open your authenticator app and enter the 6-digit code to complete setup
          </p>
        </div>
      </div>

      {/* TOTP Timer */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-center space-x-3 mb-3">
          <ClockIcon className={`h-5 w-5 ${getProgressColor(timeRemaining)}`} />
          <span className={`font-mono text-lg font-semibold ${getProgressColor(timeRemaining)}`}>
            {timeRemaining}s
          </span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            className={`h-2 rounded-full transition-all duration-1000 ${
              timeRemaining > 20 ? 'bg-green-500' :
              timeRemaining > 10 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: getProgressWidth(timeRemaining) }}
            animate={{ width: getProgressWidth(timeRemaining) }}
          />
        </div>

        <p className="text-xs text-gray-500 mt-2">
          Codes refresh every 30 seconds
        </p>
      </div>

      {/* Code Input */}
      <div className="space-y-4">
        <div className="flex justify-center space-x-3">
          {code.map((digit, index) => (
            <motion.input
              key={index}
              ref={el => inputRefs.current[index] = el}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              onChange={(e) => handleCodeChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : undefined}
              className="w-12 h-14 text-center text-xl font-semibold border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
              autoFocus={index === 0}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
            />
          ))}
        </div>

        <motion.button
          onClick={() => handleSubmit()}
          disabled={code.some(digit => !digit) || registration.state.isLoading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`
            w-full py-3 px-4 rounded-lg font-medium text-white
            transition-all duration-200
            ${code.some(digit => !digit) || registration.state.isLoading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500'
            }
          `}
        >
          {registration.state.isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
              Verifying...
            </div>
          ) : (
            'Complete Setup'
          )}
        </motion.button>
      </div>

      {/* Failed Attempts Warning */}
      {attempts > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center justify-center text-sm p-3 rounded-lg ${
            attempts >= 3
              ? 'bg-red-50 text-red-700'
              : 'bg-yellow-50 text-yellow-700'
          }`}
        >
          <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
          {attempts === 1 ? (
            'Code didn\'t work. Make sure you\'re using the latest code from your app.'
          ) : attempts === 2 ? (
            'Still having trouble? Double-check your authenticator app is set up correctly.'
          ) : (
            'Multiple failed attempts. Consider using a backup code instead.'
          )}
        </motion.div>
      )}

      {/* Backup Code Option */}
      {showBackupOption && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="border-t pt-6"
        >
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900">
              Having trouble with your authenticator?
            </h3>
            <p className="text-sm text-gray-600">
              You can use one of your backup codes instead
            </p>
            <button
              onClick={handleBackupCode}
              className="w-full py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Use Backup Code
            </button>
          </div>
        </motion.div>
      )}

      {/* Help Section */}
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="space-y-2">
          <div className="flex items-start text-xs text-blue-800">
            <CheckCircleIcon className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Authenticator Tips:</p>
              <ul className="mt-1 space-y-1">
                <li>• Make sure your device's time is correct</li>
                <li>• Wait for a fresh code if you're near the end of the timer</li>
                <li>• Check you added the correct account in your app</li>
                <li>• Try refreshing the code in your authenticator app</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Troubleshooting */}
      <div className="text-center">
        <p className="text-xs text-gray-500 mb-2">
          Still having problems?
        </p>
        <button
          onClick={() => window.open('/help/2fa-troubleshooting', '_blank')}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          View troubleshooting guide
        </button>
      </div>
    </motion.div>
  );
};