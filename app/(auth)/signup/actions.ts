"use server";

import { auth, firestore } from "@/firebase/server";
import { signupSchema } from "@/validation/signupSchema";

export const signupUser = async (data: {
	firstName: string;
	middleName: string;
	lastName: string;
	degreeEarned: string;
	email: string;
	department: string;
	password: string;
	confirmPassword: string;
}) => {
	const result = signupSchema.safeParse(data);
	// Build userData without password fields to avoid unused var lint issues
	const userData = {
		firstName: data.firstName,
		middleName: data.middleName,
		lastName: data.lastName,
		degreeEarned: data.degreeEarned,
		email: data.email,
		department: data.department,
	};

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
	} catch (e: unknown) {
		const error = e as { code?: string };
		if (error.code !== "auth/user-not-found") {
			return {
				error: true,
				message: "Server error in signing up user",
			};
		}
	}

	// creating user object and saving to our db
	try {
		const userRecord = await auth.createUser({
			displayName: `${data.firstName} ${data.lastName}`,
			email: data.email,
			password: data.password,
		});

		await firestore.collection("userData").add({
			...userData,
			uid: userRecord.uid,
			fullName: `${data.firstName} ${data.middleName} ${data.lastName}`,
			designation: "Faculty",
			status: "Enabled",
			degreeEarned: data.degreeEarned,
			created: new Date(),
		});

		return {
			error: false,
			message: "User created successfully",
		};
	} catch (e: unknown) {
		const error = e as { message?: string };
		return {
			error: true,
			message: error.message ?? "Could not signup user",
		};
	}
};
