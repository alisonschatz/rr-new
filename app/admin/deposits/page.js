// app/admin/deposits/page.js - Painel Administrativo de Depósitos
'use client';

import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, getDoc, orderBy, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { ArrowLeft, CheckCircle, XCircle, Clock, DollarSign, User, Calendar } from 'lucide-react';

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

// Lista de administradores (você pode mover isso para uma coleção no Firestore)
const ADMIN_UIDS = [
  'XgZ620lbRTQA6ELAvfqWBXKQGGJ3', // UID do administrador
  // Adicione mais UIDs de administradores se necessário
];

export default function AdminDepositsPage() {
  const { user, userData } = useAuth();
  const [depositRequests, setDepositRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [processingId, setProcessingId] = useState(null);

  // Verificar se é administrador
  const isAdmin = user && ADMIN_UIDS.includes(user.uid);

  useEffect(() => {
    if (!user || !isAdmin) {
      setLoading(false);
      return;
    }

    console.log('🔄 Carregando solicitações de depósito...');

    let q;
    if (filter === 'all') {
      q = query(
        collection(db, 'deposit_requests'),
        orderBy('requestedAt', 'desc')
      );
    } else {
      q = query(
        collection(db, 'deposit_requests'),
        where('status', '==', filter),
        orderBy('requestedAt', 'desc')
      );
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const requests = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        console.log(`📊 ${requests.length} solicitações encontradas`);
        setDepositRequests(requests);
        setLoading(false);
      },
      (error) => {
        console.error('❌ Erro ao carregar solicitações:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, isAdmin, filter]);

  const handleApprove = async (requestId, userId, amount) => {
    if (!isAdmin) {
      toast.error('ACESSO NEGADO');
      return;
    }

    setProcessingId(requestId);

    try {
      console.log('✅ Aprovando depósito:', { requestId, userId, amount });

      // 1. Atualizar saldo do usuário
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('Usuário não encontrado');
      }

      const currentBalance = userDoc.data().balance || 0;
      const newBalance = currentBalance + amount;

      await updateDoc(userRef, {
        balance: newBalance
      });

      // 2. Atualizar status da solicitação
      const requestRef = doc(db, 'deposit_requests', requestId);
      await updateDoc(requestRef, {
        status: 'approved',
        approvedAt: new Date(),
        approvedBy: user.uid
      });

      toast.success(`DEPÓSITO APROVADO! ${formatMoney(amount)} $ creditado`);

    } catch (error) {
      console.error('❌ Erro ao aprovar depósito:', error);
      toast.error('ERRO AO APROVAR DEPÓSITO');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId, reason = 'Não especificado') => {
    if (!isAdmin) {
      toast.error('ACESSO NEGADO');
      return;
    }

    setProcessingId(requestId);

    try {
      console.log('❌ Rejeitando depósito:', { requestId, reason });

      const requestRef = doc(db, 'deposit_requests', requestId);
      await updateDoc(requestRef, {
        status: 'rejected',
        rejectedAt: new Date(),
        rejectedBy: user.uid,
        rejectionReason: reason
      });

      toast.success('DEPÓSITO REJEITADO');

    } catch (error) {
      console.error('❌ Erro ao rejeitar depósito:', error);
      toast.error('ERRO AO REJEITAR DEPÓSITO');
    } finally {
      setProcessingId(null);
    }
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

  const stats = {
    pending: depositRequests.filter(r => r.status === 'pending').length,
    approved: depositRequests.filter(r => r.status === 'approved').length,
    rejected: depositRequests.filter(r => r.status === 'rejected').length,
    totalPending: depositRequests
      .filter(r => r.status === 'pending')
      .reduce((sum, r) => sum + (r.amount || 0), 0)
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen">
        <Navbar />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          
          {/* CABEÇALHO */}
          <div className="mb-8">
            <div className="card">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
                <div className="flex items-center space-x-4">
                  <Link href="/dashboard" className="btn btn-secondary font-mono text-sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    VOLTAR
                  </Link>
                  <div className="flex items-center space-x-3">
                    <DollarSign className="h-8 w-8 text-green-500" />
                    <div>
                      <h1 className="text-3xl font-bold text-gray-200 font-mono">
                        PAINEL ADMINISTRATIVO
                      </h1>
                      <p className="text-gray-400 font-mono">
                        Gerenciar solicitações de depósito
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ESTATÍSTICAS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="stat-card text-center">
              <div className="text-2xl font-bold text-yellow-400 font-mono">
                {stats.pending}
              </div>
              <div className="text-xs text-gray-400 font-mono tracking-wider">
                PENDENTES
              </div>
            </div>
            
            <div className="stat-card text-center">
              <div className="text-2xl font-bold text-green-400 font-mono">
                {stats.approved}
              </div>
              <div className="text-xs text-gray-400 font-mono tracking-wider">
                APROVADOS
              </div>
            </div>
            
            <div className="stat-card text-center">
              <div className="text-2xl font-bold text-red-400 font-mono">
                {stats.rejected}
              </div>
              <div className="text-xs text-gray-400 font-mono tracking-wider">
                REJEITADOS
              </div>
            </div>
            
            <div className="stat-card text-center">
              <div className="text-lg font-bold text-yellow-400 font-mono">
                {formatMoney(stats.totalPending)} $
              </div>
              <div className="text-xs text-gray-400 font-mono tracking-wider">
                VALOR PENDENTE
              </div>
            </div>
          </div>

          {/* FILTROS */}
          <div className="card mb-8">
            <div className="flex space-x-4">
              <button
                onClick={() => setFilter('pending')}
                className={filter === 'pending' ? 'btn btn-primary font-mono' : 'btn btn-secondary font-mono'}
              >
                PENDENTES ({stats.pending})
              </button>
              <button
                onClick={() => setFilter('approved')}
                className={filter === 'approved' ? 'btn btn-primary font-mono' : 'btn btn-secondary font-mono'}
              >
                APROVADOS ({stats.approved})
              </button>
              <button
                onClick={() => setFilter('rejected')}
                className={filter === 'rejected' ? 'btn btn-primary font-mono' : 'btn btn-secondary font-mono'}
              >
                REJEITADOS ({stats.rejected})
              </button>
              <button
                onClick={() => setFilter('all')}
                className={filter === 'all' ? 'btn btn-primary font-mono' : 'btn btn-secondary font-mono'}
              >
                TODOS
              </button>
            </div>
          </div>

          {/* LISTA DE SOLICITAÇÕES */}
          <div className="card">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-600">
              <h2 className="text-xl font-bold text-gray-200 font-mono">
                SOLICITAÇÕES ({depositRequests.length})
              </h2>
            </div>
            
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="text-gray-400 font-mono">
                  CARREGANDO SOLICITAÇÕES...
                </div>
              </div>
            ) : depositRequests.length > 0 ? (
              <div className="space-y-4">
                {depositRequests.map(request => (
                  <div key={request.id} className="bg-gray-750 border border-gray-600 p-4">
                    <div className="flex flex-col lg:flex-row justify-between items-start space-y-4 lg:space-y-0">
                      
                      {/* Informações da Solicitação */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <span className={
                            request.status === 'pending' ? 'text-2xl' :
                            request.status === 'approved' ? 'text-2xl' : 'text-2xl'
                          }>
                            {request.status === 'pending' ? '⏳' :
                             request.status === 'approved' ? '✅' : '❌'}
                          </span>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-bold font-mono text-gray-200">
                                {request.userName}
                              </span>
                              <span className={
                                request.status === 'pending' ? 'px-2 py-1 text-xs font-bold font-mono bg-yellow-600 text-white' :
                                request.status === 'approved' ? 'px-2 py-1 text-xs font-bold font-mono bg-green-600 text-white' :
                                'px-2 py-1 text-xs font-bold font-mono bg-red-600 text-white'
                              }>
                                {request.status === 'pending' ? 'PENDENTE' :
                                 request.status === 'approved' ? 'APROVADO' : 'REJEITADO'}
                              </span>
                            </div>
                            <div className="text-xs text-gray-400 font-mono">
                              ID: {request.id} | {request.userEmail}
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm font-mono">
                          <div>
                            <span className="text-gray-400">VALOR:</span>
                            <div className="font-bold text-green-400">
                              {formatMoney(request.amount)} $
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-400">SOLICITADO EM:</span>
                            <div className="text-gray-200">
                              {request.requestedAt?.seconds 
                                ? new Date(request.requestedAt.seconds * 1000).toLocaleString('pt-BR')
                                : 'N/A'
                              }
                            </div>
                          </div>
                          {request.status !== 'pending' && (
                            <div>
                              <span className="text-gray-400">
                                {request.status === 'approved' ? 'APROVADO EM:' : 'REJEITADO EM:'}
                              </span>
                              <div className="text-gray-200">
                                {(request.approvedAt || request.rejectedAt)?.seconds 
                                  ? new Date((request.approvedAt || request.rejectedAt).seconds * 1000).toLocaleString('pt-BR')
                                  : 'N/A'
                                }
                              </div>
                            </div>
                          )}
                          {request.description && (
                            <div>
                              <span className="text-gray-400">DESCRIÇÃO:</span>
                              <div className="text-gray-200 text-xs">
                                {request.description}
                              </div>
                            </div>
                          )}
                        </div>

                        {request.rejectionReason && (
                          <div className="mt-3 p-2 bg-red-900 border border-red-600">
                            <span className="text-red-200 font-mono text-xs">
                              <strong>Motivo da rejeição:</strong> {request.rejectionReason}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Ações */}
                      {request.status === 'pending' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleApprove(request.id, request.userId, request.amount)}
                            disabled={processingId === request.id}
                            className="btn btn-success text-xs font-mono"
                          >
                            {processingId === request.id ? '...' : '✅ APROVAR'}
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('Motivo da rejeição (opcional):');
                              if (reason !== null) {
                                handleReject(request.id, reason || 'Não especificado');
                              }
                            }}
                            disabled={processingId === request.id}
                            className="btn btn-danger text-xs font-mono"
                          >
                            {processingId === request.id ? '...' : '❌ REJEITAR'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <DollarSign className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-400 font-mono mb-2">
                  NENHUMA SOLICITAÇÃO ENCONTRADA
                </h3>
                <p className="text-gray-500 font-mono">
                  {filter === 'pending' ? 'Não há depósitos pendentes' : 
                   filter === 'approved' ? 'Não há depósitos aprovados' :
                   filter === 'rejected' ? 'Não há depósitos rejeitados' :
                   'Não há solicitações de depósito'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}