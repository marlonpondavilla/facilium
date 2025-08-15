"use client";

import React, { useState } from "react";
import {
	Dialog,
	DialogClose,
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
import { setBuilding } from "./actions";
import { BuildingCreate } from "@/types/buildingType";

const NewBuildingModal = () => {
	const [error, setError] = useState(false);
	const [open, setOpen] = useState(false);

	const [buildingData, setBuildingData] = useState<BuildingCreate>({
		buildingName: "",
		classroom: 0,
	});

	const handleAddBuilding = async () => {
		if (!buildingData.buildingName.trim()) {
			setError(true);
			return;
		}

		try {
			const result = await setBuilding(buildingData);
			if (result?.success) {
				toast.success("New Building added");
				setTimeout(() => {
					window.location.reload();
				}, 2000);
			}
		} catch (e: unknown) {
			const error = e as { message?: string };
			toast.error(error.message || "Error on adding building");
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
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
						}}
						className={`${error ? "border border-red-500" : ""} mt-2`}
					/>
					{error && (
						<p className={`${error ? "text-red-500 text-sm" : ""}`}>
							please provide a Building Name
						</p>
					)}
				</DialogHeader>
				<DialogFooter>
					<DialogClose asChild>
						<Button variant={"destructive"} onClick={handleAddBuilding}>
							Add New
						</Button>
					</DialogClose>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default NewBuildingModal;
