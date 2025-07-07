// components/ResourceCard.js
'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { TrendingUp, ShoppingCart, Store } from 'lucide-react';

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
  const [marketStats, setMarketStats] = useState({
    averagePrice: 0,
    lowestPrice: 0,
    highestPrice: 0,
    totalVolume: 0,
    totalOrders: 0
  });

  useEffect(() => {
    console.log('🔄 ResourceCard: Configurando listener para', resource);
    
    const q = query(
      collection(db, 'orders'),
      where('resource', '==', resource)
    );

    const unsubscribe = onSnapshot(
      q, 
      (snapshot) => {
        console.log(`📊 ${resource}: ${snapshot.docs.length} ordens de venda encontradas`);
        
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
        
        // Calcular estatísticas do mercado
        if (ordersList.length > 0) {
          const prices = ordersList.map(order => order.price).filter(p => p > 0);
          const totalValue = ordersList.reduce((sum, order) => {
            return sum + (order.price * order.quantity);
          }, 0);
          
          const totalQuantity = ordersList.reduce((sum, order) => {
            return sum + order.quantity;
          }, 0);
          
          setMarketStats({
            averagePrice: totalQuantity > 0 ? totalValue / totalQuantity : 0,
            lowestPrice: prices.length > 0 ? Math.min(...prices) : 0,
            highestPrice: prices.length > 0 ? Math.max(...prices) : 0,
            totalVolume: totalQuantity,
            totalOrders: ordersList.length
          });
        } else {
          setMarketStats({
            averagePrice: 0,
            lowestPrice: 0,
            highestPrice: 0,
            totalVolume: 0,
            totalOrders: 0
          });
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
  const bestPrice = marketStats.lowestPrice > 0 ? marketStats.lowestPrice : 0;

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
                    MARKETPLACE ATIVO
                  </span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-gray-500"></div>
                  <span className="text-xs font-mono tracking-wider text-gray-500">
                    SEM OFERTAS
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        <Store className={`h-6 w-6 ${config.textColor}`} />
      </div>

      {/* MELHOR OFERTA DISPONÍVEL */}
      <div className="mb-6">
        <div className="bg-gray-750 border border-gray-600 p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-mono tracking-wider text-gray-400">
              MELHOR PREÇO:
            </span>
            <div className="text-right">
              {loading ? (
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-gray-500 animate-pulse"></div>
                  <div className="w-2 h-2 bg-gray-500 animate-pulse"></div>
                  <div className="w-2 h-2 bg-gray-500 animate-pulse"></div>
                </div>
              ) : bestPrice > 0 ? (
                <div className="font-mono">
                  <span className="text-xl font-bold text-green-400">
                    {bestPrice.toFixed(2)}
                  </span>
                  <span className="text-sm text-gray-400 ml-1">$ / unidade</span>
                </div>
              ) : (
                <span className="text-gray-500 font-mono">-- $</span>
              )}
            </div>
          </div>
          {bestPrice > 0 && (
            <div className="flex items-center justify-center space-x-2 mt-2 p-2 bg-green-900 border border-green-600">
              <ShoppingCart className="h-4 w-4 text-green-400" />
              <span className="text-xs text-green-200 font-mono tracking-wider">
                DISPONÍVEL PARA COMPRA
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ESTATÍSTICAS DO MARKETPLACE */}
      <div className="space-y-4 mb-6">
        {/* PREÇO MÉDIO */}
        <div className="bg-gray-750 border border-gray-600 p-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-mono tracking-wider text-gray-400">
              PREÇO MÉDIO:
            </span>
            <div className={`text-lg font-bold font-mono ${
              marketStats.averagePrice > 0 ? config.textColor : 'text-gray-500'
            }`}>
              {marketStats.averagePrice > 0 ? marketStats.averagePrice.toFixed(2) + ' $' : '-- $'}
            </div>
          </div>
        </div>

        {/* RANGE DE PREÇOS */}
        {marketStats.totalOrders > 1 && (
          <div className="bg-gray-750 border border-gray-600 p-3">
            <div className="text-xs font-mono tracking-wider text-gray-400 mb-2 text-center">
              FAIXA DE PREÇOS
            </div>
            <div className="flex justify-between text-xs font-mono">
              <div className="text-center">
                <div className="text-green-400 font-bold">{marketStats.lowestPrice.toFixed(2)} $</div>
                <div className="text-gray-500">MENOR</div>
              </div>
              <div className="text-center">
                <div className="text-red-400 font-bold">{marketStats.highestPrice.toFixed(2)} $</div>
                <div className="text-gray-500">MAIOR</div>
              </div>
            </div>
          </div>
        )}

        {/* ESTATÍSTICAS DE VOLUME */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-750 border border-gray-600 p-3">
            <div className="text-center">
              <div className={`text-lg font-bold font-mono ${
                marketStats.totalOrders > 0 ? config.textColor : 'text-gray-500'
              }`}>
                {loading ? '...' : marketStats.totalOrders}
              </div>
              <div className="text-xs font-mono tracking-wider text-gray-400">
                OFERTAS
              </div>
            </div>
          </div>
          
          <div className="bg-gray-750 border border-gray-600 p-3">
            <div className="text-center">
              <div className={`text-lg font-bold font-mono ${
                marketStats.totalVolume > 0 ? config.textColor : 'text-gray-500'
              }`}>
                {loading ? '...' : marketStats.totalVolume.toLocaleString()}
              </div>
              <div className="text-xs font-mono tracking-wider text-gray-400">
                ESTOQUE
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AÇÕES RÁPIDAS */}
      <div className="space-y-3 mb-6">
        {/* Mostrar oportunidade de compra se houver ofertas */}
        {bestPrice > 0 && (
          <div className="bg-green-900 border border-green-600 p-3 text-center">
            <div className="text-xs text-green-200 font-mono tracking-wider mb-1">
              OPORTUNIDADE DE COMPRA
            </div>
            <div className="text-green-100 font-mono font-bold">
              A partir de {bestPrice.toFixed(2)} $ / unidade
            </div>
          </div>
        )}

        {/* Incentivo para vender */}
        {marketStats.totalOrders === 0 && (
          <div className="bg-blue-900 border border-blue-600 p-3 text-center">
            <div className="text-xs text-blue-200 font-mono tracking-wider mb-1">
              SEJA O PRIMEIRO
            </div>
            <div className="text-blue-100 font-mono font-bold">
              Defina o preço do mercado!
            </div>
          </div>
        )}
      </div>

      {/* BOTÃO MARKETPLACE */}
      <div className="border-t border-gray-600 pt-4">
        <Link
          href={`/orderbook/${resource.toLowerCase()}`}
          className={`w-full btn ${config.btnClass} text-center block font-mono font-bold tracking-wider transition-all duration-200 hover:transform hover:-translate-y-0.5`}
        >
          {isMarketActive ? 'ENTRAR NO MARKETPLACE' : 'CRIAR PRIMEIRA OFERTA'}
        </Link>
      </div>

      {/* RESUMO RÁPIDO */}
      <div className="mt-4 p-3 bg-gray-900 border border-gray-700">
        <div className="text-xs text-gray-400 font-mono text-center">
          {isMarketActive ? (
            <div>
              {marketStats.totalOrders} oferta{marketStats.totalOrders !== 1 ? 's' : ''} • 
              Volume: {marketStats.totalVolume.toLocaleString()} • 
              Média: {marketStats.averagePrice.toFixed(2)} $
            </div>
          ) : (
            <div>Marketplace vazio - Seja o primeiro vendedor!</div>
          )}
        </div>
      </div>

      {/* DEBUG (apenas em desenvolvimento) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-2 bg-gray-900 border border-gray-700">
          <div className="text-xs text-gray-500 font-mono">
            <div>DEBUG: {orders.length} ordens de venda</div>
            <div>MELHOR: {bestPrice.toFixed(2)} $ | MÉDIO: {marketStats.averagePrice.toFixed(2)} $</div>
            <div>VOLUME: {marketStats.totalVolume} | RANGE: {marketStats.lowestPrice.toFixed(2)}-{marketStats.highestPrice.toFixed(2)} $</div>
          </div>
        </div>
      )}
    </div>
  );
}