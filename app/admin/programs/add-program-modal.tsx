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
import { addDocumentToFirestore, checkIfDocumentExists } from "@/data/actions";
import { PlusIcon } from "lucide-react";
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
		try {
			if (!programData.programCode || !programData.programName) {
				setError(true);
				setOpen(true);
				return;
			}

			setSubmitting(true);

			const isProgramCodeExist = await checkIfDocumentExists(
				"programs",
				"programCode",
				programData.programCode
			);

			if (isProgramCodeExist) {
				setExistError(true);
				setSubmitting(false);
				setOpen(true);
				return;
			}

			const result = await addDocumentToFirestore("programs", {
				...programData,
				created: new Date().toISOString(),
			});

			if (result.success) {
				toast.success("New Program Added Successfully");
				setSubmitting(false);
				setError(false);
				setOpen(false);
				router.refresh();
			}
		} catch (e) {
			console.error(e);
		}
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
				<Button className="cursor-pointer text-white" variant={"link"}>
					<PlusIcon />
					Add New Program
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
						variant={"destructive"}
						onClick={handleAddProgram}
						className="flex w-full mt-2"
						disabled={submitting}
					>
						Add Program
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default AddProgramModal;
