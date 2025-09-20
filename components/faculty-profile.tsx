"use client";

import React from "react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "./ui/form";
import LogoutAuthButton from "./logout";
import { updateCurrentUserName } from "@/data/actions";

type UserProfile = {
	id?: string;
	email?: string;
	firstName?: string;
	lastName?: string;
	middleName?: string;
	degreeEarned?: string;
	designation?: string;
	department?: string;
	uid?: string;
	created?: string;
};

function initials(first?: string, last?: string) {
	const f = (first || "").trim();
	const l = (last || "").trim();
	return `${f[0] ?? "?"}${l[0] ?? ""}`.toUpperCase();
}

function fullName(user: UserProfile) {
	const parts = [user.firstName, user.middleName, user.lastName]
		.filter(Boolean)
		.map((s) => String(s).trim())
		.filter((s) => s.length);
	return parts.length ? parts.join(" ") : "Unnamed User";
}

function formatDate(dateStr?: string) {
	if (!dateStr) return "—";
	const d = new Date(dateStr);
	if (Number.isNaN(d.getTime())) return String(dateStr);
	return d.toLocaleDateString(undefined, {
		year: "numeric",
		month: "short",
		day: "2-digit",
	});
}

export default function FacultyProfile({ user }: { user: UserProfile | null }) {
	// Hooks must be called unconditionally
	const router = useRouter();
	const [isEditing, setIsEditing] = React.useState(false);
	const [isPending, startTransition] = useTransition();

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
		</div>
	);
}
