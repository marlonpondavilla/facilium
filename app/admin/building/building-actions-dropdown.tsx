"use client";

import toast from "react-hot-toast";
import { deleteDocumentById, updateDocumentById } from "@/data/actions";
import CardActionsDropdown from "@/components/card-actions-dropdown";

type BuildingProps = {
	building: {
		id: string;
		buildingName: string;
	};
};

export function BuildingActionsDropdown({ building }: BuildingProps) {
	const handleDelete = async () => {
		try {
			await deleteDocumentById({
				id: building.id,
				collectionName: "buildings",
				relatedFields: [
					{ collectionName: "classrooms", fieldName: "buildingId" },
				],
			});
		} catch (e: unknown) {
			const error = e as { message?: string };
			toast.error(error.message ?? "error deleting a building");
		}
	};

	const handleUpdate = async (newName: string) => {
		await updateDocumentById(building.id, "buildings", "buildingName", newName);
	};

	return (
		<>
			<CardActionsDropdown
				itemName={building.buildingName}
				onDelete={handleDelete}
				onUpdate={handleUpdate}
				updateLabel="Rename"
				updatePlaceholder="New Building Name"
			/>
		</>
	);
}
