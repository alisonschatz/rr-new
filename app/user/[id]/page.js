// app/user/[id]/page.js - REESCRITA COMPLETA
'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, 
  User, 
  MessageCircle, 
  GamepadIcon, 
  ExternalLink, 
  Share2, 
  Calendar,
  Copy,
  AlertCircle
} from 'lucide-react';

export default function PublicProfilePage({ params }) {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const userId = params.id;

  useEffect(() => {
    loadUserProfile();
  }, [userId]);

  const loadUserProfile = async () => {
    if (!userId) {
      setError('ID do usuário não fornecido');
      setLoading(false);
      return;
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (!userDoc.exists()) {
        setError('Usuário não encontrado');
        setLoading(false);
        return;
      }

      const data = userDoc.data();
      
      // Verificar se tem informações mínimas
      if (!data.name) {
        setError('Perfil não disponível');
        setLoading(false);
        return;
      }

      setUserData(data);
      setLoading(false);
      
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      setError('Erro ao carregar perfil');
      setLoading(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    const title = `Perfil de ${userData?.name || 'Usuário'} - RR Exchange`;
    const text = `Confira o perfil de ${userData?.name || 'Usuário'} no RR Exchange`;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
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

  const copyToClipboard = (text) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        toast.success('LINK COPIADO!');
      }).catch(() => {
        toast.error('Erro ao copiar link');
      });
    } else {
      // Fallback para navegadores antigos
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      toast.success('LINK COPIADO!');
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp || !timestamp.seconds) return 'Data não disponível';
    return new Date(timestamp.seconds * 1000).toLocaleDateString('pt-BR');
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp || !timestamp.seconds) return 'Data não disponível';
    return new Date(timestamp.seconds * 1000).toLocaleString('pt-BR');
  };

  const getTelegramLink = (number) => {
    if (!number) return '#';
    const clean = number.replace(/\D/g, '');
    return `https://t.me/+${clean}`;
  };

  const getRivalRegionsLink = (link) => {
    if (!link) return '#';
    if (link.startsWith('http')) return link;
    return `https://${link}`;
  };

  const isProfileComplete = () => {
    return userData && userData.name && userData.rivalRegionsLink && userData.telegramNumber;
  };

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-3 h-3 bg-blue-500 animate-bounce"></div>
            <div className="w-3 h-3 bg-blue-500 animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-3 h-3 bg-blue-500 animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
          <p className="text-gray-400 font-mono">CARREGANDO PERFIL...</p>
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="min-h-screen bg-gray-800 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-gray-800 border border-red-600 p-8 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-red-400 font-mono mb-4">
              ERRO
            </h1>
            <p className="text-gray-300 font-mono mb-6">
              {error}
            </p>
            <Link 
              href="/" 
              className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 font-mono font-bold transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>VOLTAR AO INÍCIO</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-800">
      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* HEADER */}
        <div className="bg-gray-800 border border-gray-600 p-6 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <Link 
                href="/" 
                className="inline-flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 text-gray-200 px-4 py-2 font-mono transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>INÍCIO</span>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-200 font-mono">
                  PERFIL PÚBLICO
                </h1>
                <p className="text-gray-400 font-mono text-sm">
                  Informações do usuário
                </p>
              </div>
            </div>
            
            <button
              onClick={handleShare}
              className="inline-flex items-center space-x-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 font-mono transition-colors"
            >
              <Share2 className="h-4 w-4" />
              <span>COMPARTILHAR</span>
            </button>
          </div>
        </div>

        {/* PROFILE CARD */}
        <div className="bg-gray-800 border border-gray-600 p-8 mb-8">
          
          {/* USER INFO */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-blue-600 text-white font-mono font-bold text-3xl mb-6">
              {userData.name ? userData.name.charAt(0).toUpperCase() : '?'}
            </div>
            
            <h2 className="text-3xl font-bold text-gray-200 font-mono mb-2">
              {userData.name || 'Nome não informado'}
            </h2>
            
            <div className="flex items-center justify-center space-x-2 text-gray-400 font-mono text-sm mb-4">
              <Calendar className="h-4 w-4" />
              <span>Membro desde {formatDate(userData.createdAt)}</span>
            </div>

            {/* STATUS DO PERFIL */}
            {isProfileComplete() ? (
              <div className="inline-flex items-center space-x-2 bg-green-700 text-white px-4 py-2 font-mono text-sm">
                <span>✓</span>
                <span>PERFIL COMPLETO</span>
              </div>
            ) : (
              <div className="inline-flex items-center space-x-2 bg-yellow-700 text-white px-4 py-2 font-mono text-sm">
                <span>⚠</span>
                <span>PERFIL INCOMPLETO</span>
              </div>
            )}
          </div>

          {/* CONTACT LINKS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            
            {/* RIVAL REGIONS */}
            <div className="bg-gray-700 border border-gray-600 p-6 text-center">
              <GamepadIcon className="h-12 w-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-200 font-mono mb-2">
                RIVAL REGIONS
              </h3>
              
              {userData.rivalRegionsLink ? (
                <>
                  <p className="text-gray-400 font-mono text-sm mb-4">
                    Perfil no jogo
                  </p>
                  <a
                    href={getRivalRegionsLink(userData.rivalRegionsLink)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 bg-green-600 hover:bg-green-500 text-white px-6 py-3 font-mono transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>VER PERFIL</span>
                  </a>
                </>
              ) : (
                <p className="text-gray-500 font-mono text-sm">
                  Link não informado
                </p>
              )}
            </div>

            {/* TELEGRAM */}
            <div className="bg-gray-700 border border-gray-600 p-6 text-center">
              <MessageCircle className="h-12 w-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-200 font-mono mb-2">
                TELEGRAM
              </h3>
              
              {userData.telegramNumber ? (
                <>
                  <p className="text-gray-400 font-mono text-sm mb-2">
                    Contato direto
                  </p>
                  <p className="text-gray-300 font-mono text-sm mb-4">
                    {userData.telegramNumber}
                  </p>
                  <a
                    href={getTelegramLink(userData.telegramNumber)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 font-mono transition-colors"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>ABRIR CHAT</span>
                  </a>
                </>
              ) : (
                <p className="text-gray-500 font-mono text-sm">
                  Número não informado
                </p>
              )}
            </div>
          </div>

          {/* PROFILE UPDATE INFO */}
          {userData.lastProfileUpdate && (
            <div className="text-center pt-6 border-t border-gray-600">
              <p className="text-gray-500 font-mono text-xs">
                Última atualização: {formatDateTime(userData.lastProfileUpdate)}
              </p>
            </div>
          )}
        </div>

        {/* ABOUT PLATFORM */}
        <div className="bg-gray-700 border border-gray-600 p-8 text-center">
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-gray-200 font-mono mb-4">
              🎮 RR EXCHANGE
            </h3>
            <p className="text-gray-400 font-mono mb-6">
              Sistema de trading de recursos para jogadores de Rival Regions.<br/>
              Negocie recursos valiosos com segurança e transparência.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link
              href="/"
              className="inline-flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 font-mono font-bold transition-colors"
            >
              <span>🚀</span>
              <span>ACESSAR PLATAFORMA</span>
            </Link>
            
            <Link
              href="/login"
              className="inline-flex items-center justify-center bg-gray-600 hover:bg-gray-500 text-white px-8 py-4 font-mono font-bold transition-colors"
            >
              FAZER LOGIN
            </Link>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-600">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm font-mono text-gray-400">
              <div>🔒 Login seguro com Google</div>
              <div>⚡ Transações instantâneas</div>
              <div>📊 Marketplace em tempo real</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}