"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// Legacy direct firestore helpers replaced by server action usage with revalidation
// import { addDocumentToFirestore, checkIfDocumentExists } from "@/data/actions";
import { addProgramAction } from "./actions";
import { PlusIcon, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import toast from "react-hot-toast";

type ProgramDataProps = {
	programCode: string;
	programName: string;
};

const AddProgramModal = () => {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [error, setError] = useState(false);
	const [existError, setExistError] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [programData, setProgramData] = useState<ProgramDataProps>({
		programCode: "",
		programName: "",
	});

	const handleAddProgram = async () => {
		if (!programData.programCode || !programData.programName) {
			setError(true);
			setOpen(true);
			return;
		}

		setSubmitting(true);

		// Call server action (handles duplicate detection & revalidation)
		const res = await addProgramAction({
			programCode: programData.programCode,
			programName: programData.programName,
		});

		if (!res.success) {
			if (res.error?.includes("exists")) {
				setExistError(true);
			} else {
				toast.error(res.error || "Failed to add program");
			}
			setSubmitting(false);
			return;
		}

		toast.success("New Program Added Successfully");
		setSubmitting(false);
		setError(false);
		setOpen(false);
		// router.refresh() is usually not necessary because revalidatePath in server action
		// is enough, but keep as a fallback for immediate UI consistency.
		router.refresh();
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(isOpen) => {
				// remove previous states when the dialog closes
				setOpen(isOpen);
				if (!isOpen) {
					setProgramData({
						programCode: "",
						programName: "",
					});
				}
			}}
		>
			<DialogTrigger asChild>
				<Button className="cursor-pointer" variant="default">
					<PlusIcon className="mr-1" />
					Add Program
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Add New Program</DialogTitle>
					<DialogDescription>Enter Program Details Below</DialogDescription>
				</DialogHeader>
				{error && (
					<p className="text-center text-sm text-red-500 tracking-wide">
						All fields are required.
					</p>
				)}
				{existError && (
					<p className="text-center text-sm text-red-500 tracking-wide">
						{programData.programCode} already exists
					</p>
				)}
				<Label htmlFor="program-code">Program Code</Label>
				<Input
					type="text"
					placeholder="Program Code (BSIT, BSBA, or BSHM)"
					id="program-code"
					onChange={(e) => {
						setProgramData((prev) => ({
							...prev,
							programCode: e.target.value,
						}));
						setError(false);
						setExistError(false);
					}}
					className={`${error ? "border border-red-500" : ""}`}
				/>

				<Label htmlFor="program-name">Program Name</Label>
				<Input
					type="text"
					placeholder="Program Name (Bachelor of science in Information Technology)"
					id="program-name"
					onChange={(e) => {
						setProgramData((prev) => ({
							...prev,
							programName: e.target.value,
						}));
						setError(false);
						setExistError(false);
					}}
					className={`${error ? "border border-red-500" : ""}`}
				/>
				<DialogFooter>
					<Button
						variant="default"
						onClick={handleAddProgram}
						className="flex w-full mt-2 justify-center"
						disabled={submitting}
					>
						{submitting ? (
							<>
								<Loader2 className="h-4 w-4 mr-2 animate-spin" />
								Saving...
							</>
						) : (
							"Save"
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default AddProgramModal;
