// app/admin/deposits/page.js - NAVEGAÇÃO CORRIGIDA
'use client';

import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, getDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { sendDepositApprovedNotification, sendDepositRejectedNotification } from '@/lib/telegram';
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

// Lista de administradores
const ADMIN_UIDS = [
  'XgZ620lbRTQA6ELAvfqWBXKQGGJ3',
  'W025u9s5SOWuHA0pQYF2UOzy6mG2',
];

export default function AdminDepositsPage() {
  const { user, userData } = useAuth();
  const [depositRequests, setDepositRequests] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [processingId, setProcessingId] = useState(null);

  const isAdmin = user && ADMIN_UIDS.includes(user.uid);

  useEffect(() => {
    if (!user || !isAdmin) {
      setLoading(false);
      return;
    }

    // Buscar TODOS os documentos e filtrar no frontend
    const allQuery = query(collection(db, 'deposit_requests'));

    const unsubscribe = onSnapshot(
      allQuery,
      (snapshot) => {
        const allDocs = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            status: data.status || 'unknown'
          };
        });

        setAllRequests(allDocs);

        // Filtrar conforme seleção
        let filteredRequests = [];
        
        if (filter === 'all') {
          filteredRequests = allDocs;
        } else {
          filteredRequests = allDocs.filter(request => request.status === filter);
        }

        // Ordenar por data (mais recente primeiro)
        filteredRequests.sort((a, b) => {
          const timeA = a.requestedAt?.seconds || 0;
          const timeB = b.requestedAt?.seconds || 0;
          return timeB - timeA;
        });

        setDepositRequests(filteredRequests);
        setLoading(false);
      },
      (error) => {
        console.error('❌ Erro ao carregar solicitações:', error);
        setLoading(false);
        toast.error('ERRO AO CARREGAR DADOS');
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

      // Buscar dados completos da solicitação para a notificação
      const requestDoc = allRequests.find(r => r.id === requestId);

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

      // 3. Enviar notificação de aprovação para Telegram
      try {
        console.log('📱 Enviando notificação de aprovação para Telegram...');
        await sendDepositApprovedNotification(requestDoc, requestId);
        console.log('✅ Notificação de aprovação enviada para Telegram');
        toast.success(`DEPÓSITO APROVADO! ${formatMoney(amount)} $ creditado`);
      } catch (telegramError) {
        console.warn('⚠️ Erro ao enviar notificação de aprovação:', telegramError);
        toast.success(`DEPÓSITO APROVADO! ${formatMoney(amount)} $ creditado`);
      }

    } catch (error) {
      console.error('❌ Erro ao aprovar depósito:', error);
      toast.error('ERRO AO APROVAR DEPÓSITO: ' + error.message);
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

      // Buscar dados completos da solicitação para a notificação
      const requestDoc = allRequests.find(r => r.id === requestId);

      const requestRef = doc(db, 'deposit_requests', requestId);
      await updateDoc(requestRef, {
        status: 'rejected',
        rejectedAt: new Date(),
        rejectedBy: user.uid,
        rejectionReason: reason
      });

      // Enviar notificação de rejeição para Telegram
      try {
        console.log('📱 Enviando notificação de rejeição para Telegram...');
        await sendDepositRejectedNotification(requestDoc, requestId, reason);
        console.log('✅ Notificação de rejeição enviada para Telegram');
        toast.success('DEPÓSITO REJEITADO');
      } catch (telegramError) {
        console.warn('⚠️ Erro ao enviar notificação de rejeição:', telegramError);
        toast.success('DEPÓSITO REJEITADO');
      }

    } catch (error) {
      console.error('❌ Erro ao rejeitar depósito:', error);
      toast.error('ERRO AO REJEITAR DEPÓSITO: ' + error.message);
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
    pending: allRequests.filter(r => r.status === 'pending').length,
    approved: allRequests.filter(r => r.status === 'approved').length,
    rejected: allRequests.filter(r => r.status === 'rejected').length,
    totalPending: allRequests
      .filter(r => r.status === 'pending')
      .reduce((sum, r) => sum + (r.amount || 0), 0)
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen">
        <Navbar />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          
          {/* CABEÇALHO - NAVEGAÇÃO CORRIGIDA */}
          <div className="mb-6 sm:mb-8">
            <div className="card">
              <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:space-x-4">
                <Link href="/admin" className="btn btn-secondary font-mono text-sm w-fit">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  VOLTAR AO PAINEL
                </Link>
                
                <div className="flex items-start sm:items-center space-x-3">
                  <DollarSign className="h-8 w-8 sm:h-8 sm:w-8 text-green-500 flex-shrink-0 mt-1 sm:mt-0" />
                  <div>
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-200 font-mono leading-tight">
                      GERENCIAR DEPÓSITOS
                    </h1>
                    <p className="text-gray-400 font-mono text-xs sm:text-sm mt-1">
                      Aprovar e rejeitar solicitações
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ESTATÍSTICAS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-6 sm:mb-8">
            <div className="stat-card text-center p-2 sm:p-3">
              <div className="text-lg sm:text-2xl font-bold text-yellow-400 font-mono">
                {stats.pending}
              </div>
              <div className="text-xs text-gray-400 font-mono tracking-wider">
                PENDENTES
              </div>
            </div>
            
            <div className="stat-card text-center p-2 sm:p-3">
              <div className="text-lg sm:text-2xl font-bold text-green-400 font-mono">
                {stats.approved}
              </div>
              <div className="text-xs text-gray-400 font-mono tracking-wider">
                APROVADOS
              </div>
            </div>
            
            <div className="stat-card text-center p-2 sm:p-3">
              <div className="text-lg sm:text-2xl font-bold text-red-400 font-mono">
                {stats.rejected}
              </div>
              <div className="text-xs text-gray-400 font-mono tracking-wider">
                REJEITADOS
              </div>
            </div>
            
            <div className="stat-card text-center p-2 sm:p-3">
              <div className="text-sm sm:text-lg font-bold text-yellow-400 font-mono">
                {formatMoney(stats.totalPending)} $
              </div>
              <div className="text-xs text-gray-400 font-mono tracking-wider">
                VALOR PENDENTE
              </div>
            </div>
          </div>

          {/* FILTROS */}
          <div className="card mb-6 sm:mb-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
              <button
                onClick={() => setFilter('pending')}
                className={filter === 'pending' ? 'btn btn-primary font-mono text-xs sm:text-sm py-2 sm:py-3' : 'btn btn-secondary font-mono text-xs sm:text-sm py-2 sm:py-3'}
              >
                PENDENTES ({stats.pending})
              </button>
              <button
                onClick={() => setFilter('approved')}
                className={filter === 'approved' ? 'btn btn-primary font-mono text-xs sm:text-sm py-2 sm:py-3' : 'btn btn-secondary font-mono text-xs sm:text-sm py-2 sm:py-3'}
              >
                APROVADOS ({stats.approved})
              </button>
              <button
                onClick={() => setFilter('rejected')}
                className={filter === 'rejected' ? 'btn btn-primary font-mono text-xs sm:text-sm py-2 sm:py-3' : 'btn btn-secondary font-mono text-xs sm:text-sm py-2 sm:py-3'}
              >
                REJEITADOS ({stats.rejected})
              </button>
              <button
                onClick={() => setFilter('all')}
                className={filter === 'all' ? 'btn btn-primary font-mono text-xs sm:text-sm py-2 sm:py-3' : 'btn btn-secondary font-mono text-xs sm:text-sm py-2 sm:py-3'}
              >
                TODOS ({allRequests.length})
              </button>
            </div>
          </div>

          {/* LISTA DE SOLICITAÇÕES */}
          <div className="card">
            <div className="flex items-center justify-between mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-gray-600">
              <h2 className="text-lg sm:text-xl font-bold text-gray-200 font-mono">
                SOLICITAÇÕES ({depositRequests.length})
              </h2>
            </div>
            
            {loading ? (
              <div className="flex justify-center py-8 sm:py-12">
                <div className="text-gray-400 font-mono text-sm flex items-center space-x-2">
                  <div className="w-4 h-1 bg-gray-600 animate-pulse"></div>
                  <div className="w-4 h-1 bg-gray-600 animate-pulse"></div>
                  <div className="w-4 h-1 bg-gray-600 animate-pulse"></div>
                  <span>CARREGANDO SOLICITAÇÕES...</span>
                </div>
              </div>
            ) : depositRequests.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {depositRequests.map(request => (
                  <div key={request.id} className="bg-gray-750 border border-gray-600 p-3 sm:p-4">
                    <div className="flex flex-col space-y-3">
                      
                      {/* Cabeçalho da Solicitação */}
                      <div className="flex items-center space-x-3">
                        <span className="text-xl sm:text-2xl">
                          {request.status === 'pending' ? '⏳' :
                           request.status === 'approved' ? '✅' : '❌'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2">
                            <span className="font-bold font-mono text-gray-200 text-sm sm:text-base truncate">
                              {request.userName}
                            </span>
                            <span className={
                              request.status === 'pending' ? 'px-2 py-1 text-xs font-bold font-mono bg-yellow-600 text-white inline-block mt-1 sm:mt-0' :
                              request.status === 'approved' ? 'px-2 py-1 text-xs font-bold font-mono bg-green-600 text-white inline-block mt-1 sm:mt-0' :
                              'px-2 py-1 text-xs font-bold font-mono bg-red-600 text-white inline-block mt-1 sm:mt-0'
                            }>
                              {request.status === 'pending' ? 'PENDENTE' :
                               request.status === 'approved' ? 'APROVADO' : 'REJEITADO'}
                            </span>
                          </div>
                          <div className="text-xs text-gray-400 font-mono mt-1">
                            ID: {request.id.substring(0, 8)}... | {request.userEmail}
                          </div>
                        </div>
                      </div>
                      
                      {/* Informações da Solicitação */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs sm:text-sm font-mono">
                        <div className="bg-gray-800 border border-gray-600 p-2 sm:p-3">
                          <span className="text-gray-400 block">VALOR:</span>
                          <div className="font-bold text-green-400 text-sm sm:text-base">
                            {formatMoney(request.amount)} $
                          </div>
                        </div>
                        
                        <div className="bg-gray-800 border border-gray-600 p-2 sm:p-3">
                          <span className="text-gray-400 block">SOLICITADO EM:</span>
                          <div className="text-gray-200 text-xs sm:text-sm">
                            {request.requestedAt?.seconds 
                              ? new Date(request.requestedAt.seconds * 1000).toLocaleDateString('pt-BR')
                              : 'N/A'
                            }
                          </div>
                          <div className="text-gray-400 text-xs">
                            {request.requestedAt?.seconds 
                              ? new Date(request.requestedAt.seconds * 1000).toLocaleTimeString('pt-BR')
                              : ''
                            }
                          </div>
                        </div>
                        
                        {request.status !== 'pending' && (
                          <div className="bg-gray-800 border border-gray-600 p-2 sm:p-3">
                            <span className="text-gray-400 block">
                              {request.status === 'approved' ? 'APROVADO EM:' : 'REJEITADO EM:'}
                            </span>
                            <div className="text-gray-200 text-xs sm:text-sm">
                              {(request.approvedAt || request.rejectedAt)?.seconds 
                                ? new Date((request.approvedAt || request.rejectedAt).seconds * 1000).toLocaleDateString('pt-BR')
                                : 'N/A'
                              }
                            </div>
                            <div className="text-gray-400 text-xs">
                              {(request.approvedAt || request.rejectedAt)?.seconds 
                                ? new Date((request.approvedAt || request.rejectedAt).seconds * 1000).toLocaleTimeString('pt-BR')
                                : ''
                              }
                            </div>
                          </div>
                        )}
                        
                        {request.description && (
                          <div className="bg-gray-800 border border-gray-600 p-2 sm:p-3 sm:col-span-2 lg:col-span-1">
                            <span className="text-gray-400 block">DESCRIÇÃO:</span>
                            <div className="text-gray-200 text-xs break-words">
                              {request.description.length > 50 
                                ? request.description.substring(0, 47) + '...'
                                : request.description
                              }
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Motivo da Rejeição */}
                      {request.rejectionReason && (
                        <div className="p-2 sm:p-3 bg-red-900 border border-red-600">
                          <span className="text-red-200 font-mono text-xs">
                            <strong>Motivo da rejeição:</strong> {request.rejectionReason}
                          </span>
                        </div>
                      )}

                      {/* Ações */}
                      {request.status === 'pending' && (
                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 pt-3 border-t border-gray-600">
                          <button
                            onClick={() => handleApprove(request.id, request.userId, request.amount)}
                            disabled={processingId === request.id}
                            className="flex-1 btn btn-success text-xs sm:text-sm font-mono py-2 sm:py-3"
                          >
                            {processingId === request.id ? 'PROCESSANDO...' : '✅ APROVAR DEPÓSITO'}
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('Motivo da rejeição (opcional):');
                              if (reason !== null) {
                                handleReject(request.id, reason || 'Não especificado');
                              }
                            }}
                            disabled={processingId === request.id}
                            className="flex-1 btn btn-danger text-xs sm:text-sm font-mono py-2 sm:py-3"
                          >
                            {processingId === request.id ? 'PROCESSANDO...' : '❌ REJEITAR'}
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