"use client";

import DeleteDocumentWithConfirmation from "@/components/delete-document";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import React from "react";
import toast from "react-hot-toast";

const DeleteSectionButton = ({ id }: { id: string }) => {
	const router = useRouter();

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
