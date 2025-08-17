"use client";

import CardActionsDropdown from "@/components/card-actions-dropdown";
import { deleteDocumentById, updateDocumentById } from "@/data/actions";
import React from "react";

type ProgramProps = {
	program: {
		id: string;
		programCode: string;
		programName: string;
	};
};

const ProgramActionsDropdown = ({ program }: ProgramProps) => {
	const handleUpdate = async (newProgramCode: string) => {
		await updateDocumentById(
			program.id,
			"programs",
			"programCode",
			newProgramCode
		);
	};

	const handleExtraUpdate = async (newProgramName: string) => {
		updateDocumentById(program.id, "programs", "programName", newProgramName);
	};

	const handleDelete = async () => {
		await deleteDocumentById({ id: program.id, collectionName: "programs" });
	};

	return (
		<div>
			<CardActionsDropdown
				itemName={program.programCode}
				onUpdate={handleUpdate}
				onDelete={handleDelete}
				updateLabel="Rename"
				updatePlaceholder="New Program Code"
				extraField={{
					extraUpdatePlaceholder: "New Program Name",
					onExtraUpdate: handleExtraUpdate,
				}}
			/>
		</div>
	);
};

export default ProgramActionsDropdown;
