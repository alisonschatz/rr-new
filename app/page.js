// app/page.js
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

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
        <div className="flex items-center space-x-4 font-mono text-gray-400">
          <div className="w-4 h-1 bg-gray-600 animate-pulse"></div>
          <div className="w-4 h-1 bg-gray-600 animate-pulse"></div>
          <div className="w-4 h-1 bg-gray-600 animate-pulse"></div>
          <span className="tracking-wider">CARREGANDO...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* LOGO */}
        <div className="mb-8">
          <Image
            src="/logo.png"
            alt="RR Exchange"
            width={120}
            height={120}
            className="mx-auto mb-4"
          />
          <h1 className="text-4xl font-bold text-gray-200 font-mono tracking-wider mb-2">
            RR EXCHANGE
          </h1>
          <p className="text-gray-400 font-mono tracking-wider">
            SISTEMA DE TRADING DE RECURSOS
          </p>
        </div>

        {/* BOTÕES DE ACESSO */}
        <div className="space-y-4">
          <Link 
            href="/login" 
            className="w-full btn btn-primary text-lg py-4 font-mono tracking-wider block text-center"
          >
            ENTRAR
          </Link>
          
          <Link 
            href="/register" 
            className="w-full btn btn-secondary text-lg py-4 font-mono tracking-wider block text-center"
          >
            CRIAR CONTA
          </Link>
        </div>

        {/* RECURSOS DISPONÍVEIS */}
        <div className="mt-12 pt-8 border-t border-gray-600">
          <p className="text-gray-500 font-mono text-sm tracking-wider mb-4">
            RECURSOS DISPONÍVEIS:
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-750 border border-gray-600 p-3 text-center">
              <div className="text-2xl mb-1">🏆</div>
              <div className="text-xs font-mono text-gray-400 tracking-wider">GOLD</div>
            </div>
            <div className="bg-gray-750 border border-gray-600 p-3 text-center">
              <div className="text-2xl mb-1">🛢️</div>
              <div className="text-xs font-mono text-gray-400 tracking-wider">OIL</div>
            </div>
            <div className="bg-gray-750 border border-gray-600 p-3 text-center">
              <div className="text-2xl mb-1">⛏️</div>
              <div className="text-xs font-mono text-gray-400 tracking-wider">ORE</div>
            </div>
            <div className="bg-gray-750 border border-gray-600 p-3 text-center">
              <div className="text-2xl mb-1">💎</div>
              <div className="text-xs font-mono text-gray-400 tracking-wider">DIA</div>
            </div>
            <div className="bg-gray-750 border border-gray-600 p-3 text-center">
              <div className="text-2xl mb-1">☢️</div>
              <div className="text-xs font-mono text-gray-400 tracking-wider">URA</div>
            </div>
            <div className="bg-gray-750 border border-gray-600 p-3 text-center">
              <div className="text-2xl mb-1">💵</div>
              <div className="text-xs font-mono text-gray-400 tracking-wider">CASH</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}