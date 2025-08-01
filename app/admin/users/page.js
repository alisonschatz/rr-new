// app/admin/users/page.js - REESCRITO DO ZERO
'use client';

import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, orderBy, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, 
  Users, 
  Edit3, 
  Save, 
  X, 
  Search, 
  User, 
  Shield, 
  ShieldCheck, 
  AlertTriangle,
  DollarSign,
  Calendar,
  Mail,
  Phone,
  CheckCircle,
  XCircle,
  MessageCircle,
  ExternalLink,
  Gamepad2
} from 'lucide-react';

// Constantes
const ADMIN_UIDS = [
  'XgZ620lbRTQA6ELAvfqWBXKQGGJ3',
  'W025u9s5SOWuHA0pQYF2UOzy6mG2',
];

// Utilitários
const formatMoney = (number) => {
  if (!number || number === 0) return '0.00';
  const num = Math.abs(number);
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace('.0', '') + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1).replace('.0', '') + 'K';
  return num.toFixed(2);
};

const formatDate = (timestamp) => {
  if (!timestamp?.seconds) return 'N/A';
  return new Date(timestamp.seconds * 1000).toLocaleDateString('pt-BR');
};

// Função para gerar link do Telegram
const getTelegramLink = (phoneNumber) => {
  if (!phoneNumber) return null;
  // Remove todos os caracteres não numéricos
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  return `https://t.me/+${cleanNumber}`;
};

// Função para formatar link do Rival Regions
const getRivalRegionsLink = (link) => {
  if (!link) return null;
  if (link.startsWith('http')) return link;
  return `https://${link}`;
};

// Componente Modal de Confirmação
const ConfirmDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = "CONFIRMAR",
  loading = false 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 border border-gray-600 p-6 max-w-md w-full rounded">
        <div className="flex items-center space-x-3 mb-4">
          <AlertTriangle className="h-6 w-6 text-yellow-500" />
          <h3 className="text-lg font-bold text-gray-200 font-mono">
            {title}
          </h3>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-300 font-mono text-sm whitespace-pre-line">
            {message}
          </p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 btn btn-secondary font-mono"
          >
            CANCELAR
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 btn btn-danger font-mono"
          >
            {loading ? 'PROCESSANDO...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente de Links de Contato
const ContactLinks = ({ user, size = 'normal' }) => {
  const iconSize = size === 'small' ? 'h-4 w-4' : 'h-5 w-5';
  const textSize = size === 'small' ? 'text-xs' : 'text-sm';
  
  return (
    <div className="space-y-2">
      {/* Telegram */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400 font-mono min-w-0">TELEGRAM:</span>
        <div className="flex items-center space-x-1">
          {user.telegramNumber ? (
            <a
              href={getTelegramLink(user.telegramNumber)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 transition-colors"
              title={`Abrir conversa no Telegram: ${user.telegramNumber}`}
            >
              <MessageCircle className="h-3 w-3" />
              <span className="text-xs font-mono">
                {size === 'small' ? 'Contatar' : user.telegramNumber}
              </span>
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : (
            <div className="flex items-center space-x-1 text-gray-500 text-xs">
              <MessageCircle className="h-3 w-3" />
              <span className="font-mono">Não informado</span>
            </div>
          )}
        </div>
      </div>

      {/* Rival Regions */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400 font-mono min-w-0">RIVAL REGIONS:</span>
        <div className="flex items-center space-x-1">
          {user.rivalRegionsLink ? (
            <a
              href={getRivalRegionsLink(user.rivalRegionsLink)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 text-green-400 hover:text-green-300 transition-colors"
              title="Ver perfil no Rival Regions"
            >
              <Gamepad2 className="h-3 w-3" />
              <span className="text-xs font-mono">Ver Perfil</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : (
            <div className="flex items-center space-x-1 text-gray-500 text-xs">
              <Gamepad2 className="h-3 w-3" />
              <span className="font-mono">Não informado</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
const VerificationBadge = ({ isVerified, size = 'normal' }) => {
  const sizeClass = size === 'small' ? 'h-4 w-4' : 'h-5 w-5';
  const textSize = size === 'small' ? 'text-xs' : 'text-sm';
  
  if (isVerified) {
    return (
      <div className={`flex items-center space-x-1 ${textSize}`}>
        <ShieldCheck className={`${sizeClass} text-green-400`} />
        <span className="text-green-400 font-mono font-bold">
          {size === 'small' ? 'VERIFICADO' : 'VERIFICADO'}
        </span>
      </div>
    );
  }
  
  return (
    <div className={`flex items-center space-x-1 ${textSize}`}>
      <Shield className={`${sizeClass} text-gray-500`} />
      <span className="text-gray-500 font-mono">
        {size === 'small' ? 'NÃO VERIFICADO' : 'NÃO VERIFICADO'}
      </span>
    </div>
  );
};

// Componente Status Badge
const StatusBadge = ({ userId, currentUserId, adminUIDs }) => {
  if (userId === currentUserId) {
    return (
      <span className="px-2 py-1 text-xs font-bold font-mono bg-blue-600 text-white rounded">
        VOCÊ
      </span>
    );
  }
  
  if (adminUIDs.includes(userId)) {
    return (
      <span className="px-2 py-1 text-xs font-bold font-mono bg-purple-600 text-white rounded">
        ADMIN
      </span>
    );
  }
  
  return (
    <span className="px-2 py-1 text-xs font-bold font-mono bg-gray-600 text-white rounded">
      USUÁRIO
    </span>
  );
};

// Componente Principal
export default function AdminUsersPage() {
  const { user, userData } = useAuth();
  
  // Estados
  const [users, setUsers] = useState([]);
  const [verifications, setVerifications] = useState({});
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUserId, setEditingUserId] = useState(null);
  const [editBalance, setEditBalance] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState(null);
  const [updating, setUpdating] = useState(false);

  const isAdmin = user && ADMIN_UIDS.includes(user.uid);

  // Carregar dados
  useEffect(() => {
    if (!user || !isAdmin) {
      setLoading(false);
      return;
    }

    const unsubscribes = [];

    // Carregar usuários
    const usersQuery = query(
      collection(db, 'users'),
      orderBy('createdAt', 'desc')
    );

    unsubscribes.push(onSnapshot(usersQuery, (snapshot) => {
      const usersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        balance: doc.data().balance || 0
      }));
      
      setUsers(usersList);
      setLoading(false);
    }, (error) => {
      console.error('Erro ao carregar usuários:', error);
      toast.error('ERRO AO CARREGAR USUÁRIOS');
      setLoading(false);
    }));

    // Carregar verificações
    const verificationsQuery = query(
      collection(db, 'profile_verifications'),
      where('status', '==', 'approved')
    );

    unsubscribes.push(onSnapshot(verificationsQuery, (snapshot) => {
      const verificationsMap = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.userId) {
          verificationsMap[data.userId] = true;
        }
      });
      setVerifications(verificationsMap);
    }));

    return () => unsubscribes.forEach(unsub => unsub());
  }, [user, isAdmin]);

  // Filtrar usuários
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(u => 
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  // Handlers
  const handleEditBalance = (userId, currentBalance) => {
    setEditingUserId(userId);
    setEditBalance(currentBalance.toString());
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setEditBalance('');
    setShowConfirmDialog(false);
    setPendingUpdate(null);
  };

  const handleSaveBalance = () => {
    const newBalance = parseFloat(editBalance);
    const targetUser = users.find(u => u.id === editingUserId);
    
    if (!targetUser) {
      toast.error('USUÁRIO NÃO ENCONTRADO');
      return;
    }

    if (isNaN(newBalance) || newBalance < 0) {
      toast.error('VALOR INVÁLIDO');
      return;
    }

    const difference = newBalance - targetUser.balance;
    
    setPendingUpdate({
      userId: editingUserId,
      userName: targetUser.name || 'Usuário',
      currentBalance: targetUser.balance,
      newBalance,
      difference
    });
    
    setShowConfirmDialog(true);
  };

  const confirmBalanceUpdate = async () => {
    if (!pendingUpdate) return;

    setUpdating(true);

    try {
      await updateDoc(doc(db, 'users', pendingUpdate.userId), {
        balance: pendingUpdate.newBalance,
        lastBalanceUpdate: new Date(),
        balanceUpdatedBy: user.uid
      });

      const action = pendingUpdate.difference >= 0 ? 'CREDITADO' : 'DEBITADO';
      toast.success(`SALDO ${action}: ${formatMoney(Math.abs(pendingUpdate.difference))} $`);
      
      handleCancelEdit();
    } catch (error) {
      console.error('Erro ao atualizar saldo:', error);
      toast.error('ERRO AO ATUALIZAR SALDO');
    } finally {
      setUpdating(false);
    }
  };

  // Verificações de acesso
  if (!user) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen">
          <Navbar />
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="card text-center">
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-200 font-mono mb-4">
                ACESSO RESTRITO
              </h1>
              <p className="text-gray-400 font-mono mb-6">
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
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="card text-center">
              <Users className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-200 font-mono mb-4">
                ACESSO NEGADO
              </h1>
              <p className="text-gray-400 font-mono mb-6">
                Você não tem permissão para gerenciar usuários
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

  // Estatísticas
  const stats = {
    total: users.length,
    verified: Object.keys(verifications).length,
    totalBalance: users.reduce((sum, u) => sum + (u.balance || 0), 0),
    newToday: users.filter(u => {
      if (!u.createdAt?.seconds) return false;
      const today = new Date().toDateString();
      const userDate = new Date(u.createdAt.seconds * 1000).toDateString();
      return today === userDate;
    }).length
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen">
        <Navbar />
        
        <div className="max-w-7xl mx-auto px-4 py-6">
          
          {/* CABEÇALHO */}
          <div className="mb-8">
            <div className="card">
              <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:space-x-4">
                <Link href="/admin" className="btn btn-secondary font-mono text-sm w-fit">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  VOLTAR AO PAINEL
                </Link>
                
                <div className="flex items-start sm:items-center space-x-3">
                  <Users className="h-8 w-8 sm:h-8 sm:w-8 text-blue-500 flex-shrink-0 mt-1 sm:mt-0" />
                  <div>
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-200 font-mono leading-tight">
                      GERENCIAR USUÁRIOS
                    </h1>
                    <p className="text-gray-400 font-mono text-xs sm:text-sm mt-1">
                      Visualizar e editar usuários do sistema
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ESTATÍSTICAS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="stat-card text-center">
              <div className="text-2xl font-bold text-blue-400 font-mono mb-1">
                {stats.total}
              </div>
              <div className="text-sm text-gray-400 font-mono">
                USUÁRIOS TOTAIS
              </div>
            </div>
            
            <div className="stat-card text-center">
              <div className="text-2xl font-bold text-green-400 font-mono mb-1">
                {stats.verified}
              </div>
              <div className="text-sm text-gray-400 font-mono">
                VERIFICADOS
              </div>
            </div>
            
            <div className="stat-card text-center">
              <div className="text-2xl font-bold text-yellow-400 font-mono mb-1">
                ${formatMoney(stats.totalBalance)}
              </div>
              <div className="text-sm text-gray-400 font-mono">
                SALDO TOTAL
              </div>
            </div>
            
            <div className="stat-card text-center">
              <div className="text-2xl font-bold text-purple-400 font-mono mb-1">
                {stats.newToday}
              </div>
              <div className="text-sm text-gray-400 font-mono">
                NOVOS HOJE
              </div>
            </div>
          </div>

          {/* BUSCA */}
          <div className="card mb-8">
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
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-600">
              <h2 className="text-xl font-bold text-gray-200 font-mono">
                USUÁRIOS ({filteredUsers.length})
              </h2>
            </div>
            
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="text-gray-400 font-mono flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-gray-600 border-t-blue-500 rounded-full animate-spin"></div>
                  <span>CARREGANDO USUÁRIOS...</span>
                </div>
              </div>
            ) : filteredUsers.length > 0 ? (
              <>
                {/* TABELA DESKTOP */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-750">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-300 uppercase font-mono">
                          USUÁRIO
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-300 uppercase font-mono">
                          VERIFICAÇÃO
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-300 uppercase font-mono">
                          SALDO
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-300 uppercase font-mono">
                          CONTATO & PERFIL
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-300 uppercase font-mono">
                          CRIADO EM
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-300 uppercase font-mono">
                          STATUS
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-600">
                      {filteredUsers.map(userItem => (
                        <tr key={userItem.id} className="hover:bg-gray-750">
                          {/* USUÁRIO */}
                          <td className="px-4 py-4">
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0">
                                <div className="h-10 w-10 bg-gray-600 rounded-full flex items-center justify-center">
                                  <User className="h-6 w-6 text-gray-300" />
                                </div>
                              </div>
                              <div>
                                <div className="font-bold text-gray-200 font-mono">
                                  {userItem.name || 'Sem nome'}
                                </div>
                                <div className="text-sm text-gray-400 font-mono">
                                  {userItem.email}
                                </div>
                                <div className="text-xs text-gray-500 font-mono">
                                  ID: {userItem.id.substring(0, 8)}...
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* VERIFICAÇÃO */}
                          <td className="px-4 py-4">
                            <VerificationBadge isVerified={verifications[userItem.id]} />
                          </td>

                          {/* SALDO */}
                          <td className="px-4 py-4">
                            {editingUserId === userItem.id ? (
                              <div className="flex items-center space-x-2">
                                <input
                                  type="number"
                                  value={editBalance}
                                  onChange={(e) => setEditBalance(e.target.value)}
                                  step="0.01"
                                  min="0"
                                  className="w-28 px-2 py-1 bg-gray-700 border border-gray-500 text-gray-100 text-sm font-mono rounded"
                                  disabled={updating}
                                />
                                <button
                                  onClick={handleSaveBalance}
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
                                  ${formatMoney(userItem.balance)}
                                </span>
                                <button
                                  onClick={() => handleEditBalance(userItem.id, userItem.balance)}
                                  className="p-1 text-gray-400 hover:text-gray-200"
                                  title="Editar saldo"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </button>
                              </div>
                            )}
                          </td>

                          {/* CONTATO & PERFIL */}
                          <td className="px-4 py-4">
                            <ContactLinks user={userItem} />
                            
                            {(!userItem.telegramNumber || !userItem.rivalRegionsLink) && (
                              <div className="flex items-center space-x-1 text-yellow-400 mt-2">
                                <AlertTriangle className="h-3 w-3" />
                                <span className="text-xs font-mono">
                                  Perfil incompleto
                                </span>
                              </div>
                            )}
                          </td>

                          {/* CRIADO EM */}
                          <td className="px-4 py-4">
                            <div className="text-sm text-gray-200 font-mono">
                              {formatDate(userItem.createdAt)}
                            </div>
                          </td>

                          {/* STATUS */}
                          <td className="px-4 py-4">
                            <StatusBadge 
                              userId={userItem.id} 
                              currentUserId={user?.uid} 
                              adminUIDs={ADMIN_UIDS} 
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* CARDS MOBILE */}
                <div className="lg:hidden space-y-4">
                  {filteredUsers.map(userItem => (
                    <div key={userItem.id} className="bg-gray-750 border border-gray-600 p-4 rounded">
                      <div className="flex items-start space-x-3 mb-3">
                        <div className="h-10 w-10 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="h-6 w-6 text-gray-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-bold text-gray-200 font-mono text-sm truncate">
                              {userItem.name || 'Sem nome'}
                            </span>
                            <StatusBadge 
                              userId={userItem.id} 
                              currentUserId={user?.uid} 
                              adminUIDs={ADMIN_UIDS} 
                            />
                          </div>
                          <div className="text-xs text-gray-400 font-mono">
                            {userItem.email}
                          </div>
                          <div className="text-xs text-gray-500 font-mono">
                            ID: {userItem.id.substring(0, 8)}...
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {/* Verificação */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400 font-mono">VERIFICAÇÃO:</span>
                          <VerificationBadge isVerified={verifications[userItem.id]} size="small" />
                        </div>

                        {/* Saldo */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400 font-mono">SALDO:</span>
                          {editingUserId === userItem.id ? (
                            <div className="flex items-center space-x-1">
                              <input
                                type="number"
                                value={editBalance}
                                onChange={(e) => setEditBalance(e.target.value)}
                                step="0.01"
                                min="0"
                                className="w-20 px-2 py-1 bg-gray-700 border border-gray-500 text-gray-100 text-xs font-mono rounded"
                                disabled={updating}
                              />
                              <button
                                onClick={handleSaveBalance}
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
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-green-400 font-mono text-sm">
                                ${formatMoney(userItem.balance)}
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

                        {/* Data */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400 font-mono">CRIADO EM:</span>
                          <span className="text-xs text-gray-200 font-mono">
                            {formatDate(userItem.createdAt)}
                          </span>
                        </div>

                        {/* Contato e Perfil */}
                        <div className="space-y-2">
                          <ContactLinks user={userItem} size="small" />
                          
                          {(!userItem.telegramNumber || !userItem.rivalRegionsLink) && (
                            <div className="flex items-center space-x-1 text-yellow-400">
                              <AlertTriangle className="h-3 w-3" />
                              <span className="text-xs font-mono">Perfil incompleto</span>
                            </div>
                          )}
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
                  {searchTerm ? 'Tente usar outros termos de busca' : 'Não há usuários cadastrados'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* MODAL DE CONFIRMAÇÃO */}
        <ConfirmDialog
          isOpen={showConfirmDialog}
          onClose={handleCancelEdit}
          onConfirm={confirmBalanceUpdate}
          loading={updating}
          title="CONFIRMAR ALTERAÇÃO DE SALDO"
          message={pendingUpdate ? (
            `Confirma a alteração do saldo de "${pendingUpdate.userName}"?\n\n` +
            `Saldo atual: $${formatMoney(pendingUpdate.currentBalance)}\n` +
            `Novo saldo: $${formatMoney(pendingUpdate.newBalance)}\n` +
            `Diferença: ${pendingUpdate.difference >= 0 ? '+' : ''}$${formatMoney(pendingUpdate.difference)}\n\n` +
            `Esta ação será registrada no sistema.`
          ) : ''}
          confirmText="SIM, ALTERAR SALDO"
        />
      </div>
    </ProtectedRoute>
  );
}