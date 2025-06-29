"use client"

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import {auth} from "@/firebase/client"

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({children}: {
  children: React.ReactNode
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email:string, password:string) => {
    await signInWithEmailAndPassword(auth, email, password);
  }

  const signup = async (email: string, password:string) => {
    await createUserWithEmailAndPassword(auth, email, password);
  }

  const logout = async () => {
    await signOut(auth);
  }

  return (
    <AuthContext.Provider value={{user, loading, login, signup, logout}}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext);
