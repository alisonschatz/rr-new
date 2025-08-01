// app/admin/page.js - PAINEL ADMINISTRATIVO CORRIGIDO
'use client';

import { useState, useEffect } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { 
  Settings, 
  Users, 
  Shield, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Activity,
  Database,
  BarChart3,
  ArrowLeft
} from 'lucide-react';

// Lista de administradores
const ADMIN_UIDS = [
  'XgZ620lbRTQA6ELAvfqWBXKQGGJ3',
  'W025u9s5SOWuHA0pQYF2UOzy6mG2',
];

// Formatação de dinheiro
const formatMoney = (number) => {
  if (!number || number === 0) return '0.00';
  const num = Math.abs(number);
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace('.0', '') + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1).replace('.0', '') + 'K';
  return num.toFixed(2);
};

export default function AdminDashboard() {
  const { user, userData } = useAuth();
  const [stats, setStats] = useState({
    deposits: { pending: 0, approved: 0, rejected: 0, totalValue: 0 },
    verifications: { pending: 0, approved: 0, rejected: 0 },
    users: { total: 0, verified: 0, withProfile: 0, new24h: 0 },
    system: { totalTransactions: 0, activeOrders: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);

  const isAdmin = user && ADMIN_UIDS.includes(user.uid);

  useEffect(() => {
    if (!user || !isAdmin) {
      setLoading(false);
      return;
    }

    const unsubscribes = [];

    // Listener para depósitos
    const depositsQuery = query(collection(db, 'deposit_requests'));
    unsubscribes.push(onSnapshot(depositsQuery, (snapshot) => {
      const deposits = snapshot.docs.map(doc => doc.data());
      
      const depositStats = {
        pending: deposits.filter(d => d.status === 'pending').length,
        approved: deposits.filter(d => d.status === 'approved').length,
        rejected: deposits.filter(d => d.status === 'rejected').length,
        totalValue: deposits
          .filter(d => d.status === 'pending')
          .reduce((sum, d) => sum + (d.amount || 0), 0)
      };

      setStats(prev => ({ ...prev, deposits: depositStats }));
    }));

    // Listener para verificações
    const verificationsQuery = query(collection(db, 'profile_verifications'));
    unsubscribes.push(onSnapshot(verificationsQuery, (snapshot) => {
      const verifications = snapshot.docs.map(doc => doc.data());
      
      const verificationStats = {
        pending: verifications.filter(v => v.status === 'pending').length,
        approved: verifications.filter(v => v.status === 'approved').length,
        rejected: verifications.filter(v => v.status === 'rejected').length
      };

      setStats(prev => ({ ...prev, verifications: verificationStats }));
    }));

    // Listener para usuários
    const usersQuery = query(collection(db, 'users'));
    unsubscribes.push(onSnapshot(usersQuery, (snapshot) => {
      const users = snapshot.docs.map(doc => doc.data());
      
      const now = Date.now();
      const yesterday = now - (24 * 60 * 60 * 1000);

      const userStats = {
        total: users.length,
        withProfile: users.filter(u => u.name && u.rivalRegionsLink && u.telegramNumber).length,
        new24h: users.filter(u => {
          const createdTime = u.createdAt?.seconds * 1000;
          return createdTime && createdTime > yesterday;
        }).length
      };

      setStats(prev => ({ ...prev, users: userStats }));
    }));

    // Listener para transações
    const transactionsQuery = query(collection(db, 'transactions'));
    unsubscribes.push(onSnapshot(transactionsQuery, (snapshot) => {
      const systemStats = {
        totalTransactions: snapshot.docs.length
      };

      setStats(prev => ({ ...prev, system: systemStats }));
    }));

    // Listener para ordens
    const ordersQuery = query(collection(db, 'orders'));
    unsubscribes.push(onSnapshot(ordersQuery, (snapshot) => {
      setStats(prev => ({ 
        ...prev, 
        system: { 
          ...prev.system, 
          activeOrders: snapshot.docs.length 
        }
      }));
    }));

    setLoading(false);

    return () => unsubscribes.forEach(unsub => unsub());
  }, [user, isAdmin]);

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
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-200 font-mono mb-4">
                ACESSO NEGADO
              </h1>
              <p className="text-gray-400 font-mono mb-4">
                Você não tem permissão para acessar o painel administrativo
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

  return (
    <ProtectedRoute>
      <div className="min-h-screen">
        <Navbar />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          
          {/* CABEÇALHO - COM BOTÃO VOLTAR */}
          <div className="mb-8">
            <div className="card">
              <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center">
                
                {/* PARTE PRINCIPAL - RESPONSIVA */}
                <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:space-x-4">
                  <Link href="/dashboard" className="btn btn-secondary font-mono text-sm w-fit">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    DASHBOARD
                  </Link>
                  
                  <div className="flex items-start sm:items-center space-x-3 sm:space-x-4">
                    <Settings className="h-8 w-8 sm:h-10 sm:w-10 text-blue-500 flex-shrink-0 mt-1 sm:mt-0" />
                    <div>
                      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-200 font-mono leading-tight">
                        PAINEL ADMINISTRATIVO
                      </h1>
                      <p className="text-gray-400 font-mono text-xs sm:text-sm mt-1">
                        Central de gerenciamento do RR Exchange
                      </p>
                    </div>
                  </div>
                </div>
                
              </div>
            </div>
          </div>

          {/* ESTATÍSTICAS RÁPIDAS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="stat-card">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="h-8 w-8 text-yellow-500" />
                <span className="text-2xl font-bold text-yellow-400 font-mono">
                  {stats.deposits.pending}
                </span>
              </div>
              <div className="text-sm text-gray-400 font-mono">
                DEPÓSITOS PENDENTES
              </div>
              <div className="text-xs text-gray-500 font-mono mt-1">
                ${formatMoney(stats.deposits.totalValue)}
              </div>
            </div>

            <div className="stat-card">
              <div className="flex items-center justify-between mb-2">
                <Shield className="h-8 w-8 text-blue-500" />
                <span className="text-2xl font-bold text-blue-400 font-mono">
                  {stats.verifications.pending}
                </span>
              </div>
              <div className="text-sm text-gray-400 font-mono">
                VERIFICAÇÕES PENDENTES
              </div>
            </div>

            <div className="stat-card">
              <div className="flex items-center justify-between mb-2">
                <Users className="h-8 w-8 text-green-500" />
                <span className="text-2xl font-bold text-green-400 font-mono">
                  {stats.users.total}
                </span>
              </div>
              <div className="text-sm text-gray-400 font-mono">
                USUÁRIOS TOTAIS
              </div>
              <div className="text-xs text-gray-500 font-mono mt-1">
                +{stats.users.new24h} hoje
              </div>
            </div>

            <div className="stat-card">
              <div className="flex items-center justify-between mb-2">
                <Activity className="h-8 w-8 text-purple-500" />
                <span className="text-2xl font-bold text-purple-400 font-mono">
                  {stats.system.activeOrders}
                </span>
              </div>
              <div className="text-sm text-gray-400 font-mono">
                ORDENS ATIVAS
              </div>
            </div>
          </div>

          {/* AÇÕES ADMINISTRATIVAS - BOTÕES ALINHADOS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            
            {/* DEPÓSITOS */}
            <div className="card flex flex-col h-full">
              <div className="flex items-center space-x-3 mb-6">
                <DollarSign className="h-8 w-8 text-yellow-500" />
                <h2 className="text-xl font-bold text-gray-200 font-mono">
                  DEPÓSITOS
                </h2>
              </div>
              
              <div className="flex-1">
                <div className="space-y-4">
                  <div className="bg-gray-750 border border-gray-600 p-4">
                    <div className="grid grid-cols-3 gap-4 text-center text-sm font-mono">
                      <div>
                        <div className="text-xl font-bold text-yellow-400">
                          {stats.deposits.pending}
                        </div>
                        <div className="text-gray-400 text-xs">PENDENTES</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-green-400">
                          {stats.deposits.approved}
                        </div>
                        <div className="text-gray-400 text-xs">APROVADOS</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-red-400">
                          {stats.deposits.rejected}
                        </div>
                        <div className="text-gray-400 text-xs">REJEITADOS</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-mono">
                      <span className="text-gray-400">Valor Pendente:</span>
                      <span className="text-yellow-400 font-bold">
                        ${formatMoney(stats.deposits.totalValue)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-600">
                <Link
                  href="/admin/deposits"
                  className="w-full btn bg-yellow-600 hover:bg-yellow-500 text-white font-mono text-center block py-3"
                >
                  GERENCIAR DEPÓSITOS
                </Link>
              </div>
            </div>

            {/* VERIFICAÇÕES */}
            <div className="card flex flex-col h-full">
              <div className="flex items-center space-x-3 mb-6">
                <Shield className="h-8 w-8 text-blue-500" />
                <h2 className="text-xl font-bold text-gray-200 font-mono">
                  VERIFICAÇÕES
                </h2>
              </div>
              
              <div className="flex-1">
                <div className="space-y-4">
                  <div className="bg-gray-750 border border-gray-600 p-4">
                    <div className="grid grid-cols-3 gap-4 text-center text-sm font-mono">
                      <div>
                        <div className="text-xl font-bold text-yellow-400">
                          {stats.verifications.pending}
                        </div>
                        <div className="text-gray-400 text-xs">PENDENTES</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-green-400">
                          {stats.verifications.approved}
                        </div>
                        <div className="text-gray-400 text-xs">APROVADAS</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-red-400">
                          {stats.verifications.rejected}
                        </div>
                        <div className="text-gray-400 text-xs">REJEITADAS</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* ESPAÇO EXTRA PARA EQUILIBRAR COM OUTROS CARDS */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-mono">
                      <span className="text-gray-400">Status:</span>
                      <span className="text-blue-400 font-bold">
                        {stats.verifications.pending > 0 ? 'Pendências aguardando' : 'Tudo em dia'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-600">
                <Link
                  href="/admin/verifications"
                  className="w-full btn bg-blue-600 hover:bg-blue-500 text-white font-mono text-center block py-3"
                >
                  GERENCIAR VERIFICAÇÕES
                </Link>
              </div>
            </div>

            {/* USUÁRIOS */}
            <div className="card flex flex-col h-full">
              <div className="flex items-center space-x-3 mb-6">
                <Users className="h-8 w-8 text-green-500" />
                <h2 className="text-xl font-bold text-gray-200 font-mono">
                  USUÁRIOS
                </h2>
              </div>
              
              <div className="flex-1">
                <div className="space-y-4">
                  <div className="bg-gray-750 border border-gray-600 p-4">
                    <div className="space-y-3 text-sm font-mono">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total:</span>
                        <span className="text-green-400 font-bold">{stats.users.total}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Com Perfil Completo:</span>
                        <span className="text-blue-400 font-bold">{stats.users.withProfile}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Novos (24h):</span>
                        <span className="text-purple-400 font-bold">{stats.users.new24h}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-600">
                <Link
                  href="/admin/users"
                  className="w-full btn bg-green-600 hover:bg-green-500 text-white font-mono text-center block py-3"
                >
                  GERENCIAR USUÁRIOS
                </Link>
              </div>
            </div>
          </div>

          {/* ESTATÍSTICAS DO SISTEMA */}
          <div className="card mb-8">
            <div className="flex items-center space-x-3 mb-6">
              <BarChart3 className="h-8 w-8 text-purple-500" />
              <h2 className="text-xl font-bold text-gray-200 font-mono">
                ESTATÍSTICAS DO SISTEMA
              </h2>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400 font-mono mb-2">
                  {stats.system.totalTransactions}
                </div>
                <div className="text-sm text-gray-400 font-mono">
                  TRANSAÇÕES TOTAIS
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-400 font-mono mb-2">
                  {stats.system.activeOrders}
                </div>
                <div className="text-sm text-gray-400 font-mono">
                  ORDENS ATIVAS
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-cyan-400 font-mono mb-2">
                  {((stats.users.withProfile / stats.users.total) * 100 || 0).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-400 font-mono">
                  PERFIS COMPLETOS
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-pink-400 font-mono mb-2">
                  {((stats.verifications.approved / Math.max(stats.verifications.approved + stats.verifications.rejected, 1)) * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-400 font-mono">
                  TAXA APROVAÇÃO
                </div>
              </div>
            </div>
          </div>

          {/* ALERTAS E STATUS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* ALERTAS */}
            <div className="card">
              <div className="flex items-center space-x-3 mb-6">
                <AlertTriangle className="h-8 w-8 text-orange-500" />
                <h2 className="text-xl font-bold text-gray-200 font-mono">
                  ALERTAS
                </h2>
              </div>

              <div className="space-y-3">
                {stats.deposits.pending > 5 && (
                  <div className="bg-yellow-900 border border-yellow-600 p-4">
                    <div className="flex items-center space-x-2 text-yellow-200 font-mono text-sm">
                      <Clock className="h-4 w-4" />
                      <span>Muitos depósitos pendentes ({stats.deposits.pending})</span>
                    </div>
                  </div>
                )}

                {stats.verifications.pending > 3 && (
                  <div className="bg-blue-900 border border-blue-600 p-4">
                    <div className="flex items-center space-x-2 text-blue-200 font-mono text-sm">
                      <Shield className="h-4 w-4" />
                      <span>Verificações acumulando ({stats.verifications.pending})</span>
                    </div>
                  </div>
                )}

                {stats.users.new24h > 10 && (
                  <div className="bg-green-900 border border-green-600 p-4">
                    <div className="flex items-center space-x-2 text-green-200 font-mono text-sm">
                      <TrendingUp className="h-4 w-4" />
                      <span>Alto crescimento: {stats.users.new24h} novos usuários hoje</span>
                    </div>
                  </div>
                )}

                {stats.deposits.pending === 0 && stats.verifications.pending === 0 && (
                  <div className="bg-green-900 border border-green-600 p-4">
                    <div className="flex items-center space-x-2 text-green-200 font-mono text-sm">
                      <CheckCircle className="h-4 w-4" />
                      <span>Tudo em dia! Nenhuma pendência</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* STATUS DO SISTEMA */}
            <div className="card">
              <div className="flex items-center space-x-3 mb-6">
                <Database className="h-8 w-8 text-green-500" />
                <h2 className="text-xl font-bold text-gray-200 font-mono">
                  STATUS DO SISTEMA
                </h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-750 border border-gray-600">
                  <span className="font-mono text-sm">Firestore Database</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-green-400 font-mono text-sm">ONLINE</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-750 border border-gray-600">
                  <span className="font-mono text-sm">Telegram Bot</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-green-400 font-mono text-sm">FUNCIONANDO</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-750 border border-gray-600">
                  <span className="font-mono text-sm">Sistema de Trading</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-green-400 font-mono text-sm">ATIVO</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-750 border border-gray-600">
                  <span className="font-mono text-sm">Verificações</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-green-400 font-mono text-sm">OPERACIONAL</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AÇÕES RÁPIDAS */}
          <div className="card mt-8">
            <div className="flex items-center space-x-3 mb-6">
              <Settings className="h-8 w-8 text-gray-400" />
              <h2 className="text-xl font-bold text-gray-200 font-mono">
                AÇÕES RÁPIDAS
              </h2>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                href="/test-telegram"
                className="btn bg-purple-600 hover:bg-purple-500 text-white font-mono text-center"
              >
                🧪 TESTAR TELEGRAM
              </Link>

              <Link
                href="/dashboard"
                className="btn bg-blue-600 hover:bg-blue-500 text-white font-mono text-center"
              >
                🏠 VER MARKETPLACE
              </Link>

              <button
                onClick={() => window.location.reload()}
                className="btn bg-gray-600 hover:bg-gray-500 text-white font-mono"
              >
                🔄 ATUALIZAR DADOS
              </button>

              <Link
                href="/admin/deposits"
                className="btn bg-orange-600 hover:bg-orange-500 text-white font-mono text-center"
              >
                ⚡ PENDÊNCIAS
              </Link>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}