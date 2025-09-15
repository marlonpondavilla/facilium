"use server";
import {
	addDocumentToFirestore,
	checkIfDocumentExists,
	deleteDocumentById,
	updateDocumentById,
} from "@/data/actions";
import { toSlug } from "@/lib/slug";
import { revalidatePath } from "next/cache";

export async function addBuildingAction(data: {
	buildingCode: string;
	buildingName: string;
}) {
	const buildingName = data.buildingName.trim();
	// Always derive code from name to enforce normalization
	const buildingCode = toSlug(buildingName);
	if (!buildingCode || !buildingName) {
		return { success: false, error: "All fields are required" } as const;
	}

	const exists = await checkIfDocumentExists(
		"buildings",
		"buildingCode",
		buildingCode
	);
	if (exists) {
		return { success: false, error: `${buildingCode} already exists` } as const;
	}

	const result = await addDocumentToFirestore("buildings", {
		buildingCode,
		buildingName,
		created: new Date().toISOString(),
	});

	if (!result.success) {
		return { success: false, error: "Failed to add building" } as const;
	}

	revalidatePath("/admin/building");
	return { success: true } as const;
}

export async function updateBuildingNameAction(id: string, newName: string) {
	const name = newName.trim();
	if (!name)
		return { success: false, error: "Building name required" } as const;
	await updateDocumentById(id, "buildings", "buildingName", name);
	revalidatePath("/admin/building");
	return { success: true } as const;
}

export async function deleteBuildingAction(id: string) {
	await deleteDocumentById({
		id,
		collectionName: "buildings",
		relatedFields: [{ collectionName: "classrooms", fieldName: "buildingId" }],
	});
	revalidatePath("/admin/building");
	return { success: true } as const;
}
