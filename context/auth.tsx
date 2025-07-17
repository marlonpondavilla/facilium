"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
	onAuthStateChanged,
	User,
	signInWithEmailAndPassword,
	createUserWithEmailAndPassword,
	signOut,
	ParsedToken,
} from "firebase/auth";
import { auth } from "@/firebase/client";
import { removeToken, setToken } from "./actions";
import { useRouter } from "next/navigation";

type AuthContextType = {
	user: User | null;
	loading: boolean;
	login: (email: string, password: string) => Promise<void>;
	signup: (email: string, password: string) => Promise<void>;
	logout: () => Promise<void>;
	customClaims: ParsedToken | null;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);
	const [customClaims, setCustomClaims] = useState<ParsedToken | null>(null);
	const router = useRouter();

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
			setUser(firebaseUser);
			setLoading(false);

			if (firebaseUser) {
				const tokenResult = await firebaseUser?.getIdTokenResult(true);
				const token = tokenResult?.token;
				const refreshToken = firebaseUser.refreshToken;
				const claims = tokenResult.claims;

				setCustomClaims(claims ?? null);

				if (token && refreshToken) {
					setToken({
						token,
						refreshToken,
					});
				}
			} else {
				await removeToken();
			}
		});

		return () => unsubscribe();
	}, []);

	const login = async (email: string, password: string) => {
		await signInWithEmailAndPassword(auth, email, password);

		await new Promise<void>((resolve, reject) => {
			const unsubscribe = onAuthStateChanged(
				auth,
				async (firebaseUser) => {
					if (firebaseUser) {
						try {
							const tokenResult = await firebaseUser.getIdTokenResult(true);
							const token = tokenResult.token;
							const refreshToken = firebaseUser.refreshToken;
							const claims = tokenResult.claims;

							if (token && refreshToken) {
								await setToken({ token, refreshToken });
								setCustomClaims(claims ?? null);
							}

							unsubscribe();
							resolve();
						} catch (error) {
							reject(error);
						}
					}
				},
				reject
			);
		});
	};

	const signup = async (email: string, password: string) => {
		await createUserWithEmailAndPassword(auth, email, password);
	};

	const logout = async () => {
		await signOut(auth);
		await removeToken();
		router.push("/login");
	};

	return (
		<AuthContext.Provider
			value={{ user, loading, customClaims, login, signup, logout }}
		>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth = () => useContext(AuthContext);
