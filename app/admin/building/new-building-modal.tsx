"use client";

import React, { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "../../../components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HousePlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import { BuildingCreate } from "@/types/buildingType";
import { addDocumentToFirestore, checkIfDocumentExists } from "@/data/actions";
import { useRouter } from "next/navigation";

const NewBuildingModal = () => {
	const router = useRouter();
	const [error, setError] = useState(false);
	const [existError, setExistError] = useState(false);
	const [open, setOpen] = useState(false);
	const [submitting, setSubmitting] = useState(false);

	const [buildingData, setBuildingData] = useState<BuildingCreate>({
		buildingName: "",
		classroom: 0,
	});

	const handleAddBuilding = async () => {
		if (!buildingData.buildingName.trim()) {
			setError(true);
			setOpen(true);
			return;
		}

		setSubmitting(true);

		try {
			const isBuildingExist = await checkIfDocumentExists(
				"buildings",
				"buildingName",
				buildingData.buildingName
			);

			if (isBuildingExist) {
				setExistError(true);
				setOpen(true);
				return;
			}

			const result = await addDocumentToFirestore("buildings", {
				...buildingData,
				created: new Date().toISOString(),
			});

			if (result?.success) {
				toast.success("New Building added");
				setError(false);
				setSubmitting(false);
				setOpen(false);
				router.refresh();
			}
		} catch (e: unknown) {
			const error = e as { message?: string };
			toast.error(error.message || "Error on adding building");
		}
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(isOpen) => {
				setOpen(isOpen);
				if (!isOpen) {
					setBuildingData({
						buildingName: "",
						classroom: 0,
					});
				}
			}}
		>
			<DialogTrigger asChild>
				<Button
					variant="link"
					className="hover:bg-blue-700 transition text-white text-base"
				>
					<HousePlus className="w-5 h-5" />
					Add New Building
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Add Building</DialogTitle>
					<DialogDescription>
						Enter building information below
					</DialogDescription>
					<Input
						type="text"
						placeholder="Building Name"
						onChange={(e) => {
							setBuildingData({
								...buildingData,
								buildingName: e.target.value,
							});
							setError(false);
							setExistError(false);
							setSubmitting(false);
						}}
						className={`${error ? "border border-red-500" : ""} mt-2`}
					/>
					{error && (
						<p className="text-red-500 text-sm">
							please provide a Building Name
						</p>
					)}
					{existError && (
						<p className="text-red-500 text-sm">
							Building Name {buildingData.buildingName} already exists.
						</p>
					)}
				</DialogHeader>
				<DialogFooter>
					<Button
						variant={"destructive"}
						onClick={handleAddBuilding}
						disabled={submitting}
						className="flex w-full mt-2"
					>
						Add New
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default NewBuildingModal;
