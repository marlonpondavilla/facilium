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
import { useParams, useRouter } from "next/navigation";
import React, { useState } from "react";
import toast from "react-hot-toast";

type TermProps = {
	id: string;
};

const AddTerm = ({ id }: TermProps) => {
	const [term, setTerm] = useState("");
	const [error, setError] = useState("");
	const [open, setOpen] = useState(false);

	const router = useRouter();
	const { programId } = useParams();

	const handleAddTerm = async () => {
		const startsWithNumber = (str: string) => /^\d/.test(str);
		const isOrdinalNumber = (str: string) => /^(\d+)(st|nd|rd|th)$/.test(str);

		if (term.trim() === "") {
			setError("Field cannot be empty");
			setOpen(true);
			return;
		}

		if (!startsWithNumber(term)) {
			setError("Term must start with a number");
			setOpen(true);
			return;
		}

		if (!isOrdinalNumber(term)) {
			setError("Term must be a valid ordinal (e.g., 1st, 2nd)");
			setOpen(true);
			return;
		}

		try {
			setOpen(false);

			const result = await addDocumentToFirestore("academic-terms", {
				term,
				yearLevelId: id,
				programId,
				created: new Date().toISOString(),
			});

			if (result.success) {
				toast.success("Added Successfully!");
				setTerm("");
				router.refresh();
				return;
			}
		} catch (err) {
			console.error("Failed to save term:", err);
			setError("Something went wrong. Please try again.");
		}
	};

	return (
		<div>
			<Dialog
				open={open}
				onOpenChange={(isOpen) => {
					setOpen(isOpen);
					if (!isOpen) {
						setTerm("");
						setError("");
					}
				}}
			>
				<DialogTrigger asChild>
					<Button variant="destructive">Add New Term</Button>
				</DialogTrigger>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Add Term</DialogTitle>
						<DialogDescription>Enter term information below</DialogDescription>
					</DialogHeader>
					<div className="space-y-2">
						<Input
							value={term}
							onChange={(e) => {
								setTerm(e.target.value);
								setError("");
							}}
							placeholder="Term (e.g., 1st, 2nd)"
						/>
						{error && <p className="text-red-500 text-xs">{error}</p>}
					</div>
					<DialogFooter>
						<Button
							onClick={handleAddTerm}
							className="w-full facilium-bg-indigo hover:opacity-80"
						>
							Add now
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
};

export default AddTerm;
