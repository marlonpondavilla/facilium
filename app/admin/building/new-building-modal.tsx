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
import { HousePlus, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import { BuildingCreate } from "@/types/buildingType";
import { addBuildingAction } from "./actions";
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

		const res = await addBuildingAction({
			buildingCode: "",
			buildingName: buildingData.buildingName,
		});

		if (!res.success) {
			if (res.error?.includes("exists")) {
				setExistError(true);
			} else {
				toast.error(res.error || "Failed to add building");
			}
			setSubmitting(false);
			return;
		}

		toast.success("New Building added");
		setError(false);
		setSubmitting(false);
		setOpen(false);
		// Keep router.refresh as a safety, though revalidatePath should handle it
		router.refresh();
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
				<Button variant="default" className="text-base">
					<HousePlus className="w-5 h-5 mr-1" />
					Add Building
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
						variant="default"
						onClick={handleAddBuilding}
						disabled={submitting}
						className="flex w-full mt-2 justify-center"
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

export default NewBuildingModal;
