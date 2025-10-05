"use client";

import React, { useMemo, useState } from "react";
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "./ui/alert-dialog";
import { TriangleAlert, Check } from "lucide-react";
import { Input } from "./ui/input";
import { auth } from "@/firebase/client";
import { EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { FirebaseError } from "firebase/app";

interface ConfirmationHandleDialogProps {
	trigger: React.ReactNode;
	title: string;
	description: string;
	label: string;
	onConfirm: () => void | boolean | Promise<void | boolean>;
	requireEmail?: boolean;
	expectedEmail?: string;
	emailPlaceholder?: string;
	confirmButtonText?: string;
	requirePassword?: boolean;
	passwordPlaceholder?: string;
	contentClassName?: string;
	// New: require typing a specific text (e.g., "confirm") before allowing action
	requireText?: boolean;
	expectedText?: string; // default: "confirm"
	textPlaceholder?: string; // default: 'Type "confirm"'
	textLabel?: string; // default: 'Type "confirm" to proceed'
	caseSensitive?: boolean; // default: false
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
	requirePassword = false,
	passwordPlaceholder = "Enter your password",
	contentClassName,
	requireText = false,
	expectedText = "confirm",
	textPlaceholder = 'Type "confirm"',
	textLabel,
	caseSensitive = false,
}) => {
	const [open, setOpen] = useState(false);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [text, setText] = useState("");
	const [error, setError] = useState<string>("");
	const [isVerifying, setIsVerifying] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const normalizedExpected = useMemo(
		() => (expectedEmail ? expectedEmail.trim().toLowerCase() : undefined),
		[expectedEmail]
	);

	const emailMatches = useMemo(() => {
		if (!requireEmail) return true;
		const entered = email.trim().toLowerCase();
		if (!entered) return false;
		if (normalizedExpected) return entered === normalizedExpected;
		return true; // no expected email provided, any non-empty email accepted
	}, [requireEmail, email, normalizedExpected]);

	const textMatches = useMemo(() => {
		if (!requireText) return true;
		const entered = caseSensitive ? text : text.trim().toLowerCase();
		const expected = caseSensitive
			? expectedText
			: expectedText.trim().toLowerCase();
		if (!entered) return false;
		return entered === expected;
	}, [requireText, text, expectedText, caseSensitive]);

	const canConfirm =
		(!requireEmail || emailMatches) &&
		(!requireText || textMatches) &&
		(!requirePassword || password.trim().length > 0) &&
		!isVerifying &&
		!isSubmitting;

	const resetState = () => {
		setEmail("");
		setPassword("");
		setText("");
		setError("");
		setIsVerifying(false);
	};

	const handleOpenChange = (next: boolean) => {
		if (!next) {
			// closing dialog: reset ephemeral state
			resetState();
		}
		setOpen(next);
	};

	const runPasswordCheck = async () => {
		if (!requirePassword) return true;
		if (!password.trim()) {
			setError("Password is required.");
			return false;
		}
		const user = auth.currentUser;
		if (!user) {
			setError("Not authenticated. Please re-login.");
			return false;
		}
		if (!user.email) {
			setError("Account email not found.");
			return false;
		}
		// Ensure this account actually supports password auth
		const hasPasswordProvider = user.providerData.some(
			(p) => p.providerId === "password"
		);
		if (!hasPasswordProvider) {
			setError(
				"This account was created with a different sign-in method. Set a password in account settings first."
			);
			return false;
		}
		try {
			setIsVerifying(true);
			const credential = EmailAuthProvider.credential(user.email, password);
			await reauthenticateWithCredential(user, credential);
			return true;
		} catch (e: unknown) {
			let message = "Password verification failed.";
			if (e && typeof e === "object") {
				const fe = e as FirebaseError;
				switch (fe.code) {
					case "auth/invalid-credential":
					case "auth/wrong-password":
					case "auth/invalid-login-credentials":
						message = "Incorrect password.";
						break;
					case "auth/too-many-requests":
						message =
							"Too many attempts. Please wait a moment before trying again.";
						break;
					case "auth/user-mismatch":
						message = "Credential does not match the current user.";
						break;
					case "auth/network-request-failed":
						message = "Network error. Check your connection and retry.";
						break;
					case "auth/user-disabled":
						message = "Your account is disabled.";
						break;
				}
			}
			console.warn("Password re-auth failed", e);
			setError(message);
			return false;
		} finally {
			setIsVerifying(false);
		}
	};

	const handleConfirm = async () => {
		setError("");
		if (requireEmail) {
			const trimmed = email.trim();
			if (!trimmed) {
				setError("Please type your email to confirm.");
				return;
			}
			if (normalizedExpected && trimmed.toLowerCase() !== normalizedExpected) {
				setError("Email does not match your account.");
				return;
			}
		}
		if (requireText) {
			if (!text.trim()) {
				setError(`Please type "${expectedText}" to confirm.`);
				return;
			}
			const entered = caseSensitive ? text : text.trim().toLowerCase();
			const expected = caseSensitive
				? expectedText
				: expectedText.trim().toLowerCase();
			if (entered !== expected) {
				setError(`Confirmation text does not match "${expectedText}".`);
				return;
			}
		}
		const passwordOk = await runPasswordCheck();
		if (!passwordOk) return; // keep dialog open, show error

		setIsSubmitting(true);
		try {
			const result = await onConfirm();
			if (result === false) {
				// caller signals to keep dialog open (e.g., extra validation)
				return;
			}
			// success
			setOpen(false);
			resetState();
		} catch (e) {
			console.error("Confirmation action failed", e);
			setError(
				(e as { message?: string })?.message ||
					"Submission failed. Please try again."
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	// Ensure trigger click always opens even if original onClick stops propagation
	const renderTrigger = () => {
		if (React.isValidElement(trigger)) {
			const trigEl = trigger as React.ReactElement<
				Record<string, unknown> & {
					onClick?: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
				}
			>;
			const originalOnClick = trigEl.props.onClick;
			return React.cloneElement(trigEl, {
				onClick: (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
					if (originalOnClick) originalOnClick(e);
					if (!e.defaultPrevented) setOpen(true);
				},
			});
		}
		// Fallback wrapper if not a valid element (string / fragment)
		return (
			<button
				type="button"
				onClick={() => setOpen(true)}
				className="inline-flex items-center"
			>
				{trigger}
			</button>
		);
	};

	return (
		<AlertDialog open={open} onOpenChange={handleOpenChange}>
			<AlertDialogTrigger asChild>{renderTrigger()}</AlertDialogTrigger>
			<AlertDialogContent
				className={contentClassName}
				onEscapeKeyDown={(e) => {
					if (isVerifying || isSubmitting) e.preventDefault();
				}}
			>
				<AlertDialogHeader>
					<AlertDialogTitle className="facilium-color-indigo flex gap-2 items-center">
						{label.toLowerCase().includes("delete") && (
							<TriangleAlert className="text-red-500" />
						)}
						{title}
					</AlertDialogTitle>
					<AlertDialogDescription className="text-sm text-muted-foreground">
						{description}
					</AlertDialogDescription>
				</AlertDialogHeader>
				{(requireEmail || requirePassword || requireText) && (
					<div className="space-y-4 py-2">
						{requireEmail && (
							<div className="space-y-2">
								<label className="text-xs font-medium text-gray-700">
									To proceed, type your email address
								</label>
								<Input
									type="email"
									inputMode="email"
									placeholder={emailPlaceholder}
									value={email}
									className={[
										requireEmail && email && emailMatches
											? "border-green-500 focus-visible:ring-green-500"
											: "",
										error && !emailMatches
											? "border-red-500 focus-visible:ring-red-500"
											: "",
									]
										.filter(Boolean)
										.join(" ")}
									onChange={(e) => {
										setEmail(e.target.value);
										if (error) setError("");
									}}
								/>
								{requireEmail && email && (
									<div className="flex items-center gap-2 min-h-5">
										{emailMatches ? (
											<>
												<Check className="w-4 h-4 text-green-600" />
												<p className="text-[11px] text-green-700">
													Email matches.
												</p>
											</>
										) : (
											<p className="text-[11px] text-gray-500">
												Must match your account email.
											</p>
										)}
									</div>
								)}
							</div>
						)}
						{requireText && (
							<div className="space-y-2">
								<label className="text-xs font-medium text-gray-700">
									{textLabel ?? 'Type "confirm" to proceed'}
								</label>
								<Input
									type="text"
									placeholder={textPlaceholder}
									value={text}
									onChange={(e) => {
										setText(e.target.value);
										if (error) setError("");
									}}
									className={[
										requireText && text && textMatches
											? "border-green-500 focus-visible:ring-green-500"
											: "",
										error && !textMatches
											? "border-red-500 focus-visible:ring-red-500"
											: "",
									]
										.filter(Boolean)
										.join(" ")}
								/>
								{requireText && text && (
									<div className="flex items-center gap-2 min-h-5">
										{textMatches ? (
											<>
												<Check className="w-4 h-4 text-green-600" />
												<p className="text-[11px] text-green-700">
													Looks good.
												</p>
											</>
										) : (
											<p className="text-[11px] text-gray-500">
												Type{" "}
												{caseSensitive
													? "exactly"
													: '"confirm" (not case-sensitive)'}{" "}
												to enable.
											</p>
										)}
									</div>
								)}
							</div>
						)}
						{requirePassword && (
							<div className="space-y-2">
								<label className="text-xs font-medium text-gray-700">
									Enter your password to confirm
								</label>
								<Input
									type="password"
									autoComplete="current-password"
									placeholder={passwordPlaceholder}
									value={password}
									onChange={(e) => {
										setPassword(e.target.value);
										if (error) setError("");
									}}
									className={
										error ? "border-red-500 focus-visible:ring-red-500" : ""
									}
								/>
							</div>
						)}
						{error && <p className="text-[11px] text-red-600">{error}</p>}
					</div>
				)}
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isVerifying || isSubmitting}>
						Cancel
					</AlertDialogCancel>
					<button
						type="button"
						onClick={handleConfirm}
						disabled={!canConfirm}
						className="bg-red-500 text-white rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition"
					>
						{isVerifying
							? "Verifying..."
							: isSubmitting
							? "Submitting..."
							: confirmButtonText ?? `Yes, ${label}`}
					</button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};

export default ConfirmationHandleDialog;
