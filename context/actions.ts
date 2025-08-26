"use server";

import { auth, firestore } from "@/firebase/server";
import { cookies } from "next/headers";

export const removeToken = async () => {
	const cookieStore = await cookies();
	cookieStore.delete("firebaseAuthToken");
	cookieStore.delete("firebaseAuthRefreshToken");
};

export const setToken = async ({
	token,
	refreshToken,
}: {
	token: string;
	refreshToken: string;
}) => {
	try {
		const verifiedToken = await auth.verifyIdToken(token);
		if (!verifiedToken) return;

		const userRecord = await auth.getUser(verifiedToken.uid);
		const email = userRecord.email;
		const currentClaims = userRecord.customClaims || {};

		// deafault role for every user
		let role = "faculty";

		//Check for role by env email, and assign respective designation
		if (email === process.env.ADMIN_EMAIL) {
			role = "admin";
		} else if (email === "ayanokoujisan26@gmail.com") {
			role = "dean";
		} else {
			// Try fetching designation from Firestore
			const userDoc = await firestore
				.collection("userData")
				.where("email", "==", email)
				.limit(1)
				.get();

			const userData = userDoc.docs[0]?.data();
			const designationRaw = userData?.designation;

			if (designationRaw) {
				role = designationRaw.trim().toLowerCase().replace(/\s+/g, "-");
			}
		}

		//Set the custom claim if different from existing
		if (currentClaims.role !== role) {
			await auth.setCustomUserClaims(verifiedToken.uid, { role });
		}

		//Set cookies
		const cookieStore = await cookies();

		cookieStore.set("firebaseAuthToken", token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
		});

		cookieStore.set("firebaseAuthRefreshToken", refreshToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
		});
	} catch (e) {
		console.error("Error in setToken:", e);
	}
};
