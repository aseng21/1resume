import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { auth, googleProvider } from '@/lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { FcGoogle } from 'react-icons/fc';
import { toast } from 'react-toastify';
import { Loader2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'signin' | 'signup';
  onModeChange: (mode: 'signin' | 'signup') => void;
}

export default function AuthModal({ isOpen, onClose, mode, onModeChange }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentMode, setCurrentMode] = useState(mode);

  // Update currentMode when prop changes
  if (mode !== currentMode) {
    setCurrentMode(mode);
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      if (currentMode === 'signup') {
        await createUserWithEmailAndPassword(auth, email, password);
        toast.success('Account created successfully! Welcome to 1Resume.');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success('Welcome back to 1Resume!');
      }
      onClose();
    } catch (error: any) {
      const errorMessage = error.message || 'An error occurred';
      const friendlyMessage = errorMessage.includes('auth/email-already-in-use')
        ? 'This email is already registered. Please try signing in instead.'
        : errorMessage.includes('auth/wrong-password')
        ? 'Incorrect password. Please try again.'
        : errorMessage.includes('auth/user-not-found')
        ? 'No account found with this email. Please sign up first.'
        : errorMessage.includes('auth/invalid-email')
        ? 'Please enter a valid email address.'
        : errorMessage.includes('auth/weak-password')
        ? 'Password should be at least 6 characters long.'
        : 'Authentication failed. Please try again.';
      
      toast.error(friendlyMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success('Welcome to 1Resume!');
      onClose();
    } catch (error: any) {
      toast.error('Google sign-in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    const newMode = currentMode === 'signin' ? 'signup' : 'signin';
    setCurrentMode(newMode);
    onModeChange(newMode);
    setEmail('');
    setPassword('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] p-6">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-2xl font-bold text-center">
            {currentMode === 'signin' ? 'Welcome Back!' : 'Create Account'}
          </DialogTitle>
          <DialogDescription className="text-center text-gray-500">
            {currentMode === 'signin' 
              ? 'Sign in to access your resume analysis tools.'
              : 'Join 1Resume to start optimizing your job applications.'}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6">
          <Button
            type="button"
            variant="outline"
            className="w-full h-11 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            onClick={handleGoogleAuth}
            disabled={isLoading}
          >
            <FcGoogle className="mr-2 h-5 w-5" />
            <span className="text-sm font-medium">Continue with Google</span>
            {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
          </Button>
        </div>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">or</span>
          </div>
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 px-4 border-gray-300 focus:ring-emerald-500 focus:border-emerald-500"
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 px-4 border-gray-300 focus:ring-emerald-500 focus:border-emerald-500"
              required
              disabled={isLoading}
            />
          </div>
          <Button
            type="submit"
            className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Please wait...</span>
              </div>
            ) : (
              <span>{currentMode === 'signin' ? 'Sign In' : 'Create Account'}</span>
            )}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-500">
          {currentMode === 'signin' ? (
            <p>
              Don't have an account?{' '}
              <button
                onClick={switchMode}
                className="text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Sign up
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button
                onClick={switchMode}
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
