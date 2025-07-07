// app/dashboard/page.js
'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import ResourceCard from '@/components/ResourceCard';

const RESOURCES = ['GOLD', 'OIL', 'ORE', 'DIA', 'URA', 'CASH'];

export default function Dashboard() {
  const { user, userData } = useAuth();
  const [userOrders, setUserOrders] = useState([]);

  // Listener para ordens do usuário (mantido para estatísticas internas se necessário)
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
          
          {/* RECURSOS DISPONÍVEIS - FOCO PRINCIPAL */}
          <div className="card mb-8">
            <div className="text-center mb-8">
              <p className="text-sm text-gray-500 font-mono tracking-wider">
                ESCOLHA UM RECURSO PARA NEGOCIAR
              </p>
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
        </div>
      </div>
    </ProtectedRoute>
  );
}