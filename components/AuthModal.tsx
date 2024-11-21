import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { auth, googleProvider } from '@/lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup,
  sendPasswordResetEmail,
  sendEmailVerification
} from 'firebase/auth';
import { FcGoogle } from 'react-icons/fc';
import { toast } from 'react-toastify';
import { Loader2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'signin' | 'signup' | 'reset';
  onModeChange: (mode: 'signin' | 'signup' | 'reset') => void;
}

export default function AuthModal({ isOpen, onClose, mode, onModeChange }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentMode, setCurrentMode] = useState(mode);
  const [passwordStrength, setPasswordStrength] = useState<{score: number; feedback: string}>({ score: 0, feedback: '' });

  if (mode !== currentMode) {
    setCurrentMode(mode);
    setPassword('');
    setConfirmPassword('');
    setPasswordStrength({ score: 0, feedback: '' });
  }

  const validatePassword = (pass: string) => {
    const hasNumber = /\d/.test(pass);
    const hasUpper = /[A-Z]/.test(pass);
    const hasLower = /[a-z]/.test(pass);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pass);
    const isLongEnough = pass.length >= 8;

    let score = 0;
    let feedback = [];

    if (hasNumber) score++;
    if (hasUpper) score++;
    if (hasLower) score++;
    if (hasSpecial) score++;
    if (isLongEnough) score++;

    if (!hasNumber) feedback.push("Add numbers");
    if (!hasUpper) feedback.push("Add uppercase letters");
    if (!hasLower) feedback.push("Add lowercase letters");
    if (!hasSpecial) feedback.push("Add special characters");
    if (!isLongEnough) feedback.push("Make it at least 8 characters long");

    return {
      score,
      feedback: feedback.join(", ")
    };
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    if (currentMode === 'signup') {
      setPasswordStrength(validatePassword(newPassword));
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      return;
    }

    if (currentMode === 'reset') {
      setIsLoading(true);
      try {
        await sendPasswordResetEmail(auth, email);
        toast.success('Password reset email sent! Please check your inbox.', {
          position: "top-right",
          autoClose: 5000,
        });
        onClose();
      } catch (error: any) {
        const errorMessage = error.message || 'An error occurred';
        toast.error(
          errorMessage.includes('auth/user-not-found')
            ? 'No account found with this email address'
            : 'Failed to send reset email. Please try again.',
          {
            position: "top-right",
            autoClose: 5000,
          }
        );
      }
      setIsLoading(false);
      return;
    }

    if (!password) {
      toast.error('Please enter your password', {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    if (currentMode === 'signup') {
      if (password !== confirmPassword) {
        toast.error('Passwords do not match', {
          position: "top-right",
          autoClose: 3000,
        });
        return;
      }
      if (passwordStrength.score < 3) {
        toast.error('Please use a stronger password: ' + passwordStrength.feedback, {
          position: "top-right",
          autoClose: 5000,
        });
        return;
      }
    }

    setIsLoading(true);
    try {
      if (currentMode === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(userCredential.user);
        toast.success('Account created! Please check your email for verification.', {
          position: "top-right",
          autoClose: 5000,
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        if (!auth.currentUser?.emailVerified) {
          toast.warning('Please verify your email address', {
            position: "top-right",
            autoClose: 5000,
          });
        } else {
          toast.success('Welcome back to 1Resume!', {
            position: "top-right",
            autoClose: 3000,
          });
        }
      }
      onClose();
    } catch (error: any) {
      const errorMessage = error.message || 'An error occurred';
      const friendlyMessage = errorMessage.includes('auth/email-already-in-use')
        ? 'This email is already registered. Please try signing in instead.'
        : errorMessage.includes('auth/wrong-password')
        ? 'Incorrect password. Please try again.'
        : errorMessage.includes('auth/user-not-found')
        ? 'No account found with this email address'
        : errorMessage.includes('auth/invalid-email')
        ? 'Please enter a valid email address'
        : errorMessage.includes('auth/weak-password')
        ? 'Please use a stronger password'
        : 'Authentication failed. Please try again.';
      toast.error(friendlyMessage, {
        position: "top-right",
        autoClose: 5000,
      });
    }
    setIsLoading(false);
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success('Welcome to 1Resume!', {
        position: "top-right",
        autoClose: 3000,
      });
      onClose();
    } catch (error) {
      toast.error('Google sign-in failed. Please try again.', {
        position: "top-right",
        autoClose: 5000,
      });
    }
    setIsLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] p-6">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-2xl font-bold text-center">
            {currentMode === 'signin' ? 'Welcome Back!' : currentMode === 'signup' ? 'Create Account' : 'Reset Password'}
          </DialogTitle>
          <DialogDescription className="text-center">
            {currentMode === 'signin' 
              ? 'Sign in to access your resume analysis tools.'
              : currentMode === 'signup' 
              ? 'Join 1Resume to start optimizing your job applications.'
              : 'Enter your email to receive password reset instructions.'}
          </DialogDescription>
        </DialogHeader>

        {currentMode !== 'reset' && (
          <>
            <Button
              variant="outline"
              onClick={handleGoogleAuth}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FcGoogle className="mr-2 h-4 w-4" />
              )}
              Continue with Google
            </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with email
                </span>
              </div>
            </div>
          </>
        )}

        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {currentMode !== 'reset' && (
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={handlePasswordChange}
                disabled={isLoading}
              />
              {currentMode === 'signup' && password && (
                <div className="mt-2 space-y-1">
                  <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        passwordStrength.score === 5
                          ? 'bg-emerald-600'
                          : passwordStrength.score >= 3
                          ? 'bg-emerald-400'
                          : 'bg-emerald-200'
                      }`}
                      style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                    />
                  </div>
                  <p className={`text-xs ${
                    passwordStrength.score === 5
                      ? 'text-emerald-600'
                      : passwordStrength.score >= 3
                      ? 'text-emerald-500'
                      : 'text-emerald-400'
                  }`}>
                    {passwordStrength.feedback || (passwordStrength.score === 5 ? 'Strong password!' : '')}
                  </p>
                </div>
              )}
            </div>
          )}

          {currentMode === 'signup' && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
              />
              {password && confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-500">Passwords do not match</p>
              )}
            </div>
          )}

          <Button
            type="submit"
            variant="default"
            className="w-full bg-emerald-600 hover:bg-emerald-700"
            disabled={isLoading || (currentMode === 'signup' && (
              !email || 
              !password || 
              !confirmPassword || 
              password !== confirmPassword || 
              passwordStrength.score < 3
            ))}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Please wait...</span>
              </div>
            ) : (
              <span>
                {currentMode === 'signin' 
                  ? 'Sign In' 
                  : currentMode === 'signup' 
                  ? 'Create Account' 
                  : 'Send Reset Link'}
              </span>
            )}
          </Button>
        </form>

        <div className="text-center text-sm">
          {currentMode === 'signin' ? (
            <>
              <button
                onClick={() => onModeChange('reset')}
                className="text-emerald-600 hover:text-emerald-700 font-medium block w-full mb-2"
              >
                Forgot password?
              </button>
              <p>
                Don't have an account?{' '}
                <button
                  onClick={() => onModeChange('signup')}
                  className="text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  Sign up
                </button>
              </p>
            </>
          ) : currentMode === 'signup' ? (
            <p>
              Already have an account?{' '}
              <button
                onClick={() => onModeChange('signin')}
                className="text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Sign in
              </button>
            </p>
          ) : (
            <p>
              Remember your password?{' '}
              <button
                onClick={() => onModeChange('signin')}
                className="text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
