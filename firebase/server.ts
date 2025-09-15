import { Firestore, getFirestore } from "firebase-admin/firestore";
import { getApps, ServiceAccount } from "firebase-admin/app";
import admin from "firebase-admin";
import { Auth, getAuth } from "firebase-admin/auth";

// Normalize multiline private key (works whether value stored with literal \n or actual newlines)
const rawPrivateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY || "";
const normalizedPrivateKey = rawPrivateKey
	.replace(/\\n/g, "\n") // replace escaped newlines
	.trim();

const requiredEnv = [
	"FIREBASE_ADMIN_PRIVATE_KEY_ID",
	"FIREBASE_ADMIN_PRIVATE_KEY",
	"FIREBASE_ADMIN_CLIENT_EMAIL",
	"FIREBASE_ADMIN_CLIENT_ID",
];

const missing = requiredEnv.filter(
	(k) => !process.env[k] || process.env[k] === ""
);

if (missing.length) {
	// Log a concise warning once; do not throw in edge build phases where admin SDK isn't needed.
	if (process.env.NODE_ENV !== "production") {
		console.warn(
			`Firebase admin initialization skipped: missing env vars -> ${missing.join(
				", "
			)}`
		);
	}
}

const serviceAccount = {
	type: "service_account",
	project_id: "facilium-7172e",
	private_key_id: process.env.FIREBASE_ADMIN_PRIVATE_KEY_ID,
	private_key: normalizedPrivateKey || undefined,
	client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
	client_id: process.env.FIREBASE_ADMIN_CLIENT_ID,
	auth_uri: "https://accounts.google.com/o/oauth2/auth",
	token_uri: "https://oauth2.googleapis.com/token",
	auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
	client_x509_cert_url:
		"https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40facilium-7172e.iam.gserviceaccount.com",
	universe_domain: "googleapis.com",
};

let firestore: Firestore;
let auth: Auth;
const currentApps = getApps();

if (!currentApps.length) {
	if (!missing.length && serviceAccount.private_key) {
		const app = admin.initializeApp({
			credential: admin.credential.cert(serviceAccount as ServiceAccount),
		});
		firestore = getFirestore(app);
		auth = getAuth(app);
	} else {
		// Defer initialization until env vars available (e.g., at runtime in correct environment)
		// @ts-expect-error intentional uninitialized export scenario when misconfigured
		firestore = undefined;
		// @ts-expect-error see above
		auth = undefined;
	}
} else {
	const app = currentApps[0];
	firestore = getFirestore(app);
	auth = getAuth(app);
}

export { firestore, auth };

export const getTotalUserCount = async (
	firestoreQuery: FirebaseFirestore.Query<
		FirebaseFirestore.DocumentData,
		FirebaseFirestore.DocumentData
	>,
	pageSize: number
) => {
	const queryCount = firestoreQuery.count();
	const countSnapshot = await queryCount.get();
	const countData = countSnapshot.data();

	const total = countData?.count ?? 0;
	const totalPages = Math.ceil(total / pageSize);

	return {
		totalUsers: total,
		totalPages,
	};
};
