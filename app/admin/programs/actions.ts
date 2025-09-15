"use server";
import {
	addDocumentToFirestore,
	checkIfDocumentExists,
	deleteDocumentById,
	updateDocumentById,
} from "@/data/actions";
import { revalidatePath } from "next/cache";

export async function addProgramAction(data: {
	programCode: string;
	programName: string;
}) {
	const programCode = data.programCode.trim();
	const programName = data.programName.trim();
	if (!programCode || !programName) {
		return { success: false, error: "All fields are required" } as const;
	}

	const exists = await checkIfDocumentExists(
		"programs",
		"programCode",
		programCode
	);
	if (exists) {
		return { success: false, error: `${programCode} already exists` } as const;
	}

	const result = await addDocumentToFirestore("programs", {
		programCode,
		programName,
		created: new Date().toISOString(),
	});

	if (!result.success) {
		return { success: false, error: "Failed to add program" } as const;
	}

	revalidatePath("/admin/programs");
	return { success: true } as const;
}

export async function updateProgramCodeAction(
	id: string,
	newProgramCode: string
) {
	const code = newProgramCode.trim();
	if (!code) return { success: false, error: "Program code required" } as const;
	const exists = await checkIfDocumentExists("programs", "programCode", code);
	if (exists)
		return { success: false, error: `${code} already exists` } as const;
	await updateDocumentById(id, "programs", "programCode", code);
	revalidatePath("/admin/programs");
	return { success: true } as const;
}

export async function updateProgramNameAction(
	id: string,
	newProgramName: string
) {
	const name = newProgramName.trim();
	if (!name) return { success: false, error: "Program name required" } as const;
	await updateDocumentById(id, "programs", "programName", name);
	revalidatePath("/admin/programs");
	return { success: true } as const;
}

export async function deleteProgramAction(id: string) {
	await deleteDocumentById({
		id,
		collectionName: "programs",
		relatedFields: [
			{ collectionName: "year-levels", fieldName: "programId" },
			{ collectionName: "sections", fieldName: "programId" },
			{ collectionName: "courses", fieldName: "programId" },
			{ collectionName: "academic-terms", fieldName: "programId" },
		],
	});
	revalidatePath("/admin/programs");
	return { success: true } as const;
}
