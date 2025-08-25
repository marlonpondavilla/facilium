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
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);
	const [customClaims, setCustomClaims] = useState<ParsedToken | null>(null);
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
		await signOut(auth);
		await removeToken();
		router.push("/login");
	};

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
			}}
		>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth = () => useContext(AuthContext);
