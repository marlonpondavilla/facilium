"use client";

import React, { useMemo, useState } from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "./ui/alert-dialog";
import { TriangleAlert } from "lucide-react";
import { Input } from "./ui/input";
import { Check } from "lucide-react";

interface ConfirmationHandleDialogProps {
	trigger: React.ReactNode;
	title: string;
	description: string;
	label: string;
	onConfirm: () => void;
	// Optional email confirmation gate (production safety)
	requireEmail?: boolean;
	expectedEmail?: string;
	emailPlaceholder?: string;
	confirmButtonText?: string;
}

const ConfirmationHandleDialog: React.FC<ConfirmationHandleDialogProps> = ({
	trigger,
	title,
	description,
	label,
	onConfirm,
	requireEmail = false,
	expectedEmail,
	emailPlaceholder = "your.email@domain.com",
	confirmButtonText,
}) => {
	const [email, setEmail] = useState("");
	const [error, setError] = useState<string>("");

	const normalizedExpected = useMemo(
		() => (expectedEmail ? expectedEmail.trim().toLowerCase() : undefined),
		[expectedEmail]
	);

	const canConfirm = useMemo(() => {
		if (!requireEmail) return true;
		const entered = email.trim().toLowerCase();
		if (!entered) return false;
		if (normalizedExpected) return entered === normalizedExpected;
		return true;
	}, [requireEmail, email, normalizedExpected]);

	const handleConfirmClick = () => {
		if (requireEmail) {
			const entered = email.trim();
			if (!entered) {
				setError("Please type your email to confirm.");
				return;
			}
			if (normalizedExpected && entered.toLowerCase() !== normalizedExpected) {
				setError("Email does not match your account. Please try again.");
				return;
			}
		}
		onConfirm();
	};

	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle className="facilium-color-indigo flex gap-2">
						{label.includes("delete") && (
							<TriangleAlert className="text-red-500" />
						)}
						{title}
					</AlertDialogTitle>
					<AlertDialogDescription className="text-sm text-muted-foreground">
						{description}
					</AlertDialogDescription>
				</AlertDialogHeader>
				{requireEmail && (
					<div className="space-y-2 py-2">
						<label className="text-xs font-medium text-gray-700">
							To proceed, type your email address
						</label>
						<Input
							type="email"
							inputMode="email"
							autoComplete="email"
							placeholder={emailPlaceholder}
							value={email}
							className={[
								normalizedExpected &&
								email.trim().toLowerCase() === normalizedExpected
									? "border-green-500 focus-visible:ring-green-500"
									: "",
								error ? "border-red-500 focus-visible:ring-red-500" : "",
							]
								.filter(Boolean)
								.join(" ")}
							onChange={(e) => {
								setEmail(e.target.value);
								if (error) setError("");
							}}
						/>
						{normalizedExpected && (
							<div className="flex items-center gap-2 min-h-5">
								{email.trim().toLowerCase() === normalizedExpected ? (
									<>
										<Check className="w-4 h-4 text-green-600" />
										<p className="text-[11px] text-green-700">
											Email matches your account. You can proceed.
										</p>
									</>
								) : (
									<p className="text-[11px] text-gray-500">
										Must match your account email.
									</p>
								)}
							</div>
						)}
						{error && <p className="text-[11px] text-red-600">{error}</p>}
					</div>
				)}
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction
						onClick={handleConfirmClick}
						disabled={!canConfirm}
						className="bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 cursor-pointer transition"
					>
						{confirmButtonText ?? `Yes, ${label}`}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};

export default ConfirmationHandleDialog;
