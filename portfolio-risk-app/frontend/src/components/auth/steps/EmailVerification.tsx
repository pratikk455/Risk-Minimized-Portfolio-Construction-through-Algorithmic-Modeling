'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  EnvelopeIcon,
  ArrowPathIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { UseRegistrationReturn } from '@/hooks/useRegistration';

interface EmailVerificationProps {
  registration: UseRegistrationReturn;
}

export const EmailVerification: React.FC<EmailVerificationProps> = ({ registration }) => {
  const [code, setCode] = useState<string[]>(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [canResend, setCanResend] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return; // Prevent pasting multiple characters

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

    const success = await registration.verifyEmail(codeToSubmit);
    if (!success) {
      // Clear the code on failure
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    const success = await registration.resendCode('email');
    if (success) {
      setTimeLeft(300);
      setCanResend(false);
    }
    setIsResending(false);
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
          className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center"
        >
          <EnvelopeIcon className="h-10 w-10 text-blue-600" />
        </motion.div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h2>
          <p className="text-gray-600">
            We've sent a 6-digit verification code to
          </p>
          <p className="font-medium text-gray-900">{registration.state.email}</p>
        </div>
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
              className="w-12 h-14 text-center text-xl font-semibold border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
              : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
            }
          `}
        >
          {registration.state.isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
              Verifying...
            </div>
          ) : (
            'Verify Email'
          )}
        </motion.button>
      </div>

      {/* Timer and Resend */}
      <div className="space-y-4">
        {timeLeft > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-gray-500"
          >
            Code expires in {formatTime(timeLeft)}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-red-600"
          >
            Code has expired
          </motion.div>
        )}

        <div className="flex items-center justify-center space-x-2">
          <span className="text-sm text-gray-500">Didn't receive the code?</span>
          <button
            onClick={handleResend}
            disabled={!canResend || isResending}
            className={`
              text-sm font-medium transition-all duration-200
              ${canResend && !isResending
                ? 'text-blue-600 hover:text-blue-800 cursor-pointer'
                : 'text-gray-400 cursor-not-allowed'
              }
            `}
          >
            {isResending ? (
              <div className="flex items-center">
                <ArrowPathIcon className="h-4 w-4 animate-spin mr-1" />
                Sending...
              </div>
            ) : (
              'Resend Code'
            )}
          </button>
        </div>
      </div>

      {/* Help Text */}
      <div className="space-y-2">
        <p className="text-xs text-gray-500">
          Check your spam folder if you don't see the email
        </p>
        <div className="flex items-center justify-center text-xs text-gray-400">
          <CheckCircleIcon className="h-4 w-4 mr-1" />
          Tip: You can paste the code if you copied it from your email
        </div>
      </div>
    </motion.div>
  );
};