"use server";

import { auth } from "@/firebase/server";
import { signupSchema } from "@/validation/signupSchema";

export const signupUser = async (data: {
	fullName: string;
	email: string;
	password: string;
	confirmPassword: string;
}) => {
	const result = signupSchema.safeParse(data);

	if (!result.success) {
		const errors = result.error.flatten();

		return {
			error: true,
			fieldErrors: errors.fieldErrors,
			message: "Error in validation signup data",
		};
	}

	try {
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

	try {
		await auth.createUser({
			displayName: data.fullName,
			email: data.email,
			password: data.password,
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
