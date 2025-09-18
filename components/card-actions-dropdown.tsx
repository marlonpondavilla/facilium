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
import { EllipsisVertical, TriangleAlert, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useTransition, useEffect } from "react";
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
	deleteContext?: {
		itemType: string; // e.g., "Building", "Program", "Classroom"
		cascadeDescription?: string[]; // Array of items that will be deleted
		destructiveWarning?: string; // Custom warning message
	};
};

const CardActionsDropdown = ({
	itemName,
	onDelete,
	onUpdate,
	updateLabel,
	updatePlaceholder,
	extraField,
	deleteContext,
}: CardActionsDropdownProps) => {
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [dropDownOpen, setDropDownOpen] = useState(false);
	const [inputError, setInputError] = useState("");
	const [updateValue, setUpdateValue] = useState("");
	const [extraUpdateValue, setExtraUpdateValue] = useState("");
	const [deleteConfirmValue, setDeleteConfirmValue] = useState("");
	const [deleteError, setDeleteError] = useState("");
	const [isPending, startTransition] = useTransition();
	const [isMounted, setIsMounted] = useState(false);

	const router = useRouter();

	useEffect(() => {
		setIsMounted(true);
	}, []);

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
		// Check if user typed the correct item name
		if (deleteConfirmValue.trim() !== itemName) {
			setDeleteError(`Please type "${itemName}" to confirm deletion`);
			return;
		}

		startTransition(async () => {
			try {
				setDropDownOpen(false);
				setDeleteOpen(false);
				setDeleteConfirmValue("");
				setDeleteError("");
				await onDelete();
				toast.success("Deleted successfully");
				router.refresh();
			} catch (e: unknown) {
				const error = e as { message?: string };
				toast.error(error.message ?? "error deleting a building");
			}
		});
	};

	// Prevent hydration mismatch by not rendering interactive elements until client-side mounted
	if (!isMounted) {
		return (
			<button suppressHydrationWarning aria-label="Actions menu">
				<EllipsisVertical className="w-5 h-5" />
			</button>
		);
	}

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

			<AlertDialog
				key={`delete-dialog-${itemName}`}
				open={deleteOpen}
				onOpenChange={(open) => {
					setDeleteOpen(open);
					if (!open) {
						// Reset confirmation input when dialog closes
						setDeleteConfirmValue("");
						setDeleteError("");
					}
				}}
			>
				<AlertDialogContent className="max-w-md" suppressHydrationWarning>
					<AlertDialogHeader>
						<AlertDialogTitle className="flex items-center gap-3 text-red-600">
							<div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
								<TriangleAlert className="w-5 h-5 text-red-600" />
							</div>
							<span className="text-gray-900">
								Delete {deleteContext?.itemType || "Item"}
							</span>
						</AlertDialogTitle>
						<AlertDialogDescription className="text-sm text-gray-600 leading-relaxed">
							You are about to permanently delete{" "}
							<strong className="text-gray-900">
								&ldquo;{itemName}&rdquo;
							</strong>
							{deleteContext?.cascadeDescription &&
								deleteContext.cascadeDescription.length > 0 && (
									<>
										{" "}
										and{" "}
										<strong className="text-red-600">
											ALL related data
										</strong>{" "}
										including:
									</>
								)}
						</AlertDialogDescription>
					</AlertDialogHeader>

					{deleteContext?.cascadeDescription &&
						deleteContext.cascadeDescription.length > 0 && (
							<div className="px-6 pb-2">
								<ul className="list-disc list-inside space-y-1 text-xs text-gray-600">
									{deleteContext.cascadeDescription.map((item, index) => (
										<li key={index}>{item}</li>
									))}
								</ul>
							</div>
						)}

					<div className="px-6 pb-2">
						<p className="text-red-600 text-sm font-medium">
							{deleteContext?.destructiveWarning ||
								"This action cannot be undone."}
						</p>
					</div>

					<div className="py-4 space-y-3">
						<div className="bg-red-50 border border-red-200 rounded-lg p-3">
							<p className="text-sm text-red-800 font-medium">
								To confirm this destructive action, please type the{" "}
								{deleteContext?.itemType?.toLowerCase() || "item"} name exactly
								as shown:
							</p>
							<p className="text-sm text-red-600 font-mono bg-red-100 px-2 py-1 rounded mt-1">
								{itemName}
							</p>
						</div>
						<Input
							key={`delete-confirm-${itemName}`}
							placeholder={`Type "${itemName}" exactly as shown above`}
							value={deleteConfirmValue}
							onChange={(e) => {
								setDeleteConfirmValue(e.target.value);
								setDeleteError("");
							}}
							className={`${
								deleteError
									? "border-red-500 focus:border-red-500 focus:ring-red-500"
									: deleteConfirmValue.trim() === itemName
									? "border-green-500 focus:border-green-500 focus:ring-green-500"
									: ""
							}`}
							suppressHydrationWarning
						/>
						{deleteError && (
							<p
								className="text-red-500 text-xs mt-1 flex items-center gap-1"
								suppressHydrationWarning
							>
								<TriangleAlert className="w-3 h-3" />
								{deleteError}
							</p>
						)}
						{deleteConfirmValue.trim() === itemName && !deleteError && (
							<p
								className="text-green-600 text-xs mt-1 flex items-center gap-1"
								suppressHydrationWarning
							>
								<svg
									className="w-3 h-3"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M5 13l4 4L19 7"
									/>
								</svg>
								Confirmation verified - you may now proceed with deletion
							</p>
						)}
					</div>

					<AlertDialogFooter className="gap-3">
						<AlertDialogCancel className="flex-1">Cancel</AlertDialogCancel>
						<AlertDialogAction
							className={`flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:text-gray-500 transition-all duration-200 ${
								isPending ? "opacity-50 cursor-not-allowed" : ""
							}`}
							onClick={handleDeleteClick}
							disabled={isPending || deleteConfirmValue.trim() !== itemName}
						>
							{isPending ? (
								<>
									<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
									Deleting...
								</>
							) : (
								<>
									<Trash2 className="w-4 h-4" />
									Delete {deleteContext?.itemType || "Item"}
								</>
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
};

export default CardActionsDropdown;
