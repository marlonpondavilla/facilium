"use client";

import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { deleteDocumentById } from "@/data/actions";
import { Trash2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import React, { useState } from "react";
import toast from "react-hot-toast";

type ActionTermBtnProps = {
	id: string;
};

const ActionTermBtn = ({ id }: ActionTermBtnProps) => {
	const [open, setOpen] = useState(false);

	const router = useRouter();
	const pathname = usePathname();

	const handleViewCourses = () => {
		router.push(`${pathname}/${"courses"}/${id}`);
	};

	const handleDeleteTerm = async () => {
		try {
			setOpen(false);

			await deleteDocumentById({
				id,
				collectionName: "academic-terms",
				relatedFields: [
					{ collectionName: "courses", fieldName: "termId" },
					// add courses to be deleted here stop cramming dude
				],
			});

			router.refresh();
			toast.success("Deleted successfully");
		} catch (e) {
			console.error("Delete failed:", e);
		}
	};

	return (
		<div className="flex gap-4">
			<Button
				variant={"link"}
				onClick={handleViewCourses}
				className="cursor-pointer"
			>
				View Courses
			</Button>

			<AlertDialog open={open} onOpenChange={setOpen}>
				<AlertDialogTrigger asChild>
					<Button variant={"destructive"}>
						Delete <Trash2 />
					</Button>
				</AlertDialogTrigger>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							Are you sure you want to delete this term?
						</AlertDialogTitle>
						<AlertDialogDescription>
							This will delete this term and other related information.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<Button onClick={handleDeleteTerm} variant={"destructive"}>
							Confirm
						</Button>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
};

export default ActionTermBtn;
