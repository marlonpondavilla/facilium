"use client";

import React, { useTransition } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { useAuth } from "@/context/auth";
import {
	EmailAuthProvider,
	reauthenticateWithCredential,
	updatePassword,
	signOut,
} from "firebase/auth";
import { auth } from "@/firebase/client";
import { updateCurrentUserName } from "@/data/actions";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "./ui/form";
import { PasswordInput } from "./ui/password-input";
import LogoutAuthButton from "./logout";

type UserProfile = {
	id: string;
	uid: string;
	email?: string;
	firstName: string;
	middleName?: string;
	lastName: string;
	degreeEarned?: string;
	designation?: string;
	department?: string;
	created?: Date | string | { toDate: () => Date } | null;
};

interface WithToDate {
	toDate: () => Date;
}

const hasToDate = (v: unknown): v is { toDate: () => Date } =>
	typeof v === "object" &&
	v !== null &&
	"toDate" in (v as object) &&
	typeof (v as WithToDate).toDate === "function";

const fullName = (u: UserProfile) =>
	`${(u.firstName ?? "").trim()}${
		u.middleName ? ` ${u.middleName.trim()}` : ""
	} ${u.lastName ?? ""}`
		.replace(/\s+/g, " ")
		.trim();

const initials = (first: string, last: string) =>
	`${first?.[0] ?? "?"}${last?.[0] ?? "?"}`.toUpperCase();

const formatDate = (
	value: Date | string | { toDate: () => Date } | null | undefined
) => {
	if (!value) return "—";
	try {
		const d = hasToDate(value)
			? value.toDate()
			: new Date(value as Date | string);
		if (Number.isNaN(d.getTime())) return "—";
		return d.toLocaleDateString();
	} catch {
		return "—";
	}
};

export default function FacultyProfile({ user }: { user: UserProfile | null }) {
	const router = useRouter();
	const authCtx = useAuth();
	const [isEditing, setIsEditing] = React.useState(false);
	const [isPending, startTransition] = useTransition();
	const [isPwPending, startPwTransition] = useTransition();
	const [isPwEditing, setIsPwEditing] = React.useState(false);

	// Name form
	const nameSchema = z.object({
		firstName: z.string().trim().min(1, "First name is required"),
		middleName: z.string().optional(),
		lastName: z.string().trim().min(1, "Last name is required"),
	});
	type NameFormValues = z.infer<typeof nameSchema>;
	const form = useForm<NameFormValues>({
		resolver: zodResolver(nameSchema),
		defaultValues: {
			firstName: user?.firstName || "",
			middleName: user?.middleName || "",
			lastName: user?.lastName || "",
		},
		mode: "onBlur",
	});
	const resetToUser = () => {
		form.reset({
			firstName: user?.firstName || "",
			middleName: user?.middleName || "",
			lastName: user?.lastName || "",
		});
	};
	const onSubmit = (values: NameFormValues) => {
		startTransition(async () => {
			const res = await updateCurrentUserName(values);
			if (res?.success) {
				toast.success("Your name was updated.");
				setIsEditing(false);
				router.refresh();
			} else {
				toast.error(res?.error || "Failed to update name.");
			}
		});
	};

	// Change password form
	const passwordRegex =
		/^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/?]).{6,}$/;
	const pwSchema = z
		.object({
			currentPassword: z.string().min(6, "Current password is required"),
			newPassword: z.string().refine((val) => passwordRegex.test(val), {
				message:
					"At least 6 chars, include an uppercase and a special character",
			}),
			confirmPassword: z.string(),
		})
		.superRefine((data, ctx) => {
			if (data.newPassword !== data.confirmPassword) {
				ctx.addIssue({
					code: "custom",
					path: ["confirmPassword"],
					message: "Passwords do not match",
				});
			}
			if (data.newPassword === data.currentPassword) {
				ctx.addIssue({
					code: "custom",
					path: ["newPassword"],
					message: "New password must be different from current",
				});
			}
		});
	type PwFormValues = z.infer<typeof pwSchema>;
	const pwForm = useForm<PwFormValues>({
		resolver: zodResolver(pwSchema),
		defaultValues: {
			currentPassword: "",
			newPassword: "",
			confirmPassword: "",
		},
		mode: "onBlur",
	});
	const onChangePassword = (values: PwFormValues) => {
		startPwTransition(async () => {
			try {
				const current = auth.currentUser;
				if (!current || !current.email) {
					toast.error("Not authenticated.");
					return;
				}
				const cred = EmailAuthProvider.credential(
					current.email,
					values.currentPassword
				);
				await reauthenticateWithCredential(current, cred);
				await updatePassword(current, values.newPassword);
				toast.success("Password changed successfully.");
				pwForm.reset();
				if (authCtx?.logout) {
					await authCtx.logout();
				} else {
					await signOut(auth);
					router.replace("/login");
				}
			} catch (e: unknown) {
				// Normalized error code
				const err = e as { code?: string; message?: string } | undefined;
				const raw = err?.code || err?.message || "unknown";
				const code = typeof raw === "string" ? raw : String(raw ?? "unknown");
				// Map common auth errors from Identity Toolkit/Firebase
				if (
					code.includes("invalid-credential") ||
					code.includes("invalid-login-credentials") ||
					code.includes("wrong-password")
				) {
					pwForm.setError("currentPassword", {
						type: "manual",
						message: "Incorrect current password",
					});
					toast.error("Incorrect current password.");
					return;
				}
				if (code.includes("weak-password")) {
					pwForm.setError("newPassword", {
						type: "manual",
						message: "Password is too weak.",
					});
					toast.error("New password is too weak.");
					return;
				}
				if (code.includes("requires-recent-login")) {
					toast.error(
						"Please sign in again to change your password, then retry."
					);
					return;
				}
				if (code.includes("too-many-requests")) {
					toast.error("Too many attempts. Please wait a moment and try again.");
					return;
				}
				if (code.includes("network-request-failed")) {
					toast.error(
						"Network error. Check your internet connection and try again."
					);
					return;
				}
				if (code.includes("user-disabled")) {
					toast.error("This account is disabled. Contact the administrator.");
					return;
				}
				if (code.includes("invalid-api-key")) {
					toast.error("Configuration error (API key). Please contact support.");
					return;
				}
				toast.error("Failed to change password.");
			}
		});
	};

	if (!user) {
		return (
			<Card className="max-w-3xl mx-auto">
				<CardHeader>
					<CardTitle className="text-base">Profile</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-gray-600">
						We can&rsquo;t load your profile right now.
					</p>
				</CardContent>
			</Card>
		);
	}

	const name = fullName(user);
	const designation = (user.designation || "").trim() || "Faculty";
	const department = (user.department || "").trim() || "—";

	return (
		<div className="w-full max-w-5xl mx-auto space-y-4">
			<Card className="w-full">
				<CardHeader className="flex flex-row items-center gap-4">
					<Avatar className="size-14">
						<AvatarFallback>
							{initials(user.firstName, user.lastName)}
						</AvatarFallback>
					</Avatar>
					<div className="flex-1 min-w-0">
						<CardTitle className="text-xl truncate">{name}</CardTitle>
						<CardDescription className="text-xs">{`uid: ${user.uid}`}</CardDescription>
						<div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
							<Badge variant="outline">{designation}</Badge>
							<Badge>{department}</Badge>
						</div>
					</div>
					<div className="hidden sm:flex items-center gap-2">
						<Button
							size="sm"
							variant="outline"
							onClick={() => {
								resetToUser();
								setIsEditing(true);
							}}
							disabled={isEditing}
						>
							Edit Name
						</Button>
						<LogoutAuthButton />
					</div>
				</CardHeader>
				{isEditing && (
					<CardContent className="pt-0">
						<Form {...form}>
							<form
								onSubmit={form.handleSubmit(onSubmit)}
								className="grid grid-cols-1 sm:grid-cols-3 gap-4 border rounded-md p-4 focus-within:ring-2 focus-within:ring-primary/40"
							>
								<FormField
									control={form.control}
									name="firstName"
									render={({ field }) => (
										<FormItem>
											<FormLabel>First name</FormLabel>
											<FormControl>
												<Input placeholder="First name" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="middleName"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Middle name</FormLabel>
											<FormControl>
												<Input
													placeholder="Middle name (optional)"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="lastName"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Last name</FormLabel>
											<FormControl>
												<Input placeholder="Last name" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<div className="col-span-1 sm:col-span-3 flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2 sm:justify-end">
									<Button
										type="button"
										variant="ghost"
										onClick={() => {
											resetToUser();
											setIsEditing(false);
										}}
										disabled={isPending}
										className="w-full sm:w-auto"
									>
										Cancel
									</Button>
									<Button
										type="submit"
										disabled={isPending}
										className="w-full sm:w-auto"
									>
										{isPending ? "Saving..." : "Save"}
									</Button>
								</div>
							</form>
						</Form>
					</CardContent>
				)}
				<CardContent
					className={`grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm transition-opacity ${
						isEditing ? "opacity-60" : "opacity-100"
					}`}
				>
					<div>
						<p className="text-gray-500">Email</p>
						<p className="font-medium break-all">{user.email || "—"}</p>
					</div>
					<div>
						<p className="text-gray-500">Department</p>
						<p className="font-medium">{department}</p>
					</div>
					<div>
						<p className="text-gray-500">Designation</p>
						<p className="font-medium">
							{designation.toLowerCase() === "dean"
								? `Campus ${designation}`
								: designation}
						</p>
					</div>
					<div>
						<p className="text-gray-500">Degree</p>
						<p className="font-medium">{user.degreeEarned || "—"}</p>
					</div>
					<div>
						<p className="text-gray-500">Account Created</p>
						<p className="font-medium">{formatDate(user.created)}</p>
					</div>
				</CardContent>
			</Card>
			<div className="sm:hidden flex justify-end gap-2">
				{!isEditing && (
					<Button
						size="sm"
						variant="outline"
						onClick={() => {
							resetToUser();
							setIsEditing(true);
						}}
						disabled={isEditing}
					>
						Edit Name
					</Button>
				)}
				<LogoutAuthButton />
			</div>

			<Card className="w-full">
				<CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
					<div>
						<CardTitle className="text-base">Change Password</CardTitle>
						<CardDescription>
							Set a new password for your account.
						</CardDescription>
					</div>
					<div className="flex items-center gap-2">
						{isPwEditing ? (
							<Button
								size="sm"
								variant="ghost"
								onClick={() => {
									pwForm.reset();
									setIsPwEditing(false);
								}}
								disabled={isPwPending}
							>
								Cancel
							</Button>
						) : (
							<Button
								size="sm"
								variant="outline"
								onClick={() => setIsPwEditing(true)}
							>
								Enable Editing
							</Button>
						)}
					</div>
				</CardHeader>
				<CardContent>
					{!isPwEditing && (
						<p className="text-xs text-muted-foreground mb-2">
							Password editing is disabled. Click &quot;Enable Editing&quot; to
							make changes.
						</p>
					)}
					<Form {...pwForm}>
						<form
							onSubmit={pwForm.handleSubmit(onChangePassword)}
							className={`grid grid-cols-1 sm:grid-cols-2 gap-4 border rounded-md p-4 focus-within:ring-2 focus-within:ring-primary/40 ${
								isPwEditing ? "opacity-100" : "opacity-60 select-none"
							}`}
						>
							<FormField
								control={pwForm.control}
								name="currentPassword"
								render={({ field }) => (
									<FormItem className="sm:col-span-2">
										<FormLabel>Current password</FormLabel>
										<FormControl>
											<PasswordInput
												placeholder="Current password"
												disabled={!isPwEditing || isPwPending}
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={pwForm.control}
								name="newPassword"
								render={({ field }) => (
									<FormItem>
										<FormLabel>New password</FormLabel>
										<FormControl>
											<PasswordInput
												placeholder="New password"
												disabled={!isPwEditing || isPwPending}
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={pwForm.control}
								name="confirmPassword"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Confirm new password</FormLabel>
										<FormControl>
											<PasswordInput
												placeholder="Confirm new password"
												disabled={!isPwEditing || isPwPending}
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<div className="sm:col-span-2 flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2 sm:justify-end mt-2">
								<Button
									type="button"
									variant="ghost"
									onClick={() => pwForm.reset()}
									disabled={!isPwEditing || isPwPending}
									className="w-full sm:w-auto"
								>
									Clear
								</Button>
								<Button
									type="submit"
									disabled={!isPwEditing || isPwPending}
									className="w-full sm:w-auto"
								>
									{isPwPending ? "Updating..." : "Update Password"}
								</Button>
							</div>
						</form>
					</Form>
				</CardContent>
			</Card>
		</div>
	);
}
