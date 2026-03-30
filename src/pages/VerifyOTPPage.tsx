import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Shield, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function VerifyOTPPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const setAuthState = useAuthStore((state) => state.setAuthState);
  
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [canResend, setCanResend] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  
  // Get email from navigation state
  const email = location.state?.email;

  useEffect(() => {
    if (!email) {
      navigate('/register');
      return;
    }

    // Countdown timer for OTP expiry
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Enable resend after 30 seconds
    const resendTimer = setTimeout(() => {
      setCanResend(true);
    }, 30000);

    return () => {
      clearInterval(timer);
      clearTimeout(resendTimer);
    };
  }, [email, navigate]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const cooldownTimer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(cooldownTimer);
    }
  }, [resendCooldown]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (otp.length !== 6) {
      setError('Please enter a 6-digit OTP');
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiClient.verifyOTP(email, otp);
      
      // Store token
      localStorage.setItem('auth_token', response.token);
      
      // Update auth store
      setAuthState(response.user, response.token);
      
      toast({
        title: 'Success!',
        description: 'Email verified successfully',
      });
      
      // Redirect to home
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || resendCooldown > 0) return;

    setIsLoading(true);
    setError('');

    try {
      await apiClient.resendOTP(email);
      
      // Reset timers
      setTimeLeft(300);
      setCanResend(false);
      setResendCooldown(30);
      
      // Enable resend after 30 seconds again
      setTimeout(() => {
        setCanResend(true);
      }, 30000);
      
      toast({
        title: 'OTP Sent',
        description: 'A new OTP has been sent to your email',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
  };

  if (!email) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <Mail className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Verify Your Email</CardTitle>
          <CardDescription className="text-center">
            We've sent a 6-digit code to<br />
            <strong>{email}</strong>
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleVerify}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {timeLeft > 0 && (
              <div className="flex items-center justify-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  Code expires in {formatTime(timeLeft)}
                </span>
              </div>
            )}
            
            {timeLeft === 0 && (
              <Alert>
                <AlertDescription>
                  Your OTP has expired. Please request a new one.
                </AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="otp">Enter OTP</Label>
              <Input
                id="otp"
                type="text"
                inputMode="numeric"
                placeholder="000000"
                value={otp}
                onChange={handleOTPInput}
                required
                disabled={isLoading || timeLeft === 0}
                className="text-center text-2xl tracking-widest font-mono"
                maxLength={6}
                autoFocus
              />
              <p className="text-xs text-muted-foreground text-center">
                Enter the 6-digit code sent to your email
              </p>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || otp.length !== 6 || timeLeft === 0}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Verify Email
                </>
              )}
            </Button>
            
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Didn't receive the code?
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={handleResend}
                disabled={!canResend || resendCooldown > 0 || isLoading}
                className="w-full"
              >
                {resendCooldown > 0 ? (
                  `Resend available in ${resendCooldown}s`
                ) : (
                  'Resend OTP'
                )}
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
