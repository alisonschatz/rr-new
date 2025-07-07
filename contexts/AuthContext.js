// contexts/AuthContext.js - VERSÃO ATUALIZADA
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeUserData = () => {};

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        
        // Configurar listener para dados do usuário em tempo real
        const userDocRef = doc(db, 'users', user.uid);
        unsubscribeUserData = onSnapshot(
          userDocRef,
          (doc) => {
            if (doc.exists()) {
              const data = doc.data();
              console.log('🔄 Dados do usuário atualizados:', data);
              setUserData(data);
            } else {
              console.log('❌ Documento do usuário não encontrado');
              setUserData(null);
            }
            setLoading(false);
          },
          (error) => {
            console.error('❌ Erro no listener dos dados do usuário:', error);
            setLoading(false);
          }
        );
      } else {
        setUser(null);
        setUserData(null);
        setLoading(false);
        // Limpar listener se o usuário fez logout
        unsubscribeUserData();
      }
    });

    return () => {
      unsubscribe();
      unsubscribeUserData();
    };
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserData(null);
    } catch (error) {
      console.error('Erro no logout:', error);
    }
  };

  const value = {
    user,
    userData,
    loading,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};