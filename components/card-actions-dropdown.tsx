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
import { auth } from "@/firebase/client";
import { EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogCancel,
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
	requirePasswordForDelete?: boolean; // if true, require password re-auth in delete dialog
	requireNameMatch?: boolean; // if false, skip typing the name confirmation
};

export const CardActionsDropdown = ({
	itemName,
	onDelete,
	onUpdate,
	updateLabel,
	updatePlaceholder,
	extraField,
	deleteContext,
	requirePasswordForDelete = false,
	requireNameMatch = true,
}: CardActionsDropdownProps) => {
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [dropDownOpen, setDropDownOpen] = useState(false);
	const [inputError, setInputError] = useState("");
	const [updateValue, setUpdateValue] = useState("");
	const [extraUpdateValue, setExtraUpdateValue] = useState("");
	const [deleteConfirmValue, setDeleteConfirmValue] = useState("");
	const [deleteError, setDeleteError] = useState("");
	const [deletePassword, setDeletePassword] = useState("");
	const [passwordError, setPasswordError] = useState("");
	const [verifyingPassword, setVerifyingPassword] = useState(false);
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
		// Name confirmation only if required
		if (requireNameMatch && deleteConfirmValue.trim() !== itemName) {
			setDeleteError(`Please type "${itemName}" to confirm deletion`);
			return;
		}

		if (requirePasswordForDelete) {
			const ok = await runPasswordCheck();
			if (!ok) return; // passwordError already set
		}

		startTransition(async () => {
			try {
				await onDelete();
				toast.success("Deleted successfully");
				// Only close and reset after successful deletion
				setDropDownOpen(false);
				setDeleteOpen(false);
				setDeleteConfirmValue("");
				setDeleteError("");
				setDeletePassword("");
				setPasswordError("");
				router.refresh();
			} catch (e: unknown) {
				const error = e as { message?: string };
				setDeleteError(error.message ?? "Deletion failed. Please try again.");
				toast.error(error.message ?? "error deleting a building");
			}
		});
	};

	async function runPasswordCheck(): Promise<boolean> {
		setPasswordError("");
		if (!deletePassword.trim()) {
			setPasswordError("Password is required.");
			return false;
		}
		const user = auth.currentUser;
		if (!user) {
			setPasswordError("Not authenticated. Please re-login.");
			return false;
		}
		if (!user.email) {
			setPasswordError("User email missing.");
			return false;
		}
		const hasPasswordProvider = user.providerData.some(
			(p) => p.providerId === "password"
		);
		if (!hasPasswordProvider) {
			setPasswordError("Account has no password set.");
			return false;
		}
		try {
			setVerifyingPassword(true);
			const cred = EmailAuthProvider.credential(user.email, deletePassword);
			await reauthenticateWithCredential(user, cred);
			return true;
		} catch (e) {
			let msg = "Password verification failed.";
			if (e && typeof e === "object") {
				const fe = e as FirebaseError;
				switch (fe.code) {
					case "auth/wrong-password":
					case "auth/invalid-credential":
					case "auth/invalid-login-credentials":
						msg = "Incorrect password.";
						break;
					case "auth/too-many-requests":
						msg = "Too many attempts. Try again later.";
						break;
					case "auth/network-request-failed":
						msg = "Network error. Check connection.";
						break;
				}
			}
			setPasswordError(msg);
			return false;
		} finally {
			setVerifyingPassword(false);
		}
	}

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
						setDeleteConfirmValue("");
						setDeleteError("");
						setDeletePassword("");
						setPasswordError("");
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
						<AlertDialogDescription asChild>
							<div className="text-sm text-gray-600 leading-relaxed space-y-3">
								<p>
									You are about to permanently delete{" "}
									<strong className="text-gray-900">
										&ldquo;{itemName}&rdquo;
									</strong>
									.
								</p>
								{deleteContext?.cascadeDescription &&
									deleteContext.cascadeDescription.length > 0 && (
										<div className="bg-red-50 border border-red-200 rounded p-3 text-xs text-red-800 space-y-1">
											<p className="font-semibold">This will also remove:</p>
											<ul className="list-disc list-inside space-y-0.5">
												{deleteContext.cascadeDescription.map((d) => (
													<li key={d}>{d}</li>
												))}
											</ul>
											{deleteContext.destructiveWarning && (
												<p className="pt-1 text-red-600 font-medium">
													{deleteContext.destructiveWarning}
												</p>
											)}
										</div>
									)}
							</div>
						</AlertDialogDescription>
					</AlertDialogHeader>

					{requireNameMatch && (
						<div className="py-4 space-y-3">
							<div className="bg-red-50 border border-red-200 rounded-lg p-3">
								<p className="text-sm text-red-800 font-medium">
									Type the {deleteContext?.itemType?.toLowerCase() || "item"}{" "}
									name exactly to confirm:
								</p>
								<p className="text-sm text-red-600 font-mono bg-red-100 px-2 py-1 rounded mt-1">
									{itemName}
								</p>
							</div>
							<Input
								key={`delete-confirm-${itemName}`}
								placeholder={`Type "${itemName}"`}
								value={deleteConfirmValue}
								onChange={(e) => {
									setDeleteConfirmValue(e.target.value);
									setDeleteError("");
								}}
								className={
									deleteError
										? "border-red-500 focus:border-red-500 focus:ring-red-500"
										: deleteConfirmValue.trim() === itemName
										? "border-green-500 focus:border-green-500 focus:ring-green-500"
										: ""
								}
							/>
							{deleteError && (
								<p className="text-red-500 text-xs mt-1 flex items-center gap-1">
									<TriangleAlert className="w-3 h-3" />
									{deleteError}
								</p>
							)}
							{deleteConfirmValue.trim() === itemName && !deleteError && (
								<p className="text-green-600 text-xs mt-1 flex items-center gap-1">
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
									Name confirmed
								</p>
							)}
						</div>
					)}

					{requirePasswordForDelete && (
						<div className="space-y-2 mt-4 pt-4 border-t border-gray-200">
							<label className="text-xs font-medium text-gray-700">
								Enter your password to confirm
							</label>
							<Input
								placeholder="Password"
								type="password"
								value={deletePassword}
								onChange={(e) => {
									setDeletePassword(e.target.value);
									setPasswordError("");
								}}
								className={passwordError ? "border-red-500" : ""}
							/>
							{passwordError && (
								<p className="text-red-500 text-xs flex items-center gap-1">
									<TriangleAlert className="w-3 h-3" />
									{passwordError}
								</p>
							)}
							{verifyingPassword && (
								<p className="text-xs text-gray-500">Verifying password…</p>
							)}
						</div>
					)}

					<AlertDialogFooter className="gap-3 mt-6">
						<AlertDialogCancel className="flex-1">Cancel</AlertDialogCancel>
						<button
							type="button"
							className={`flex-1 inline-flex items-center justify-center gap-2 rounded-md text-white text-sm font-medium h-10 px-4 bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-300 disabled:text-gray-500 transition-all duration-200 ${
								isPending ? "opacity-50 cursor-not-allowed" : ""
							}`}
							onClick={(e) => {
								// Prevent Radix auto-close behavior (not using AlertDialogAction now anyway)
								e.preventDefault();
								void handleDeleteClick();
							}}
							disabled={
								isPending ||
								verifyingPassword ||
								(requireNameMatch && deleteConfirmValue.trim() !== itemName) ||
								(requirePasswordForDelete && !deletePassword)
							}
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
						</button>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
};

export default CardActionsDropdown;
