"use server";

import { firestore, getTotalUserCount } from "@/firebase/server";
import { User } from "@/types/userInterface";

type GetUsersOptions = {
	pagination?: {
		pageSize?: number;
		startAfterDocId?: string;
		search?: string;
	};
	department?: string;
};

export const getUsersWithPage = async (options?: GetUsersOptions) => {
	const pageSize = options?.pagination?.pageSize || 10;
	const startAfterDocId = options?.pagination?.startAfterDocId;
	const search = options?.pagination?.search?.trim() || "";
	const department = options?.department?.trim();

	let usersQuery: FirebaseFirestore.Query = firestore
		.collection("userData")
		.orderBy("created", "desc");

	// Department filter (skip if 'all' or empty)
	if (department && department.toLowerCase() !== "all") {
		usersQuery = firestore
			.collection("userData")
			.where("department", "==", department)
			.orderBy("created", "desc");
	}

	// if search exists it runs (emailk only bro)
	if (search) {
		// when combining with department filter, reapply the where clause
		let searchBase = firestore
			.collection("userData")
			.orderBy("email")
			.startAt(search)
			.endAt(search + "\uf8ff");
		if (department && department.toLowerCase() !== "all") {
			// equality + orderBy different field usually requires a composite index in Firestore
			searchBase = firestore
				.collection("userData")
				.where("department", "==", department)
				.orderBy("email")
				.startAt(search)
				.endAt(search + "\uf8ff");
		}
		usersQuery = searchBase;
	}

	// NOTE: The combinations below require composite indexes in Firestore:
	// 1. department == X + orderBy(created desc)
	// 2. department == X + orderBy(email) (when searching)
	// 3. orderBy(email) alone (search only) – usually single-field exists automatically
	// If you see the Firestore error: "The query requires an index" copy the console link
	// or add definitions to firestore indexes config.
	const { totalUsers, totalPages } = await getTotalUserCount(
		usersQuery,
		pageSize
	);

	let query = usersQuery.limit(pageSize);

	if (startAfterDocId) {
		const startAfterDocSnapshot = await firestore
			.collection("userData")
			.doc(startAfterDocId)
			.get();
		if (startAfterDocSnapshot.exists) {
			query = query.startAfter(startAfterDocSnapshot);
		}
	}

	let propertiesSnapshot: FirebaseFirestore.QuerySnapshot;
	try {
		propertiesSnapshot = await query.get();
	} catch (err: unknown) {
		// Surface a clearer developer-facing message for missing index
		const e = err as { code?: string; message?: string };
		if (e.message?.includes("requires an index")) {
			console.error(
				"Missing Firestore composite index. Create indexes for (department asc, created desc) and (department asc, email asc). Original message:",
				e.message
			);
		}
		throw err;
	}

	const properties = propertiesSnapshot.docs.map(
		(doc) =>
			({
				id: doc.id,
				...doc.data(),
			} as User)
	);

	// Last visible doc for next cursor
	const lastVisibleDoc =
		propertiesSnapshot.docs[propertiesSnapshot.docs.length - 1];

	return {
		data: properties,
		totalUsers,
		totalPages,
		nextCursor: lastVisibleDoc ? lastVisibleDoc.id : null,
	};
};
