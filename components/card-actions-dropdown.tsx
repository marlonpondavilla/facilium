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
import { useState, useTransition } from "react";
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
import { useRouter } from "next/navigation";

type CardActionsDropdownProps = {
	itemName: string;
	onDelete: () => Promise<void>;
	onUpdate: (value: string) => Promise<void>;
	updateLabel: string;
	updatePlaceholder: string;
	extraField?: {
		onExtraUpdate: (extraValue: string) => Promise<void>;
		extraUpdatePlaceholder: string;
	};
};

const CardActionsDropdown = ({
	itemName,
	onDelete,
	onUpdate,
	updateLabel,
	updatePlaceholder,
	extraField,
}: CardActionsDropdownProps) => {
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [dropDownOpen, setDropDownOpen] = useState(false);
	const [inputError, setInputError] = useState("");
	const [updateValue, setUpdateValue] = useState("");
	const [extraUpdateValue, setExtraUpdateValue] = useState("");
	const [isPending, startTransition] = useTransition();

	const router = useRouter();

	const handleUpdateClick = async () => {
		const trimmedName = updateValue.trim();
		const extraTrimmedName = extraUpdateValue.trim();

		if (trimmedName === "" || (extraField && extraTrimmedName === "")) {
			setInputError("Field cannot be empty");
			toast.error("Oops!");
			return;
		}

		if (
			trimmedName.length > 20 ||
			(extraField && extraTrimmedName.length > 50)
		) {
			setInputError("Name is too long");
			toast.error("Oops!");
			return;
		}

		setInputError("");

		startTransition(async () => {
			try {
				// passing the name to the async update in parent component
				await onUpdate(trimmedName);
				// checks if extra field has data then update it
				await extraField?.onExtraUpdate(extraTrimmedName);
				setDropDownOpen(false);
				toast.success("Updated successfully");
				router.refresh();
			} catch (e: unknown) {
				const error = e as { message?: string };
				toast.error(error.message ?? "error deleting a building");
			}
		});
	};

	const handleDeleteClick = async () => {
		startTransition(async () => {
			try {
				setDeleteOpen(false);
				await onDelete();
				toast.success("Deleted successfully");
				router.refresh();
			} catch (e: unknown) {
				const error = e as { message?: string };
				toast.error(error.message ?? "error deleting a building");
			}
		});
	};

	return (
		<>
			<DropdownMenu open={dropDownOpen} onOpenChange={setDropDownOpen}>
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
							<DropdownMenuSubTrigger>{updateLabel}</DropdownMenuSubTrigger>
							<DropdownMenuPortal>
								<DropdownMenuSubContent>
									<div className="space-y-2 p-4">
										<Input
											placeholder={updatePlaceholder}
											value={updateValue}
											onChange={(e) => {
												setUpdateValue(e.target.value);
												setInputError("");
											}}
											className={`${inputError ? "border border-red-500" : ""}`}
										/>
										{extraField && (
											<Input
												placeholder={extraField.extraUpdatePlaceholder}
												value={extraUpdateValue}
												onChange={(e) => {
													setExtraUpdateValue(e.target.value);
													setInputError("");
												}}
												className={`${
													inputError ? "border border-red-500" : ""
												}`}
											/>
										)}
										{inputError && (
											<p className="text-red-500 text-xs">{inputError}</p>
										)}
										<Button
											variant="destructive"
											onClick={handleUpdateClick}
											className="w-full h-8 mt-2"
											disabled={isPending}
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
							Are you sure you want to delete {itemName}?
						</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							className="bg-red-600 hover:bg-red-700"
							onClick={handleDeleteClick}
							disabled={isPending}
						>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
};

export default CardActionsDropdown;
