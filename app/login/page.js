// app/login/page.js - LOGIN APENAS COM GOOGLE
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Redirecionar se já estiver logado
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    
    try {
      console.log('🚀 Iniciando login com Google...');
      
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      
      // Configurar para sempre mostrar a tela de seleção de conta
      provider.setCustomParameters({
        prompt: 'select_account'
      });

      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      console.log('✅ Login realizado:', user.displayName);

      // Verificar se é o primeiro login do usuário
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        console.log('📝 Primeiro login - criando perfil do usuário');
        
        // Criar perfil do usuário no Firestore
        const userData = {
          uid: user.uid,
          name: user.displayName || 'Usuário',
          email: user.email,
          photoURL: user.photoURL || null,
          balance: 0, // SALDO INICIAL ZERADO
          inventory: {
            GOLD: 0,
            OIL: 0,
            ORE: 0,
            DIA: 0,
            URA: 0,
            CASH: 0
          },
          createdAt: new Date(),
          lastLogin: new Date(),
          loginMethod: 'google'
        };

        await setDoc(userDocRef, userData);
        console.log('👤 Perfil criado com sucesso');
        
        toast.success('CONTA CRIADA COM SUCESSO! BEM-VINDO AO RR EXCHANGE!');
      } else {
        console.log('👋 Login de usuário existente');
        
        // Atualizar último login
        await setDoc(userDocRef, {
          lastLogin: new Date()
        }, { merge: true });
        
        toast.success('LOGIN REALIZADO COM SUCESSO! BEM-VINDO DE VOLTA!');
      }

      // Redirecionar para o dashboard
      router.push('/dashboard');
      
    } catch (error) {
      console.error('❌ Erro no login:', error);
      
      let errorMessage = 'ERRO NO LOGIN';
      
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'LOGIN CANCELADO PELO USUÁRIO';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'POPUP BLOQUEADO - PERMITA POPUPS PARA ESTE SITE';
      } else if (error.code === 'auth/cancelled-popup-request') {
        errorMessage = 'LOGIN CANCELADO';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'ERRO DE CONEXÃO - VERIFIQUE SUA INTERNET';
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-4 font-mono text-gray-400">
          <div className="w-4 h-1 bg-gray-600 animate-pulse"></div>
          <div className="w-4 h-1 bg-gray-600 animate-pulse"></div>
          <div className="w-4 h-1 bg-gray-600 animate-pulse"></div>
          <span className="tracking-wider">VERIFICANDO LOGIN...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        
        {/* LOGO */}
        <div className="mb-12">
          <Image
            src="/logo.png"
            alt="RR Exchange"
            width={120}
            height={120}
            className="mx-auto mb-6"
          />
          <h1 className="text-4xl font-bold text-gray-200 font-mono tracking-wider mb-2">
            RR EXCHANGE
          </h1>
          <p className="text-gray-400 font-mono tracking-wider">
            SISTEMA DE TRADING DE RECURSOS
          </p>
        </div>

        {/* CARD DE LOGIN */}
        <div className="card mb-8">
          <h2 className="text-2xl font-bold text-gray-200 font-mono tracking-wider mb-6">
            ENTRAR NA PLATAFORMA
          </h2>
          
          <p className="text-gray-400 font-mono text-sm tracking-wider mb-8">
            Use sua conta Google para acessar o marketplace
          </p>

          {/* BOTÃO GOOGLE */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white hover:bg-gray-50 text-gray-900 font-bold py-4 px-6 border border-gray-300 transition-colors duration-200 flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed font-mono tracking-wider"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-gray-400 border-t-gray-700 rounded-full animate-spin"></div>
                <span>ENTRANDO...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>CONTINUAR COM GOOGLE</span>
              </>
            )}
          </button>

          {/* INFORMAÇÕES ADICIONAIS */}
          <div className="mt-8 pt-6 border-t border-gray-600">
            <p className="text-xs text-gray-500 font-mono tracking-wider mb-4">
              ✓ LOGIN SEGURO E RÁPIDO<br/>
              ✓ SEM NECESSIDADE DE CRIAR SENHA<br/>
              ✓ SEUS DADOS PROTEGIDOS PELO GOOGLE
            </p>
          </div>
        </div>

        {/* RECURSOS DISPONÍVEIS */}
        <div className="pt-8 border-t border-gray-600">
          <p className="text-gray-500 font-mono text-sm tracking-wider mb-4">
            RECURSOS DISPONÍVEIS PARA TRADING:
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

        {/* VOLTAR À HOME */}
        <div className="mt-8">
          <Link 
            href="/" 
            className="text-gray-500 hover:text-gray-300 font-mono text-sm tracking-wider transition-colors"
          >
            ← VOLTAR À PÁGINA INICIAL
          </Link>
        </div>
      </div>
    </div>
  );
}