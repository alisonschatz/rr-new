// app/user/[id]/page.js - ATUALIZADO COM TEMA CONSISTENTE E ELEMENTOS DISCRETOS
'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, 
  User, 
  MessageCircle, 
  Gamepad2, 
  ExternalLink, 
  Share2, 
  Calendar,
  AlertCircle,
  Shield,
  ShieldCheck,
  Copy,
  CheckCircle,
  Home
} from 'lucide-react';

// Hook para verificação
const useVerification = (userId) => {
  const [status, setStatus] = useState({ isVerified: false, loading: true });

  useEffect(() => {
    if (!userId) {
      setStatus({ isVerified: false, loading: false });
      return;
    }

    const q = query(
      collection(db, 'profile_verifications'),
      where('userId', '==', userId),
      where('status', '==', 'approved')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setStatus({
        isVerified: !snapshot.empty,
        loading: false
      });
    }, () => {
      setStatus({ isVerified: false, loading: false });
    });

    return () => unsubscribe();
  }, [userId]);

  return status;
};

// Componente Badge de Verificação - Discreto
const VerificationBadge = ({ userId, size = 'normal' }) => {
  const { isVerified, loading } = useVerification(userId);

  if (loading) {
    return (
      <div className="inline-flex items-center space-x-1 bg-gray-700 px-2 py-1 text-xs font-mono">
        <div className="w-3 h-3 bg-gray-600 animate-pulse"></div>
        <span className="text-gray-400">...</span>
      </div>
    );
  }

  const sizeClasses = size === 'large' ? 'px-3 py-1 text-sm' : 'px-2 py-1 text-xs';

  if (isVerified) {
    return (
      <div className={`inline-flex items-center space-x-1 bg-green-700 text-green-100 font-mono font-bold ${sizeClasses}`}>
        <ShieldCheck className="h-3 w-3" />
        <span>VERIFICADO</span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center space-x-1 bg-gray-600 text-gray-300 font-mono ${sizeClasses}`}>
      <Shield className="h-3 w-3" />
      <span>NÃO VERIFICADO</span>
    </div>
  );
};

// Componente de Loading
const LoadingScreen = () => (
  <div className="min-h-screen bg-gray-800 flex items-center justify-center">
    <div className="text-center">
      <div className="flex items-center space-x-2 text-gray-400 font-mono mb-4">
        <div className="w-3 h-3 bg-gray-600 animate-pulse"></div>
        <div className="w-3 h-3 bg-gray-600 animate-pulse"></div>
        <div className="w-3 h-3 bg-gray-600 animate-pulse"></div>
        <span className="tracking-wider">CARREGANDO PERFIL...</span>
      </div>
    </div>
  </div>
);

// Componente de Erro
const ErrorScreen = ({ error, onRetry }) => (
  <div className="min-h-screen bg-gray-800 flex items-center justify-center p-4">
    <div className="max-w-md w-full">
      <div className="card bg-red-900 border-red-600">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-700 mx-auto mb-6 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-red-300" />
          </div>
          
          <h1 className="text-2xl font-bold text-red-300 font-mono mb-4 tracking-wider">
            PERFIL INDISPONÍVEL
          </h1>
          
          <p className="text-red-200 font-mono mb-6 text-sm tracking-wider">
            {error}
          </p>
          
          <div className="space-y-3">
            <button
              onClick={onRetry}
              className="w-full btn btn-secondary font-mono tracking-wider"
            >
              TENTAR NOVAMENTE
            </button>
            
            <Link
              href="/"
              className="w-full btn btn-primary font-mono tracking-wider flex items-center justify-center space-x-2"
            >
              <Home className="h-4 w-4" />
              <span>VOLTAR AO INÍCIO</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Componente de Link de Contato - Tema Consistente
const ContactCard = ({ icon: Icon, title, subtitle, href, available, buttonText }) => (
  <div className="card hover:bg-gray-750 transition-colors">
    <div className="text-center">
      <div className={`w-12 h-12 mx-auto mb-4 flex items-center justify-center ${
        available 
          ? 'bg-blue-700 text-blue-100' 
          : 'bg-gray-700 text-gray-400'
      }`}>
        <Icon className="h-6 w-6" />
      </div>
      
      <h3 className="text-lg font-bold text-gray-200 font-mono tracking-wider mb-2">
        {title}
      </h3>
      
      <p className="text-gray-400 font-mono text-sm tracking-wider mb-4">
        {subtitle}
      </p>
      
      {available ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary font-mono tracking-wider flex items-center justify-center space-x-2"
        >
          <span>{buttonText}</span>
          <ExternalLink className="h-4 w-4" />
        </a>
      ) : (
        <div className="btn btn-secondary cursor-not-allowed font-mono tracking-wider">
          NÃO DISPONÍVEL
        </div>
      )}
    </div>
  </div>
);

// Componente Principal
export default function PublicProfilePage({ params }) {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const userId = params.id;

  const loadProfile = async () => {
    if (!userId) {
      setError('ID do usuário não fornecido');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (!userDoc.exists()) {
        setError('Usuário não encontrado');
        setLoading(false);
        return;
      }

      const data = userDoc.data();
      
      if (!data.name && !data.email) {
        setError('Perfil não disponível publicamente');
        setLoading(false);
        return;
      }

      setUserData(data);
      setLoading(false);
      
    } catch (err) {
      console.error('Erro ao carregar perfil:', err);
      setError('Erro ao carregar perfil. Tente novamente.');
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const handleShare = async () => {
    const url = window.location.href;
    const title = `Perfil de ${userData?.name || 'Usuário'} - RR Exchange`;

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        toast.success('PERFIL COMPARTILHADO!');
      } catch (err) {
        if (err.name !== 'AbortError') {
          copyToClipboard(url);
        }
      }
    } else {
      copyToClipboard(url);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('LINK COPIADO!');
    } catch (err) {
      toast.error('ERRO AO COPIAR LINK');
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp?.seconds) return 'Data não disponível';
    return new Date(timestamp.seconds * 1000).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTelegramLink = (number) => {
    if (!number) return null;
    const clean = number.replace(/\D/g, '');
    return `https://t.me/+${clean}`;
  };

  const getRivalRegionsLink = (link) => {
    if (!link) return null;
    return link.startsWith('http') ? link : `https://${link}`;
  };

  const isProfileComplete = () => {
    return userData?.name && userData?.rivalRegionsLink && userData?.telegramNumber;
  };

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorScreen error={error} onRetry={loadProfile} />;

  return (
    <div className="min-h-screen bg-gray-800">
      {/* Header - Tema Consistente */}
      <div className="navbar">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/profile"
              className="btn bg-green-600 hover:bg-green-500 text-white font-mono tracking-wider flex items-center space-x-2"
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">MEU PERFIL</span>
            </Link>
            
            <button
              onClick={handleShare}
              className="btn btn-primary font-mono tracking-wider flex items-center space-x-2"
            >
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">COMPARTILHAR</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Profile Header - Tema Consistente */}
        <div className="card mb-8">
          <div className="text-center">
            {/* Avatar */}
            <div className="relative inline-block mb-6">
              <div className="w-24 h-24 bg-blue-700 flex items-center justify-center text-3xl font-bold text-white font-mono">
                {userData?.name ? userData.name.charAt(0).toUpperCase() : '?'}
              </div>
            </div>
            
            {/* Nome e Badge Discreto */}
            <h1 className="text-3xl font-bold text-gray-200 font-mono tracking-wider mb-3">
              {userData?.name || 'USUÁRIO'}
            </h1>
            
            {/* Badge de Verificação - Discreto */}
            <div className="mb-4">
              <VerificationBadge userId={userId} size="normal" />
            </div>
            
            {/* Data de Cadastro */}
            <div className="flex items-center justify-center space-x-2 text-gray-400 font-mono text-sm mb-6">
              <Calendar className="h-4 w-4" />
              <span>MEMBRO DESDE {formatDate(userData?.createdAt).toUpperCase()}</span>
            </div>

            {/* Status Badge - Discreto */}
            <div className={`inline-flex items-center space-x-2 px-4 py-2 font-mono font-bold text-sm ${
              isProfileComplete() 
                ? 'bg-green-700 text-green-100' 
                : 'bg-yellow-700 text-yellow-100'
            }`}>
              <CheckCircle className="h-4 w-4" />
              <span>{isProfileComplete() ? 'PERFIL COMPLETO' : 'PERFIL PARCIAL'}</span>
            </div>
          </div>
        </div>

        {/* Contact Cards - Tema Consistente */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <ContactCard
            icon={MessageCircle}
            title="TELEGRAM"
            subtitle={userData?.telegramNumber ? `${userData.telegramNumber}` : "Contato não disponível"}
            href={getTelegramLink(userData?.telegramNumber)}
            available={!!userData?.telegramNumber}
            buttonText="ABRIR CHAT"
          />
          
          <ContactCard
            icon={Gamepad2}
            title="RIVAL REGIONS"
            subtitle={userData?.rivalRegionsLink ? "Perfil verificado no jogo" : "Perfil não disponível"}
            href={getRivalRegionsLink(userData?.rivalRegionsLink)}
            available={!!userData?.rivalRegionsLink}
            buttonText="VER NO JOGO"
          />
        </div>



        {/* Platform Info - Melhorado com Logo */}
        <div className="card bg-blue-900 border-blue-600">
          <div className="text-center">
            {/* Logo do Site */}
            <div className="mb-6">
              <Image
                src="/logo.png"
                alt="RR Exchange"
                width={80}
                height={80}
                className="mx-auto"
              />
            </div>
            
            <h2 className="text-4xl font-bold text-blue-100 font-mono tracking-wider mb-6">
              RR EXCHANGE
            </h2>
            
            <div className="max-w-4xl mx-auto mb-8">
              <p className="text-blue-200 font-mono text-lg leading-relaxed tracking-wider mb-4">
                SISTEMA DE TRADING DE RECURSOS PARA JOGADORES DE RIVAL REGIONS
              </p>
              <p className="text-blue-300 font-mono text-base leading-relaxed tracking-wider">
                Negocie recursos valiosos com segurança e transparência no marketplace mais confiável da comunidade
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/login"
                className="btn btn-success text-lg font-mono tracking-wider flex items-center justify-center space-x-3 py-4 px-8 hover:transform hover:scale-105 transition-all duration-200"
              >
                <span>🚀</span>
                <span>ACESSAR PLATAFORMA</span>
              </Link>
              
              <Link
                href="/login"
                className="btn btn-secondary text-lg font-mono tracking-wider py-4 px-8 hover:transform hover:scale-105 transition-all duration-200"
              >
                FAZER LOGIN
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}