import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';

const signUpSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(30, 'Username must be less than 30 characters'),
});

const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

interface AuthPageProps {
  mode: 'login' | 'signup';
}

export default function Auth({ mode }: AuthPageProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signUp, signIn, user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isArtisan, setIsArtisan] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const redirect = searchParams.get('redirect') || '/';

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      navigate(redirect);
    }
  }, [user, authLoading, navigate, redirect]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      if (mode === 'signup') {
        const result = signUpSchema.safeParse({ email, password, username });
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach((err) => {
            if (err.path[0]) {
              fieldErrors[err.path[0] as string] = err.message;
            }
          });
          setErrors(fieldErrors);
          setLoading(false);
          return;
        }

        const { error } = await signUp(email, password, username, isArtisan);
        if (error) {
          toast({
            title: 'Sign up failed',
            description: error.message,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Welcome to ArtisanStock!',
            description: 'Your account has been created successfully.',
          });
          navigate(redirect);
        }
      } else {
        const result = signInSchema.safeParse({ email, password });
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach((err) => {
            if (err.path[0]) {
              fieldErrors[err.path[0] as string] = err.message;
            }
          });
          setErrors(fieldErrors);
          setLoading(false);
          return;
        }

        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: 'Sign in failed',
            description: error.message,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Welcome back!',
            description: 'You have signed in successfully.',
          });
          navigate(redirect);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <Layout showFooter={false}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout showFooter={false}>
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <span className="text-5xl mb-4 block">🎨</span>
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">
              {mode === 'signup' ? 'Create Your Account' : 'Welcome Back'}
            </h1>
            <p className="text-muted-foreground">
              {mode === 'signup' 
                ? 'Join our community of artisans and collectors' 
                : 'Sign in to continue to ArtisanStock'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="artisan-input"
                  placeholder="craftmaster"
                  autoComplete="username"
                />
                {errors.username && (
                  <p className="text-sm text-destructive">{errors.username}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="artisan-input"
                placeholder="you@example.com"
                autoComplete="email"
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="artisan-input"
                placeholder="••••••••"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            {mode === 'signup' && (
              <div className="flex items-start gap-3 p-4 bg-secondary/50 rounded-lg">
                <Checkbox
                  id="artisan"
                  checked={isArtisan}
                  onCheckedChange={(checked) => setIsArtisan(checked === true)}
                />
                <div className="space-y-1">
                  <Label htmlFor="artisan" className="cursor-pointer">
                    I want to sell my handcrafted goods
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Check this if you're an artisan and want to create listings
                  </p>
                </div>
              </div>
            )}

            <Button 
              type="submit" 
              variant="hero" 
              size="lg" 
              className="w-full"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'signup' ? 'Create Account' : 'Sign In'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === 'signup' ? (
              <>
                Already have an account?{' '}
                <Link to="/login" className="text-primary font-medium hover:underline">
                  Sign in
                </Link>
              </>
            ) : (
              <>
                Don't have an account?{' '}
                <Link to="/signup" className="text-primary font-medium hover:underline">
                  Sign up
                </Link>
              </>
            )}
          </p>
        </div>
      </div>
    </Layout>
  );
}
