// app/profile/page.js - Página de Perfil ATUALIZADA COM BOTÃO VER PERFIL PÚBLICO
'use client';

import { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import ProfileVerificationBadge from '@/components/ProfileVerificationBadge';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, User, Edit3, ExternalLink, MessageCircle, GamepadIcon, Shield, Eye } from 'lucide-react';

export default function ProfilePage() {
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    rivalRegionsLink: '',
    telegramNumber: ''
  });

  // Carregar dados do usuário quando disponível
  useEffect(() => {
    if (userData) {
      setFormData({
        name: userData.name || '',
        rivalRegionsLink: userData.rivalRegionsLink || '',
        telegramNumber: userData.telegramNumber || ''
      });
    }
  }, [userData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateRivalRegionsLink = (link) => {
    if (!link) return false; // Campo obrigatório agora
    
    // Padrão específico do Rival Regions mobile
    const patterns = [
      /^https?:\/\/m\.rivalregions\.com\/#slide\/profile\/\d+$/,
      /^m\.rivalregions\.com\/#slide\/profile\/\d+$/
    ];
    
    return patterns.some(pattern => pattern.test(link.toLowerCase()));
  };

  const validateTelegramNumber = (number) => {
    if (!number) return false; // Campo obrigatório agora
    
    // Formato: +55 11 99999-9999 ou similar
    const cleanNumber = number.replace(/\D/g, '');
    return cleanNumber.length >= 10 && cleanNumber.length <= 15;
  };

  const formatTelegramNumber = (value) => {
    // Remove tudo que não é número
    const digits = value.replace(/\D/g, '');
    
    // Aplica formatação brasileira
    if (digits.length <= 11) {
      // Formato brasileiro: +55 (11) 99999-9999
      return digits.replace(/(\d{2})(\d{2})(\d{5})(\d{0,4})/, (match, country, area, first, second) => {
        let formatted = '';
        if (country) formatted += `+${country}`;
        if (area) formatted += ` (${area})`;
        if (first) formatted += ` ${first}`;
        if (second) formatted += `-${second}`;
        return formatted;
      });
    } else {
      // Formato internacional genérico
      return `+${digits}`;
    }
  };

  const handleTelegramChange = (e) => {
    const formatted = formatTelegramNumber(e.target.value);
    setFormData(prev => ({
      ...prev,
      telegramNumber: formatted
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user || !userData) {
      toast.error('USUÁRIO NÃO AUTENTICADO');
      return;
    }

    // Validações
    if (!formData.name.trim()) {
      toast.error('NOME É OBRIGATÓRIO');
      return;
    }

    if (!formData.rivalRegionsLink.trim()) {
      toast.error('LINK DO RIVAL REGIONS É OBRIGATÓRIO');
      return;
    }

    if (!validateRivalRegionsLink(formData.rivalRegionsLink)) {
      toast.error('LINK DO RIVAL REGIONS INVÁLIDO - Use o formato: https://m.rivalregions.com/#slide/profile/SEU_ID');
      return;
    }

    if (!formData.telegramNumber.trim()) {
      toast.error('NÚMERO DO TELEGRAM É OBRIGATÓRIO');
      return;
    }

    if (!validateTelegramNumber(formData.telegramNumber)) {
      toast.error('NÚMERO DO TELEGRAM INVÁLIDO');
      return;
    }

    setLoading(true);

    try {
      const userRef = doc(db, 'users', user.uid);
      
      // Preparar dados para atualização
      const updateData = {
        name: formData.name.trim(),
        rivalRegionsLink: formData.rivalRegionsLink.trim(),
        telegramNumber: formData.telegramNumber.trim(),
        lastProfileUpdate: new Date()
      };

      await updateDoc(userRef, updateData);

      toast.success('PERFIL ATUALIZADO COM SUCESSO!');

    } catch (error) {
      console.error('❌ Erro ao atualizar perfil:', error);
      toast.error('ERRO AO ATUALIZAR PERFIL');
    } finally {
      setLoading(false);
    }
  };

  const formatRivalRegionsLink = (link) => {
    if (!link) return '';
    
    // Adicionar https:// se não tiver protocolo
    if (!link.startsWith('http')) {
      return `https://${link}`;
    }
    return link;
  };

  // Verificar se o perfil está completo para verificação
  const isProfileCompleteForVerification = () => {
    return formData.name.trim() && 
           formData.rivalRegionsLink.trim() && 
           formData.telegramNumber.trim() &&
           validateRivalRegionsLink(formData.rivalRegionsLink) &&
           validateTelegramNumber(formData.telegramNumber);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen">
        <Navbar />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          
          {/* CABEÇALHO */}
          <div className="mb-6 sm:mb-8">
            <div className="card">
              <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <Link href="/dashboard" className="btn btn-secondary font-mono text-xs sm:text-sm">
                    <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    VOLTAR
                  </Link>
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <User className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
                    <div>
                      <div className="flex items-center space-x-2">
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-200 font-mono">
                          MEU PERFIL
                        </h1>
                        {/* Badge de Verificação Discreto */}
                        <ProfileVerificationBadge userData={userData} size="small" />
                      </div>
                      <p className="text-gray-400 font-mono text-xs sm:text-sm">
                        Editar informações pessoais
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* BOTÃO VER PERFIL PÚBLICO */}
                <Link
                  href={`/user/${user?.uid}`}
                  className="btn bg-purple-600 hover:bg-purple-500 text-white flex items-center space-x-2 font-mono text-sm"
                >
                  <Eye className="h-4 w-4" />
                  <span>VER PERFIL PÚBLICO</span>
                </Link>
              </div>
            </div>
          </div>

          {/* STATUS DE VERIFICAÇÃO - Responsivo */}
          <div className="card mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-3">
                <Shield className="h-5 w-5 text-blue-400" />
                <h2 className="text-base font-bold text-gray-200 font-mono">
                  STATUS DE VERIFICAÇÃO
                </h2>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <ProfileVerificationBadge userData={userData} size="normal" />
                
                {isProfileCompleteForVerification() && (
                  <div className="text-xs text-green-400 font-mono">
                    ✅ Elegível para verificação
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* INFORMAÇÕES ATUAIS - Responsivo */}
          <div className="card mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-3">
                <h2 className="text-base font-bold text-gray-200 font-mono">
                  📊 INFORMAÇÕES ATUAIS
                </h2>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-6 text-sm font-mono">
                <div className="flex flex-col sm:flex-row sm:items-center">
                  <span className="text-gray-400">EMAIL:</span>
                  <span className="text-gray-200 sm:ml-2 truncate max-w-xs">{userData?.email || 'N/A'}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center">
                  <span className="text-gray-400">MEMBRO DESDE:</span>
                  <span className="text-gray-200 sm:ml-2">
                    {userData?.createdAt?.seconds 
                      ? new Date(userData.createdAt.seconds * 1000).toLocaleDateString('pt-BR')
                      : 'N/A'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* FORMULÁRIO DE EDIÇÃO */}
          <div className="card">
            <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-gray-600">
              <Edit3 className="h-6 w-6 text-green-500" />
              <h2 className="text-xl font-bold text-gray-200 font-mono">
                EDITAR PERFIL
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* NOME/NICKNAME */}
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2 font-mono tracking-wider">
                  <User className="h-4 w-4 inline mr-2" />
                  NOME / NICKNAME *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="input font-mono"
                  placeholder="Seu nome ou nickname"
                  required
                  disabled={loading}
                  maxLength={50}
                />
                <div className="text-xs text-gray-500 font-mono mt-1">
                  Como você quer ser chamado no sistema ({formData.name.length}/50)
                </div>
              </div>

              {/* LINK RIVAL REGIONS */}
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2 font-mono tracking-wider">
                  <GamepadIcon className="h-4 w-4 inline mr-2" />
                  LINK DO PERFIL NO RIVAL REGIONS *
                </label>
                <input
                  type="url"
                  name="rivalRegionsLink"
                  value={formData.rivalRegionsLink}
                  onChange={handleInputChange}
                  className="input font-mono"
                  placeholder="https://m.rivalregions.com/#slide/profile/2001258303"
                  required
                  disabled={loading}
                />
                <div className="text-xs text-gray-500 font-mono mt-1">
                  Formato: https://m.rivalregions.com/#slide/profile/SEU_ID
                </div>
                
                {/* PREVIEW DO LINK */}
                {formData.rivalRegionsLink && validateRivalRegionsLink(formData.rivalRegionsLink) && (
                  <div className="mt-2 p-2 bg-green-900 border border-green-600">
                    <div className="flex items-center space-x-2 text-green-200 text-xs font-mono">
                      <ExternalLink className="h-3 w-3" />
                      <span>Link válido:</span>
                      <a 
                        href={formatRivalRegionsLink(formData.rivalRegionsLink)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="underline hover:text-green-100"
                      >
                        Ver perfil no jogo
                      </a>
                    </div>
                  </div>
                )}
                
                {formData.rivalRegionsLink && !validateRivalRegionsLink(formData.rivalRegionsLink) && (
                  <div className="mt-2 p-2 bg-red-900 border border-red-600">
                    <div className="text-red-200 text-xs font-mono">
                      ❌ Link inválido
                    </div>
                  </div>
                )}
              </div>

              {/* NÚMERO DO TELEGRAM */}
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2 font-mono tracking-wider">
                  <MessageCircle className="h-4 w-4 inline mr-2" />
                  NÚMERO DO TELEGRAM *
                </label>
                <input
                  type="tel"
                  name="telegramNumber"
                  value={formData.telegramNumber}
                  onChange={handleTelegramChange}
                  className="input font-mono"
                  placeholder="+55 (11) 99999-9999"
                  required
                  disabled={loading}
                  maxLength={20}
                />
                <div className="text-xs text-gray-500 font-mono mt-1">
                  Formato: +55 (11) 99999-9999
                </div>
                
                {/* VALIDAÇÃO DO TELEGRAM */}
                {formData.telegramNumber && validateTelegramNumber(formData.telegramNumber) && (
                  <div className="mt-2 p-2 bg-green-900 border border-green-600">
                    <div className="text-green-200 text-xs font-mono">
                      ✅ Número válido
                    </div>
                  </div>
                )}
                
                {formData.telegramNumber && !validateTelegramNumber(formData.telegramNumber) && (
                  <div className="mt-2 p-2 bg-red-900 border border-red-600">
                    <div className="text-red-200 text-xs font-mono">
                      ❌ Número inválido
                    </div>
                  </div>
                )}
              </div>

              {/* INFORMAÇÕES SOBRE VERIFICAÇÃO - Simplificada */}
              <div className="bg-blue-900 border border-blue-600 p-4">
                <div className="flex items-center space-x-2 text-blue-200 font-mono text-sm">
                  <span className="text-blue-400">🛡️</span>
                  <span>Complete todos os campos para solicitar verificação após salvar</span>
                </div>
              </div>

              {/* BOTÕES */}
              <div className="flex space-x-3 pt-4 border-t border-gray-600">
                <Link
                  href="/dashboard"
                  className="flex-1 btn btn-secondary font-mono tracking-wider text-center"
                >
                  CANCELAR
                </Link>
                <button
                  type="submit"
                  disabled={loading || !formData.name.trim() || !formData.rivalRegionsLink.trim() || !formData.telegramNumber.trim()}
                  className="flex-1 btn btn-success font-mono tracking-wider flex items-center justify-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>{loading ? 'SALVANDO...' : 'SALVAR ALTERAÇÕES'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}