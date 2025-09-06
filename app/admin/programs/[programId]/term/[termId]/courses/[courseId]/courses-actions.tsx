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
import { Input } from "@/components/ui/input";
import { deleteDocumentById, updateDocumentById } from "@/data/actions";
import { PencilIcon, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import toast from "react-hot-toast";

type CoursesProps = {
	data: {
		id: string;
		courseCode: string;
		subjectTitle: string;
	};
};

const CoursesActions = ({ data }: CoursesProps) => {
	const [inputError, setInputError] = useState("");
	const [open, setOpen] = useState(false);
	const [subjectTitleUpdate, setSubjectTitleUpdate] = useState("");
	const router = useRouter();

	const handleUpdate = async () => {
		if (!subjectTitleUpdate.trim()) {
			setInputError("Fields cannot be empty");
			setOpen(true);
			return;
		}

		await updateDocumentById(
			data.id,
			"courses",
			"subjectTitle",
			subjectTitleUpdate
		);
		setOpen(false);
		toast.success(data.subjectTitle);
		window.location.reload();
	};

	const handleDelete = async () => {
		await deleteDocumentById({ id: data.id, collectionName: "courses" });
		router.refresh();
		toast.success("Deleted successfully!");
	};

	return (
		<div className="flex gap-4">
			<Dialog
				open={open}
				onOpenChange={(isOpen) => {
					setOpen(isOpen);
					if (!isOpen) {
						setSubjectTitleUpdate("");
						setInputError("");
					}
				}}
			>
				<DialogTrigger asChild>
					<Button className="bg-green-500 rounded-full hover:opacity-80">
						<PencilIcon />
						Update
					</Button>
				</DialogTrigger>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Update subject title</DialogTitle>
						<DialogDescription>
							You are updating:{" "}
							<span className="font-bold">{data.courseCode}</span>
						</DialogDescription>
					</DialogHeader>

					<p className="text-center text-gray-500">
						Previous: {data.subjectTitle}
					</p>

					<Input
						placeholder="Enter new subject title"
						onChange={(e) => {
							setSubjectTitleUpdate(e.target.value);
							setInputError("");
						}}
					/>
					{inputError && <p className="text-xs text-red-500">{inputError}</p>}

					<DialogFooter>
						<DialogClose>Cancel</DialogClose>
						<Button variant={"destructive"} onClick={handleUpdate}>
							Update now
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<AlertDialog>
				<AlertDialogTrigger asChild>
					<Button variant={"destructive"} className="rounded-full">
						<Trash2 />
						Delete
					</Button>
				</AlertDialogTrigger>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							Are you sure you want to delete {data.courseCode}?
						</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<Button onClick={handleDelete} variant={"destructive"}>
							Yes, delete
						</Button>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
};

export default CoursesActions;
