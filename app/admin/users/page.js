// app/admin/users/page.js - Gerenciar Usuários
'use client';

import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { ArrowLeft, Users, Edit3, Save, X, Search, DollarSign, User, Calendar, Mail, Phone } from 'lucide-react';

// Formatação de dinheiro
const formatMoney = (number) => {
  if (!number || number === 0) return '0.00';
  const num = Math.abs(number);
  if (num >= 1000000000000000000) return (num / 1000000000000000000).toFixed(2).replace(/\.?0+$/, '') + 'kkkkkkkk';
  if (num >= 1000000000000000) return (num / 1000000000000000).toFixed(2).replace(/\.?0+$/, '') + 'kkkkkkk';
  if (num >= 1000000000000) return (num / 1000000000000).toFixed(2).replace(/\.?0+$/, '') + 'kkkkkk';
  if (num >= 1000000000) return (num / 1000000000).toFixed(2).replace(/\.?0+$/, '') + 'kkkkk';
  if (num >= 1000000) return (num / 1000000).toFixed(2).replace(/\.?0+$/, '') + 'kkkk';
  if (num >= 1000) return (num / 1000).toFixed(2).replace(/\.?0+$/, '') + 'kkk';
  if (num >= 1) return (num).toFixed(2).replace(/\.?0+$/, '') + 'kk';
  return num.toFixed(2);
};

// Lista de administradores
const ADMIN_UIDS = [
  'XgZ620lbRTQA6ELAvfqWBXKQGGJ3',
  'W025u9s5SOWuHA0pQYF2UOzy6mG2',
];

export default function AdminUsersPage() {
  const { user, userData } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [editBalance, setEditBalance] = useState('');
  const [updating, setUpdating] = useState(false);

  const isAdmin = user && ADMIN_UIDS.includes(user.uid);

  useEffect(() => {
    if (!user || !isAdmin) {
      setLoading(false);
      return;
    }

    console.log('🔄 Carregando usuários...');

    // Buscar todos os usuários
    const usersQuery = query(
      collection(db, 'users'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      usersQuery,
      (snapshot) => {
        const usersList = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            balance: data.balance || 0,
            createdAt: data.createdAt || null,
            lastLogin: data.lastLogin || null
          };
        });

        console.log(`📊 ${usersList.length} usuários encontrados`);
        setUsers(usersList);
        setFilteredUsers(usersList);
        setLoading(false);
      },
      (error) => {
        console.error('❌ Erro ao carregar usuários:', error);
        setLoading(false);
        toast.error('ERRO AO CARREGAR USUÁRIOS');
      }
    );

    return () => unsubscribe();
  }, [user, isAdmin]);

  // Filtrar usuários por busca
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user => 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  const handleEditBalance = (userId, currentBalance) => {
    setEditingUser(userId);
    setEditBalance(currentBalance.toString());
  };

  const handleSaveBalance = async (userId) => {
    const newBalance = parseFloat(editBalance);
    
    if (isNaN(newBalance) || newBalance < 0) {
      toast.error('VALOR INVÁLIDO');
      return;
    }

    setUpdating(true);

    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        balance: newBalance
      });

      toast.success('SALDO ATUALIZADO COM SUCESSO!');
      setEditingUser(null);
      setEditBalance('');
    } catch (error) {
      console.error('❌ Erro ao atualizar saldo:', error);
      toast.error('ERRO AO ATUALIZAR SALDO');
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditBalance('');
  };

  if (!user) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen">
          <Navbar />
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="card text-center">
              <h1 className="text-2xl font-bold text-gray-200 font-mono mb-4">
                ACESSO RESTRITO
              </h1>
              <p className="text-gray-400 font-mono mb-4">
                Você precisa estar logado para acessar esta página
              </p>
              <Link href="/login" className="btn btn-primary font-mono">
                FAZER LOGIN
              </Link>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!isAdmin) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen">
          <Navbar />
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="card text-center">
              <Users className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-200 font-mono mb-4">
                ACESSO NEGADO
              </h1>
              <p className="text-gray-400 font-mono mb-4">
                Você não tem permissão para acessar o gerenciamento de usuários
              </p>
              <Link href="/dashboard" className="btn btn-primary font-mono">
                VOLTAR AO DASHBOARD
              </Link>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Estatísticas dos usuários
  const stats = {
    totalUsers: users.length,
    totalBalance: users.reduce((sum, user) => sum + (user.balance || 0), 0),
    activeUsers: users.filter(user => user.lastLogin).length,
    newUsersToday: users.filter(user => {
      if (!user.createdAt?.seconds) return false;
      const today = new Date();
      const userDate = new Date(user.createdAt.seconds * 1000);
      return userDate.toDateString() === today.toDateString();
    }).length
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen">
        <Navbar />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          
          {/* CABEÇALHO */}
          <div className="mb-6 sm:mb-8">
            <div className="card">
              <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <Link href="/admin/deposits" className="btn btn-secondary font-mono text-xs sm:text-sm">
                    <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    VOLTAR
                  </Link>
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
                    <div>
                      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-200 font-mono">
                        GERENCIAR USUÁRIOS
                      </h1>
                      <p className="text-gray-400 font-mono text-xs sm:text-sm">
                        Visualizar e editar usuários do sistema
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ESTATÍSTICAS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-6 sm:mb-8">
            <div className="stat-card text-center p-2 sm:p-3">
              <div className="text-lg sm:text-2xl font-bold text-blue-400 font-mono">
                {stats.totalUsers}
              </div>
              <div className="text-xs text-gray-400 font-mono tracking-wider">
                TOTAL USUÁRIOS
              </div>
            </div>
            
            <div className="stat-card text-center p-2 sm:p-3">
              <div className="text-lg sm:text-2xl font-bold text-green-400 font-mono">
                {formatMoney(stats.totalBalance)} $
              </div>
              <div className="text-xs text-gray-400 font-mono tracking-wider">
                SALDO TOTAL
              </div>
            </div>
            
            <div className="stat-card text-center p-2 sm:p-3">
              <div className="text-lg sm:text-2xl font-bold text-yellow-400 font-mono">
                {stats.activeUsers}
              </div>
              <div className="text-xs text-gray-400 font-mono tracking-wider">
                COM LOGIN
              </div>
            </div>
            
            <div className="stat-card text-center p-2 sm:p-3">
              <div className="text-lg sm:text-2xl font-bold text-purple-400 font-mono">
                {stats.newUsersToday}
              </div>
              <div className="text-xs text-gray-400 font-mono tracking-wider">
                NOVOS HOJE
              </div>
            </div>
          </div>

          {/* BUSCA */}
          <div className="card mb-6 sm:mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome, email ou ID..."
                className="input pl-10 font-mono"
              />
            </div>
          </div>

          {/* LISTA DE USUÁRIOS */}
          <div className="card">
            <div className="flex items-center justify-between mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-gray-600">
              <h2 className="text-lg sm:text-xl font-bold text-gray-200 font-mono">
                USUÁRIOS ({filteredUsers.length})
              </h2>
            </div>
            
            {loading ? (
              <div className="flex justify-center py-8 sm:py-12">
                <div className="text-gray-400 font-mono text-sm flex items-center space-x-2">
                  <div className="w-4 h-1 bg-gray-600 animate-pulse"></div>
                  <div className="w-4 h-1 bg-gray-600 animate-pulse"></div>
                  <div className="w-4 h-1 bg-gray-600 animate-pulse"></div>
                  <span>CARREGANDO USUÁRIOS...</span>
                </div>
              </div>
            ) : filteredUsers.length > 0 ? (
              <>
                {/* TABELA DESKTOP */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="table-header">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-300 uppercase tracking-wider font-mono">
                          USUÁRIO
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-300 uppercase tracking-wider font-mono">
                          CONTATO
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-300 uppercase tracking-wider font-mono">
                          RIVAL REGIONS
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-300 uppercase tracking-wider font-mono">
                          SALDO
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-300 uppercase tracking-wider font-mono">
                          AÇÕES
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-600">
                      {filteredUsers.map(userItem => (
                        <tr key={userItem.id} className="table-row">
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-3">
                              <User className="h-8 w-8 text-gray-400" />
                              <div>
                                <div className="font-bold text-gray-200 font-mono">
                                  {userItem.name || 'Sem nome'}
                                </div>
                                <div className="text-xs text-gray-400 font-mono">
                                  {userItem.email || 'Sem email'}
                                </div>
                                <div className="text-xs text-gray-500 font-mono">
                                  ID: {userItem.id.substring(0, 8)}...
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="space-y-1">
                              {userItem.telegramNumber && (
                                <div className="text-xs text-gray-200 font-mono flex items-center space-x-1">
                                  <span>📱</span>
                                  <span>{userItem.telegramNumber}</span>
                                </div>
                              )}
                              <div className="text-xs text-gray-400 font-mono">
                                Criado: {userItem.createdAt?.seconds 
                                  ? new Date(userItem.createdAt.seconds * 1000).toLocaleDateString('pt-BR')
                                  : 'N/A'
                                }
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {userItem.rivalRegionsLink ? (
                              <a
                                href={userItem.rivalRegionsLink.startsWith('http') ? userItem.rivalRegionsLink : `https://${userItem.rivalRegionsLink}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 font-mono text-sm flex items-center space-x-1"
                              >
                                <span>🎮</span>
                                <span>Ver Perfil</span>
                              </a>
                            ) : (
                              <span className="text-gray-500 font-mono text-sm">Não informado</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {editingUser === userItem.id ? (
                              <div className="flex items-center space-x-2">
                                <input
                                  type="number"
                                  value={editBalance}
                                  onChange={(e) => setEditBalance(e.target.value)}
                                  step="0.01"
                                  min="0"
                                  className="w-24 px-2 py-1 bg-gray-700 border border-gray-500 text-gray-100 text-sm font-mono"
                                  disabled={updating}
                                />
                                <button
                                  onClick={() => handleSaveBalance(userItem.id)}
                                  disabled={updating}
                                  className="p-1 text-green-400 hover:text-green-300"
                                >
                                  <Save className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  disabled={updating}
                                  className="p-1 text-red-400 hover:text-red-300"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <span className="font-bold text-green-400 font-mono">
                                  $ {formatMoney(userItem.balance)}
                                </span>
                                <button
                                  onClick={() => handleEditBalance(userItem.id, userItem.balance)}
                                  className="p-1 text-gray-400 hover:text-gray-200"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </button>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-gray-200 font-mono text-sm">
                              {userItem.createdAt?.seconds 
                                ? new Date(userItem.createdAt.seconds * 1000).toLocaleDateString('pt-BR')
                                : 'N/A'
                              }
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-2">
                              {userItem.id === user?.uid && (
                                <span className="px-2 py-1 text-xs font-bold font-mono bg-blue-600 text-white">
                                  VOCÊ
                                </span>
                              )}
                              {ADMIN_UIDS.includes(userItem.id) && userItem.id !== user?.uid && (
                                <span className="px-2 py-1 text-xs font-bold font-mono bg-purple-600 text-white">
                                  ADMIN
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* CARDS MOBILE */}
                <div className="md:hidden space-y-4">
                  {filteredUsers.map(userItem => (
                    <div key={userItem.id} className="bg-gray-750 border border-gray-600 p-4">
                      <div className="flex items-start space-x-3 mb-3">
                        <User className="h-8 w-8 text-gray-400 mt-1" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-bold text-gray-200 font-mono text-sm truncate">
                              {userItem.name || 'Sem nome'}
                            </span>
                            {userItem.id === user?.uid && (
                              <span className="px-2 py-1 text-xs font-bold font-mono bg-blue-600 text-white">
                                VOCÊ
                              </span>
                            )}
                            {ADMIN_UIDS.includes(userItem.id) && userItem.id !== user?.uid && (
                              <span className="px-2 py-1 text-xs font-bold font-mono bg-purple-600 text-white">
                                ADMIN
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-400 font-mono">
                            {userItem.email || 'Sem email'}
                          </div>
                          <div className="text-xs text-gray-400 font-mono">
                            ID: {userItem.id.substring(0, 8)}...
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                        <div>
                          <span className="text-gray-400 block">SALDO:</span>
                          {editingUser === userItem.id ? (
                            <div className="flex items-center space-x-1 mt-1">
                              <input
                                type="number"
                                value={editBalance}
                                onChange={(e) => setEditBalance(e.target.value)}
                                step="0.01"
                                min="0"
                                className="w-20 px-2 py-1 bg-gray-700 border border-gray-500 text-gray-100 text-xs font-mono"
                                disabled={updating}
                              />
                              <button
                                onClick={() => handleSaveBalance(userItem.id)}
                                disabled={updating}
                                className="p-1 text-green-400"
                              >
                                <Save className="h-3 w-3" />
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                disabled={updating}
                                className="p-1 text-red-400"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="font-bold text-green-400">
                                $ {formatMoney(userItem.balance)}
                              </span>
                              <button
                                onClick={() => handleEditBalance(userItem.id, userItem.balance)}
                                className="p-1 text-gray-400"
                              >
                                <Edit3 className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                        </div>
                        
                        <div>
                          <span className="text-gray-400 block">CRIADO EM:</span>
                          <div className="text-gray-200 mt-1">
                            {userItem.createdAt?.seconds 
                              ? new Date(userItem.createdAt.seconds * 1000).toLocaleDateString('pt-BR')
                              : 'N/A'
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-400 font-mono mb-2">
                  NENHUM USUÁRIO ENCONTRADO
                </h3>
                <p className="text-gray-500 font-mono">
                  {searchTerm ? 'Tente buscar por outros termos' : 'Não há usuários cadastrados'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}