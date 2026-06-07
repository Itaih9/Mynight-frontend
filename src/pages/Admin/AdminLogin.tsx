import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '@/services/api/admin.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Mail, ArrowLeft } from 'lucide-react';

type Step = 'credentials' | 'otp';

export const AdminLogin = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await adminApi.login(email, password);
      setStep('otp');
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (otp.length !== 6) {
      setError('Enter the 6-digit code');
      return;
    }
    setLoading(true);
    try {
      await adminApi.verifyOtp(email, otp);
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setLoading(true);
    try {
      await adminApi.login(email, password);
      setOtp('');
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep('credentials');
    setOtp('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-slate-900 mb-4">
              {step === 'credentials' ? <Shield className="w-7 h-7 text-white" /> : <Mail className="w-7 h-7 text-white" />}
            </div>
            <h1 className="text-2xl font-semibold text-slate-900">
              {step === 'credentials' ? 'Admin Panel' : 'Verify your email'}
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              {step === 'credentials'
                ? 'Sign in to continue'
                : <>We sent a 6-digit code to <span className="font-semibold text-slate-900">{email}</span></>}
            </p>
          </div>

          {step === 'credentials' && (
            <form onSubmit={handleCredentialsSubmit} className="space-y-4 text-left">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
              />
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />

              {error && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
              )}

              <Button type="submit" loading={loading} className="w-full" size="lg">
                Send code
              </Button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleOtpSubmit} className="space-y-4 text-left">
              <Input
                label="6-digit code"
                type="text"
                inputMode="numeric"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                required
                autoFocus
              />

              {error && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
              )}

              <Button type="submit" loading={loading} className="w-full" size="lg">
                Verify & sign in
              </Button>

              <div className="flex items-center justify-between text-sm pt-2">
                <button type="button" onClick={handleBack} className="text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 font-medium">
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button type="button" onClick={handleResend} disabled={loading} className="text-slate-600 hover:text-slate-900 font-medium disabled:opacity-50">
                  Resend code
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
