// components/ResourceCard.js
'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { TrendingUp, Package } from 'lucide-react';

const resourceConfig = {
  GOLD: { 
    icon: '🏆', 
    name: 'GOLD',
    className: 'resource-gold',
    btnClass: 'btn-gold',
    textColor: 'text-yellow-600',
    activeColor: 'bg-yellow-600'
  },
  OIL: { 
    icon: '🛢️', 
    name: 'OIL',
    className: 'resource-oil',
    btnClass: 'btn-oil',
    textColor: 'text-gray-400',
    activeColor: 'bg-gray-500'
  },
  ORE: { 
    icon: '⛏️', 
    name: 'ORE',
    className: 'resource-ore',
    btnClass: 'btn-ore',
    textColor: 'text-orange-600',
    activeColor: 'bg-orange-600'
  },
  DIA: { 
    icon: '💎', 
    name: 'DIA',
    className: 'resource-dia',
    btnClass: 'btn-dia',
    textColor: 'text-blue-600',
    activeColor: 'bg-blue-600'
  },
  URA: { 
    icon: '☢️', 
    name: 'URA',
    className: 'resource-ura',
    btnClass: 'btn-ura',
    textColor: 'text-green-600',
    activeColor: 'bg-green-600'
  },
  CASH: { 
    icon: '💵', 
    name: 'CASH',
    className: 'resource-cash',
    btnClass: 'btn-cash',
    textColor: 'text-emerald-600',
    activeColor: 'bg-emerald-600'
  }
};

export default function ResourceCard({ resource, userInventory }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [averagePrice, setAveragePrice] = useState(0);

  useEffect(() => {
    console.log('🔄 ResourceCard: Configurando listener para', resource);
    
    const q = query(
      collection(db, 'orders'),
      where('resource', '==', resource)
    );

    const unsubscribe = onSnapshot(
      q, 
      (snapshot) => {
        console.log(`📊 ${resource}: ${snapshot.docs.length} ordens encontradas`);
        
        const ordersList = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            price: Number(data.price) || 0,
            quantity: Number(data.quantity) || 0,
            userId: data.userId || '',
            timestamp: data.timestamp || null
          };
        });
        
        setOrders(ordersList);
        
        // Calcular preço médio ponderado
        if (ordersList.length > 0) {
          const totalValue = ordersList.reduce((sum, order) => {
            return sum + (order.price * order.quantity);
          }, 0);
          
          const totalQuantity = ordersList.reduce((sum, order) => {
            return sum + order.quantity;
          }, 0);
          
          setAveragePrice(totalQuantity > 0 ? totalValue / totalQuantity : 0);
        } else {
          setAveragePrice(0);
        }
        
        setLoading(false);
      },
      (error) => {
        console.error(`❌ Erro no ResourceCard ${resource}:`, error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [resource]);

  const config = resourceConfig[resource];
  const userQuantity = userInventory?.[resource] || 0;

  if (!config) {
    return (
      <div className="card border-2 border-red-600">
        <div className="text-center">
          <p className="text-red-400 font-mono font-bold">ERRO</p>
          <p className="text-red-400 font-mono text-sm">RECURSO {resource} NÃO ENCONTRADO</p>
        </div>
      </div>
    );
  }

  const isMarketActive = orders.length > 0;

  return (
    <div className={`card-resource ${config.className} transition-all duration-200`}>
      {/* CABEÇALHO DO RECURSO */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-600">
        <div className="flex items-center space-x-4">
          <div className="text-4xl">{config.icon}</div>
          <div>
            <h3 className={`text-2xl font-bold font-mono tracking-wider ${config.textColor}`}>
              {config.name}
            </h3>
            <div className="flex items-center space-x-2 mt-1">
              {isMarketActive ? (
                <>
                  <div className={`w-2 h-2 ${config.activeColor}`}></div>
                  <span className={`text-xs font-mono tracking-wider ${config.textColor}`}>
                    MERCADO ATIVO
                  </span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-gray-500"></div>
                  <span className="text-xs font-mono tracking-wider text-gray-500">
                    SEM ATIVIDADE
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        <TrendingUp className={`h-6 w-6 ${config.textColor}`} />
      </div>

      {/* DADOS DO MERCADO */}
      <div className="space-y-4 mb-6">
        {/* PREÇO MÉDIO */}
        <div className="bg-gray-750 border border-gray-600 p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-mono tracking-wider text-gray-400">
              PREÇO MÉDIO:
            </span>
            <div className="text-right">
              {loading ? (
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-gray-500 animate-pulse"></div>
                  <div className="w-2 h-2 bg-gray-500 animate-pulse"></div>
                  <div className="w-2 h-2 bg-gray-500 animate-pulse"></div>
                </div>
              ) : averagePrice > 0 ? (
                <div className="font-mono">
                  <span className={`text-xl font-bold ${config.textColor}`}>
                    {averagePrice.toFixed(2)}
                  </span>
                  <span className="text-sm text-gray-400 ml-1">$</span>
                </div>
              ) : (
                <span className="text-gray-500 font-mono">-- $</span>
              )}
            </div>
          </div>
        </div>

        {/* INVENTÁRIO DO USUÁRIO */}
        <div className="bg-gray-750 border border-gray-600 p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-mono tracking-wider text-gray-400 flex items-center">
              <Package className="h-4 w-4 mr-2" />
              MEU INVENTÁRIO:
            </span>
            <div className={`text-xl font-bold font-mono ${
              userQuantity > 0 ? config.textColor : 'text-gray-500'
            }`}>
              {userQuantity.toLocaleString()}
            </div>
          </div>
        </div>

        {/* ESTATÍSTICAS DO MERCADO */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-750 border border-gray-600 p-3">
            <div className="text-center">
              <div className={`text-lg font-bold font-mono ${
                orders.length > 0 ? config.textColor : 'text-gray-500'
              }`}>
                {loading ? '...' : orders.length}
              </div>
              <div className="text-xs font-mono tracking-wider text-gray-400">
                ORDENS
              </div>
            </div>
          </div>
          
          <div className="bg-gray-750 border border-gray-600 p-3">
            <div className="text-center">
              <div className={`text-lg font-bold font-mono ${
                orders.reduce((sum, order) => sum + order.quantity, 0) > 0 ? config.textColor : 'text-gray-500'
              }`}>
                {loading ? '...' : orders.reduce((sum, order) => sum + order.quantity, 0).toLocaleString()}
              </div>
              <div className="text-xs font-mono tracking-wider text-gray-400">
                VOLUME
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BOTÃO ORDERBOOK */}
      <div className="border-t border-gray-600 pt-4">
        <Link
          href={`/orderbook/${resource.toLowerCase()}`}
          className={`w-full btn ${config.btnClass} text-center block font-mono font-bold tracking-wider transition-all duration-200 hover:transform hover:-translate-y-0.5`}
        >
          ACESSAR ORDERBOOK
        </Link>
      </div>

      {/* DEBUG (apenas em desenvolvimento) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-2 bg-gray-900 border border-gray-700">
          <div className="text-xs text-gray-500 font-mono">
            <div>DEBUG: {orders.length} ordens carregadas</div>
            <div>PREÇO: {averagePrice.toFixed(2)}</div>
            <div>VOLUME: {orders.reduce((sum, order) => sum + order.quantity, 0)}</div>
          </div>
        </div>
      )}
    </div>
  );
}