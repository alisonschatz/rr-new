// components/DepositModal.js - Modal de Solicitação de Depósito
'use client';

import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { X, DollarSign } from 'lucide-react';

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

export default function DepositModal({ isOpen, onClose }) {
  const { user, userData } = useAuth();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user || !userData) {
      toast.error('USUÁRIO NÃO AUTENTICADO');
      return;
    }

    const depositAmount = parseFloat(amount);

    if (!depositAmount || depositAmount <= 0) {
      toast.error('VALOR DEVE SER MAIOR QUE ZERO');
      return;
    }

    if (depositAmount > 1000000000000000) { // Limite de 1kkkkkk
      toast.error('VALOR MÁXIMO: 1kkkkkk $');
      return;
    }

    setLoading(true);

    try {
      console.log('💰 Criando solicitação de depósito:', {
        userId: user.uid,
        amount: depositAmount,
        description
      });

      // Criar solicitação de depósito
      const depositRequest = {
        userId: user.uid,
        userName: userData.name || 'Usuário',
        userEmail: userData.email || '',
        amount: depositAmount,
        description: description.trim() || 'Depósito solicitado',
        status: 'pending', // pending, approved, rejected
        requestedAt: serverTimestamp(),
        approvedAt: null,
        approvedBy: null,
        rejectionReason: null,
        type: 'deposit'
      };

      const depositRef = await addDoc(collection(db, 'deposit_requests'), depositRequest);

      console.log('✅ Solicitação de depósito criada com ID:', depositRef.id);

      toast.success('SOLICITAÇÃO ENVIADA! AGUARDE APROVAÇÃO DO ADMINISTRADOR');
      
      // Limpar formulário e fechar modal
      setAmount('');
      setDescription('');
      onClose();

    } catch (error) {
      console.error('❌ Erro ao criar solicitação:', error);
      toast.error('ERRO AO ENVIAR SOLICITAÇÃO');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAmount('');
    setDescription('');
    onClose();
  };

  if (!isOpen) return null;

  const depositAmount = parseFloat(amount) || 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="modal max-w-md w-full mx-auto p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6 border-b border-gray-600 pb-4">
          <h2 className="text-xl font-bold text-gray-200 font-mono tracking-wider">
            SOLICITAR DEPÓSITO
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-200 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* VALOR DO DEPÓSITO */}
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2 font-mono tracking-wider">
              VALOR A DEPOSITAR ($)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              step="0.01"
              min="0.01"
              max="1000000000000000"
              required
              className="input font-mono"
              placeholder="0.00"
              disabled={loading}
            />
            <div className="text-xs text-gray-500 font-mono mt-1">
              Valor máximo: 1kkkkkk $ (1.000.000.000.000.000)
            </div>
          </div>

          {/* DESCRIÇÃO/JUSTIFICATIVA */}
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2 font-mono tracking-wider">
              DESCRIÇÃO (OPCIONAL)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={200}
              rows={3}
              className="input font-mono resize-none"
              placeholder="Motivo do depósito, referência de pagamento, etc..."
              disabled={loading}
            />
            <div className="text-xs text-gray-500 font-mono mt-1">
              {description.length}/200 caracteres
            </div>
          </div>

          {/* PREVIEW DO DEPÓSITO */}
          {depositAmount > 0 && (
            <div className="bg-gray-750 border border-gray-600 p-4 space-y-2">
              <div className="flex justify-between text-sm font-mono">
                <span className="text-gray-400">VALOR SOLICITADO:</span>
                <span className="font-bold text-green-400">{formatMoney(depositAmount)} $</span>
              </div>
              <div className="flex justify-between text-sm font-mono">
                <span className="text-gray-400">SEU SALDO ATUAL:</span>
                <span className="font-bold text-gray-200">{formatMoney(userData?.balance || 0)} $</span>
              </div>
              <div className="flex justify-between text-sm font-mono border-t border-gray-600 pt-2">
                <span className="text-gray-400">SALDO APÓS APROVAÇÃO:</span>
                <span className="font-bold text-green-400">
                  {formatMoney((userData?.balance || 0) + depositAmount)} $
                </span>
              </div>
            </div>
          )}

          {/* INFORMAÇÕES IMPORTANTES */}
          <div className="bg-blue-900 border border-blue-600 p-4">
            <div className="flex items-start space-x-2">
              <span className="text-blue-400 mt-1">ℹ️</span>
              <div className="text-blue-200 font-mono text-xs space-y-2">
                <p>• Sua solicitação será enviada para análise do administrador</p>
                <p>• O depósito será creditado após aprovação</p>
                <p>• Você receberá uma notificação sobre o status</p>
                <p>• Tempo médio de aprovação: 24-48 horas</p>
              </div>
            </div>
          </div>

          {/* BOTÕES */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 btn btn-secondary font-mono tracking-wider"
            >
              CANCELAR
            </button>
            <button
              type="submit"
              disabled={loading || depositAmount <= 0}
              className="flex-1 btn btn-success font-mono tracking-wider"
            >
              {loading ? 'ENVIANDO...' : 'ENVIAR SOLICITAÇÃO'}
            </button>
          </div>
        </form>

        {/* INFORMAÇÕES DE CONTATO */}
        <div className="mt-6 pt-4 border-t border-gray-600 text-center">
          <p className="text-xs text-gray-500 font-mono">
            Em caso de dúvidas, entre em contato com o suporte
          </p>
        </div>
      </div>
    </div>
  );
}