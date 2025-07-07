// components/OrderModal.js
'use client';

import { useState } from 'react';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';

export default function OrderModal({ isOpen, onClose, resource }) {
  const { user, userData } = useAuth();
  const [orderData, setOrderData] = useState({
    price: '',
    quantity: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setOrderData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user || !userData) {
      toast.error('Usuário não autenticado');
      return;
    }

    const price = parseFloat(orderData.price);
    const quantity = parseInt(orderData.quantity);

    // Validações detalhadas
    if (!price || price <= 0) {
      toast.error('Preço deve ser maior que zero');
      return;
    }

    if (!quantity || quantity <= 0) {
      toast.error('Quantidade deve ser maior que zero');
      return;
    }

    const totalCost = price * quantity;

    if (totalCost > (userData.balance || 0)) {
      toast.error(`Saldo insuficiente. Você tem ${userData.balance?.toLocaleString()} RRCOIN`);
      return;
    }

    setLoading(true);

    try {
      console.log('Criando ordem:', {
        userId: user.uid,
        resource,
        price,
        quantity,
        totalCost,
        userBalance: userData.balance
      });

      // Criar a ordem no Firestore
      const orderData = {
        userId: user.uid,
        resource: resource,
        price: price,
        quantity: quantity,
        timestamp: serverTimestamp()
      };

      console.log('Dados da ordem a ser salva:', orderData);

      const orderRef = await addDoc(collection(db, 'orders'), orderData);

      console.log('✅ Ordem criada com sucesso! ID:', orderRef.id);

      // Deduzir o saldo do usuário
      const userRef = doc(db, 'users', user.uid);
      const newBalance = userData.balance - totalCost;
      
      await updateDoc(userRef, {
        balance: newBalance
      });

      console.log('✅ Saldo atualizado de', userData.balance, 'para', newBalance);

      toast.success(`Ordem criada! ${quantity} ${resource} por ${price.toFixed(2)} RRCOIN cada`);
      
      // Limpar formulário e fechar modal
      setOrderData({ price: '', quantity: '' });
      onClose();

    } catch (error) {
      console.error('Erro detalhado ao criar ordem:', error);
      
      // Mensagens de erro mais específicas
      if (error.code === 'permission-denied') {
        toast.error('Permissão negada. Verifique as regras do Firestore');
      } else if (error.code === 'unavailable') {
        toast.error('Serviço temporariamente indisponível. Tente novamente');
      } else {
        toast.error(`Erro ao criar ordem: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Reset form when modal closes
  const handleClose = () => {
    setOrderData({ price: '', quantity: '' });
    onClose();
  };

  if (!isOpen) return null;

  const price = parseFloat(orderData.price || 0);
  const quantity = parseInt(orderData.quantity || 0);
  const totalCost = price * quantity || 0;
  const userBalance = userData?.balance || 0;
  const remainingBalance = userBalance - totalCost;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Nova Ordem de Compra - {resource}</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preço por unidade (RRCOIN)
            </label>
            <input
              type="number"
              name="price"
              value={orderData.price}
              onChange={handleChange}
              step="0.01"
              min="0.01"
              required
              className="input"
              placeholder="0.00"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantidade
            </label>
            <input
              type="number"
              name="quantity"
              value={orderData.quantity}
              onChange={handleChange}
              min="1"
              required
              className="input"
              placeholder="0"
              disabled={loading}
            />
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between text-sm">
              <span>Custo Total:</span>
              <span className="font-semibold">{totalCost.toLocaleString()} RRCOIN</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span>Saldo Atual:</span>
              <span className="font-semibold">{userBalance.toLocaleString()} RRCOIN</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span>Saldo Restante:</span>
              <span className={`font-semibold ${
                remainingBalance >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {remainingBalance.toLocaleString()} RRCOIN
              </span>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 btn btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || totalCost > userBalance || totalCost <= 0}
              className="flex-1 btn btn-primary"
            >
              {loading ? 'Criando...' : 'Criar Ordem'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}