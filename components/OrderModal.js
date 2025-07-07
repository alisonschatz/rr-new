// components/OrderModal.js
'use client';

import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';

// Função de formatação de dinheiro estendida
const formatMoney = (number) => {
  if (!number || number === 0) return '0.00';
  
  const num = Math.abs(number);
  
  if (num >= 1000000000000000000) {
    return (num / 1000000000000000000).toFixed(2).replace(/\.?0+$/, '') + 'kkkkkkkk';
  }
  if (num >= 1000000000000000) {
    return (num / 1000000000000000).toFixed(2).replace(/\.?0+$/, '') + 'kkkkkkk';
  }
  if (num >= 1000000000000) {
    return (num / 1000000000000).toFixed(2).replace(/\.?0+$/, '') + 'kkkkkk';
  }
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(2).replace(/\.?0+$/, '') + 'kkkkk';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(2).replace(/\.?0+$/, '') + 'kkkk';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(2).replace(/\.?0+$/, '') + 'kkk';
  }
  if (num >= 1) {
    return (num).toFixed(2).replace(/\.?0+$/, '') + 'kk';
  }
  
  return num.toFixed(2);
};

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

    // Validações básicas
    if (!price || price <= 0) {
      toast.error('Preço deve ser maior que zero');
      return;
    }

    if (!quantity || quantity <= 0) {
      toast.error('Quantidade deve ser maior que zero');
      return;
    }

    setLoading(true);

    try {
      console.log('Criando ordem de venda:', {
        userId: user.uid,
        resource,
        price,
        quantity,
        type: 'sell'
      });

      // Criar a ordem de venda no Firestore
      const orderData = {
        userId: user.uid,
        resource: resource,
        price: price,
        quantity: quantity,
        type: 'sell', // Identificar como ordem de venda
        timestamp: serverTimestamp()
      };

      console.log('Dados da ordem de venda a ser salva:', orderData);

      const orderRef = await addDoc(collection(db, 'orders'), orderData);

      console.log('✅ Ordem de venda criada com sucesso! ID:', orderRef.id);

      toast.success(`Ordem de venda criada! ${quantity} ${resource} por ${price.toFixed(2)} $ cada`);
      
      // Limpar formulário e fechar modal
      setOrderData({ price: '', quantity: '' });
      onClose();

    } catch (error) {
      console.error('Erro detalhado ao criar ordem de venda:', error);
      
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
  const totalValue = price * quantity || 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="modal max-w-md w-full mx-2 sm:mx-auto p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 sm:mb-6 border-b border-gray-600 pb-3 sm:pb-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-200 font-mono tracking-wider">
            NOVA ORDEM DE VENDA
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-200 transition-colors p-1"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>

        {/* RESOURCE INFO */}
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-750 border border-gray-600">
          <div className="text-center">
            <div className="text-2xl sm:text-3xl mb-2">{resource === 'GOLD' ? '🏆' : resource === 'OIL' ? '🛢️' : resource === 'ORE' ? '⛏️' : resource === 'DIA' ? '💎' : resource === 'URA' ? '☢️' : '💵'}</div>
            <div className="font-bold text-gray-200 font-mono tracking-wider text-sm sm:text-base">
              VENDENDO {resource}
            </div>
            <div className="text-xs text-gray-400 font-mono tracking-wider mt-1">
              Outros traders poderão comprar sua oferta
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2 font-mono tracking-wider">
              PREÇO POR UNIDADE ($)
            </label>
            <input
              type="number"
              name="price"
              value={orderData.price}
              onChange={handleChange}
              step="0.01"
              min="0.01"
              required
              className="input font-mono"
              placeholder="0.00"
              disabled={loading}
            />
            <div className="text-xs text-gray-500 font-mono mt-1">
              Preço que você quer receber por cada unidade
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2 font-mono tracking-wider">
              QUANTIDADE A VENDER
            </label>
            <input
              type="number"
              name="quantity"
              value={orderData.quantity}
              onChange={handleChange}
              min="1"
              required
              className="input font-mono"
              placeholder="0"
              disabled={loading}
            />
            <div className="text-xs text-gray-500 font-mono mt-1">
              Quantas unidades você quer vender
            </div>
          </div>

          <div className="bg-gray-750 p-3 sm:p-4 border border-gray-600 space-y-2">
            <div className="flex justify-between text-xs sm:text-sm font-mono">
              <span className="text-gray-400 tracking-wider">VALOR TOTAL:</span>
              <span className="font-bold text-green-400">{formatMoney(totalValue)} $</span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm font-mono">
              <span className="text-gray-400 tracking-wider">VOCÊ RECEBERÁ:</span>
              <span className="font-bold text-green-400">{formatMoney(totalValue)} $ (quando vendido)</span>
            </div>
          </div>

          {/* INFO MESSAGE */}
          <div className="bg-blue-900 border border-blue-600 p-3 text-center">
            <p className="text-blue-200 font-mono text-xs sm:text-sm tracking-wider">
              💡 Sua ordem ficará disponível para outros traders comprarem
            </p>
          </div>

          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
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
              disabled={loading || totalValue <= 0}
              className="flex-1 btn btn-success font-mono tracking-wider"
            >
              {loading ? 'CRIANDO...' : 'CRIAR ORDEM DE VENDA'}
            </button>
          </div>
        </form>

        {/* HELP TEXT */}
        <div className="mt-4 sm:mt-6 text-xs text-gray-500 font-mono text-center">
          <p>🏪 Outros traders poderão comprar seus recursos pelo preço definido</p>
        </div>
      </div>
    </div>
  );
}