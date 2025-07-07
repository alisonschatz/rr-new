// app/page.js
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 to-purple-900">
      <div className="text-center text-white mb-8">
        <h1 className="text-6xl font-bold mb-4">RR Exchange</h1>
        <p className="text-xl mb-8">Sistema de Trading de Recursos</p>
        <div className="flex gap-4 justify-center">
          <Link href="/login" className="btn btn-primary text-lg px-8 py-3">
            Entrar
          </Link>
          <Link href="/register" className="btn btn-secondary text-lg px-8 py-3">
            Criar Conta
          </Link>
        </div>
      </div>
      
      <div className="mt-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-center">
        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4">
          <div className="text-2xl mb-2">🏆</div>
          <div className="text-sm font-medium">GOLD</div>
        </div>
        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4">
          <div className="text-2xl mb-2">🛢️</div>
          <div className="text-sm font-medium">OIL</div>
        </div>
        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4">
          <div className="text-2xl mb-2">⛏️</div>
          <div className="text-sm font-medium">ORE</div>
        </div>
        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4">
          <div className="text-2xl mb-2">💎</div>
          <div className="text-sm font-medium">DIA</div>
        </div>
        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4">
          <div className="text-2xl mb-2">☢️</div>
          <div className="text-sm font-medium">URA</div>
        </div>
        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4">
          <div className="text-2xl mb-2">💵</div>
          <div className="text-sm font-medium">CASH</div>
        </div>
      </div>
    </div>
  );
}