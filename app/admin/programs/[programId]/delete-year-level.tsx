"use client";

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
import { deleteDocumentById } from "@/data/actions";
import { Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useTransition } from "react";
import toast from "react-hot-toast";

const DeleteYearLevel = ({ id }: { id: string }) => {
	const [isPending, startTransition] = useTransition();
	const router = useRouter();

	const handleDelete = async () => {
		// delete year level and relative section and courses
		await deleteDocumentById({
			id,
			collectionName: "year-levels",
			relatedFields: [
				{ collectionName: "sections", fieldName: "yearLevelId" },
				{ collectionName: "courses", fieldName: "yearLevelId" },
				{ collectionName: "academic-terms", fieldName: "yearLevelId" },
			],
		});
		startTransition(() => {
			router.refresh();
		});
		toast.success("Deleted successfully!");
	};

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button variant={"destructive"} className="cursor-pointer">
					Delete
					<Trash2Icon />
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						Are you sure you want to delete this year level?
					</DialogTitle>
					<DialogDescription>This action cannot be undone</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<DialogClose asChild>
						<Button className="facilium-bg-indigo">Cancel</Button>
					</DialogClose>
					<Button
						variant={"destructive"}
						onClick={handleDelete}
						disabled={isPending}
					>
						Yes, delete
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default DeleteYearLevel;
