"use client";

import CardActionsDropdown from "@/components/card-actions-dropdown";
import React, { useState } from "react";
import {
	deleteProgramAction,
	updateProgramCodeAction,
	updateProgramNameAction,
} from "./actions";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

type ProgramProps = {
	program: {
		id: string;
		programCode: string;
		programName: string;
	};
};

const ProgramActionsDropdown = ({ program }: ProgramProps) => {
	const router = useRouter();
	const [busy, setBusy] = useState(false);

	const handleUpdate = async (newProgramCode: string) => {
		if (!newProgramCode.trim()) return;
		setBusy(true);
		const res = await updateProgramCodeAction(program.id, newProgramCode);
		if (!res.success) {
			toast.error(res.error || "Update failed");
		} else {
			toast.success("Program code updated");
		}
		setBusy(false);
		router.refresh();
	};

	const handleExtraUpdate = async (newProgramName: string) => {
		if (!newProgramName.trim()) return;
		setBusy(true);
		const res = await updateProgramNameAction(program.id, newProgramName);
		if (!res.success) {
			toast.error(res.error || "Update failed");
		} else {
			toast.success("Program name updated");
		}
		setBusy(false);
		router.refresh();
	};

	const handleDelete = async () => {
		setBusy(true);
		const res = await deleteProgramAction(program.id);
		if (!res.success) {
			toast.error("Delete failed");
		} else {
			toast.success("Program deleted");
		}
		setBusy(false);
		router.refresh();
	};

	return (
		<div>
			<CardActionsDropdown
				itemName={program.programCode}
				onUpdate={async (v) => {
					if (busy) return;
					await handleUpdate(v);
				}}
				onDelete={async () => {
					if (busy) return;
					await handleDelete();
				}}
				updateLabel="Rename"
				updatePlaceholder="New Program Code"
				deleteContext={{
					itemType: "Program",
					cascadeDescription: [
						"All sections within this program",
						"All courses associated with this program",
					],
					destructiveWarning:
						"This will permanently delete this entire program and ALL related academic data. This action cannot be undone.",
				}}
				extraField={{
					extraUpdatePlaceholder: "New Program Name",
					onExtraUpdate: async (v) => {
						if (busy) return;
						await handleExtraUpdate(v);
					},
				}}
			/>
		</div>
	);
};

export default ProgramActionsDropdown;
