// app/page.js - PÁGINA INICIAL ATUALIZADA PARA GOOGLE LOGIN
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

        {/* DESCRIÇÃO */}
        <div className="mb-8">
          <p className="text-gray-300 font-mono text-lg tracking-wider mb-4">
            MARKETPLACE DESCENTRALIZADO
          </p>
          <p className="text-gray-500 font-mono text-sm tracking-wider">
            Negocie recursos valiosos com outros traders.<br/>
            Sistema seguro e transparente.
          </p>
        </div>

        {/* BOTÃO DE ACESSO */}
        <div className="mb-12">
          <Link 
            href="/login" 
            className="w-full btn btn-primary text-xl py-6 font-mono tracking-wider block text-center bg-blue-600 hover:bg-blue-500 border-blue-500 transition-all duration-200 transform hover:scale-105"
          >
            🚀 ACESSAR PLATAFORMA
          </Link>
          
          <p className="text-gray-500 font-mono text-xs tracking-wider mt-4">
            LOGIN RÁPIDO COM SUA CONTA GOOGLE
          </p>
        </div>

        {/* RECURSOS DISPONÍVEIS */}
        <div className="pt-8 border-t border-gray-600">
          <p className="text-gray-500 font-mono text-sm tracking-wider mb-4">
            RECURSOS DISPONÍVEIS:
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-750 border border-gray-600 p-3 text-center hover:bg-gray-700 transition-colors">
              <div className="text-2xl mb-1">🏆</div>
              <div className="text-xs font-mono text-gray-400 tracking-wider">GOLD</div>
            </div>
            <div className="bg-gray-750 border border-gray-600 p-3 text-center hover:bg-gray-700 transition-colors">
              <div className="text-2xl mb-1">🛢️</div>
              <div className="text-xs font-mono text-gray-400 tracking-wider">OIL</div>
            </div>
            <div className="bg-gray-750 border border-gray-600 p-3 text-center hover:bg-gray-700 transition-colors">
              <div className="text-2xl mb-1">⛏️</div>
              <div className="text-xs font-mono text-gray-400 tracking-wider">ORE</div>
            </div>
            <div className="bg-gray-750 border border-gray-600 p-3 text-center hover:bg-gray-700 transition-colors">
              <div className="text-2xl mb-1">💎</div>
              <div className="text-xs font-mono text-gray-400 tracking-wider">DIA</div>
            </div>
            <div className="bg-gray-750 border border-gray-600 p-3 text-center hover:bg-gray-700 transition-colors">
              <div className="text-2xl mb-1">☢️</div>
              <div className="text-xs font-mono text-gray-400 tracking-wider">URA</div>
            </div>
            <div className="bg-gray-750 border border-gray-600 p-3 text-center hover:bg-gray-700 transition-colors">
              <div className="text-2xl mb-1">💵</div>
              <div className="text-xs font-mono text-gray-400 tracking-wider">CASH</div>
            </div>
          </div>
        </div>

        {/* CARACTERÍSTICAS */}
        <div className="mt-8 pt-6 border-t border-gray-600">
          <div className="grid grid-cols-1 gap-3 text-xs font-mono text-gray-500 tracking-wider">
            <div className="flex items-center justify-center space-x-2">
              <span>🔒</span>
              <span>LOGIN SEGURO COM GOOGLE</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <span>⚡</span>
              <span>TRANSAÇÕES INSTANTÂNEAS</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <span>📊</span>
              <span>MARKETPLACE EM TEMPO REAL</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <span>🧾</span>
              <span>SISTEMA DE RECIBOS</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}