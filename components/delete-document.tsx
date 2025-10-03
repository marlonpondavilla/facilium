"use client";

import React, { useState } from "react";
import { Trash2, TriangleAlert } from "lucide-react";
import { Button } from "./ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	DialogDescription,
	DialogFooter,
	DialogClose,
} from "./ui/dialog";
import toast from "react-hot-toast";
import {
	deleteDocumentById,
	incrementDocumentCountById,
	deleteDocumentsByFieldValue,
	deleteUserCompletely,
} from "@/data/actions";
import { useRouter } from "next/navigation";

type BatchField = {
	id: string;
	collectionName: string;
	fieldName: string;
};

type DeleteDocumentWithConfirmationProps = {
	data: {
		id: string;
		collectionName: string;
		label: string;
		relatedFields?: {
			id: string;
			collectionName: string;
			fieldName: string;
			amount: number;
		};
		batchFields?: BatchField[];
	};
};

const DeleteDocumentWithConfirmation = ({
	data: { id, collectionName, label, relatedFields, batchFields },
}: DeleteDocumentWithConfirmationProps) => {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [error, setError] = useState<string>("");

	const handleDelete = async () => {
		setError("");
		setIsDeleting(true);
		try {
			// Adjust related counters (supports negative values for decrement)
			if (relatedFields) {
				await incrementDocumentCountById(
					relatedFields.id,
					relatedFields.collectionName,
					relatedFields.fieldName,
					relatedFields.amount
				);
			}

			// Delete dependent documents in parallel
			if (batchFields && batchFields.length > 0) {
				await Promise.all(
					batchFields.map(async (bf) => {
						try {
							await deleteDocumentsByFieldValue(
								bf.collectionName,
								bf.fieldName,
								bf.id
							);
						} catch (batchError) {
							console.error(
								`Failed to delete related docs for ${bf.id}`,
								batchError
							);
						}
					})
				);
			}

			if (label.toLowerCase() === "user" && collectionName === "userData") {
				const res = await deleteUserCompletely(id);
				if (res.success) {
					toast.success("User account deleted successfully!");
				} else {
					throw res.error || new Error("Failed to delete user account");
				}
			} else {
				await deleteDocumentById({ id, collectionName });
				toast.success(`${label} deleted successfully!`);
			}
			setOpen(false);
			router.refresh();
		} catch (e: unknown) {
			const err = e as { message?: string };
			const message = err?.message || "Failed to delete. Please try again.";
			setError(message);
			toast.error(message);
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={(o) => !isDeleting && setOpen(o)}>
			<DialogTrigger asChild>
				<Button
					size={"sm"}
					variant={"destructive"}
					className="cursor-pointer"
					onClick={() => setOpen(true)}
				>
					<Trash2 />
				</Button>
			</DialogTrigger>
			<DialogContent
				onEscapeKeyDown={(e) => {
					if (isDeleting) e.preventDefault();
				}}
			>
				<DialogHeader>
					<DialogTitle>
						<div className="flex items-center gap-2">
							<TriangleAlert className="text-red-500" />
							You are deleting a {label.toLowerCase()}
						</div>
					</DialogTitle>
					<DialogDescription>This action cannot be undone.</DialogDescription>
				</DialogHeader>
				{error && (
					<p className="text-xs text-red-600 font-medium" role="alert">
						{error}
					</p>
				)}
				<DialogFooter>
					<DialogClose asChild disabled={isDeleting}>
						<Button variant={"outline"} disabled={isDeleting}>
							Cancel
						</Button>
					</DialogClose>
					<Button
						onClick={handleDelete}
						variant={"default"}
						disabled={isDeleting}
						className="bg-red-500 text-white hover:bg-red-400 disabled:opacity-60 disabled:cursor-not-allowed"
					>
						{isDeleting ? "Deleting..." : "Confirm"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default DeleteDocumentWithConfirmation;
