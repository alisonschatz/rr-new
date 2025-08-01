// components/Navbar.js - REESCRITA DO ZERO
'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { LogOut, Menu, X, Plus, Receipt, Settings, Users, Wallet } from 'lucide-react';
import DepositModal from './DepositModal';

// Formatação de dinheiro
const formatMoney = (number) => {
  if (!number || number === 0) return '0';
  const num = Math.abs(number);
  if (num >= 1000000000000000000) return (num / 1000000000000000000).toFixed(1).replace(/\.?0+$/, '') + 'kkkkkkkk';
  if (num >= 1000000000000000) return (num / 1000000000000000).toFixed(1).replace(/\.?0+$/, '') + 'kkkkkkk';
  if (num >= 1000000000000) return (num / 1000000000000).toFixed(1).replace(/\.?0+$/, '') + 'kkkkkk';
  if (num >= 1000000000) return (num / 1000000000).toFixed(1).replace(/\.?0+$/, '') + 'kkkkk';
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.?0+$/, '') + 'kkkk';
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.?0+$/, '') + 'kkk';
  if (num >= 1) return (num).toFixed(1).replace(/\.?0+$/, '') + 'kk';
  return num.toString();
};

// Lista de administradores
const ADMIN_UIDS = [
  'XgZ620lbRTQA6ELAvfqWBXKQGGJ3',
  'W025u9s5SOWuHA0pQYF2UOzy6mG2',
];

export default function Navbar() {
  const { user, userData, logout } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);

  const isAdmin = user && ADMIN_UIDS.includes(user.uid);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Erro no logout:', error);
    } finally {
      setMobileMenuOpen(false);
    }
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <>
      <nav className="navbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* LOGO */}
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
            <div className="hidden lg:flex items-center space-x-4">
              
              {userData ? (
                <>
                  {/* SALDO */}
                  <div className="flex items-center space-x-3 bg-gray-700 hover:bg-gray-600 transition-colors px-4 py-2 border border-gray-600">
                    <Wallet className="h-5 w-5 text-green-400 flex-shrink-0" />
                    <div className="flex flex-col items-end">
                      <div className="text-xs text-gray-400 font-mono tracking-wider leading-tight">SALDO</div>
                      <div className="text-lg font-bold text-green-400 font-mono leading-tight">
                        ${formatMoney(userData.balance || 0)}
                      </div>
                    </div>
                  </div>

                  {/* DEPOSITAR */}
                  <button
                    onClick={() => setShowDepositModal(true)}
                    className="btn btn-success flex items-center space-x-2 font-mono text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    <span>DEPOSITAR</span>
                  </button>

                  {/* PERFIL */}
                  <Link
                    href="/profile"
                    className="btn btn-secondary flex items-center space-x-2 font-mono text-sm"
                  >
                    <Users className="h-4 w-4" />
                    <span>PERFIL</span>
                  </Link>
                  
                  {/* HISTÓRICO */}
                  <Link
                    href="/history"
                    className="btn btn-secondary flex items-center space-x-2 font-mono text-sm"
                  >
                    <Receipt className="h-4 w-4" />
                    <span>HISTÓRICO</span>
                  </Link>

                  {/* ADMIN (se aplicável) */}
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="btn bg-red-600 hover:bg-red-500 text-white flex items-center space-x-2 font-mono text-sm"
                    >
                      <Settings className="h-4 w-4" />
                      <span>ADMIN</span>
                    </Link>
                  )}

                  {/* USUÁRIO E LOGOUT */}
                  <div className="flex items-center space-x-3 border-l border-gray-600 pl-4">
                    <div className="text-sm font-mono text-right">
                      <div className="font-bold text-gray-200">
                        {userData.name?.toUpperCase() || 'USUÁRIO'}
                      </div>
                      <div className="text-xs text-gray-400">
                        {isAdmin ? 'ADMINISTRADOR' : 'TRADER'}
                      </div>
                    </div>
                    
                    <button
                      onClick={handleLogout}
                      className="btn btn-secondary flex items-center space-x-2 font-mono text-sm"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>SAIR</span>
                    </button>
                  </div>
                </>
              ) : (
                /* LOADING */
                <div className="flex items-center space-x-2 text-gray-400 font-mono text-sm">
                  <div className="w-3 h-3 bg-gray-600 animate-pulse"></div>
                  <span>CARREGANDO...</span>
                </div>
              )}
            </div>

            {/* BOTÃO MOBILE */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-gray-400 hover:text-white transition-colors"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* MENU MOBILE */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-gray-600 bg-gray-800">
              <div className="px-4 py-4 space-y-3">
                
                {userData ? (
                  <>
                    {/* CARD DO USUÁRIO COM SALDO */}
                    <div className="bg-gray-750 p-4 border border-gray-600">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold text-gray-200 font-mono">
                            {userData.name?.toUpperCase() || 'USUÁRIO'}
                          </div>
                          <div className="text-xs text-gray-400 font-mono">
                            {isAdmin ? 'ADMINISTRADOR' : 'TRADER ATIVO'}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3 bg-gray-800 px-3 py-2 border border-gray-600">
                          <Wallet className="h-5 w-5 text-green-400 flex-shrink-0" />
                          <div className="flex flex-col items-end">
                            <div className="text-xs text-gray-400 font-mono tracking-wider leading-tight">SALDO</div>
                            <div className="text-lg font-bold text-green-400 font-mono leading-tight">
                              ${formatMoney(userData.balance || 0)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* BOTÕES DE NAVEGAÇÃO */}
                    <button
                      onClick={() => {
                        setShowDepositModal(true);
                        closeMobileMenu();
                      }}
                      className="w-full btn btn-success flex items-center justify-center space-x-3 font-mono"
                    >
                      <Plus className="h-5 w-5" />
                      <span>SOLICITAR DEPÓSITO</span>
                    </button>

                    <Link
                      href="/profile"
                      onClick={closeMobileMenu}
                      className="w-full btn btn-secondary flex items-center justify-center space-x-3 font-mono"
                    >
                      <Users className="h-5 w-5" />
                      <span>MEU PERFIL</span>
                    </Link>

                    <Link
                      href="/history"
                      onClick={closeMobileMenu}
                      className="w-full btn btn-secondary flex items-center justify-center space-x-3 font-mono"
                    >
                      <Receipt className="h-5 w-5" />
                      <span>HISTÓRICO</span>
                    </Link>

                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={closeMobileMenu}
                        className="w-full btn bg-red-600 hover:bg-red-500 text-white flex items-center justify-center space-x-3 font-mono"
                      >
                        <Settings className="h-5 w-5" />
                        <span>PAINEL ADMINISTRATIVO</span>
                      </Link>
                    )}

                    <button
                      onClick={handleLogout}
                      className="w-full btn btn-secondary flex items-center justify-center space-x-3 font-mono border-t border-gray-600 pt-3 mt-3"
                    >
                      <LogOut className="h-5 w-5" />
                      <span>SAIR DA CONTA</span>
                    </button>
                  </>
                ) : (
                  /* LOADING MOBILE */
                  <div className="text-center py-4">
                    <div className="flex items-center justify-center space-x-2 text-gray-400 font-mono">
                      <div className="w-3 h-3 bg-gray-600 animate-pulse"></div>
                      <span>CARREGANDO...</span>
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