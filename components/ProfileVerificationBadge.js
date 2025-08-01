// components/ProfileVerificationBadge.js - Componente para selo de verificação
'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { sendProfileVerificationRequest } from '@/lib/telegram';
import toast from 'react-hot-toast';
import { Shield, ShieldCheck, Clock, AlertCircle, Send } from 'lucide-react';

export default function ProfileVerificationBadge({ userData, size = 'normal' }) {
  const { user } = useAuth();
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (!user || !userData) return;

    // Listener para verificar se há solicitação de verificação
    const verificationsQuery = query(
      collection(db, 'profile_verifications'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(verificationsQuery, (snapshot) => {
      if (snapshot.empty) {
        setVerificationStatus(null);
      } else {
        // Pegar a solicitação mais recente
        const verifications = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        const latest = verifications.sort((a, b) => 
          (b.requestedAt?.seconds || 0) - (a.requestedAt?.seconds || 0)
        )[0];
        
        setVerificationStatus(latest);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, userData]);

  // Verificar se o perfil está completo
  const isProfileComplete = () => {
    return userData && 
           userData.name && 
           userData.rivalRegionsLink && 
           userData.telegramNumber &&
           userData.name.trim().length > 0 &&
           userData.rivalRegionsLink.trim().length > 0 &&
           userData.telegramNumber.trim().length > 0;
  };

  // Verificar se pode solicitar novamente (perfil rejeitado há mais de 24h)
  const canRequestAgain = () => {
    if (!verificationStatus || verificationStatus.status !== 'rejected') return false;
    
    // Verificar se passou 24 horas desde a rejeição
    const rejectedTime = verificationStatus.rejectedAt?.seconds * 1000;
    const now = Date.now();
    const timeDiff = now - rejectedTime;
    const hoursElapsed = timeDiff / (1000 * 60 * 60);
    
    return hoursElapsed >= 24; // 24 horas para solicitar novamente
  };

  // Calcular tempo restante para nova solicitação
  const getTimeUntilResubmit = () => {
    if (!verificationStatus || verificationStatus.status !== 'rejected') return '';
    
    const rejectedTime = verificationStatus.rejectedAt?.seconds * 1000;
    const now = Date.now();
    const timeDiff = now - rejectedTime;
    const hoursElapsed = timeDiff / (1000 * 60 * 60);
    const hoursRemaining = Math.max(0, 24 - hoursElapsed);
    
    if (hoursRemaining > 1) {
      return `${Math.ceil(hoursRemaining)} horas`;
    } else if (hoursRemaining > 0) {
      return `${Math.ceil(hoursRemaining * 60)} minutos`;
    }
    return 'Agora';
  };

  // Solicitar verificação
  const requestVerification = async () => {
    if (!user || !userData || !isProfileComplete()) {
      toast.error('COMPLETE SEU PERFIL PRIMEIRO');
      return;
    }

    // Verificar se pode solicitar novamente se foi rejeitado
    if (verificationStatus?.status === 'rejected' && !canRequestAgain()) {
      toast.error(`AGUARDE ${getTimeUntilResubmit()} PARA SOLICITAR NOVAMENTE`);
      return;
    }

    setRequesting(true);

    try {
      console.log('🛡️ === INICIANDO VERIFICAÇÃO REAL ===');
      console.log('🛡️ Criando solicitação de verificação para:', user.uid);
      
      // Criar solicitação de verificação
      const verificationRequest = {
        userId: user.uid,
        userName: userData.name,
        userEmail: userData.email,
        rivalRegionsLink: userData.rivalRegionsLink,
        telegramNumber: userData.telegramNumber,
        status: 'pending',
        requestedAt: serverTimestamp(),
        type: 'profile_verification',
        // Se for uma nova tentativa, marcar como resubmissão
        isResubmission: verificationStatus?.status === 'rejected' || false,
        previousRejectionReason: verificationStatus?.rejectionReason || null
      };

      console.log('🛡️ Dados da solicitação:', verificationRequest);

      const requestRef = await addDoc(collection(db, 'profile_verifications'), verificationRequest);

      console.log('✅ Solicitação de verificação criada com ID:', requestRef.id);
      console.log('📱 Tentando enviar notificação para Telegram...');

      // Enviar notificação para Telegram
      try {
        const notificationData = {
          userName: userData.name,
          userEmail: userData.email,
          rivalRegionsLink: userData.rivalRegionsLink,
          telegramNumber: userData.telegramNumber,
          userId: user.uid
        };
        
        console.log('📱 Dados para notificação:', notificationData);
        console.log('📱 ID da solicitação:', requestRef.id);
        
        const notificationSent = await sendProfileVerificationRequest(notificationData, requestRef.id);
        
        console.log('📱 Resultado da notificação:', notificationSent);
        
        if (notificationSent) {
          console.log('✅ Notificação Telegram enviada com sucesso!');
          toast.success(verificationStatus?.status === 'rejected' ? 
            'NOVA SOLICITAÇÃO ENVIADA! 🛡️' : 
            'SOLICITAÇÃO DE VERIFICAÇÃO ENVIADA! 🛡️'
          );
        } else {
          console.log('⚠️ Notificação Telegram não enviada');
          toast.success('SOLICITAÇÃO DE VERIFICAÇÃO ENVIADA!');
        }
      } catch (telegramError) {
        console.warn('❌ Erro na notificação Telegram:', telegramError);
        toast.success('SOLICITAÇÃO DE VERIFICAÇÃO ENVIADA!');
      }

    } catch (error) {
      console.error('❌ Erro ao solicitar verificação:', error);
      toast.error('ERRO AO SOLICITAR VERIFICAÇÃO');
    } finally {
      setRequesting(false);
    }
  };

  // Se ainda está carregando
  if (loading) {
    return size === 'small' ? (
      <div className="w-4 h-4 bg-gray-600 animate-pulse"></div>
    ) : null;
  }

  // Renderização baseada no status
  if (verificationStatus?.status === 'approved') {
    // PERFIL VERIFICADO
    return (
      <div className={`inline-flex items-center space-x-1 ${
        size === 'small' ? 'text-xs' : 'text-sm'
      } font-mono`}>
        <ShieldCheck className={`${
          size === 'small' ? 'h-4 w-4' : 'h-5 w-5'
        } text-green-400`} />
        <span className="text-green-400 font-bold">VERIFICADO</span>
      </div>
    );
  }

  if (verificationStatus?.status === 'pending') {
    // VERIFICAÇÃO PENDENTE
    return (
      <div className={`inline-flex items-center space-x-1 ${
        size === 'small' ? 'text-xs' : 'text-sm'
      } font-mono`}>
        <Clock className={`${
          size === 'small' ? 'h-4 w-4' : 'h-5 w-5'
        } text-yellow-400`} />
        <span className="text-yellow-400 font-bold">PENDENTE</span>
      </div>
    );
  }

  if (verificationStatus?.status === 'rejected') {
    // VERIFICAÇÃO REJEITADA
    return size === 'small' ? (
      <div className="inline-flex items-center space-x-1 text-xs font-mono">
        <AlertCircle className="h-4 w-4 text-red-400" />
        <span className="text-red-400 font-bold">REJEITADO</span>
      </div>
    ) : (
      <div className="space-y-2">
        <div className="inline-flex items-center space-x-1 text-sm font-mono">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <span className="text-red-400 font-bold">REJEITADO</span>
        </div>
        
        {verificationStatus.rejectionReason && (
          <div className="text-xs text-red-300 font-mono">
            Motivo: {verificationStatus.rejectionReason}
          </div>
        )}
        
        {canRequestAgain() ? (
          <button
            onClick={requestVerification}
            disabled={requesting}
            className="inline-flex items-center space-x-2 bg-orange-600 hover:bg-orange-500 text-white px-3 py-2 font-mono text-xs transition-colors disabled:opacity-50"
          >
            <Send className="h-3 w-3" />
            <span>{requesting ? 'ENVIANDO...' : 'SOLICITAR NOVAMENTE'}</span>
          </button>
        ) : (
          <div className="text-xs text-gray-500 font-mono">
            Nova solicitação em: {getTimeUntilResubmit()}
          </div>
        )}
      </div>
    );
  }

  // SEM VERIFICAÇÃO - Mostrar botão para solicitar se perfil completo
  if (isProfileComplete()) {
    return size === 'small' ? (
      <button
        onClick={requestVerification}
        disabled={requesting}
        className="inline-flex items-center space-x-1 text-gray-400 hover:text-gray-200 transition-colors"
        title="Solicitar verificação"
      >
        <Shield className="h-4 w-4" />
      </button>
    ) : (
      <button
        onClick={requestVerification}
        disabled={requesting}
        className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 font-mono text-sm transition-colors disabled:opacity-50"
      >
        <Send className="h-4 w-4" />
        <span>{requesting ? 'ENVIANDO...' : 'SOLICITAR VERIFICAÇÃO'}</span>
      </button>
    );
  }

  // PERFIL INCOMPLETO
  return size === 'small' ? (
    <div className="inline-flex items-center space-x-1 text-gray-500">
      <Shield className="h-4 w-4" />
    </div>
  ) : (
    <div className="inline-flex items-center space-x-2 text-gray-500 font-mono text-sm">
      <AlertCircle className="h-4 w-4" />
      <span>COMPLETE SEU PERFIL</span>
    </div>
  );
}

// Hook personalizado para verificar status de verificação
export const useProfileVerification = (userId) => {
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const verificationsQuery = query(
      collection(db, 'profile_verifications'),
      where('userId', '==', userId),
      where('status', '==', 'approved')
    );

    const unsubscribe = onSnapshot(verificationsQuery, (snapshot) => {
      setIsVerified(!snapshot.empty);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return { isVerified, loading };
};