// app/dashboard/page.js
'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import ResourceCard from '@/components/ResourceCard';
import { TrendingUp, Wallet, BarChart3 } from 'lucide-react';

const RESOURCES = ['GOLD', 'OIL', 'ORE', 'DIA', 'URA', 'CASH'];

export default function Dashboard() {
  const { user, userData } = useAuth();
  const [userOrders, setUserOrders] = useState([]);

  // Listener para ordens do usuário
  useEffect(() => {
    if (!user) return;

    const ordersQuery = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      const ordersList = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          resource: data.resource || '',
          price: Number(data.price) || 0,
          quantity: Number(data.quantity) || 0,
          timestamp: data.timestamp || null
        };
      });
      setUserOrders(ordersList);
    });

    return () => unsubscribe();
  }, [user]);

  // Calcular estatísticas
  const totalInvested = userOrders.reduce((sum, order) => sum + (order.price * order.quantity), 0);

  if (!userData) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex items-center space-x-4 font-mono text-gray-400">
            <div className="w-4 h-1 bg-gray-600 animate-pulse"></div>
            <div className="w-4 h-1 bg-gray-600 animate-pulse"></div>
            <div className="w-4 h-1 bg-gray-600 animate-pulse"></div>
            <span className="tracking-wider">CARREGANDO...</span>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen">
        <Navbar />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          
          {/* MERCADO DE RECURSOS - FOCO PRINCIPAL */}
          <div className="card mb-8">
            <div className="text-center mb-8">
              <h2 className="text-5xl font-bold text-gray-200 font-mono tracking-wider mb-3">
                MERCADO DE RECURSOS
              </h2>
              <p className="text-xl text-gray-400 font-mono tracking-wider mb-2">
                ESCOLHA UM RECURSO PARA NEGOCIAR
              </p>
              <div className="flex items-center justify-center gap-2 text-gray-500">
                <BarChart3 className="h-5 w-5" />
                <span className="font-mono text-sm tracking-wider">
                  {RESOURCES.length} RECURSOS DISPONÍVEIS
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {RESOURCES.map(resource => (
                <ResourceCard
                  key={resource}
                  resource={resource}
                  userInventory={userData.inventory || {}}
                />
              ))}
            </div>
          </div>

          {/* SUAS ORDENS ATIVAS */}
          {userOrders.length > 0 && (
            <div className="bg-gray-750 border border-gray-600 p-6">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-600">
                <h3 className="text-lg font-bold text-gray-300 font-mono tracking-wider">
                  SUAS ORDENS ATIVAS
                </h3>
                <span className="text-sm text-gray-500 font-mono">
                  {userOrders.length} ORDEM{userOrders.length !== 1 ? 'S' : ''}
                </span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-600">
                      <th className="px-4 py-2 text-left text-xs font-bold text-gray-400 uppercase tracking-wider font-mono">
                        RECURSO
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-bold text-gray-400 uppercase tracking-wider font-mono">
                        QTD
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-bold text-gray-400 uppercase tracking-wider font-mono">
                        PREÇO
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-bold text-gray-400 uppercase tracking-wider font-mono">
                        TOTAL
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-bold text-gray-400 uppercase tracking-wider font-mono">
                        DATA
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {userOrders.slice(0, 5).map(order => (
                      <tr key={order.id} className="hover:bg-gray-700 transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-bold text-gray-200 font-mono">
                            {order.resource}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-gray-300 font-mono">
                            {order.quantity.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-gray-300 font-mono">
                            {order.price.toLocaleString()} $
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-green-400 font-mono">
                            {(order.price * order.quantity).toLocaleString()} $
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-gray-400 font-mono text-sm">
                            {order.timestamp?.seconds
                              ? new Date(order.timestamp.seconds * 1000).toLocaleDateString('pt-BR')
                              : 'N/A'
                            }
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {userOrders.length > 5 && (
                <div className="mt-4 text-center">
                  <span className="text-sm text-gray-500 font-mono">
                    E MAIS {userOrders.length - 5} ORDEM{userOrders.length - 5 !== 1 ? 'S' : ''}...
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ESTADO SEM ORDENS */}
          {userOrders.length === 0 && (
            <div className="bg-gray-750 border border-gray-600 p-8 text-center">
              <TrendingUp className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-400 font-mono tracking-wider mb-2">
                NENHUMA ORDEM ATIVA
              </h3>
              <p className="text-gray-500 font-mono text-sm tracking-wider">
                CLIQUE EM QUALQUER RECURSO ACIMA PARA COMEÇAR A NEGOCIAR
              </p>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}