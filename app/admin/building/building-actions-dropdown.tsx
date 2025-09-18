"use client";

import toast from "react-hot-toast";
import CardActionsDropdown from "@/components/card-actions-dropdown";
import { deleteBuildingAction, updateBuildingNameAction } from "./actions";
import { useRouter } from "next/navigation";
import { useState } from "react";

type BuildingProps = {
	building: {
		id: string;
		buildingName: string;
	};
};

export function BuildingActionsDropdown({ building }: BuildingProps) {
	const router = useRouter();
	const [busy, setBusy] = useState(false);

	const handleDelete = async () => {
		setBusy(true);
		const res = await deleteBuildingAction(building.id);
		if (!res.success) {
			toast.error("Delete failed");
		} else {
			toast.success("Building deleted");
		}
		setBusy(false);
		router.refresh();
	};

	const handleUpdate = async (newName: string) => {
		if (!newName.trim()) return;
		setBusy(true);
		const res = await updateBuildingNameAction(building.id, newName);
		if (!res.success) {
			toast.error(res.error || "Update failed");
		} else {
			toast.success("Building name updated");
		}
		setBusy(false);
		router.refresh();
	};

	return (
		<>
			<CardActionsDropdown
				itemName={building.buildingName}
				onDelete={async () => {
					if (busy) return;
					await handleDelete();
				}}
				onUpdate={async (v) => {
					if (busy) return;
					await handleUpdate(v);
				}}
				updateLabel="Rename"
				updatePlaceholder="New Building Name"
				deleteContext={{
					itemType: "Building",
					cascadeDescription: [
						"All classrooms in this building",
						"All current schedules using these classrooms",
						"All pending schedules awaiting approval",
						"All approved schedule records",
					],
					destructiveWarning: "This action cannot be undone.",
				}}
			/>
		</>
	);
}
