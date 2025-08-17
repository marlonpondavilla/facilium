"use client";

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
import { deleteDocumentById, incrementDocumentCountById } from "@/data/actions";
import { useRouter } from "next/navigation";

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
	};
};

const DeleteDocumentWithConfirmation = ({
	data: { id, collectionName, label, relatedFields },
}: DeleteDocumentWithConfirmationProps) => {
	const router = useRouter();

	const handleDelete = async () => {
		try {
			// if decrement is true subtract 1 to the field
			if (relatedFields) {
				await incrementDocumentCountById(
					relatedFields.id,
					relatedFields.collectionName,
					relatedFields.fieldName,
					relatedFields.amount
				);
			}
			// dynamically delete document based on id
			await deleteDocumentById({ id: id, collectionName: collectionName });
			toast.success("Deleted successfully!");
			router.refresh();
		} catch (e: unknown) {
			const error = e as { message?: string };
			console.error(error.message);
		}
	};

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button size={"sm"} variant={"destructive"} className="cursor-pointer">
					<Trash2 />
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						<div className="flex items-center gap-2">
							<TriangleAlert className="text-red-500" />
							You are deleting a {label.toLowerCase()}
						</div>
					</DialogTitle>
					<DialogDescription>This action cannot be undone.</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<DialogClose asChild>
						<Button variant={"outline"}>Cancel</Button>
					</DialogClose>
					<DialogClose asChild>
						<Button
							onClick={handleDelete}
							variant={"default"}
							className="bg-red-500 text-white hover:bg-red-400"
						>
							Confirm
						</Button>
					</DialogClose>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default DeleteDocumentWithConfirmation;
