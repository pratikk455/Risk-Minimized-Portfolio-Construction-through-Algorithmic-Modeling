'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { UseRegistrationReturn, RegistrationStep1Data } from '@/hooks/useRegistration';

interface RegistrationStep1Props {
  registration: UseRegistrationReturn;
}

interface FormErrors {
  username?: string;
  email?: string;
  full_name?: string;
  phone_number?: string;
  password?: string;
  confirmPassword?: string;
}

export const RegistrationStep1: React.FC<RegistrationStep1Props> = ({ registration }) => {
  const [formData, setFormData] = useState<RegistrationStep1Data>({
    username: '',
    email: '',
    full_name: '',
    phone_number: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const validateField = (field: string, value: string): string | undefined => {
    switch (field) {
      case 'username':
        if (value.length < 3) return 'Username must be at least 3 characters';
        if (value.length > 50) return 'Username must be less than 50 characters';
        if (!/^[a-zA-Z0-9_]+$/.test(value)) return 'Username can only contain letters, numbers, and underscores';
        break;

      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return 'Please enter a valid email address';
        break;

      case 'full_name':
        if (value.length < 1) return 'Full name is required';
        if (value.length > 255) return 'Full name must be less than 255 characters';
        break;

      case 'phone_number':
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        if (!phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''))) {
          return 'Please enter a valid phone number';
        }
        break;

      case 'password':
        if (value.length < 8) return 'Password must be at least 8 characters';
        if (!/(?=.*[a-z])/.test(value)) return 'Password must contain at least one lowercase letter';
        if (!/(?=.*[A-Z])/.test(value)) return 'Password must contain at least one uppercase letter';
        if (!/(?=.*\d)/.test(value)) return 'Password must contain at least one number';
        break;

      case 'confirmPassword':
        if (value !== formData.password) return 'Passwords do not match';
        break;
    }
    return undefined;
  };

  const calculatePasswordStrength = (password: string): number => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/(?=.*[a-z])/.test(password)) strength += 1;
    if (/(?=.*[A-Z])/.test(password)) strength += 1;
    if (/(?=.*\d)/.test(password)) strength += 1;
    if (/(?=.*[@$!%*?&])/.test(password)) strength += 1;
    return strength;
  };

  const handleInputChange = (field: keyof RegistrationStep1Data, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }

    // Calculate password strength
    if (field === 'password') {
      setPasswordStrength(calculatePasswordStrength(value));
    }

    // Real-time validation for certain fields
    if (field === 'username' || field === 'email') {
      const error = validateField(field, value);
      if (error) {
        setErrors(prev => ({ ...prev, [field]: error }));
      }
    }

    // Validate confirm password in real-time
    if (field === 'confirmPassword' || (field === 'password' && formData.confirmPassword)) {
      const confirmValue = field === 'confirmPassword' ? value : formData.confirmPassword;
      const passwordValue = field === 'password' ? value : formData.password;
      if (confirmValue && confirmValue !== passwordValue) {
        setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      } else {
        setErrors(prev => ({ ...prev, confirmPassword: undefined }));
      }
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    Object.keys(formData).forEach(field => {
      const error = validateField(field, formData[field as keyof RegistrationStep1Data]);
      if (error) {
        newErrors[field as keyof FormErrors] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    await registration.registerStep1(formData);
  };

  const getPasswordStrengthColor = (strength: number): string => {
    if (strength <= 2) return 'bg-red-500';
    if (strength <= 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = (strength: number): string => {
    if (strength <= 2) return 'Weak';
    if (strength <= 3) return 'Medium';
    return 'Strong';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Your Account</h2>
        <p className="text-gray-600">
          Fill in your information to get started with your secure portfolio management account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Username */}
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
            Username
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <UserIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="username"
              type="text"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              className={`
                block w-full pl-10 pr-3 py-3 border rounded-lg
                focus:outline-none focus:ring-2 focus:ring-blue-500
                ${errors.username ? 'border-red-300 bg-red-50' : 'border-gray-300'}
              `}
              placeholder="Choose a unique username"
              autoComplete="username"
            />
          </div>
          {errors.username && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-1 text-sm text-red-600 flex items-center"
            >
              <XMarkIcon className="h-4 w-4 mr-1" />
              {errors.username}
            </motion.p>
          )}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <EnvelopeIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`
                block w-full pl-10 pr-3 py-3 border rounded-lg
                focus:outline-none focus:ring-2 focus:ring-blue-500
                ${errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'}
              `}
              placeholder="your.email@example.com"
              autoComplete="email"
            />
          </div>
          {errors.email && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-1 text-sm text-red-600 flex items-center"
            >
              <XMarkIcon className="h-4 w-4 mr-1" />
              {errors.email}
            </motion.p>
          )}
        </div>

        {/* Full Name */}
        <div>
          <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">
            Full Name
          </label>
          <input
            id="full_name"
            type="text"
            value={formData.full_name}
            onChange={(e) => handleInputChange('full_name', e.target.value)}
            className={`
              block w-full px-3 py-3 border rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500
              ${errors.full_name ? 'border-red-300 bg-red-50' : 'border-gray-300'}
            `}
            placeholder="John Doe"
            autoComplete="name"
          />
          {errors.full_name && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-1 text-sm text-red-600 flex items-center"
            >
              <XMarkIcon className="h-4 w-4 mr-1" />
              {errors.full_name}
            </motion.p>
          )}
        </div>

        {/* Phone Number */}
        <div>
          <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <PhoneIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="phone_number"
              type="tel"
              value={formData.phone_number}
              onChange={(e) => handleInputChange('phone_number', e.target.value)}
              className={`
                block w-full pl-10 pr-3 py-3 border rounded-lg
                focus:outline-none focus:ring-2 focus:ring-blue-500
                ${errors.phone_number ? 'border-red-300 bg-red-50' : 'border-gray-300'}
              `}
              placeholder="+1 (555) 123-4567"
              autoComplete="tel"
            />
          </div>
          {errors.phone_number && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-1 text-sm text-red-600 flex items-center"
            >
              <XMarkIcon className="h-4 w-4 mr-1" />
              {errors.phone_number}
            </motion.p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            We'll send you a verification code via SMS
          </p>
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className={`
                block w-full pr-10 px-3 py-3 border rounded-lg
                focus:outline-none focus:ring-2 focus:ring-blue-500
                ${errors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'}
              `}
              placeholder="Create a strong password"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {showPassword ? (
                <EyeSlashIcon className="h-5 w-5 text-gray-400" />
              ) : (
                <EyeIcon className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>

          {/* Password Strength Indicator */}
          {formData.password && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-2"
            >
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor(passwordStrength)}`}
                    style={{ width: `${(passwordStrength / 5) * 100}%` }}
                  />
                </div>
                <span className={`text-xs font-medium ${
                  passwordStrength <= 2 ? 'text-red-600' :
                  passwordStrength <= 3 ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {getPasswordStrengthText(passwordStrength)}
                </span>
              </div>
            </motion.div>
          )}

          {errors.password && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-1 text-sm text-red-600 flex items-center"
            >
              <XMarkIcon className="h-4 w-4 mr-1" />
              {errors.password}
            </motion.p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
            Confirm Password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              className={`
                block w-full pr-10 px-3 py-3 border rounded-lg
                focus:outline-none focus:ring-2 focus:ring-blue-500
                ${errors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-gray-300'}
              `}
              placeholder="Confirm your password"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {showConfirmPassword ? (
                <EyeSlashIcon className="h-5 w-5 text-gray-400" />
              ) : (
                <EyeIcon className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>
          {formData.confirmPassword && formData.password === formData.confirmPassword && !errors.confirmPassword && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-1 text-sm text-green-600 flex items-center"
            >
              <CheckIcon className="h-4 w-4 mr-1" />
              Passwords match
            </motion.p>
          )}
          {errors.confirmPassword && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-1 text-sm text-red-600 flex items-center"
            >
              <XMarkIcon className="h-4 w-4 mr-1" />
              {errors.confirmPassword}
            </motion.p>
          )}
        </div>

        {/* Submit Button */}
        <motion.button
          type="submit"
          disabled={registration.state.isLoading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`
            w-full py-3 px-4 rounded-lg font-medium text-white
            transition-all duration-200
            ${registration.state.isLoading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
            }
          `}
        >
          {registration.state.isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
              Creating Account...
            </div>
          ) : (
            'Create Account'
          )}
        </motion.button>
      </form>

      {/* Terms */}
      <p className="text-xs text-gray-500 text-center">
        By creating an account, you agree to our{' '}
        <a href="/terms" className="text-blue-600 hover:text-blue-800">Terms of Service</a>
        {' '}and{' '}
        <a href="/privacy" className="text-blue-600 hover:text-blue-800">Privacy Policy</a>
      </p>
    </motion.div>
  );
};