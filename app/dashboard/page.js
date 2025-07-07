// app/dashboard/page.js
'use client';

import { useState, useEffect } from 'react';
import { doc, updateDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import ResourceCard from '@/components/ResourceCard';
import toast from 'react-hot-toast';
import { Plus, Wallet, TrendingUp } from 'lucide-react';

const RESOURCES = ['GOLD', 'OIL', 'ORE', 'DIA', 'URA', 'CASH'];

export default function Dashboard() {
  const { user, userData } = useAuth();
  const [userOrders, setUserOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Buscar ordens do usuário em tempo real
    const q = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUserOrders(ordersList);
    });

    return () => unsubscribe();
  }, [user]);

  const handleDeposit = async () => {
    if (!user || !userData) return;

    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      const newBalance = (userData.balance || 0) + 1000;

      await updateDoc(userRef, {
        balance: newBalance
      });

      toast.success('1000 RRCOIN depositados com sucesso!');
    } catch (error) {
      console.error('Erro no depósito:', error);
      toast.error('Erro ao realizar depósito');
    } finally {
      setLoading(false);
    }
  };

  if (!userData) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header com saldo e depósito */}
          <div className="mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Bem-vindo, {userData.name}!
                  </h1>
                  <div className="flex items-center space-x-2">
                    <Wallet className="h-5 w-5 text-green-600" />
                    <span className="text-xl font-semibold text-green-600">
                      {userData.balance?.toLocaleString()} RRCOIN
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleDeposit}
                  disabled={loading}
                  className="btn btn-success flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>{loading ? 'Depositando...' : 'Depositar 1000 RRCOIN'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Estatísticas rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ordens Ativas</p>
                  <p className="text-2xl font-bold text-gray-900">{userOrders.length}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Investido</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {userOrders.reduce((sum, order) => sum + (order.price * order.quantity), 0).toLocaleString()}
                  </p>
                </div>
                <Wallet className="h-8 w-8 text-green-600" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Recursos Únicos</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Object.values(userData.inventory || {}).filter(qty => qty > 0).length}
                  </p>
                </div>
                <div className="text-2xl">📦</div>
              </div>
            </div>
          </div>

          {/* Grid de recursos */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Recursos Disponíveis</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {RESOURCES.map(resource => (
                <ResourceCard
                  key={resource}
                  resource={resource}
                  userInventory={userData.inventory}
                />
              ))}
            </div>
          </div>

          {/* Minhas ordens ativas */}
          {userOrders.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Minhas Ordens Ativas</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Recurso
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantidade
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Preço
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {userOrders.map(order => (
                      <tr key={order.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {order.resource}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.price.toLocaleString()} RRCOIN
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {(order.price * order.quantity).toLocaleString()} RRCOIN
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(order.timestamp?.seconds * 1000).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}