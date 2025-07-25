"use server";

import { auth, firestore } from "@/firebase/server";
import { signupSchema } from "@/validation/signupSchema";

export const signupUser = async (data: {
	fullName: string;
	email: string;
	department: string;
	password: string;
	confirmPassword: string;
}) => {
	const result = signupSchema.safeParse(data);
	const { password, confirmPassword, ...userData } = data;

	if (!result.success) {
		const errors = result.error.flatten();

		return {
			error: true,
			fieldErrors: errors.fieldErrors,
			message: "Error in validation signup data",
		};
	}

	// check email existence
	try {
		// if this becomes true the return will fire, email is existing ongke
		await auth.getUserByEmail(data.email);

		return {
			error: true,
			fieldErrors: {
				email: ["Email already in use by another account"],
			},
			message: "Email already exists",
		};
	} catch (err: any) {
		if (err.code !== "auth/user-not-found") {
			return {
				error: true,
				message: "Server error in signing up user",
			};
		}
	}

	// creating user object and saving to our db
	try {
		await auth.createUser({
			displayName: data.fullName,
			email: data.email,
			password: data.password,
		});

		await firestore.collection("userData").add({
			...userData,
			created: new Date(),
		});

		return {
			error: false,
			message: "User created successfully",
		};
	} catch (e: any) {
		return {
			error: true,
			message: e.message ?? "Could not signup user",
		};
	}
};
