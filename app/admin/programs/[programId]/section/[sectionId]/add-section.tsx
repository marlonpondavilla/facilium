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
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	addDocumentToFirestore,
	checkIfDocumentExists,
	getSingleDocumentFromFirestore,
} from "@/data/actions";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState, useTransition } from "react";
import toast from "react-hot-toast";

type AddSectionButtonProps = {
	yearLevelId: string;
	programId: string;
	sectionName: string;
};

const AddSectionButton = ({ id }: { id: string }) => {
	const [open, setOpen] = useState(false);
	const [inputError, setInputError] = useState("");
	const [isPending, startTransition] = useTransition();
	const [suffix, setSuffix] = useState("");
	const [programCode, setProgramCode] = useState("");
	const [yearLevel, setYearLevel] = useState("");
	const [sectionData, setSectionData] = useState<AddSectionButtonProps>({
		yearLevelId: id,
		programId: "",
		sectionName: "",
	});
	const router = useRouter();
	const { programId } = useParams();

	// remove ordinals and get only the numebr
	const match = yearLevel.match(/^(\d+)(st|nd|rd|th)?$/);
	const yearLevelRemovedOrdinals = match ? match[1] : null;

	// display program code and yearlevel without the ordinals
	const sectionPrefix = `${programCode} - ${yearLevelRemovedOrdinals}`;

	// fetch the program code and year level
	useEffect(() => {
		const fetchData = async () => {
			if (!programId || !id) {
				return;
			}

			// fetch for programCode and yearLevel
			const programCodeResult = await getSingleDocumentFromFirestore(
				programId.toString(),
				"programs",
				"programCode"
			);

			const yearLevelResult = await getSingleDocumentFromFirestore(
				id,
				"year-levels",
				"yearLevel"
			);

			// end of fetching

			if (programCodeResult) {
				setProgramCode(programCodeResult);
			}

			if (yearLevelResult) {
				setYearLevel(yearLevelResult);
			}
		};

		fetchData();
	}, [programId, id]);

	// set the full section name everytime suffix is changed
	useEffect(() => {
		if (suffix && sectionPrefix) {
			setSectionData((prev) => ({
				...prev,
				programId: String(programId),
				sectionName: `${sectionPrefix}${suffix}`,
			}));
		}
	}, [suffix, sectionPrefix]);

	const alphabet = Array.from({ length: 26 }, (_, i) =>
		String.fromCharCode(65 + i)
	);

	const handleAddSection = async () => {
		if (!programCode || !yearLevelRemovedOrdinals) {
			toast.error("error in section prefix and year level value");
			setOpen(true);
			return;
		}

		if (!sectionData.sectionName) {
			setInputError("Please select a section");
			setOpen(true);
			return;
		}

		// return true if section exist already
		const isSectionExist = await checkIfDocumentExists(
			"sections",
			"sectionName",
			sectionData.sectionName
		);
		if (isSectionExist) {
			setInputError("Section already exist, please select another value.");
			setOpen(true);
			toast.error("Oops!");
			return;
		}

		// add section data to firestore
		const result = await addDocumentToFirestore("sections", {
			...sectionData,
			created: new Date().toISOString(),
		});

		if (result.success) {
			toast.success("New Section has been added");
			setOpen(false);
			startTransition(() => {
				router.refresh();
			});
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button variant={"destructive"}>Add New Section</Button>
			</DialogTrigger>
			<DialogContent className="w-1/4">
				<DialogHeader>
					<DialogTitle>Add Section</DialogTitle>
					<DialogDescription>Add section to {sectionPrefix}</DialogDescription>
				</DialogHeader>
				<div className="flex justify-center items-center gap-2">
					<p className="font-bold text-gray-500">{sectionPrefix}</p>
					<Select
						value={suffix}
						onValueChange={(val) => {
							setSuffix(val);
							setInputError("");
						}}
					>
						<SelectTrigger>
							<SelectValue placeholder="Section" />
						</SelectTrigger>
						<SelectContent>
							<SelectGroup className="h-20">
								{alphabet.map((char) => (
									<SelectItem key={char} value={char}>
										{char}
									</SelectItem>
								))}
							</SelectGroup>
						</SelectContent>
					</Select>
				</div>
				{inputError && (
					<p className="text-red-500 text-xs text-center">{inputError}</p>
				)}
				<DialogFooter>
					<Button
						onClick={handleAddSection}
						disabled={isPending}
						className="w-full facilium-bg-indigo hover:opacity-80"
					>
						Add now
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default AddSectionButton;
