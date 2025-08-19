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
import { addDocumentToFirestore, checkIfDocumentExists } from "@/data/actions";
import { CirclePlus } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState, useTransition } from "react";
import toast from "react-hot-toast";

type AddYearLevelProps = {
	programId: string;
	yearLevel: string;
};

const AddYearLevel = ({ id }: { id: string }) => {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [error, setError] = useState(false);
	const [inputError, setInputError] = useState("");
	const [open, setOpen] = useState(false);
	const [yearLevelData, setYearLevelData] = useState<AddYearLevelProps>({
		programId: id,
		yearLevel: "",
	});

	const handleAddYearLevel = async () => {
		const startsWithNumber = (str: string) => /^\d/.test(str);
		const isOrdinalNumber = (str: string) => /^(\d+)(st|nd|rd|th)$/.test(str);

		const yearLevelExists = await checkIfDocumentExists(
			"year-levels",
			"yearLevel",
			yearLevelData.yearLevel,
			"programId",
			yearLevelData.programId
		);

		if (yearLevelExists) {
			setInputError("Year level has already been added.");
			setOpen(true);
			return;
		}

		if (!yearLevelData.yearLevel) {
			setError(true);
			setOpen(true);
			return;
		}

		if (!startsWithNumber(yearLevelData.yearLevel)) {
			setOpen(true);
			setInputError("Year level must start with a number");
			return;
		}

		if (!isOrdinalNumber(yearLevelData.yearLevel)) {
			setOpen(true);
			setInputError(
				"Year level must be a valid ordinal (e.g., 1st, 2nd, 3rd, 4th)"
			);
			return;
		}

		// add year level data to firestore
		const result = await addDocumentToFirestore("year-levels", {
			...yearLevelData,
			created: new Date().toISOString(),
		});

		if (result.success) {
			toast.success("New year level has been created!");
			setOpen(false);
			startTransition(() => {
				router.refresh();
			});
		}
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(isOpen) => {
				setOpen(isOpen);
				if (!isOpen) {
					setYearLevelData({
						programId: id,
						yearLevel: "",
					});
				}
			}}
		>
			<DialogTrigger asChild>
				<Button variant={"destructive"}>
					<CirclePlus /> Add New Year Level
				</Button>
			</DialogTrigger>
			<DialogContent className="w-1/4">
				<DialogHeader>
					<DialogTitle>Add Year Level</DialogTitle>
					<DialogDescription>
						Enter year level information below
					</DialogDescription>
				</DialogHeader>
				<Input
					placeholder="Year level (1st, 2nd, 3rd, or 4th)"
					value={yearLevelData.yearLevel}
					onChange={(e) => {
						setYearLevelData((prev) => ({
							...prev,
							yearLevel: e.target.value,
						}));
						setError(false);
						setInputError("");
					}}
					className={`${error || inputError ? "border border-red-500" : ""} `}
				/>
				{error && <p className="text-xs text-red-500">Field cannot be empty</p>}
				{inputError && <p className="text-xs text-red-500">{inputError}</p>}
				<DialogFooter>
					<Button
						className="w-full facilium-bg-indigo hover:opacity-80"
						onClick={handleAddYearLevel}
						disabled={isPending}
					>
						Add now
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default AddYearLevel;
