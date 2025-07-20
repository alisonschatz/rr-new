// components/Navbar.js - ATUALIZADO COM SISTEMA DE DEPÓSITO
'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { LogOut, Menu, X, Plus, Receipt, Settings } from 'lucide-react';
import DepositModal from './DepositModal';

// Função de formatação de dinheiro estendida
const formatMoney = (number) => {
  if (!number || number === 0) return '0';
  
  const num = Math.abs(number);
  
  if (num >= 1000000000000000000) {
    return (num / 1000000000000000000).toFixed(1).replace(/\.?0+$/, '') + 'kkkkkkkk';
  }
  if (num >= 1000000000000000) {
    return (num / 1000000000000000).toFixed(1).replace(/\.?0+$/, '') + 'kkkkkkk';
  }
  if (num >= 1000000000000) {
    return (num / 1000000000000).toFixed(1).replace(/\.?0+$/, '') + 'kkkkkk';
  }
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1).replace(/\.?0+$/, '') + 'kkkkk';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.?0+$/, '') + 'kkkk';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.?0+$/, '') + 'kkk';
  }
  if (num >= 1) {
    return (num).toFixed(1).replace(/\.?0+$/, '') + 'kk';
  }
  
  return num.toString();
};

// Lista de administradores
const ADMIN_UIDS = [
  'XgZ620lbRTQA6ELAvfqWBXKQGGJ3', // UID do administrador
];

export default function Navbar() {
  const { user, userData, logout } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);

  // Verificar se é administrador
  const isAdmin = user && ADMIN_UIDS.includes(user.uid);

  // Função de logout
  const handleLogout = async () => {
    try {
      await logout();
      console.log('👋 Logout realizado');
      router.push('/');
    } catch (error) {
      console.error('❌ Erro no logout:', error);
    } finally {
      setMobileMenuOpen(false);
    }
  };

  // Toggle do menu mobile
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <>
      <nav className="navbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* LOGO E TÍTULO */}
            <Link 
              href="/dashboard" 
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
            >
              <Image
                src="/logo.png"
                alt="RR Exchange"
                width={40}
                height={40}
                className="h-8 w-8 sm:h-10 sm:w-10"
              />
              <span className="text-lg sm:text-xl font-bold text-gray-200 font-mono tracking-wider">
                MERCADO DE RECURSOS
              </span>
            </Link>

            {/* MENU DESKTOP */}
            <div className="hidden md:flex items-center space-x-4">
              
              {/* BOTÃO HISTÓRICO */}
              {userData && (
                <Link
                  href="/history"
                  className="btn btn-secondary flex items-center space-x-2 font-mono tracking-wider text-sm px-4 py-2"
                >
                  <Receipt className="h-4 w-4" />
                  <span>HISTÓRICO</span>
                </Link>
              )}

              {/* BOTÃO ADMIN (só para administradores) */}
              {isAdmin && (
                <Link
                  href="/admin/deposits"
                  className="btn bg-purple-600 hover:bg-purple-500 text-white flex items-center space-x-2 font-mono tracking-wider text-sm px-4 py-2"
                >
                  <Settings className="h-4 w-4" />
                  <span>ADMIN</span>
                </Link>
              )}
              
              {/* BOTÃO DEPÓSITO */}
              {userData && (
                <button
                  onClick={() => setShowDepositModal(true)}
                  className="btn btn-success flex items-center space-x-2 font-mono tracking-wider text-sm px-4 py-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>DEPOSITAR</span>
                </button>
              )}

              {/* SALDO */}
              {userData && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-green-400 font-mono font-bold tracking-wider">
                    SALDO:
                  </span>
                  <div className="balance-display min-w-0 flex-shrink-0">
                    <span className="text-lg font-bold font-mono truncate block max-w-[120px] lg:max-w-[200px]" title={'$ ' + (userData.balance || 0).toLocaleString()}>
                      $ {formatMoney(userData.balance || 0)}
                    </span>
                  </div>
                </div>
              )}

              {/* USUÁRIO E LOGOUT */}
              {userData && (
                <div className="flex items-center space-x-4 border-l border-gray-600 pl-4">
                  <div className="text-sm font-mono">
                    <div className="font-bold text-gray-200 tracking-wider">
                      {userData.name.toUpperCase()}
                    </div>
                    <div className="text-gray-400 text-xs tracking-wider">
                      {isAdmin ? 'ADMIN' : 'TRADER'}
                    </div>
                  </div>
                  
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 px-3 py-2 text-sm font-bold text-gray-300 hover:text-white hover:bg-gray-700 transition-colors border border-gray-600 font-mono tracking-wider"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>SAIR</span>
                  </button>
                </div>
              )}

              {/* LOADING STATE */}
              {!userData && user && (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-1 bg-gray-600 animate-pulse"></div>
                  <div className="w-4 h-1 bg-gray-600 animate-pulse"></div>
                  <div className="w-4 h-1 bg-gray-600 animate-pulse"></div>
                  <span className="text-sm text-gray-400 font-mono tracking-wider">
                    CARREGANDO...
                  </span>
                </div>
              )}
            </div>

            {/* BOTÃO MOBILE MENU */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 text-gray-400 hover:text-white transition-colors"
              aria-label="Menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>

          {/* MENU MOBILE DROPDOWN */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-600 bg-gray-800">
              <div className="px-2 py-4 space-y-3">
                
                {/* HISTÓRICO MOBILE */}
                {userData && (
                  <Link
                    href="/history"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full bg-gray-700 hover:bg-gray-600 text-gray-200 flex items-center justify-center space-x-3 px-4 py-3 font-mono tracking-wider font-bold transition-colors"
                  >
                    <Receipt className="h-5 w-5" />
                    <span>VER HISTÓRICO DE TRANSAÇÕES</span>
                  </Link>
                )}

                {/* ADMIN MOBILE */}
                {isAdmin && (
                  <Link
                    href="/admin/deposits"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center space-x-3 px-4 py-3 font-mono tracking-wider font-bold transition-colors"
                  >
                    <Settings className="h-5 w-5" />
                    <span>PAINEL ADMINISTRATIVO</span>
                  </Link>
                )}
                
                {/* DEPÓSITO MOBILE */}
                {userData && (
                  <button
                    onClick={() => {
                      setShowDepositModal(true);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full bg-green-700 hover:bg-green-600 text-white flex items-center justify-center space-x-3 px-4 py-3 font-mono tracking-wider font-bold transition-colors"
                  >
                    <Plus className="h-5 w-5" />
                    <span>SOLICITAR DEPÓSITO</span>
                  </button>
                )}

                {/* SALDO MOBILE */}
                {userData && (
                  <div className="px-3 py-3 bg-gray-750 border border-gray-600">
                    <div className="text-xs text-gray-400 font-mono tracking-wider mb-1">
                      SALDO DISPONÍVEL
                    </div>
                    <div className="flex items-center text-green-400 font-mono font-bold">
                      <span className="text-lg truncate" title={'$ ' + (userData.balance || 0).toLocaleString()}>
                        $ {formatMoney(userData.balance || 0)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 font-mono mt-1">
                      Valor exato: $ {(userData.balance || 0).toLocaleString()}
                    </div>
                  </div>
                )}

                {/* USUÁRIO MOBILE */}
                {userData && (
                  <div className="px-3 py-3 bg-gray-750 border border-gray-600">
                    <div className="font-bold text-gray-200 font-mono tracking-wider text-lg">
                      {userData.name.toUpperCase()}
                    </div>
                    <div className="text-gray-400 text-sm font-mono tracking-wider">
                      {isAdmin ? 'ADMINISTRADOR' : 'TRADER ATIVO'}
                    </div>
                  </div>
                )}

                {/* LOGOUT MOBILE */}
                {userData && (
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center space-x-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors font-mono tracking-wider font-bold"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>SAIR DA CONTA</span>
                  </button>
                )}

                {/* LOADING MOBILE */}
                {!userData && user && (
                  <div className="px-3 py-3 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-1 bg-gray-600 animate-pulse"></div>
                      <div className="w-4 h-1 bg-gray-600 animate-pulse"></div>
                      <div className="w-4 h-1 bg-gray-600 animate-pulse"></div>
                      <span className="text-sm text-gray-400 font-mono tracking-wider ml-2">
                        CARREGANDO DADOS...
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* MODAL DE DEPÓSITO */}
      <DepositModal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
      />
    </>
  );
}