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
import { departments } from "@/data/department";
import toast from "react-hot-toast";

type ProgramDataProps = {
	programCode: string;
	programName: string;
	department: string;
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
		department: "",
	});

	const handleAddProgram = async () => {
		if (
			!programData.programCode ||
			!programData.programName ||
			!programData.department
		) {
			setError(true);
			return;
		}
		setSubmitting(true);
		try {
			const res = await addProgramAction({
				programCode: programData.programCode,
				programName: programData.programName,
				department: programData.department,
			});
			if (!res.success) {
				if (res.error?.includes("exists")) {
					setExistError(true);
				} else {
					toast.error(res.error || "Failed to add program");
				}
				return;
			}
			toast.success("Program added");
			// reset form while staying on the same route
			setProgramData({ programCode: "", programName: "", department: "" });
			setError(false);
			setExistError(false);
			setOpen(false); // close dialog explicitly
			// Ensure the current /admin/programs route data revalidates but do not navigate elsewhere
			router.refresh();
		} finally {
			setSubmitting(false);
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
						department: "",
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
				<Label htmlFor="department">Department</Label>
				<select
					id="department"
					value={programData.department}
					onChange={(e) => {
						setProgramData((prev) => ({ ...prev, department: e.target.value }));
						setError(false);
						setExistError(false);
					}}
					className={`border ${
						error && !programData.department
							? "border-red-500"
							: "border-gray-300"
					} rounded py-2 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500`}
				>
					<option value="">Select Department</option>
					{departments.map((d) => (
						<option key={d} value={d}>
							{d}
						</option>
					))}
				</select>
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
