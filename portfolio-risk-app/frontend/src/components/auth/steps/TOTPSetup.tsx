'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheckIcon,
  QrCodeIcon,
  DocumentDuplicateIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import { UseRegistrationReturn } from '@/hooks/useRegistration';

interface TOTPSetupProps {
  registration: UseRegistrationReturn;
}

const authenticatorApps = [
  {
    name: 'Google Authenticator',
    ios: 'https://apps.apple.com/app/google-authenticator/id388497605',
    android: 'https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2',
    icon: '🔐',
  },
  {
    name: 'Microsoft Authenticator',
    ios: 'https://apps.apple.com/app/microsoft-authenticator/id983156458',
    android: 'https://play.google.com/store/apps/details?id=com.azure.authenticator',
    icon: '🛡️',
  },
  {
    name: 'Authy',
    ios: 'https://apps.apple.com/app/authy/id494168017',
    android: 'https://play.google.com/store/apps/details?id=com.authy.authy',
    icon: '🔑',
  },
];

export const TOTPSetup: React.FC<TOTPSetupProps> = ({ registration }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [copiedBackup, setCopiedBackup] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [showAppList, setShowAppList] = useState(false);

  useEffect(() => {
    const setupTOTP = async () => {
      if (!registration.state.qrCode) {
        await registration.setupTOTP();
      }
      setIsLoading(false);
    };

    setupTOTP();
  }, [registration]);

  const handleCopyBackupCodes = async () => {
    if (registration.state.backupCodes) {
      const codes = registration.state.backupCodes.join('\n');
      await navigator.clipboard.writeText(codes);
      setCopiedBackup(true);
      setTimeout(() => setCopiedBackup(false), 2000);
    }
  };

  const handleDownloadBackupCodes = () => {
    if (registration.state.backupCodes) {
      const codes = registration.state.backupCodes.join('\n');
      const blob = new Blob([
        `Portfolio Risk Management - Backup Codes\n`,
        `Generated: ${new Date().toLocaleString()}\n\n`,
        `IMPORTANT: Keep these codes safe and secure!\n`,
        `Use these codes if you lose access to your authenticator app.\n`,
        `Each code can only be used once.\n\n`,
        codes
      ], { type: 'text/plain' });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'portfolio-risk-backup-codes.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleContinue = () => {
    // Move to verification step
    registration.state.currentStep = 5;
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12"
      >
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">Setting up two-factor authentication...</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="text-center space-y-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="mx-auto w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center"
        >
          <ShieldCheckIcon className="h-10 w-10 text-purple-600" />
        </motion.div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Set Up Two-Factor Authentication
          </h2>
          <p className="text-gray-600 max-w-md mx-auto">
            Add an extra layer of security to your account by setting up an authenticator app
          </p>
        </div>
      </div>

      {/* Step 1: Download App */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3">1</span>
          Download an Authenticator App
        </h3>

        <div className="space-y-3">
          <button
            onClick={() => setShowAppList(!showAppList)}
            className="w-full flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
          >
            <span className="font-medium text-gray-900">Recommended Apps</span>
            {showAppList ? (
              <ChevronDownIcon className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronRightIcon className="h-5 w-5 text-gray-500" />
            )}
          </button>

          <AnimatePresence>
            {showAppList && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                {authenticatorApps.map((app, index) => (
                  <motion.div
                    key={app.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100"
                  >
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{app.icon}</span>
                      <span className="font-medium text-gray-900">{app.name}</span>
                    </div>
                    <div className="flex space-x-2">
                      <a
                        href={app.ios}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-black text-white text-xs rounded-lg hover:bg-gray-800 transition-colors"
                      >
                        iOS
                      </a>
                      <a
                        href={app.android}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Android
                      </a>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Step 2: Scan QR Code */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3">2</span>
          Scan QR Code
        </h3>

        {registration.state.qrCode && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="p-4 bg-white rounded-lg border-2 border-gray-200"
              >
                <img
                  src={registration.state.qrCode}
                  alt="TOTP QR Code"
                  className="w-48 h-48"
                />
              </motion.div>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600 mb-3">
                Open your authenticator app and scan this QR code
              </p>

              <button
                onClick={() => setShowManualEntry(!showManualEntry)}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Can't scan? Enter code manually
              </button>

              <AnimatePresence>
                {showManualEntry && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 p-3 bg-gray-100 rounded-lg"
                  >
                    <p className="text-xs text-gray-600 mb-2">
                      Account: {registration.state.email}
                    </p>
                    <p className="text-xs text-gray-600 mb-2">
                      Issuer: PortfolioRisk
                    </p>
                    <div className="flex items-center justify-between bg-white rounded p-2">
                      <code className="text-xs font-mono text-gray-800 break-all">
                        {/* We'd extract this from the QR code data */}
                        SECRET_KEY_PLACEHOLDER
                      </code>
                      <button
                        onClick={() => navigator.clipboard.writeText('SECRET_KEY_PLACEHOLDER')}
                        className="ml-2 p-1 text-gray-500 hover:text-gray-700"
                      >
                        <DocumentDuplicateIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      {/* Step 3: Save Backup Codes */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="bg-amber-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3">3</span>
          Save Your Backup Codes
        </h3>

        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                Important: Save these backup codes in a safe place
              </p>
              <p className="text-xs text-amber-700 mt-1">
                Use these codes to access your account if you lose your authenticator device. Each code can only be used once.
              </p>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => setShowBackupCodes(!showBackupCodes)}
              className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
            >
              {showBackupCodes ? 'Hide' : 'Show'} Backup Codes
            </button>

            <button
              onClick={handleCopyBackupCodes}
              className="px-4 py-2 bg-white border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-50 transition-colors"
            >
              {copiedBackup ? (
                <CheckCircleIcon className="h-5 w-5" />
              ) : (
                <DocumentDuplicateIcon className="h-5 w-5" />
              )}
            </button>

            <button
              onClick={handleDownloadBackupCodes}
              className="px-4 py-2 bg-white border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-50 transition-colors"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
            </button>
          </div>

          <AnimatePresence>
            {showBackupCodes && registration.state.backupCodes && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-white rounded-lg border border-amber-200 p-4"
              >
                <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                  {registration.state.backupCodes.map((code, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded"
                    >
                      <span className="text-gray-600 text-xs mr-2">{index + 1}.</span>
                      <span className="font-semibold text-gray-900">{code}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Continue Button */}
      <motion.button
        onClick={handleContinue}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full py-3 px-4 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200"
      >
        Continue to Verification
      </motion.button>

      {/* Help Text */}
      <div className="text-center">
        <p className="text-xs text-gray-500">
          Need help setting up your authenticator app?{' '}
          <a href="/help/2fa" className="text-blue-600 hover:text-blue-800">
            View our setup guide
          </a>
        </p>
      </div>
    </motion.div>
  );
};