import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';

// Types for registration flow
export interface RegistrationStep1Data {
  username: string;
  email: string;
  full_name: string;
  phone_number: string;
  password: string;
  confirmPassword: string;
}

export interface VerificationData {
  user_id: number;
  code: string;
  verification_type: 'email' | 'phone';
}

export interface TOTPSetupData {
  user_id: number;
}

export interface TOTPVerifyData {
  user_id: number;
  totp_code: string;
}

export interface RegistrationState {
  currentStep: number;
  userId: number | null;
  email: string;
  phone: string;
  qrCode: string | null;
  backupCodes: string[] | null;
  isLoading: boolean;
  error: string | null;
}

export interface UseRegistrationReturn {
  state: RegistrationState;
  registerStep1: (data: RegistrationStep1Data) => Promise<boolean>;
  verifyEmail: (code: string) => Promise<boolean>;
  verifyPhone: (code: string) => Promise<boolean>;
  setupTOTP: () => Promise<boolean>;
  verifyTOTP: (code: string) => Promise<boolean>;
  resendCode: (type: 'email' | 'sms') => Promise<boolean>;
  resetRegistration: () => void;
  setError: (error: string | null) => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

export const useRegistration = (): UseRegistrationReturn => {
  const [state, setState] = useState<RegistrationState>({
    currentStep: 1,
    userId: null,
    email: '',
    phone: '',
    qrCode: null,
    backupCodes: null,
    isLoading: false,
    error: null,
  });

  const updateState = useCallback((updates: Partial<RegistrationState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const setError = useCallback((error: string | null) => {
    updateState({ error, isLoading: false });
  }, [updateState]);

  const makeRequest = useCallback(async (
    endpoint: string,
    data: any,
    method: 'POST' | 'GET' = 'POST'
  ) => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/auth/${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: method === 'POST' ? JSON.stringify(data) : undefined,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || result.message || 'Request failed');
      }

      return result;
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }, []);

  const registerStep1 = useCallback(async (data: RegistrationStep1Data): Promise<boolean> => {
    updateState({ isLoading: true, error: null });

    try {
      // Validate password confirmation
      if (data.password !== data.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      // Remove confirmPassword from API request
      const { confirmPassword, ...apiData } = data;

      const result = await makeRequest('register-step1', apiData);

      if (result.success) {
        updateState({
          currentStep: 2,
          userId: result.user_id,
          email: data.email,
          phone: data.phone_number,
          isLoading: false,
        });

        toast.success('Registration started! Check your email for verification code.');
        return true;
      } else {
        throw new Error(result.message || 'Registration failed');
      }
    } catch (error: any) {
      setError(error.message);
      toast.error(error.message);
      return false;
    }
  }, [makeRequest, updateState, setError]);

  const verifyEmail = useCallback(async (code: string): Promise<boolean> => {
    if (!state.userId) {
      setError('No user ID found');
      return false;
    }

    updateState({ isLoading: true, error: null });

    try {
      const result = await makeRequest('verify-email', {
        user_id: state.userId,
        code,
        verification_type: 'email',
      });

      if (result.success) {
        updateState({
          currentStep: 3,
          isLoading: false,
        });

        toast.success('Email verified! Check your phone for SMS verification code.');
        return true;
      } else {
        throw new Error(result.message || 'Email verification failed');
      }
    } catch (error: any) {
      setError(error.message);
      toast.error(error.message);
      return false;
    }
  }, [state.userId, makeRequest, updateState, setError]);

  const verifyPhone = useCallback(async (code: string): Promise<boolean> => {
    if (!state.userId) {
      setError('No user ID found');
      return false;
    }

    updateState({ isLoading: true, error: null });

    try {
      const result = await makeRequest('verify-phone', {
        user_id: state.userId,
        code,
        verification_type: 'phone',
      });

      if (result.success) {
        updateState({
          currentStep: 4,
          isLoading: false,
        });

        toast.success('Phone verified! Now set up two-factor authentication.');
        return true;
      } else {
        throw new Error(result.message || 'Phone verification failed');
      }
    } catch (error: any) {
      setError(error.message);
      toast.error(error.message);
      return false;
    }
  }, [state.userId, makeRequest, updateState, setError]);

  const setupTOTP = useCallback(async (): Promise<boolean> => {
    if (!state.userId) {
      setError('No user ID found');
      return false;
    }

    updateState({ isLoading: true, error: null });

    try {
      const result = await makeRequest('setup-totp', {
        user_id: state.userId,
      });

      if (result.success) {
        updateState({
          currentStep: 5,
          qrCode: result.qr_code,
          backupCodes: result.backup_codes,
          isLoading: false,
        });

        toast.success('TOTP setup ready! Scan the QR code with your authenticator app.');
        return true;
      } else {
        throw new Error(result.message || 'TOTP setup failed');
      }
    } catch (error: any) {
      setError(error.message);
      toast.error(error.message);
      return false;
    }
  }, [state.userId, makeRequest, updateState, setError]);

  const verifyTOTP = useCallback(async (code: string): Promise<boolean> => {
    if (!state.userId) {
      setError('No user ID found');
      return false;
    }

    updateState({ isLoading: true, error: null });

    try {
      const result = await makeRequest('verify-totp', {
        user_id: state.userId,
        totp_code: code,
      });

      if (result.success) {
        updateState({
          currentStep: 6, // Completion step
          isLoading: false,
        });

        toast.success('Registration complete! You can now log in.');
        return true;
      } else {
        throw new Error(result.message || 'TOTP verification failed');
      }
    } catch (error: any) {
      setError(error.message);
      toast.error(error.message);
      return false;
    }
  }, [state.userId, makeRequest, updateState, setError]);

  const resendCode = useCallback(async (type: 'email' | 'sms'): Promise<boolean> => {
    if (!state.userId) {
      setError('No user ID found');
      return false;
    }

    updateState({ isLoading: true, error: null });

    try {
      const result = await makeRequest('request-otp', {
        user_id: state.userId,
        method: type,
      });

      if (result.success) {
        updateState({ isLoading: false });
        toast.success(`Verification code sent via ${type}`);
        return true;
      } else {
        throw new Error(result.message || 'Failed to resend code');
      }
    } catch (error: any) {
      setError(error.message);
      toast.error(error.message);
      return false;
    }
  }, [state.userId, makeRequest, updateState, setError]);

  const resetRegistration = useCallback(() => {
    setState({
      currentStep: 1,
      userId: null,
      email: '',
      phone: '',
      qrCode: null,
      backupCodes: null,
      isLoading: false,
      error: null,
    });
  }, []);

  return {
    state,
    registerStep1,
    verifyEmail,
    verifyPhone,
    setupTOTP,
    verifyTOTP,
    resendCode,
    resetRegistration,
    setError,
  };
};