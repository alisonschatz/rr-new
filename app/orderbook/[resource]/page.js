// app/orderbook/[resource]/page.js
'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, deleteDoc, updateDoc, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import OrderModal from '@/components/OrderModal';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, Trash2, TrendingUp, RefreshCw, AlertCircle } from 'lucide-react';
import Link from 'next/link';

const resourceConfig = {
  gold: { name: 'Ouro', icon: '🏆', resource: 'GOLD' },
  oil: { name: 'Petróleo', icon: '🛢️', resource: 'OIL' },
  ore: { name: 'Minério', icon: '⛏️', resource: 'ORE' },
  dia: { name: 'Diamante', icon: '💎', resource: 'DIA' },
  ura: { name: 'Urânio', icon: '☢️', resource: 'URA' },
  cash: { name: 'Dinheiro', icon: '💵', resource: 'CASH' }
};

export default function OrderbookPage({ params }) {
  const { user, userData } = useAuth();
  const [orders, setOrders] = useState([]);
  const [userOrders, setUserOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [debugInfo, setDebugInfo] = useState({
    totalOrders: 0,
    userOrdersCount: 0,
    errors: [],
    lastUpdate: null
  });

  const resourceKey = params.resource;
  const config = resourceConfig[resourceKey];

  // Função para buscar dados manualmente (para debug)
  const fetchOrdersManually = async () => {
    if (!config) return;
    
    try {
      console.log('🔍 Buscando ordens manualmente para:', config.resource);
      
      const q = query(
        collection(db, 'orders'),
        where('resource', '==', config.resource)
      );
      
      const snapshot = await getDocs(q);
      console.log('📊 Snapshot manual recebido:', snapshot.size, 'documentos');
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        console.log('📄 Ordem encontrada:', {
          id: doc.id,
          resource: data.resource,
          price: data.price,
          quantity: data.quantity,
          userId: data.userId,
          timestamp: data.timestamp
        });
      });
      
      return snapshot.size;
    } catch (error) {
      console.error('❌ Erro na busca manual:', error);
      return 0;
    }
  };

  if (!config) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">Recurso não encontrado</h1>
              <p className="text-red-600">Recurso: {resourceKey}</p>
              <p className="text-gray-600">Recursos válidos: gold, oil, ore, dia, ura, cash</p>
              <Link href="/dashboard" className="btn btn-primary mt-4">
                Voltar ao Dashboard
              </Link>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  useEffect(() => {
    console.log('🚀 Inicializando orderbook para:', config.resource);
    console.log('👤 Usuário logado:', user?.uid);
    
    let unsubscribeAll = () => {};
    let unsubscribeUser = () => {};
    
    // Buscar TODAS as ordens do recurso
    try {
      const allOrdersQuery = query(
        collection(db, 'orders'),
        where('resource', '==', config.resource)
      );

      console.log('📡 Configurando listener para todas as ordens...');
      
      unsubscribeAll = onSnapshot(
        allOrdersQuery,
        (snapshot) => {
          console.log('📦 Snapshot recebido - Total de docs:', snapshot.size);
          
          const ordersList = [];
          const errors = [];
          
          snapshot.forEach((doc) => {
            try {
              const data = doc.data();
              console.log('📄 Processando ordem:', doc.id, data);
              
              // Validar dados da ordem
              if (!data.resource || !data.price || !data.quantity || !data.userId) {
                console.warn('⚠️ Ordem com dados incompletos:', doc.id, data);
                errors.push(`Ordem ${doc.id} tem dados incompletos`);
                return;
              }
              
              ordersList.push({
                id: doc.id,
                resource: data.resource,
                price: Number(data.price) || 0,
                quantity: Number(data.quantity) || 0,
                userId: data.userId,
                timestamp: data.timestamp
              });
            } catch (err) {
              console.error('❌ Erro ao processar ordem:', doc.id, err);
              errors.push(`Erro na ordem ${doc.id}: ${err.message}`);
            }
          });

          // Ordenar por preço (maior primeiro)
          ordersList.sort((a, b) => b.price - a.price);
          
          console.log('✅ Ordens processadas:', ordersList.length);
          console.log('📊 Lista de ordens:', ordersList);
          
          setOrders(ordersList);
          setDebugInfo(prev => ({
            ...prev,
            totalOrders: ordersList.length,
            errors: errors,
            lastUpdate: new Date().toLocaleTimeString()
          }));
          
          setLoading(false);
        },
        (error) => {
          console.error('❌ Erro no listener de ordens:', error);
          setDebugInfo(prev => ({
            ...prev,
            errors: [...prev.errors, `Erro no listener: ${error.message}`]
          }));
          setLoading(false);
          toast.error('Erro ao carregar orderbook: ' + error.message);
        }
      );

      // Buscar ordens do usuário logado
      if (user) {
        console.log('👤 Configurando listener para ordens do usuário...');
        
        const userOrdersQuery = query(
          collection(db, 'orders'),
          where('resource', '==', config.resource),
          where('userId', '==', user.uid)
        );

        unsubscribeUser = onSnapshot(
          userOrdersQuery,
          (snapshot) => {
            console.log('👤 Ordens do usuário recebidas:', snapshot.size);
            
            const userOrdersList = [];
            
            snapshot.forEach((doc) => {
              const data = doc.data();
              console.log('👤 Ordem do usuário:', doc.id, data);
              
              userOrdersList.push({
                id: doc.id,
                ...data,
                price: Number(data.price) || 0,
                quantity: Number(data.quantity) || 0
              });
            });

            // Ordenar por timestamp (mais recente primeiro)
            userOrdersList.sort((a, b) => {
              const timeA = a.timestamp?.seconds || 0;
              const timeB = b.timestamp?.seconds || 0;
              return timeB - timeA;
            });
            
            console.log('✅ Suas ordens processadas:', userOrdersList.length);
            setUserOrders(userOrdersList);
            setDebugInfo(prev => ({
              ...prev,
              userOrdersCount: userOrdersList.length
            }));
          },
          (error) => {
            console.error('❌ Erro no listener de ordens do usuário:', error);
            toast.error('Erro ao carregar suas ordens: ' + error.message);
          }
        );
      }
    } catch (error) {
      console.error('❌ Erro ao configurar listeners:', error);
      setLoading(false);
      toast.error('Erro ao configurar listeners: ' + error.message);
    }

    // Busca manual inicial para debug
    fetchOrdersManually();

    return () => {
      console.log('🧹 Limpando listeners...');
      unsubscribeAll();
      unsubscribeUser();
    };
  }, [config.resource, user]);

  const handleCancelOrder = async (orderId, price, quantity) => {
    if (!user || !userData) {
      toast.error('Usuário não autenticado');
      return;
    }

    try {
      console.log('🗑️ Cancelando ordem:', orderId);
      
      // Deletar a ordem
      await deleteDoc(doc(db, 'orders', orderId));

      // Devolver o saldo ao usuário
      const refundAmount = price * quantity;
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        balance: userData.balance + refundAmount
      });

      toast.success(`Ordem cancelada! ${refundAmount.toFixed(2)} RRCOIN devolvidos`);
    } catch (error) {
      console.error('❌ Erro ao cancelar ordem:', error);
      toast.error('Erro ao cancelar ordem: ' + error.message);
    }
  };

  const handleRefresh = () => {
    console.log('🔄 Refresh manual solicitado');
    setLoading(true);
    fetchOrdersManually();
    setTimeout(() => setLoading(false), 2000);
  };

  // Calcular estatísticas
  const stats = {
    averagePrice: 0,
    highestPrice: 0,
    lowestPrice: 0,
    totalVolume: 0
  };

  if (orders.length > 0) {
    const prices = orders.map(order => order.price);
    const totalValue = orders.reduce((sum, order) => sum + (order.price * order.quantity), 0);
    const totalQty = orders.reduce((sum, order) => sum + order.quantity, 0);

    stats.averagePrice = totalQty > 0 ? totalValue / totalQty : 0;
    stats.highestPrice = Math.max(...prices);
    stats.lowestPrice = Math.min(...prices.filter(p => p > 0));
    stats.totalVolume = totalQty;
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="btn btn-secondary">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Link>
              <div className="flex items-center space-x-3">
                <span className="text-4xl">{config.icon}</span>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{config.name}</h1>
                  <p className="text-gray-600">Orderbook - {config.resource}</p>
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleRefresh}
                className="btn btn-secondary flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Atualizar</span>
              </button>
              <button
                onClick={() => setShowOrderModal(true)}
                className="btn btn-primary flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Nova Ordem</span>
              </button>
            </div>
          </div>

          {/* Debug Panel */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2 mb-2">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              <h3 className="font-bold text-blue-800">Status do Sistema</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">Total de Ordens:</span>
                <span className="ml-2 text-blue-700 font-bold">{debugInfo.totalOrders}</span>
              </div>
              <div>
                <span className="font-medium">Suas Ordens:</span>
                <span className="ml-2 text-blue-700 font-bold">{debugInfo.userOrdersCount}</span>
              </div>
              <div>
                <span className="font-medium">Usuário:</span>
                <span className="ml-2 text-blue-700 font-mono text-xs">
                  {user?.uid ? user.uid.substring(0, 8) + '...' : 'N/A'}
                </span>
              </div>
              <div>
                <span className="font-medium">Última Atualização:</span>
                <span className="ml-2 text-blue-700">{debugInfo.lastUpdate || 'N/A'}</span>
              </div>
            </div>
            {debugInfo.errors.length > 0 && (
              <div className="mt-2">
                <span className="font-medium text-red-600">Erros:</span>
                <ul className="list-disc list-inside text-red-600 text-xs">
                  {debugInfo.errors.map((error, idx) => (
                    <li key={idx}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Preço Médio</p>
                  <p className="text-xl font-bold text-gray-900">
                    {stats.averagePrice.toFixed(2)} RRCOIN
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Maior Preço</p>
                  <p className="text-xl font-bold text-green-600">
                    {stats.highestPrice.toFixed(2)} RRCOIN
                  </p>
                </div>
                <div className="text-2xl text-green-600">📈</div>
              </div>
            </div>
            
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Menor Preço</p>
                  <p className="text-xl font-bold text-red-600">
                    {(stats.lowestPrice || 0).toFixed(2)} RRCOIN
                  </p>
                </div>
                <div className="text-2xl text-red-600">📉</div>
              </div>
            </div>
            
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Volume Total</p>
                  <p className="text-xl font-bold text-gray-900">{stats.totalVolume}</p>
                </div>
                <div className="text-2xl">📊</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Orderbook - Todas as Ordens */}
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Orderbook ({orders.length} ordens)
              </h2>
              
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2">Carregando ordens...</span>
                </div>
              ) : orders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Preço
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Quantidade
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Total
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Trader
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {orders.map(order => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {order.price.toFixed(2)} RRCOIN
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {order.quantity}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {(order.price * order.quantity).toFixed(2)} RRCOIN
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500 font-mono">
                            {order.userId.substring(0, 8)}...
                            {order.userId === user?.uid && (
                              <span className="ml-2 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                                Você
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">Nenhuma ordem encontrada para {config.resource}</p>
                  <button
                    onClick={() => setShowOrderModal(true)}
                    className="btn btn-primary"
                  >
                    Criar primeira ordem
                  </button>
                </div>
              )}
            </div>

            {/* Minhas Ordens */}
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Minhas Ordens ({userOrders.length})
              </h2>
              
              {userOrders.length > 0 ? (
                <div className="space-y-3">
                  {userOrders.map(order => (
                    <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">Preço:</span>
                            <span>{order.price.toFixed(2)} RRCOIN</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">Quantidade:</span>
                            <span>{order.quantity}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">Total:</span>
                            <span className="font-semibold">
                              {(order.price * order.quantity).toFixed(2)} RRCOIN
                            </span>
                          </div>
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>Data:</span>
                            <span>
                              {order.timestamp?.seconds 
                                ? new Date(order.timestamp.seconds * 1000).toLocaleDateString()
                                : 'Data não disponível'
                              }
                            </span>
                          </div>
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>ID:</span>
                            <span className="font-mono">{order.id}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleCancelOrder(order.id, order.price, order.quantity)}
                          className="ml-3 btn-danger btn text-xs flex items-center space-x-1"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>Cancelar</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">Você não tem ordens ativas para {config.resource}</p>
                  <button
                    onClick={() => setShowOrderModal(true)}
                    className="btn btn-primary"
                  >
                    Criar primeira ordem
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal de Nova Ordem */}
        <OrderModal
          isOpen={showOrderModal}
          onClose={() => setShowOrderModal(false)}
          resource={config.resource}
        />
      </div>
    </ProtectedRoute>
  );
}