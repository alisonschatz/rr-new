// app/register/page.js
'use client';

import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Função para formatar telefone
  const formatPhone = (value) => {
    // Remove tudo que não é número
    const digits = value.replace(/\D/g, '');
    
    // Aplica formatação baseada no tamanho
    if (digits.length <= 10) {
      // Formato: (11) 9999-9999
      return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, (match, area, first, second) => {
        if (second) {
          return `(${area}) ${first}-${second}`;
        } else if (first) {
          return `(${area}) ${first}`;
        } else if (area) {
          return `(${area}`;
        }
        return digits;
      });
    } else {
      // Formato: (11) 99999-9999
      return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, (match, area, first, second) => {
        if (second) {
          return `(${area}) ${first}-${second}`;
        } else if (first) {
          return `(${area}) ${first}`;
        } else if (area) {
          return `(${area}`;
        }
        return digits;
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'phone') {
      // Formatar telefone em tempo real
      const formattedPhone = formatPhone(value);
      setFormData(prev => ({
        ...prev,
        [name]: formattedPhone
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('NICKNAME É OBRIGATÓRIO');
      return false;
    }
    
    if (!formData.email.trim()) {
      toast.error('EMAIL É OBRIGATÓRIO');
      return false;
    }
    
    if (!formData.phone.trim()) {
      toast.error('TELEFONE É OBRIGATÓRIO');
      return false;
    }
    
    // Validar telefone - deve ter pelo menos 10 dígitos
    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      toast.error('TELEFONE DEVE TER PELO MENOS 10 DÍGITOS');
      return false;
    }
    
    if (formData.password.length < 6) {
      toast.error('SENHA DEVE TER NO MÍNIMO 6 CARACTERES');
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('SENHAS NÃO COINCIDEM');
      return false;
    }
    
    return true;
  };

  const createUserAccount = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);

    try {
      console.log('🔐 Criando conta para:', formData.email);
      
      // Criar usuário no Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      console.log('✅ Usuário criado no Auth:', userCredential.user.uid);

      // Criar documento do usuário no Firestore
      const userData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        balance: 0,
        createdAt: new Date(),
        inventory: {
          GOLD: 0,
          OIL: 0,
          ORE: 0,
          DIA: 0,
          URA: 0,
          CASH: 0
        }
      };

      await setDoc(doc(db, 'users', userCredential.user.uid), userData);
      
      console.log('✅ Dados salvos no Firestore');
      
      toast.success('CONTA CRIADA COM SUCESSO!');
      
      // Redirecionar para dashboard
      router.push('/dashboard');
      
    } catch (error) {
      console.error('❌ Erro ao criar conta:', error);
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          toast.error('EMAIL JÁ ESTÁ EM USO');
          break;
        case 'auth/invalid-email':
          toast.error('EMAIL INVÁLIDO');
          break;
        case 'auth/weak-password':
          toast.error('SENHA MUITO FRACA');
          break;
        default:
          toast.error('ERRO AO CRIAR CONTA');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        
        {/* CABEÇALHO */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <Image
              src="/logo.png"
              alt="RR Exchange"
              width={80}
              height={80}
              className="mx-auto"
            />
          </Link>
          
          <h1 className="text-2xl font-bold text-gray-200 font-mono tracking-wider mb-2">
            CRIAR CONTA
          </h1>
          <p className="text-gray-500 font-mono text-sm tracking-wider">
            JUNTE-SE AO RR EXCHANGE
          </p>
        </div>

        {/* FORMULÁRIO */}
        <form onSubmit={createUserAccount} className="card space-y-6">
          
          {/* NICKNAME */}
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2 font-mono tracking-wider">
              NICKNAME
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="input font-mono"
              placeholder="SEU NICKNAME"
              required
              disabled={isLoading}
            />
          </div>

          {/* EMAIL */}
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2 font-mono tracking-wider">
              EMAIL
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="input font-mono"
              placeholder="SEU@EMAIL.COM"
              required
              disabled={isLoading}
            />
          </div>

          {/* TELEFONE */}
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2 font-mono tracking-wider">
              TELEFONE
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="input font-mono"
              placeholder="(11) 99999-9999"
              required
              disabled={isLoading}
              maxLength={15}
            />
          </div>

          {/* SENHA */}
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2 font-mono tracking-wider">
              SENHA
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="input font-mono"
              placeholder="••••••••"
              minLength={6}
              required
              disabled={isLoading}
            />
          </div>

          {/* CONFIRMAR SENHA */}
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2 font-mono tracking-wider">
              CONFIRMAR SENHA
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className="input font-mono"
              placeholder="••••••••"
              minLength={6}
              required
              disabled={isLoading}
            />
          </div>

          {/* BOTÃO SUBMIT */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn btn-primary py-3 text-lg font-mono tracking-wider"
          >
            {isLoading ? 'CRIANDO CONTA...' : 'CRIAR CONTA'}
          </button>
        </form>

        {/* NAVEGAÇÃO */}
        <div className="mt-6 space-y-4 text-center">
          <p className="text-gray-500 font-mono text-sm tracking-wider">
            JÁ TEM UMA CONTA?{' '}
            <Link 
              href="/login" 
              className="text-gray-300 hover:text-white font-bold transition-colors"
            >
              ENTRAR
            </Link>
          </p>
          
          <Link 
            href="/" 
            className="block text-gray-500 hover:text-gray-300 font-mono text-sm tracking-wider transition-colors"
          >
            ← VOLTAR PARA INÍCIO
          </Link>
        </div>
      </div>
    </div>
  );
}