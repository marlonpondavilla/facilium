"use client";

import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuSub,
	DropdownMenuSubTrigger,
	DropdownMenuPortal,
	DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { EllipsisVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogCancel,
	AlertDialogAction,
} from "@/components/ui/alert-dialog";
import toast from "react-hot-toast";
import { deleteDocumentById, updateDocumentById } from "@/data/actions";

type BuildingProps = {
	building: {
		id: string;
		buildingName: string;
	};
};

export function BuildingActionsDropdown({ building }: BuildingProps) {
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [newBuildingName, setNewBuildingName] = useState("");

	const handleDelete = async () => {
		try {
			await deleteDocumentById({
				id: building.id,
				collectionName: "buildings",
				relatedFields: [
					{ collectionName: "classrooms", fieldName: "buildingId" },
				],
			});
			toast.success("Deleted successfully");
			setTimeout(() => {
				window.location.reload();
			}, 1000);
		} catch (e: unknown) {
			const error = e as { message?: string };
			toast.error(error.message ?? "error deleting a building");
		}
	};

	const handleUpdate = async () => {
		try {
			await updateDocumentById(
				building.id,
				"building",
				"buildingName",
				newBuildingName
			);
			toast.success("Updated successfully");
			setTimeout(() => {
				window.location.reload();
			}, 2000);
		} catch (e: unknown) {
			const error = e as { message?: string };
			toast.error(error.message ?? "error deleting a building");
		}
	};

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<button>
						<EllipsisVertical className="w-5 h-5" />
					</button>
				</DropdownMenuTrigger>

				<DropdownMenuContent>
					<DropdownMenuLabel>Actions</DropdownMenuLabel>
					<DropdownMenuSeparator />
					<DropdownMenuGroup>
						<DropdownMenuItem onSelect={() => setDeleteOpen(true)}>
							Delete
						</DropdownMenuItem>

						<DropdownMenuSub>
							<DropdownMenuSubTrigger>Update</DropdownMenuSubTrigger>
							<DropdownMenuPortal>
								<DropdownMenuSubContent>
									<div className="space-y-2">
										<Input
											placeholder="New building name"
											name={building.id}
											onChange={(e) => setNewBuildingName(e.target.value)}
										/>
										<Button
											variant="destructive"
											onClick={handleUpdate}
											className="w-full h-8"
										>
											Update
										</Button>
									</div>
								</DropdownMenuSubContent>
							</DropdownMenuPortal>
						</DropdownMenuSub>
					</DropdownMenuGroup>
				</DropdownMenuContent>
			</DropdownMenu>

			<AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							Are you sure you want to delete {building.buildingName}?
						</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							className="bg-red-600 hover:bg-red-700"
							onClick={() => {
								setDeleteOpen(false);
								handleDelete();
							}}
						>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
