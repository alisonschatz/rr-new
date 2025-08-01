// app/admin/verifications/page.js - Nova página para gerenciar verificações
'use client';

import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, getDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { sendProfileVerificationApproved, sendProfileVerificationRejected } from '@/lib/telegram';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { ArrowLeft, Shield, CheckCircle, XCircle, Clock, User, ExternalLink, MessageCircle, GamepadIcon } from 'lucide-react';

// Lista de administradores
const ADMIN_UIDS = [
  'XgZ620lbRTQA6ELAvfqWBXKQGGJ3',
  'W025u9s5SOWuHA0pQYF2UOzy6mG2',
];

export default function AdminVerificationsPage() {
  const { user, userData } = useAuth();
  const [verificationRequests, setVerificationRequests] = useState([]);
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

    // Buscar TODAS as solicitações de verificação
    const allQuery = query(collection(db, 'profile_verifications'));

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

        setVerificationRequests(filteredRequests);
        setLoading(false);
      },
      (error) => {
        console.error('❌ Erro ao carregar verificações:', error);
        setLoading(false);
        toast.error('ERRO AO CARREGAR DADOS');
      }
    );

    return () => unsubscribe();
  }, [user, isAdmin, filter]);

  const handleApprove = async (requestId, userData) => {
    if (!isAdmin) {
      toast.error('ACESSO NEGADO');
      return;
    }

    setProcessingId(requestId);

    try {
      console.log('✅ Aprovando verificação:', { requestId, userData });

      // Buscar dados completos da solicitação
      const requestDoc = allRequests.find(r => r.id === requestId);

      // Atualizar status da solicitação
      const requestRef = doc(db, 'profile_verifications', requestId);
      await updateDoc(requestRef, {
        status: 'approved',
        approvedAt: new Date(),
        approvedBy: user.uid
      });

      // Enviar notificação de aprovação para Telegram
      try {
        console.log('📱 Enviando notificação de aprovação para Telegram...');
        await sendProfileVerificationApproved(requestDoc, requestId);
        console.log('✅ Notificação de aprovação enviada para Telegram');
        toast.success('VERIFICAÇÃO APROVADA! USUÁRIO RECEBERÁ O SELO 🛡️');
      } catch (telegramError) {
        console.warn('⚠️ Erro ao enviar notificação de aprovação:', telegramError);
        toast.success('VERIFICAÇÃO APROVADA! USUÁRIO RECEBERÁ O SELO 🛡️');
      }

    } catch (error) {
      console.error('❌ Erro ao aprovar verificação:', error);
      toast.error('ERRO AO APROVAR VERIFICAÇÃO: ' + error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId, reason = 'Dados incorretos ou incompletos') => {
    if (!isAdmin) {
      toast.error('ACESSO NEGADO');
      return;
    }

    setProcessingId(requestId);

    try {
      console.log('❌ Rejeitando verificação:', { requestId, reason });

      // Buscar dados completos da solicitação
      const requestDoc = allRequests.find(r => r.id === requestId);

      const requestRef = doc(db, 'profile_verifications', requestId);
      await updateDoc(requestRef, {
        status: 'rejected',
        rejectedAt: new Date(),
        rejectedBy: user.uid,
        rejectionReason: reason
      });

      // Enviar notificação de rejeição para Telegram
      try {
        console.log('📱 Enviando notificação de rejeição para Telegram...');
        await sendProfileVerificationRejected(requestDoc, requestId, reason);
        console.log('✅ Notificação de rejeição enviada para Telegram');
        toast.success('VERIFICAÇÃO REJEITADA');
      } catch (telegramError) {
        console.warn('⚠️ Erro ao enviar notificação de rejeição:', telegramError);
        toast.success('VERIFICAÇÃO REJEITADA');
      }

    } catch (error) {
      console.error('❌ Erro ao rejeitar verificação:', error);
      toast.error('ERRO AO REJEITAR VERIFICAÇÃO: ' + error.message);
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
                Você não tem permissão para gerenciar verificações
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
    total: allRequests.length
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
                    <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
                    <div>
                      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-200 font-mono">
                        VERIFICAÇÕES DE PERFIL
                      </h1>
                      <p className="text-gray-400 font-mono text-xs sm:text-sm">
                        Gerenciar selos de verificação
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
                APROVADAS
              </div>
            </div>
            
            <div className="stat-card text-center p-2 sm:p-3">
              <div className="text-lg sm:text-2xl font-bold text-red-400 font-mono">
                {stats.rejected}
              </div>
              <div className="text-xs text-gray-400 font-mono tracking-wider">
                REJEITADAS
              </div>
            </div>
            
            <div className="stat-card text-center p-2 sm:p-3">
              <div className="text-lg sm:text-2xl font-bold text-blue-400 font-mono">
                {stats.total}
              </div>
              <div className="text-xs text-gray-400 font-mono tracking-wider">
                TOTAL
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
                APROVADAS ({stats.approved})
              </button>
              <button
                onClick={() => setFilter('rejected')}
                className={filter === 'rejected' ? 'btn btn-primary font-mono text-xs sm:text-sm py-2 sm:py-3' : 'btn btn-secondary font-mono text-xs sm:text-sm py-2 sm:py-3'}
              >
                REJEITADAS ({stats.rejected})
              </button>
              <button
                onClick={() => setFilter('all')}
                className={filter === 'all' ? 'btn btn-primary font-mono text-xs sm:text-sm py-2 sm:py-3' : 'btn btn-secondary font-mono text-xs sm:text-sm py-2 sm:py-3'}
              >
                TODAS ({stats.total})
              </button>
            </div>
          </div>

          {/* LISTA DE SOLICITAÇÕES */}
          <div className="card">
            <div className="flex items-center justify-between mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-gray-600">
              <h2 className="text-lg sm:text-xl font-bold text-gray-200 font-mono">
                SOLICITAÇÕES ({verificationRequests.length})
              </h2>
            </div>
            
            {loading ? (
              <div className="flex justify-center py-8 sm:py-12">
                <div className="text-gray-400 font-mono text-sm flex items-center space-x-2">
                  <div className="w-4 h-1 bg-gray-600 animate-pulse"></div>
                  <div className="w-4 h-1 bg-gray-600 animate-pulse"></div>
                  <div className="w-4 h-1 bg-gray-600 animate-pulse"></div>
                  <span>CARREGANDO VERIFICAÇÕES...</span>
                </div>
              </div>
            ) : verificationRequests.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {verificationRequests.map(request => (
                  <div key={request.id} className="bg-gray-750 border border-gray-600 p-3 sm:p-4">
                    <div className="flex flex-col space-y-3">
                      
                      {/* Cabeçalho da Solicitação */}
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">
                          {request.status === 'pending' ? '🛡️' :
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
                      
                      {/* Informações do Usuário */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs sm:text-sm font-mono">
                        <div className="bg-gray-800 border border-gray-600 p-2 sm:p-3">
                          <span className="text-gray-400 block">TELEGRAM:</span>
                          <div className="flex items-center space-x-2">
                            <MessageCircle className="h-4 w-4 text-blue-400" />
                            <span className="text-blue-400">{request.telegramNumber}</span>
                          </div>
                        </div>
                        
                        <div className="bg-gray-800 border border-gray-600 p-2 sm:p-3">
                          <span className="text-gray-400 block">RIVAL REGIONS:</span>
                          <div className="flex items-center space-x-2">
                            <GamepadIcon className="h-4 w-4 text-green-400" />
                            <a 
                              href={request.rivalRegionsLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-green-400 hover:text-green-300 flex items-center space-x-1"
                            >
                              <span>Ver Perfil</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
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
                      </div>

                      {/* Status específico */}
                      {request.status !== 'pending' && (
                        <div className="bg-gray-800 border border-gray-600 p-2 sm:p-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm font-mono">
                            <div>
                              <span className="text-gray-400 block">
                                {request.status === 'approved' ? 'APROVADO EM:' : 'REJEITADO EM:'}
                              </span>
                              <div className="text-gray-200">
                                {(request.approvedAt || request.rejectedAt)?.seconds 
                                  ? new Date((request.approvedAt || request.rejectedAt).seconds * 1000).toLocaleDateString('pt-BR')
                                  : 'N/A'
                                }
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-400 block">
                                {request.status === 'approved' ? 'APROVADO POR:' : 'REJEITADO POR:'}
                              </span>
                              <div className="text-gray-200">
                                {(request.approvedBy || request.rejectedBy)?.substring(0, 8)}...
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

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
                            onClick={() => handleApprove(request.id, request)}
                            disabled={processingId === request.id}
                            className="flex-1 btn btn-success text-xs sm:text-sm font-mono py-2 sm:py-3"
                          >
                            {processingId === request.id ? 'PROCESSANDO...' : '✅ APROVAR VERIFICAÇÃO'}
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('Motivo da rejeição (opcional):');
                              if (reason !== null) {
                                handleReject(request.id, reason || 'Dados incorretos ou incompletos');
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
                <Shield className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-400 font-mono mb-2">
                  NENHUMA SOLICITAÇÃO ENCONTRADA
                </h3>
                <p className="text-gray-500 font-mono">
                  {filter === 'pending' ? 'Não há verificações pendentes' : 
                   filter === 'approved' ? 'Não há verificações aprovadas' :
                   filter === 'rejected' ? 'Não há verificações rejeitadas' :
                   'Não há solicitações de verificação'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}