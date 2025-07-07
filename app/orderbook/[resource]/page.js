// app/orderbook/[resource]/page.js
'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, deleteDoc, updateDoc, getDocs, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import OrderModal from '@/components/OrderModal';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, Trash2, TrendingUp, RefreshCw, AlertCircle, BarChart3, ShoppingCart } from 'lucide-react';
import Link from 'next/link';

const resourceConfig = {
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

export default function OrderbookPage({ params }) {
  const { user, userData } = useAuth();
  const [orders, setOrders] = useState([]);
  const [userOrders, setUserOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [stats, setStats] = useState({
    averagePrice: 0,
    highestPrice: 0,
    lowestPrice: 0,
    totalVolume: 0,
    totalOrders: 0
  });

  const resourceKey = params.resource;
  const config = resourceConfig[resourceKey];

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
                O recurso "{resourceKey}" não existe no sistema.
              </p>
              <p className="text-gray-500 font-mono text-sm mb-6">
                RECURSOS VÁLIDOS: gold, oil, ore, dia, ura, cash
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

  // Buscar dados manualmente para debug
  const fetchOrdersManually = async () => {
    setRefreshing(true);
    try {
      console.log('🔄 Buscando ordens manualmente para:', config.resource);
      
      const q = query(
        collection(db, 'orders'),
        where('resource', '==', config.resource)
      );
      
      const snapshot = await getDocs(q);
      console.log('📊 Ordens encontradas manualmente:', snapshot.size);
      
      setTimeout(() => setRefreshing(false), 1000);
    } catch (error) {
      console.error('❌ Erro na busca manual:', error);
      setRefreshing(false);
    }
  };

  // Função para comprar uma ordem
  const handleBuyOrder = async (order) => {
    if (!user || !userData) {
      toast.error('USUÁRIO NÃO AUTENTICADO');
      return;
    }

    if (order.userId === user.uid) {
      toast.error('VOCÊ NÃO PODE COMPRAR SUA PRÓPRIA ORDEM');
      return;
    }

    const totalCost = order.price * order.quantity;

    if (totalCost > (userData.balance || 0)) {
      toast.error(`SALDO INSUFICIENTE. VOCÊ TEM ${userData.balance?.toLocaleString()} $`);
      return;
    }

    try {
      console.log('💰 Comprando ordem:', order);

      // Remover a ordem do mercado
      await deleteDoc(doc(db, 'orders', order.id));

      // Deduzir dinheiro do comprador
      const buyerRef = doc(db, 'users', user.uid);
      await updateDoc(buyerRef, {
        balance: userData.balance - totalCost
      });

      // Buscar dados do vendedor para adicionar o dinheiro
      const sellerRef = doc(db, 'users', order.userId);
      const sellerDoc = await getDoc(sellerRef);
      
      if (sellerDoc.exists()) {
        const sellerData = sellerDoc.data();
        await updateDoc(sellerRef, {
          balance: (sellerData.balance || 0) + totalCost
        });
      }

      toast.success(`COMPRA REALIZADA! ${order.quantity} ${config.resource} por ${totalCost.toFixed(2)} $`);
      
    } catch (error) {
      console.error('❌ Erro ao comprar ordem:', error);
      toast.error('ERRO AO PROCESSAR COMPRA');
    }
  };

  // Configurar listeners
  useEffect(() => {
    console.log('🚀 Inicializando orderbook para:', config.resource);
    
    let unsubscribeAll = () => {};
    let unsubscribeUser = () => {};
    
    try {
      // Listener para todas as ordens de venda
      const allOrdersQuery = query(
        collection(db, 'orders'),
        where('resource', '==', config.resource)
      );

      unsubscribeAll = onSnapshot(
        allOrdersQuery,
        (snapshot) => {
          console.log('📦 Ordens recebidas:', snapshot.size);
          
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

          // Ordenar por preço (menor primeiro para facilitar compras)
          ordersList.sort((a, b) => a.price - b.price);
          
          console.log('✅ Ordens processadas:', ordersList.length);
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

            // Ordenar por timestamp (mais recente primeiro)
            userOrdersList.sort((a, b) => {
              const timeA = a.timestamp?.seconds || 0;
              const timeB = b.timestamp?.seconds || 0;
              return timeB - timeA;
            });
            
            console.log('👤 Suas ordens de venda:', userOrdersList.length);
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

    // Busca manual inicial
    fetchOrdersManually();

    return () => {
      unsubscribeAll();
      unsubscribeUser();
    };
  }, [config.resource, user]);

  // Cancelar ordem de venda
  const handleCancelOrder = async (orderId) => {
    if (!user || !userData) {
      toast.error('USUÁRIO NÃO AUTENTICADO');
      return;
    }

    try {
      console.log('🗑️ Cancelando ordem de venda:', orderId);
      
      await deleteDoc(doc(db, 'orders', orderId));

      toast.success('ORDEM DE VENDA CANCELADA!');
    } catch (error) {
      console.error('❌ Erro ao cancelar ordem:', error);
      toast.error('ERRO AO CANCELAR ORDEM');
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen">
        <Navbar />
        
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
          {/* CABEÇALHO DO RECURSO */}
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
                      <h1 className={`text-2xl sm:text-4xl font-bold font-mono tracking-wider ${config.color}`}>
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
                    onClick={fetchOrdersManually}
                    disabled={refreshing}
                    className="btn btn-secondary flex items-center justify-center space-x-2 font-mono tracking-wider text-sm"
                  >
                    <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                    <span>ATUALIZAR</span>
                  </button>
                  <button
                    onClick={() => setShowOrderModal(true)}
                    className={`btn font-mono tracking-wider flex items-center justify-center space-x-2 text-sm ${config.bgColor} text-white`}
                  >
                    <Plus className="h-4 w-4" />
                    <span>VENDER {config.resource}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* STATUS DO SISTEMA */}
          <div className="mb-6 sm:mb-8">
            <div className="card bg-gray-750 border-gray-600">
              <div className="flex items-center space-x-3 mb-4">
                <AlertCircle className="h-5 w-5 text-blue-500" />
                <h3 className="font-bold text-gray-200 font-mono tracking-wider text-sm sm:text-base">STATUS DO MARKETPLACE</h3>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm font-mono">
                <div className="text-center">
                  <div className="text-xs text-gray-400 tracking-wider">ORDENS À VENDA</div>
                  <div className={`text-lg font-bold ${config.color}`}>{stats.totalOrders}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-400 tracking-wider">VOLUME TOTAL</div>
                  <div className={`text-lg font-bold ${config.color}`}>{stats.totalVolume.toLocaleString()}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-400 tracking-wider">SUAS VENDAS</div>
                  <div className={`text-lg font-bold ${config.color}`}>{userOrders.length}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-400 tracking-wider">SEU SALDO</div>
                  <div className="text-sm sm:text-lg font-bold text-green-400">
                    {userData?.balance?.toLocaleString() || '0'} $
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ESTATÍSTICAS DE PREÇO */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
            <div className="stat-card">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs sm:text-sm font-bold text-gray-400 font-mono tracking-wider mb-1">PREÇO MÉDIO</p>
                  <p className={`text-lg sm:text-2xl font-bold font-mono ${config.color}`}>
                    {stats.averagePrice.toFixed(2)} $
                  </p>
                </div>
                <BarChart3 className={`h-6 w-6 sm:h-8 sm:w-8 ${config.color}`} />
              </div>
            </div>
            
            <div className="stat-card">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs sm:text-sm font-bold text-gray-400 font-mono tracking-wider mb-1">MENOR PREÇO</p>
                  <p className="text-lg sm:text-2xl font-bold text-green-400 font-mono">
                    {(stats.lowestPrice || 0).toFixed(2)} $
                  </p>
                </div>
                <div className="text-lg sm:text-2xl text-green-400">💰</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs sm:text-sm font-bold text-gray-400 font-mono tracking-wider mb-1">MAIOR PREÇO</p>
                  <p className="text-lg sm:text-2xl font-bold text-red-400 font-mono">
                    {stats.highestPrice.toFixed(2)} $
                  </p>
                </div>
                <div className="text-lg sm:text-2xl text-red-400">📈</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs sm:text-sm font-bold text-gray-400 font-mono tracking-wider mb-1">VOLUME TOTAL</p>
                  <p className={`text-lg sm:text-2xl font-bold font-mono ${config.color}`}>
                    {stats.totalVolume.toLocaleString()}
                  </p>
                </div>
                <div className="text-lg sm:text-2xl">📊</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
            {/* MARKETPLACE - ORDENS À VENDA */}
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
                    <span className="tracking-wider text-xs sm:text-sm">CARREGANDO OFERTAS...</span>
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
                            PREÇO
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-300 uppercase tracking-wider font-mono">
                            QUANTIDADE
                          </th>
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
                                {order.price.toFixed(2)} $
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-gray-200 font-mono">
                                {order.quantity.toLocaleString()}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-bold text-green-400 font-mono">
                                {(order.price * order.quantity).toFixed(2)} $
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-gray-400 font-mono text-sm">
                                {order.userId.substring(0, 8)}...
                                {order.userId === user?.uid && (
                                  <span className={`ml-2 px-2 py-1 text-xs font-bold tracking-wider ${config.bgColor} text-white`}>
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
                                  disabled={!userData || (userData.balance || 0) < (order.price * order.quantity)}
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
                      <div key={order.id} className="bg-gray-750 border border-gray-600 p-3 rounded-none">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs text-gray-400 font-mono tracking-wider">PREÇO:</span>
                              <span className="font-bold text-gray-200 font-mono">
                                {order.price.toFixed(2)} $
                              </span>
                            </div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs text-gray-400 font-mono tracking-wider">QTD:</span>
                              <span className="text-gray-200 font-mono">
                                {order.quantity.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs text-gray-400 font-mono tracking-wider">TOTAL:</span>
                              <span className="font-bold text-green-400 font-mono">
                                {(order.price * order.quantity).toFixed(2)} $
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-400 font-mono tracking-wider">VENDEDOR:</span>
                              <div className="text-gray-400 font-mono text-xs">
                                {order.userId.substring(0, 6)}...
                                {order.userId === user?.uid && (
                                  <span className={`ml-2 px-1 py-0.5 text-xs font-bold tracking-wider ${config.bgColor} text-white`}>
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
                            disabled={!userData || (userData.balance || 0) < (order.price * order.quantity)}
                          >
                            <ShoppingCart className="h-4 w-4" />
                            <span>COMPRAR POR {(order.price * order.quantity).toFixed(2)} $</span>
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
                  <p className="text-gray-500 font-mono tracking-wider mb-4 sm:mb-6 text-sm sm:text-base">
                    SEJA O PRIMEIRO A VENDER {config.resource}
                  </p>
                  <button
                    onClick={() => setShowOrderModal(true)}
                    className={`btn ${config.bgColor} text-white font-mono tracking-wider text-sm`}
                  >
                    CRIAR PRIMEIRA OFERTA
                  </button>
                </div>
              )}
            </div>

            {/* SUAS ORDENS DE VENDA */}
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
                              <div className="font-bold text-gray-200">{order.price.toFixed(2)} $</div>
                            </div>
                            <div>
                              <span className="text-gray-400 tracking-wider">QUANTIDADE:</span>
                              <div className="font-bold text-gray-200">{order.quantity}</div>
                            </div>
                            <div>
                              <span className="text-gray-400 tracking-wider">VALOR TOTAL:</span>
                              <div className="font-bold text-green-400">
                                {(order.price * order.quantity).toFixed(2)} $
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
                  <p className="text-gray-500 font-mono tracking-wider mb-4 sm:mb-6 text-sm sm:text-base">
                    VOCÊ NÃO TEM ORDENS DE VENDA PARA {config.resource}
                  </p>
                  <button
                    onClick={() => setShowOrderModal(true)}
                    className={`btn ${config.bgColor} text-white font-mono tracking-wider text-sm`}
                  >
                    CRIAR ORDEM DE VENDA
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MODAL DE NOVA ORDEM DE VENDA */}
        <OrderModal
          isOpen={showOrderModal}
          onClose={() => setShowOrderModal(false)}
          resource={config.resource}
        />
      </div>
    </ProtectedRoute>
  );
}