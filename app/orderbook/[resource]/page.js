// app/orderbook/[resource]/page.js - REESCRITO DO ZERO
'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, deleteDoc, updateDoc, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import OrderModal from '@/components/OrderModal';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, Trash2, TrendingUp, RefreshCw, AlertCircle, ShoppingCart, X } from 'lucide-react';
import Link from 'next/link';

// Formatação de números
const formatNumber = (number) => {
  if (!number || number === 0) return '0';
  const num = Math.abs(number);
  if (num >= 1000000000000000000) return (num / 1000000000000000000).toFixed(1).replace('.0', '') + 'kkkkkkkk';
  if (num >= 1000000000000000) return (num / 1000000000000000).toFixed(1).replace('.0', '') + 'kkkkkkk';
  if (num >= 1000000000000) return (num / 1000000000000).toFixed(1).replace('.0', '') + 'kkkkkk';
  if (num >= 1000000000) return (num / 1000000000).toFixed(1).replace('.0', '') + 'kkkkk';
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace('.0', '') + 'kkkk';
  if (num >= 1000) return (num / 1000).toFixed(1).replace('.0', '') + 'kkk';
  if (num >= 1) return (num).toFixed(1).replace('.0', '') + 'kk';
  return num.toString();
};

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

// Configuração dos recursos
const RESOURCES = {
  gold: { 
    name: 'OURO', 
    icon: '🏆', 
    resource: 'GOLD', 
    color: 'text-yellow-600', 
    bgColor: 'bg-yellow-800' 
  },
  oil: { 
    name: 'PETRÓLEO', 
    icon: '🛢️', 
    resource: 'OIL', 
    color: 'text-gray-400', 
    bgColor: 'bg-gray-700' 
  },
  ore: { 
    name: 'MINÉRIO', 
    icon: '⛏️', 
    resource: 'ORE', 
    color: 'text-orange-600', 
    bgColor: 'bg-orange-800' 
  },
  dia: { 
    name: 'DIAMANTE', 
    icon: '💎', 
    resource: 'DIA', 
    color: 'text-blue-600', 
    bgColor: 'bg-blue-800' 
  },
  ura: { 
    name: 'URÂNIO', 
    icon: '☢️', 
    resource: 'URA', 
    color: 'text-green-600', 
    bgColor: 'bg-green-800' 
  },
  cash: { 
    name: 'DINHEIRO', 
    icon: '💵', 
    resource: 'CASH', 
    color: 'text-emerald-600', 
    bgColor: 'bg-emerald-800' 
  }
};

// Modal de Compra
function BuyModal({ isOpen, onClose, order, resource }) {
  const { user, userData } = useAuth();
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !order) return null;

  const maxQuantity = order.quantity || 0;
  const pricePerUnit = order.price || 0;
  const requestedQty = parseInt(quantity) || 0;
  const totalCost = requestedQty * pricePerUnit;
  const maxAffordable = Math.floor((userData?.balance || 0) / pricePerUnit);

  const handleBuy = async () => {
    if (!user || !userData || !order) {
      toast.error('DADOS INVÁLIDOS');
      return;
    }

    if (requestedQty <= 0 || requestedQty > maxQuantity) {
      toast.error('QUANTIDADE INVÁLIDA');
      return;
    }

    if (totalCost > (userData.balance || 0)) {
      toast.error('SALDO INSUFICIENTE');
      return;
    }

    setLoading(true);

    try {
      console.log('💰 Iniciando compra:', {
        buyer: user.uid,
        seller: order.userId,
        resource,
        quantity: requestedQty,
        pricePerUnit,
        totalCost
      });

      // 1. Atualizar dados do comprador
      const buyerRef = doc(db, 'users', user.uid);
      const buyerDoc = await getDoc(buyerRef);
      
      if (!buyerDoc.exists()) {
        throw new Error('Dados do comprador não encontrados');
      }

      const buyerData = buyerDoc.data();
      const newBuyerBalance = (buyerData.balance || 0) - totalCost;
      
      // Atualizar inventário do comprador
      const currentInventory = buyerData.inventory || {};
      const newBuyerInventory = {
        ...currentInventory,
        [resource]: (currentInventory[resource] || 0) + requestedQty
      };

      await updateDoc(buyerRef, {
        balance: newBuyerBalance,
        inventory: newBuyerInventory
      });

      // 2. Atualizar saldo do vendedor
      const sellerRef = doc(db, 'users', order.userId);
      const sellerDoc = await getDoc(sellerRef);
      
      if (sellerDoc.exists()) {
        const sellerData = sellerDoc.data();
        await updateDoc(sellerRef, {
          balance: (sellerData.balance || 0) + totalCost
        });
      }

      // 3. Atualizar ou remover a ordem
      const remainingQuantity = maxQuantity - requestedQty;
      
      if (remainingQuantity > 0) {
        const orderRef = doc(db, 'orders', order.id);
        await updateDoc(orderRef, {
          quantity: remainingQuantity
        });
      } else {
        await deleteDoc(doc(db, 'orders', order.id));
      }

      // 4. Registrar transação para sistema de recibos
      const transactionRef = await addDoc(collection(db, 'transactions'), {
        buyerId: user.uid,
        sellerId: order.userId,
        resource,
        quantity: requestedQty,
        pricePerUnit,
        totalValue: totalCost,
        timestamp: serverTimestamp(),
        type: 'purchase'
      });

      console.log('✅ Transação registrada com ID:', transactionRef.id);

      toast.success('COMPRA REALIZADA! ' + formatNumber(requestedQty) + ' ' + resource + ' por ' + formatMoney(totalCost) + ' $');
      
      // Oferecer ver recibo
      setTimeout(() => {
        toast((t) => (
          <div className="flex flex-col space-y-2">
            <span>Compra registrada! Ver recibo?</span>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  window.open('/receipt/' + transactionRef.id, '_blank');
                  toast.dismiss(t.id);
                }}
                className="px-3 py-1 bg-blue-600 text-white text-sm font-mono"
              >
                VER RECIBO
              </button>
              <button
                onClick={() => toast.dismiss(t.id)}
                className="px-3 py-1 bg-gray-600 text-white text-sm font-mono"
              >
                FECHAR
              </button>
            </div>
          </div>
        ), { duration: 10000 });
      }, 2000);

      onClose();

    } catch (error) {
      console.error('❌ Erro na compra:', error);
      toast.error('ERRO: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="modal max-w-md w-full mx-auto p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6 border-b border-gray-600 pb-4">
          <h2 className="text-xl font-bold text-gray-200 font-mono tracking-wider">
            COMPRAR {resource}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Informações da Ordem */}
          <div className="bg-gray-750 border border-gray-600 p-4">
            <div className="grid grid-cols-2 gap-4 text-sm font-mono">
              <div>
                <span className="text-gray-400">PREÇO:</span>
                <div className="font-bold text-gray-200">{formatMoney(pricePerUnit)} $</div>
              </div>
              <div>
                <span className="text-gray-400">DISPONÍVEL:</span>
                <div className="font-bold text-gray-200">{formatNumber(maxQuantity)}</div>
              </div>
            </div>
          </div>

          {/* Quantidade a Comprar */}
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2 font-mono tracking-wider">
              QUANTIDADE A COMPRAR
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="1"
              max={Math.min(maxQuantity, maxAffordable)}
              className="input font-mono"
              placeholder="0"
              disabled={loading}
            />
            <div className="text-xs text-gray-500 font-mono mt-1 space-y-1">
              <div>Máximo disponível: {formatNumber(maxQuantity)}</div>
              <div>Máximo que você pode comprar: {formatNumber(maxAffordable)}</div>
            </div>
          </div>

          {/* Botões de Quantidade Rápida */}
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => setQuantity(Math.min(Math.floor(maxQuantity * 0.25), maxAffordable).toString())}
              className="btn btn-secondary text-xs font-mono"
              disabled={loading}
            >
              25%
            </button>
            <button
              onClick={() => setQuantity(Math.min(Math.floor(maxQuantity * 0.5), maxAffordable).toString())}
              className="btn btn-secondary text-xs font-mono"
              disabled={loading}
            >
              50%
            </button>
            <button
              onClick={() => setQuantity(Math.min(Math.floor(maxQuantity * 0.75), maxAffordable).toString())}
              className="btn btn-secondary text-xs font-mono"
              disabled={loading}
            >
              75%
            </button>
            <button
              onClick={() => setQuantity(Math.min(maxQuantity, maxAffordable).toString())}
              className="btn btn-secondary text-xs font-mono"
              disabled={loading}
            >
              MÁX
            </button>
          </div>

          {/* Resumo da Compra */}
          {requestedQty > 0 && (
            <div className="bg-gray-750 border border-gray-600 p-4 space-y-2">
              <div className="flex justify-between text-sm font-mono">
                <span className="text-gray-400">QUANTIDADE:</span>
                <span className="font-bold text-gray-200">{formatNumber(requestedQty)}</span>
              </div>
              <div className="flex justify-between text-sm font-mono">
                <span className="text-gray-400">PREÇO UNITÁRIO:</span>
                <span className="font-bold text-gray-200">{formatMoney(pricePerUnit)} $</span>
              </div>
              <div className="flex justify-between text-sm font-mono border-t border-gray-600 pt-2">
                <span className="text-gray-400">TOTAL A PAGAR:</span>
                <span className="font-bold text-green-400">{formatMoney(totalCost)} $</span>
              </div>
              <div className="flex justify-between text-sm font-mono">
                <span className="text-gray-400">SEU SALDO:</span>
                <span className={userData?.balance >= totalCost ? 'font-bold text-green-400' : 'font-bold text-red-400'}>
                  {formatMoney(userData?.balance || 0)} $
                </span>
              </div>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 btn btn-secondary font-mono tracking-wider"
            >
              CANCELAR
            </button>
            <button
              onClick={handleBuy}
              disabled={loading || requestedQty <= 0 || totalCost > (userData?.balance || 0)}
              className="flex-1 btn btn-success font-mono tracking-wider"
            >
              {loading ? 'COMPRANDO...' : 'CONFIRMAR COMPRA'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderbookPage({ params }) {
  const { user, userData } = useAuth();
  const [orders, setOrders] = useState([]);
  const [userOrders, setUserOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [stats, setStats] = useState({
    averagePrice: 0,
    highestPrice: 0,
    lowestPrice: 0,
    totalVolume: 0,
    totalOrders: 0
  });

  const resourceKey = params.resource;
  const config = RESOURCES[resourceKey];

  // Verificar se o recurso é válido
  if (!config) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen">
          <Navbar />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="card text-center">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-200 font-mono tracking-wider mb-2">
                RECURSO NÃO ENCONTRADO
              </h1>
              <p className="text-gray-400 font-mono mb-4">
                O recurso {resourceKey} não existe no sistema.
              </p>
              <Link href="/dashboard" className="btn btn-primary font-mono tracking-wider">
                VOLTAR AO DASHBOARD
              </Link>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Configurar listeners para ordens
  useEffect(() => {
    if (!config) return;

    console.log('🚀 Inicializando orderbook para:', config.resource);
    
    let unsubscribeAll = () => {};
    let unsubscribeUser = () => {};
    
    try {
      // Listener para todas as ordens
      const allOrdersQuery = query(
        collection(db, 'orders'),
        where('resource', '==', config.resource)
      );

      unsubscribeAll = onSnapshot(
        allOrdersQuery,
        (snapshot) => {
          const ordersList = [];
          
          snapshot.forEach((doc) => {
            const data = doc.data();
            if (data.resource && data.price && data.quantity && data.userId) {
              ordersList.push({
                id: doc.id,
                resource: data.resource,
                price: Number(data.price) || 0,
                quantity: Number(data.quantity) || 0,
                userId: data.userId,
                timestamp: data.timestamp
              });
            }
          });

          // Ordenar por preço (menor primeiro)
          ordersList.sort((a, b) => a.price - b.price);
          setOrders(ordersList);
          
          // Calcular estatísticas
          if (ordersList.length > 0) {
            const prices = ordersList.map(order => order.price);
            const totalValue = ordersList.reduce((sum, order) => sum + (order.price * order.quantity), 0);
            const totalQty = ordersList.reduce((sum, order) => sum + order.quantity, 0);

            setStats({
              averagePrice: totalQty > 0 ? totalValue / totalQty : 0,
              highestPrice: Math.max(...prices),
              lowestPrice: Math.min(...prices.filter(p => p > 0)),
              totalVolume: totalQty,
              totalOrders: ordersList.length
            });
          } else {
            setStats({
              averagePrice: 0,
              highestPrice: 0,
              lowestPrice: 0,
              totalVolume: 0,
              totalOrders: 0
            });
          }
          
          setLoading(false);
        },
        (error) => {
          console.error('❌ Erro no listener de ordens:', error);
          setLoading(false);
          toast.error('ERRO AO CARREGAR ORDERBOOK');
        }
      );

      // Listener para ordens do usuário
      if (user) {
        const userOrdersQuery = query(
          collection(db, 'orders'),
          where('resource', '==', config.resource),
          where('userId', '==', user.uid)
        );

        unsubscribeUser = onSnapshot(
          userOrdersQuery,
          (snapshot) => {
            const userOrdersList = snapshot.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                ...data,
                price: Number(data.price) || 0,
                quantity: Number(data.quantity) || 0
              };
            });

            userOrdersList.sort((a, b) => {
              const timeA = a.timestamp?.seconds || 0;
              const timeB = b.timestamp?.seconds || 0;
              return timeB - timeA;
            });
            
            setUserOrders(userOrdersList);
          },
          (error) => {
            console.error('❌ Erro nas ordens do usuário:', error);
          }
        );
      }
    } catch (error) {
      console.error('❌ Erro ao configurar listeners:', error);
      setLoading(false);
    }

    return () => {
      unsubscribeAll();
      unsubscribeUser();
    };
  }, [config?.resource, user]);

  // Função para abrir modal de compra
  const handleBuyOrder = (order) => {
    if (!user || !userData) {
      toast.error('USUÁRIO NÃO AUTENTICADO');
      return;
    }

    if (order.userId === user.uid) {
      toast.error('VOCÊ NÃO PODE COMPRAR SUA PRÓPRIA ORDEM');
      return;
    }

    setSelectedOrder(order);
    setShowBuyModal(true);
  };

  // Cancelar ordem
  const handleCancelOrder = async (orderId) => {
    if (!user) {
      toast.error('USUÁRIO NÃO AUTENTICADO');
      return;
    }

    try {
      await deleteDoc(doc(db, 'orders', orderId));
      toast.success('ORDEM CANCELADA!');
    } catch (error) {
      console.error('❌ Erro ao cancelar:', error);
      toast.error('ERRO AO CANCELAR ORDEM');
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen">
        <Navbar />
        
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
          
          {/* CABEÇALHO */}
          <div className="mb-6 sm:mb-8">
            <div className="card">
              <div className="flex flex-col space-y-4 sm:space-y-6 lg:flex-row lg:justify-between lg:items-center lg:space-y-0">
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
                  <Link href="/dashboard" className="btn btn-secondary font-mono tracking-wider text-sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    VOLTAR
                  </Link>
                  <div className="flex items-center space-x-4">
                    <span className="text-3xl sm:text-5xl">{config.icon}</span>
                    <div>
                      <h1 className={'text-2xl sm:text-4xl font-bold font-mono tracking-wider ' + config.color}>
                        {config.name}
                      </h1>
                      <p className="text-gray-400 font-mono tracking-wider text-sm sm:text-lg">
                        MARKETPLACE - {config.resource}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                  <button
                    onClick={() => window.location.reload()}
                    className="btn btn-secondary flex items-center justify-center space-x-2 font-mono tracking-wider text-sm"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>ATUALIZAR</span>
                  </button>
                  <button
                    onClick={() => setShowOrderModal(true)}
                    className={'btn font-mono tracking-wider flex items-center justify-center space-x-2 text-sm text-white ' + config.bgColor}
                  >
                    <Plus className="h-4 w-4" />
                    <span>VENDER {config.resource}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ESTATÍSTICAS RÁPIDAS */}
          <div className="mb-6 sm:mb-8">
            <div className="card bg-gray-750 border-gray-600">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm font-mono">
                <div className="text-center">
                  <div className="text-xs text-gray-400 tracking-wider">OFERTAS</div>
                  <div className={'text-lg font-bold ' + config.color}>{stats.totalOrders}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-400 tracking-wider">VOLUME</div>
                  <div className={'text-lg font-bold ' + config.color}>{formatNumber(stats.totalVolume)}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-400 tracking-wider">MELHOR PREÇO</div>
                  <div className="text-lg font-bold text-green-400">
                    {stats.lowestPrice > 0 ? formatMoney(stats.lowestPrice) + ' $' : '--'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-400 tracking-wider">SEU SALDO</div>
                  <div className="text-lg font-bold text-green-400">
                    {formatMoney(userData?.balance || 0)} $
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ESTATÍSTICAS DETALHADAS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
            <div className="stat-card">
              <div>
                <p className="text-xs sm:text-sm font-bold text-gray-400 font-mono tracking-wider mb-1">
                  PREÇO MÉDIO
                </p>
                <p className={'text-lg sm:text-2xl font-bold font-mono ' + config.color}>
                  {formatMoney(stats.averagePrice)} $
                </p>
              </div>
            </div>
            
            <div className="stat-card">
              <div>
                <p className="text-xs sm:text-sm font-bold text-gray-400 font-mono tracking-wider mb-1">
                  MENOR PREÇO
                </p>
                <p className="text-lg sm:text-2xl font-bold text-green-400 font-mono">
                  {formatMoney(stats.lowestPrice)} $
                </p>
              </div>
            </div>
            
            <div className="stat-card">
              <div>
                <p className="text-xs sm:text-sm font-bold text-gray-400 font-mono tracking-wider mb-1">
                  MAIOR PREÇO
                </p>
                <p className="text-lg sm:text-2xl font-bold text-red-400 font-mono">
                  {formatMoney(stats.highestPrice)} $
                </p>
              </div>
            </div>
            
            <div className="stat-card">
              <div>
                <p className="text-xs sm:text-sm font-bold text-gray-400 font-mono tracking-wider mb-1">
                  VOLUME TOTAL
                </p>
                <p className={'text-lg sm:text-2xl font-bold font-mono ' + config.color}>
                  {formatNumber(stats.totalVolume)}
                </p>
              </div>
            </div>
          </div>

          {/* CONTEÚDO PRINCIPAL */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
            
            {/* ORDENS À VENDA */}
            <div className="card">
              <div className="flex items-center justify-between mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-gray-600">
                <h2 className="text-lg sm:text-2xl font-bold text-gray-200 font-mono tracking-wider">
                  ORDENS À VENDA
                </h2>
                <div className="text-xs sm:text-sm text-gray-400 font-mono tracking-wider">
                  {orders.length} DISPONÍVEL{orders.length !== 1 ? 'IS' : ''}
                </div>
              </div>
              
              {loading ? (
                <div className="flex justify-center py-8 sm:py-12">
                  <div className="flex items-center space-x-4 font-mono text-gray-400">
                    <div className="w-4 h-1 bg-gray-600 animate-pulse"></div>
                    <div className="w-4 h-1 bg-gray-600 animate-pulse"></div>
                    <div className="w-4 h-1 bg-gray-600 animate-pulse"></div>
                    <span className="tracking-wider text-xs sm:text-sm">CARREGANDO...</span>
                  </div>
                </div>
              ) : orders.length > 0 ? (
                <>
                  {/* TABELA DESKTOP */}
                  <div className="hidden md:block orderbook-table overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="table-header">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-300 uppercase tracking-wider font-mono">
                            TOTAL
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-300 uppercase tracking-wider font-mono">
                            VENDEDOR
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-300 uppercase tracking-wider font-mono">
                            AÇÃO
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-600">
                        {orders.map(order => (
                          <tr key={order.id} className="table-row">
                            <td className="px-4 py-3">
                              <div className="font-bold text-gray-200 font-mono">
                                {formatMoney(order.price)} $
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-gray-200 font-mono">
                                {formatNumber(order.quantity)}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-bold text-green-400 font-mono">
                                {formatMoney(order.price * order.quantity)} $
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-gray-400 font-mono text-sm">
                                {order.userId.substring(0, 8)}...
                                {order.userId === user?.uid && (
                                  <span className="ml-2 px-2 py-1 text-xs font-bold tracking-wider bg-blue-600 text-white">
                                    VOCÊ
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {order.userId === user?.uid ? (
                                <span className="text-xs text-gray-500 font-mono">SUA ORDEM</span>
                              ) : (
                                <button
                                  onClick={() => handleBuyOrder(order)}
                                  className="btn btn-success text-xs flex items-center space-x-1"
                                >
                                  <ShoppingCart className="h-3 w-3" />
                                  <span>COMPRAR</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* CARDS MOBILE */}
                  <div className="md:hidden space-y-3">
                    {orders.map(order => (
                      <div key={order.id} className="bg-gray-750 border border-gray-600 p-3">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs text-gray-400 font-mono tracking-wider">PREÇO:</span>
                              <span className="font-bold text-gray-200 font-mono">
                                {formatMoney(order.price)} $
                              </span>
                            </div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs text-gray-400 font-mono tracking-wider">QTD:</span>
                              <span className="text-gray-200 font-mono">
                                {formatNumber(order.quantity)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs text-gray-400 font-mono tracking-wider">TOTAL:</span>
                              <span className="font-bold text-green-400 font-mono">
                                {formatMoney(order.price * order.quantity)} $
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-400 font-mono tracking-wider">VENDEDOR:</span>
                              <div className="text-gray-400 font-mono text-xs">
                                {order.userId.substring(0, 6)}...
                                {order.userId === user?.uid && (
                                  <span className="ml-2 px-1 py-0.5 text-xs font-bold tracking-wider bg-blue-600 text-white">
                                    VOCÊ
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        {order.userId === user?.uid ? (
                          <div className="text-center text-xs text-gray-500 font-mono">
                            SUA ORDEM DE VENDA
                          </div>
                        ) : (
                          <button
                            onClick={() => handleBuyOrder(order)}
                            className="w-full btn btn-success text-xs flex items-center justify-center space-x-2"
                          >
                            <ShoppingCart className="h-4 w-4" />
                            <span>COMPRAR POR {formatMoney(order.price * order.quantity)} $</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 sm:py-12">
                  <TrendingUp className="h-12 w-12 sm:h-16 sm:w-16 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg sm:text-xl font-bold text-gray-400 font-mono tracking-wider mb-2">
                    NENHUMA OFERTA DISPONÍVEL
                  </h3>
                  <p className="text-gray-500 font-mono tracking-wider text-sm sm:text-base">
                    Seja o primeiro a vender {config.resource}
                  </p>
                </div>
              )}
            </div>

            {/* SUAS ORDENS */}
            <div className="card">
              <div className="flex items-center justify-between mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-gray-600">
                <h2 className="text-lg sm:text-2xl font-bold text-gray-200 font-mono tracking-wider">
                  SUAS VENDAS
                </h2>
                <div className="text-xs sm:text-sm text-gray-400 font-mono tracking-wider">
                  {userOrders.length} ATIVA{userOrders.length !== 1 ? 'S' : ''}
                </div>
              </div>
              
              {userOrders.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {userOrders.map(order => (
                    <div key={order.id} className="bg-gray-750 border border-gray-600 p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row justify-between items-start space-y-3 sm:space-y-0">
                        <div className="flex-1 w-full">
                          <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm font-mono">
                            <div>
                              <span className="text-gray-400 tracking-wider">PREÇO:</span>
                              <div className="font-bold text-gray-200">{formatMoney(order.price)} $</div>
                            </div>
                            <div>
                              <span className="text-gray-400 tracking-wider">QUANTIDADE:</span>
                              <div className="font-bold text-gray-200">{formatNumber(order.quantity)}</div>
                            </div>
                            <div>
                              <span className="text-gray-400 tracking-wider">VALOR TOTAL:</span>
                              <div className="font-bold text-green-400">
                                {formatMoney(order.price * order.quantity)} $
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-400 tracking-wider">CRIADA EM:</span>
                              <div className="text-gray-400">
                                {order.timestamp?.seconds 
                                  ? new Date(order.timestamp.seconds * 1000).toLocaleDateString('pt-BR')
                                  : 'N/A'
                                }
                              </div>
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-gray-500 font-mono">
                            ID: {order.id.substring(0, 8)}...
                          </div>
                        </div>
                        <button
                          onClick={() => handleCancelOrder(order.id)}
                          className="w-full sm:w-auto sm:ml-4 btn btn-danger text-xs sm:text-sm flex items-center justify-center space-x-1 font-mono tracking-wider"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>CANCELAR</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 sm:py-12">
                  <TrendingUp className="h-12 w-12 sm:h-16 sm:w-16 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg sm:text-xl font-bold text-gray-400 font-mono tracking-wider mb-2">
                    NENHUMA VENDA ATIVA
                  </h3>
                  <p className="text-gray-500 font-mono tracking-wider text-sm sm:text-base">
                    Você não tem ordens de venda para {config.resource}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MODAL DE NOVA ORDEM */}
        <OrderModal
          isOpen={showOrderModal}
          onClose={() => setShowOrderModal(false)}
          resource={config.resource}
        />

        {/* MODAL DE COMPRA COM SISTEMA DE RECIBOS */}
        <BuyModal
          isOpen={showBuyModal}
          onClose={() => {
            setShowBuyModal(false);
            setSelectedOrder(null);
          }}
          order={selectedOrder}
          resource={config.resource}
        />
      </div>
    </ProtectedRoute>
  );
}