"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
	onAuthStateChanged,
	User,
	signInWithEmailAndPassword,
	createUserWithEmailAndPassword,
	signOut,
	sendEmailVerification,
	ParsedToken,
	updateProfile,
} from "firebase/auth";
import { auth } from "@/firebase/client";
import { removeToken, setToken } from "./actions";
import { useRouter } from "next/navigation";
import { addDocumentToFirestore } from "@/data/actions";

type SignupFormData = {
	firstName: string;
	middleName: string;
	lastName: string;
	degreeEarned: string;
	email: string;
	password: string;
	confirmPassword: string;
};

type AuthContextType = {
	user: User | null;
	loading: boolean;
	emailVerified: boolean;
	login: (email: string, password: string) => Promise<void>;
	signup: (formData: SignupFormData) => Promise<void>;
	logout: () => Promise<void>;
	customClaims: ParsedToken | null;
	loggingOut: boolean;
	refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);
	const [customClaims, setCustomClaims] = useState<ParsedToken | null>(null);
	const [loggingOut, setLoggingOut] = useState(false);
	const router = useRouter();

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
			if (firebaseUser && !firebaseUser.emailVerified) {
				await signOut(auth);
				setUser(null);
				setLoading(false);
				return;
			}

			if (firebaseUser) {
				setUser(firebaseUser);

				const tokenResult = await firebaseUser.getIdTokenResult(true);
				const token = tokenResult.token;
				const refreshToken = firebaseUser.refreshToken;

				if (token && refreshToken) {
					await setToken({ token, refreshToken });

					const refreshedTokenResult = await firebaseUser.getIdTokenResult(
						true
					);
					setCustomClaims(refreshedTokenResult.claims ?? null);
				}
			} else {
				setUser(null);
				await removeToken();
			}

			setLoading(false);
		});

		return () => unsubscribe();
	}, []);

	const login = async (email: string, password: string) => {
		const result = await signInWithEmailAndPassword(auth, email, password);

		const user = result.user;

		// reject if not verified
		if (!user.emailVerified) {
			await signOut(auth); // Optional but keeps things clean
			throw new Error("Please verify your email before logging in.");
		}

		// token handling
		const tokenResult = await user.getIdTokenResult(true);
		const token = tokenResult.token;
		const refreshToken = user.refreshToken;

		if (token && refreshToken) {
			await setToken({ token, refreshToken });

			const refreshedTokenResult = await user.getIdTokenResult(true);
			setCustomClaims(refreshedTokenResult.claims ?? null);
		}
	};

	const signup = async (formData: SignupFormData) => {
		const { email, password, confirmPassword, ...profileData } = formData;

		const result = await createUserWithEmailAndPassword(auth, email, password);
		const user = result.user;

		await updateProfile(user, {
			displayName: `${formData.firstName} ${formData.lastName}`,
		});

		// save data to firestore
		await addDocumentToFirestore("userData", {
			uid: user.uid,
			email: email,
			designation: "Faculty",
			status: "Enabled",
			...profileData,
			created: new Date().toISOString(),
		});

		// sendEmailVerification function
		await sendEmailVerification(user, {
			url: `${window.location.origin}/login`,
		});

		router.push("/verify-email");
	};

	const logout = async () => {
		if (loggingOut) return; // prevent double clicks
		setLoggingOut(true);
		// Run signOut and token removal in parallel; ignore individual errors to ensure navigation proceeds
		await Promise.allSettled([
			(async () => {
				try {
					await signOut(auth);
				} catch (_) {}
			})(),
			(async () => {
				try {
					await removeToken();
				} catch (_) {}
			})(),
		]);
		// Use replace to avoid adding to history stack and reduce flicker
		router.replace("/login");
		// Small timeout to allow navigation before resetting state (optional safeguard)
		setTimeout(() => setLoggingOut(false), 500);
	};

	// Manual / interval token refresh
	const refreshSession = async () => {
		if (!user) return;
		try {
			const tokenResult = await user.getIdTokenResult(true);
			const token = tokenResult.token;
			const refreshToken = user.refreshToken;
			if (token && refreshToken) {
				await setToken({ token, refreshToken });
				setCustomClaims(tokenResult.claims ?? null);
			}
		} catch (e) {
			console.warn("refreshSession failed", e);
		}
	};

	useEffect(() => {
		if (!user) return;
		// 25 min interval (Firebase tokens ~1h) to keep claims fresh
		const interval = setInterval(() => {
			refreshSession();
		}, 25 * 60 * 1000);
		return () => clearInterval(interval);
	}, [user]);

	return (
		<AuthContext.Provider
			value={{
				user,
				loading,
				emailVerified: !!user?.emailVerified,
				customClaims,
				login,
				signup,
				logout,
				loggingOut,
				refreshSession,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth = () => useContext(AuthContext);
