"use server";

import { firestore } from "@/firebase/server";
import { Building, BuildingCreate } from "@/types/buildingType";

export const setBuilding = async (data: BuildingCreate) => {
	try {
		await firestore.collection("buildings").add({
			...data,
			created: new Date(),
		});

		return { success: true };
	} catch (e: unknown) {
		const error = e as { message?: string };
		console.error(error.message);
	}
};

export const getBuilding = async (): Promise<Building[]> => {
	const snapshot = await firestore.collection("buildings").get();

	const buildings: Building[] = snapshot.docs.map((doc) => {
		const data = doc.data();

		return {
			id: doc.id,
			buildingName: data.buildingName as string,
			classroom: data.classroom as number,
			created: data.created ? data.created.toDate() : undefined,
		};
	});

	return buildings;
};
