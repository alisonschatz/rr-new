// app/login/page.js
'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('LOGIN REALIZADO COM SUCESSO!');
      router.push('/dashboard');
    } catch (error) {
      console.error('Erro no login:', error);
      toast.error('CREDENCIAIS INVÁLIDAS');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-sm w-full">
        {/* LOGO E TÍTULO */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <Image
              src="/logo.png"
              alt="RR Exchange"
              width={80}
              height={80}
              className="mx-auto mb-4"
            />
          </Link>
          <h1 className="text-2xl font-bold text-gray-200 font-mono tracking-wider mb-1">
            ENTRAR
          </h1>
          <p className="text-gray-500 font-mono text-sm tracking-wider">
            ACESSE SUA CONTA
          </p>
        </div>
        
        {/* FORMULÁRIO */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2 font-mono tracking-wider">
                EMAIL
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input font-mono"
                placeholder="SEU@EMAIL.COM"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2 font-mono tracking-wider">
                SENHA
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input font-mono"
                placeholder="••••••••"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary py-3 text-lg font-mono tracking-wider"
            >
              {loading ? 'ENTRANDO...' : 'ENTRAR'}
            </button>
          </form>
        </div>
        
        {/* LINK PARA REGISTRO */}
        <div className="mt-6 text-center">
          <p className="text-gray-500 font-mono text-sm tracking-wider">
            NÃO TEM CONTA?{' '}
            <Link href="/register" className="text-gray-300 hover:text-white font-bold transition-colors">
              CRIAR CONTA
            </Link>
          </p>
        </div>

        {/* VOLTAR */}
        <div className="mt-4 text-center">
          <Link href="/" className="text-gray-500 hover:text-gray-300 font-mono text-sm tracking-wider transition-colors">
            ← VOLTAR
          </Link>
        </div>
      </div>
    </div>
  );
}