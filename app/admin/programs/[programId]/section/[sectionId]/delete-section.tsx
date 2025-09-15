"use client";

import DeleteDocumentWithConfirmation from "@/components/delete-document";
import React from "react";

const DeleteSectionButton = ({ id }: { id: string }) => {
	return (
		<div className="flex gap-2 items-center">
			<p>Delete</p>
			<DeleteDocumentWithConfirmation
				data={{ id, collectionName: "sections", label: "section" }}
			/>
		</div>
	);
};

export default DeleteSectionButton;
