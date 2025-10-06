"use client";

import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import type { FirebaseError } from "firebase/app";
import { auth } from "@/firebase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import toast from "react-hot-toast";

const emailRegex = /[^@\s]+@[^@\s]+\.[^@\s]+/;

const ForgotPasswordDialog = () => {
	const [open, setOpen] = useState(false);
	const [email, setEmail] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const handleSubmit = async () => {
		setError("");
		if (!emailRegex.test(email)) {
			setError("Please enter a valid email address.");
			return;
		}
		try {
			setLoading(true);
			await sendPasswordResetEmail(auth, email.trim());
			toast.success("Password reset email sent. Check your inbox.");
			setOpen(false);
			setEmail("");
		} catch (e: unknown) {
			let message = "Failed to send reset email.";
			const err = e as Partial<FirebaseError> | Error | undefined;
			if (err && (err as FirebaseError).code) {
				const code = (err as FirebaseError).code;
				switch (code) {
					case "auth/invalid-email":
						message = "The email address is invalid.";
						break;
					case "auth/user-not-found":
						message = "No user found with this email.";
						break;
					case "auth/too-many-requests":
						message = "Too many attempts. Please try again later.";
						break;
					case "auth/network-request-failed":
						message = "Network error. Check your connection and try again.";
						break;
					default:
						message = (err as FirebaseError).message || message;
				}
			} else if (err instanceof Error) {
				message = err.message;
			}
			toast.error(message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button variant="link" className="px-0 h-auto font-normal text-sm">
					Forgot password?
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Reset your password</DialogTitle>
					<DialogDescription>
						Enter your account email. We&apos;ll send you a link to reset your
						password.
					</DialogDescription>
				</DialogHeader>
				<div className="grid gap-3 py-2">
					<Input
						type="email"
						placeholder="you@example.com"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
					/>
					{error && (
						<p className="text-sm text-red-600" role="alert">
							{error}
						</p>
					)}
				</div>
				<DialogFooter>
					<Button
						onClick={handleSubmit}
						disabled={loading || !email}
						className="w-full sm:w-auto"
					>
						{loading ? "Sending..." : "Send reset link"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default ForgotPasswordDialog;
