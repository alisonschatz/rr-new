// components/ResourceCard.js
'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { TrendingUp, Package, RefreshCw } from 'lucide-react';

const resourceConfig = {
  GOLD: { icon: '🏆', color: 'bg-yellow-100 border-yellow-300', name: 'Ouro' },
  OIL: { icon: '🛢️', color: 'bg-gray-100 border-gray-400', name: 'Petróleo' },
  ORE: { icon: '⛏️', color: 'bg-orange-100 border-orange-400', name: 'Minério' },
  DIA: { icon: '💎', color: 'bg-blue-100 border-blue-400', name: 'Diamante' },
  URA: { icon: '☢️', color: 'bg-green-100 border-green-400', name: 'Urânio' },
  CASH: { icon: '💵', color: 'bg-emerald-100 border-emerald-400', name: 'Dinheiro' }
};

export default function ResourceCard({ resource, userInventory }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [averagePrice, setAveragePrice] = useState(0);

  useEffect(() => {
    console.log('ResourceCard: Configurando listener para', resource);
    
    // Buscar ordens do recurso - SEM orderBy para evitar problemas de índice
    const q = query(
      collection(db, 'orders'),
      where('resource', '==', resource)
    );

    const unsubscribe = onSnapshot(
      q, 
      (snapshot) => {
        console.log(`ResourceCard ${resource}: Recebidas ${snapshot.docs.length} ordens`);
        
        const ordersList = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data
          };
        });
        
        setOrders(ordersList);
        
        // Calcular preço médio
        if (ordersList.length > 0) {
          const totalValue = ordersList.reduce((sum, order) => {
            const price = order.price || 0;
            const quantity = order.quantity || 0;
            return sum + (price * quantity);
          }, 0);
          
          const totalQuantity = ordersList.reduce((sum, order) => {
            return sum + (order.quantity || 0);
          }, 0);
          
          if (totalQuantity > 0) {
            setAveragePrice(totalValue / totalQuantity);
          } else {
            setAveragePrice(0);
          }
        } else {
          setAveragePrice(0);
        }
        
        setLoading(false);
      },
      (error) => {
        console.error(`Erro no ResourceCard ${resource}:`, error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [resource]);

  const config = resourceConfig[resource];
  const userQuantity = userInventory?.[resource] || 0;

  if (!config) {
    return (
      <div className="card border-2 border-red-300">
        <p className="text-red-600">Recurso {resource} não configurado</p>
      </div>
    );
  }

  return (
    <div className={`card border-2 ${config.color} hover:shadow-lg transition-shadow`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-3xl">{config.icon}</span>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{config.name}</h3>
            <p className="text-sm text-gray-600">{resource}</p>
          </div>
        </div>
        <TrendingUp className="h-5 w-5 text-gray-400" />
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Preço Médio:</span>
          <span className="font-bold text-lg">
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin inline" />
            ) : averagePrice > 0 ? (
              `${averagePrice.toFixed(2)} RRCOIN`
            ) : (
              'N/A'
            )}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 flex items-center">
            <Package className="h-4 w-4 mr-1" />
            Meu Inventário:
          </span>
          <span className="font-semibold text-blue-600">{userQuantity}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Ordens Ativas:</span>
          <span className="font-semibold">
            {loading ? '...' : orders.length}
          </span>
        </div>

        <div className="pt-3 border-t">
          <Link
            href={`/orderbook/${resource.toLowerCase()}`}
            className="w-full btn btn-primary text-center block"
          >
            Ver Orderbook
          </Link>
        </div>

        {/* Debug info em desenvolvimento */}
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
            Debug: {orders.length} ordens carregadas
          </div>
        )}
      </div>
    </div>
  );
}