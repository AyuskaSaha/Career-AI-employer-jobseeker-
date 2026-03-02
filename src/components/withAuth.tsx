'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase } from '@/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Loader2 } from 'lucide-react';

export default function withAuth<P extends object>(WrappedComponent: React.ComponentType<P>) {
  const WithAuthComponent = (props: P) => {
    const { auth } = useFirebase();
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      if (!auth) return;

      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          setUser(user);
        } else {
          router.replace('/auth');
        }
        setLoading(false);
      });

      return () => unsubscribe();
    }, [auth, router]);

    if (loading) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background">
          <Loader2 className="h-16 w-16 animate-spin" />
        </div>
      );
    }

    if (!user) {
      return null; // or a redirect component
    }

    return <WrappedComponent {...props} />;
  };

  return WithAuthComponent;
}
