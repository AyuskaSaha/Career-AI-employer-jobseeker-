'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFirebase } from '@/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { auth } = useFirebase();
  const role = searchParams.get('role') || 'job-seeker';

  const handleAuthAction = async () => {
    if (!auth) {
      setError('Firebase is not initialized.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      router.push(role === 'job-seeker' ? '/job-seeker' : '/employer');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <Logo className="mx-auto" />
        <CardTitle className="mt-4 text-2xl font-bold">
          {role === 'job-seeker' ? 'Job Seeker' : 'Employer'} Portal
        </CardTitle>
        <CardDescription>
          {isSignUp ? 'Create an account to continue' : 'Sign in to your account'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button onClick={handleAuthAction} disabled={loading} className="w-full">
          {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Login')}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="font-semibold text-primary hover:underline"
          >
            {isSignUp ? 'Login' : 'Sign Up'}
          </button>
        </p>
      </CardContent>
    </Card>
  );
}
