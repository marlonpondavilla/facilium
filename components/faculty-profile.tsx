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
import { auth, storage } from "@/firebase/client";
import { updateCurrentUserName, updateCurrentUserPhoto } from "@/data/actions";
import {
	ref as storageRef,
	uploadBytes,
	getDownloadURL,
} from "firebase/storage";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
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
import ConfirmationHandleDialog from "./confirmation-handle-dialog";
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "./ui/alert-dialog";
import { Edit, ImageUp } from "lucide-react";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";
import { degreeAttainment } from "@/data/department";
import { updateCurrentUserDegree } from "@/data/actions";

type UserProfile = {
	id: string;
	employeeNumber: string;
	email?: string;
	firstName: string;
	middleName?: string;
	lastName: string;
	degreeEarned?: string;
	designation?: string;
	department?: string;
	photoURL?: string;
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
	const [isPwPending] = useTransition();
	const [isPwEditing, setIsPwEditing] = React.useState(false);
	// Degree editing state
	const [isDegEditing, setIsDegEditing] = React.useState(false);
	const [degreeValue, setDegreeValue] = React.useState<string>(
		(user?.degreeEarned || "") as string
	);
	const [isDegPending, startDegTransition] = useTransition();

	// Avatar state
	const fileInputRef = React.useRef<HTMLInputElement | null>(null);
	const [photoPreview, setPhotoPreview] = React.useState<string | null>(
		(user?.photoURL ?? "").trim() || null
	);
	const [cropOpen, setCropOpen] = React.useState(false);
	const [isUploading, setIsUploading] = React.useState(false);
	// image natural size
	const [imgSize, setImgSize] = React.useState<{ w: number; h: number } | null>(
		null
	);
	const [imgReady, setImgReady] = React.useState(false);
	// keep track of current object URL to revoke it later
	const previewUrlRef = React.useRef<string | null>(null);

	const MAX_FILE_MB = 2;
	const allowedTypes = new Set<string>([
		"image/jpeg",
		"image/png",
		"image/webp",
		"image/gif",
		"image/avif",
	]);
	const allowedExt = new Set<string>([
		"jpg",
		"jpeg",
		"png",
		"webp",
		"gif",
		"avif",
	]);
	// viewport constants
	const VIEW = 280; // px circle viewport
	const OUTPUT = 512; // px output circle diameter
	// position/scale
	const [pos, setPos] = React.useState<{ x: number; y: number }>({
		x: 0,
		y: 0,
	});
	const [scale, setScale] = React.useState<number>(1);
	const [minScale, setMinScale] = React.useState<number>(1);
	const imgRef = React.useRef<HTMLImageElement | null>(null);
	const dragStart = React.useRef<{ x: number; y: number } | null>(null);

	const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
		const file = e.target.files?.[0];
		if (!file) return;
		const type = (file.type || "").toLowerCase();
		const name = (file.name || "").toLowerCase();
		const ext = name.includes(".")
			? name.substring(name.lastIndexOf(".") + 1)
			: "";
		// Basic MIME/image check first
		if (!type.startsWith("image/")) {
			toast.error("Unsupported file. Please select an image (JPG, PNG, WEBP).");
			return;
		}
		// Stricter allowlist (handle HEIC and other uncommon formats)
		if (!allowedTypes.has(type) && !allowedExt.has(ext)) {
			if (ext === "heic" || type.includes("heic") || type.includes("heif")) {
				toast.error(
					"HEIC images aren’t supported by this browser. Please convert to JPG/PNG/WEBP."
				);
			} else {
				toast.error(
					"This image format isn’t supported. Please use JPG, PNG, WEBP, GIF or AVIF."
				);
			}
			return;
		}
		if (file.size > MAX_FILE_MB * 1024 * 1024) {
			toast.error(`Image is too large. Max ${MAX_FILE_MB}MB.`);
			return;
		}
		// Revoke previous preview URL if exists to avoid memory leaks
		if (previewUrlRef.current) {
			try {
				URL.revokeObjectURL(previewUrlRef.current);
			} catch {}
		}
		const localUrl = URL.createObjectURL(file);
		previewUrlRef.current = localUrl;
		setPhotoPreview(localUrl);
		setImgReady(false);
		// Open crop dialog; scale/position will be initialized on image load
		setCropOpen(true);
	};

	// Clamp position so the image always covers the circular viewport bounds
	const clampPos = React.useCallback(
		(nx: number, ny: number, sc: number) => {
			if (!imgSize) return { x: nx, y: ny };
			const w = imgSize.w * sc;
			const h = imgSize.h * sc;
			// Keep image covering the entire circle bounding box (square VIEW x VIEW)
			const minX = Math.min(0, VIEW - w);
			const maxX = 0;
			const minY = Math.min(0, VIEW - h);
			const maxY = 0;
			return {
				x: Math.max(minX, Math.min(nx, maxX)),
				y: Math.max(minY, Math.min(ny, maxY)),
			};
		},
		[imgSize]
	);

	const onImgLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
		const el = e.currentTarget;
		const w = el.naturalWidth || el.width;
		const h = el.naturalHeight || el.height;
		if (!w || !h) return;
		setImgSize({ w, h });
		// Fit-cover initial scale to cover the circle box
		const cover = Math.max(VIEW / w, VIEW / h);
		setMinScale(cover);
		setScale(cover);
		const centered = {
			x: (VIEW - w * cover) / 2,
			y: (VIEW - h * cover) / 2,
		};
		setPos(centered);
		setImgReady(true);
	};

	const onWheel: React.WheelEventHandler<HTMLDivElement> = (e) => {
		if (!imgSize) return;
		e.preventDefault();
		const delta = e.deltaY > 0 ? -0.1 : 0.1;
		const nextScale = Math.max(minScale, Math.min(4, scale + delta));
		// Adjust pos to zoom relative to center
		const centerX = VIEW / 2;
		const centerY = VIEW / 2;
		const imgCX = (centerX - pos.x) / scale;
		const imgCY = (centerY - pos.y) / scale;
		const nx = centerX - imgCX * nextScale;
		const ny = centerY - imgCY * nextScale;
		const fixed = clampPos(nx, ny, nextScale);
		setScale(nextScale);
		setPos(fixed);
	};

	const onMouseDown: React.MouseEventHandler<HTMLDivElement> = (e) => {
		dragStart.current = { x: e.clientX, y: e.clientY };
	};
	const onMouseMove: React.MouseEventHandler<HTMLDivElement> = (e) => {
		if (!dragStart.current) return;
		const dx = e.clientX - dragStart.current.x;
		const dy = e.clientY - dragStart.current.y;
		dragStart.current = { x: e.clientX, y: e.clientY };
		const next = clampPos(pos.x + dx, pos.y + dy, scale);
		setPos(next);
	};
	const onMouseUpOrLeave: React.MouseEventHandler<HTMLDivElement> = () => {
		dragStart.current = null;
	};

	// Touch drag support
	const touchStart = React.useRef<{ x: number; y: number } | null>(null);
	const onTouchStart: React.TouchEventHandler<HTMLDivElement> = (e) => {
		if (e.touches.length !== 1) return;
		const t = e.touches[0];
		touchStart.current = { x: t.clientX, y: t.clientY };
	};
	const onTouchMove: React.TouchEventHandler<HTMLDivElement> = (e) => {
		if (!touchStart.current || e.touches.length !== 1) return;
		const t = e.touches[0];
		const dx = t.clientX - touchStart.current.x;
		const dy = t.clientY - touchStart.current.y;
		touchStart.current = { x: t.clientX, y: t.clientY };
		const next = clampPos(pos.x + dx, pos.y + dy, scale);
		setPos(next);
	};
	const onTouchEnd: React.TouchEventHandler<HTMLDivElement> = () => {
		touchStart.current = null;
	};

	const resetCrop = () => {
		setPhotoPreview(null);
		setImgReady(false);
		if (previewUrlRef.current) {
			try {
				URL.revokeObjectURL(previewUrlRef.current);
			} catch {}
			previewUrlRef.current = null;
		}
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	const onImgError: React.ReactEventHandler<HTMLImageElement> = () => {
		toast.error("Failed to load this image. Please use JPG, PNG, or WEBP.");
		setCropOpen(false);
		resetCrop();
	};

	// Create a circular PNG blob from current viewport
	const makeCroppedBlob = async (): Promise<Blob | null> => {
		if (!imgRef.current || !imgSize) return null;
		const canvas = document.createElement("canvas");
		canvas.width = OUTPUT;
		canvas.height = OUTPUT;
		const ctx = canvas.getContext("2d");
		if (!ctx) return null;
		// Compute source rect in image pixels corresponding to viewport
		const sx = -pos.x / scale;
		const sy = -pos.y / scale;
		const sw = VIEW / scale;
		const sh = VIEW / scale;
		// Clip to circle
		ctx.clearRect(0, 0, OUTPUT, OUTPUT);
		ctx.save();
		ctx.beginPath();
		ctx.arc(OUTPUT / 2, OUTPUT / 2, OUTPUT / 2, 0, Math.PI * 2);
		ctx.closePath();
		ctx.clip();
		// Draw scaled to canvas
		ctx.drawImage(imgRef.current, sx, sy, sw, sh, 0, 0, OUTPUT, OUTPUT);
		ctx.restore();
		return await new Promise<Blob | null>((resolve) =>
			canvas.toBlob((b) => resolve(b), "image/png")
		);
	};

	// Upload flow invoked after password confirmation
	const performUpload = async (): Promise<boolean> => {
		const file = fileInputRef.current?.files?.[0];
		if (!file) {
			toast.error("No image selected.");
			return false;
		}
		const uid = authCtx?.user?.uid;
		if (!uid) {
			toast.error("Not authenticated.");
			return false;
		}
		try {
			setIsUploading(true);
			const path = `avatars/${uid}.png`;
			const ref = storageRef(storage, path);
			const blob = await makeCroppedBlob();
			if (!blob) return false;
			await uploadBytes(ref, blob, { contentType: "image/png" });
			const url = await getDownloadURL(ref);
			const res = await updateCurrentUserPhoto({ photoURL: url });
			if (!res?.success) {
				toast.error(res?.error || "Failed to update profile photo.");
				return false;
			}
			toast.success("Profile photo updated.");
			setPhotoPreview(null);
			setCropOpen(false);
			if (fileInputRef.current) fileInputRef.current.value = "";
			if (previewUrlRef.current) {
				try {
					URL.revokeObjectURL(previewUrlRef.current);
				} catch {}
				previewUrlRef.current = null;
			}
			router.refresh();
			return true;
		} catch (e: unknown) {
			console.error("Avatar upload failed", e);
			let code = "";
			if (e && typeof e === "object" && "code" in e) {
				const c = (e as Record<string, unknown>).code;
				if (typeof c === "string") code = c;
			}
			if (typeof code === "string" && code.includes("storage/unauthorized")) {
				toast.error(
					"Upload blocked by Storage Rules. See notes below for how to allow avatars/{uid}.png."
				);
			} else {
				toast.error("Upload failed.");
			}
			return false;
		} finally {
			setIsUploading(false);
		}
	};

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
	const currentPhotoURL = (user?.photoURL ?? "").trim() || undefined;
	const currentDegree = (user.degreeEarned || "—") as string;

	return (
		<div className="w-full max-w-5xl mx-auto space-y-4">
			<Card className="w-full">
				<CardHeader className="flex flex-row items-center gap-4">
					<Avatar className="size-18">
						{currentPhotoURL && (
							<AvatarImage
								className="object-cover"
								src={currentPhotoURL}
								alt={name}
							/>
						)}
						<AvatarFallback>
							{initials(user.firstName, user.lastName)}
						</AvatarFallback>
					</Avatar>
					<div className="flex-1 min-w-0">
						<CardTitle className="text-xl truncate">{name}</CardTitle>
						<CardDescription className="text-xs pb-2">{`Employee Number: ${user.employeeNumber}`}</CardDescription>
						<div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
							<Badge variant="outline">{designation}</Badge>
							<Badge className="facilium-bg-indigo">{department}</Badge>
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
							<Edit />
						</Button>
						<input
							id="avatar-file"
							ref={fileInputRef}
							type="file"
							accept="image/*"
							className="sr-only"
							onChange={handleFileChange}
						/>
						<Button asChild size="sm" variant="outline" disabled={isUploading}>
							<label
								htmlFor="avatar-file"
								className="cursor-pointer flex items-center gap-1"
							>
								<span>Change Photo</span>
								<ImageUp className="h-4 w-4" />
							</label>
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
									<ConfirmationHandleDialog
										trigger={
											<Button
												type="button"
												disabled={isPending}
												className="w-full sm:w-auto"
											>
												{isPending ? "Saving..." : "Save"}
											</Button>
										}
										title="Confirm name change"
										description="Please confirm to update your name."
										label="save"
										confirmButtonText="Yes, save"
										onConfirm={async () => {
											// Validate the form first
											const isValid = await form.trigger();
											if (!isValid) {
												toast.error("Please fix the form errors.");
												return false;
											}
											const values = form.getValues();
											try {
												const res = await updateCurrentUserName(values);
												if (res?.success) {
													toast.success("Your name was updated.");
													setIsEditing(false);
													router.refresh();
													return true;
												}
												toast.error(res?.error || "Failed to update name.");
												return false;
											} catch {
												toast.error("Failed to update name.");
												return false;
											}
										}}
									/>
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
						<div className="flex items-center gap-2">
							<p className="text-gray-500">Degree Attainment</p>
							{!isDegEditing && (
								<Button
									variant="ghost"
									size="icon"
									aria-label="Edit degree"
									onClick={() => setIsDegEditing(true)}
								>
									<Edit className="h-4 w-4" />
								</Button>
							)}
						</div>
						{isDegEditing ? (
							<div className="flex flex-col gap-2">
								<Select value={degreeValue} onValueChange={setDegreeValue}>
									<SelectTrigger className="w-full sm:w-[260px]">
										<SelectValue placeholder="Select degree" />
									</SelectTrigger>
									<SelectContent className="max-h-60">
										<SelectGroup>
											{degreeAttainment.map((d) => (
												<SelectItem key={d} value={d}>
													{d}
												</SelectItem>
											))}
										</SelectGroup>
									</SelectContent>
								</Select>
								<div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
									<Button
										variant="ghost"
										onClick={() => {
											setIsDegEditing(false);
											setDegreeValue((user?.degreeEarned || "") as string);
										}}
										disabled={isDegPending}
										className="w-full sm:w-auto"
									>
										Cancel
									</Button>
									<ConfirmationHandleDialog
										trigger={
											<Button
												disabled={isDegPending}
												className="w-full sm:w-auto"
											>
												{isDegPending ? "Saving..." : "Save"}
											</Button>
										}
										title="Confirm degree change"
										description="Please confirm to update your degree."
										label="save"
										confirmButtonText="Yes, save"
										onConfirm={async () => {
											if (!degreeValue) {
												toast.error("Please select a degree.");
												return false;
											}
											return await new Promise<boolean>((resolve) => {
												startDegTransition(async () => {
													const res = await updateCurrentUserDegree({
														degreeEarned: degreeValue,
													});
													if (res?.success) {
														toast.success("Degree updated.");
														setIsDegEditing(false);
														router.refresh();
														resolve(true);
													} else {
														toast.error(
															res?.error || "Failed to update degree."
														);
														resolve(false);
													}
												});
											});
										}}
									/>
								</div>
							</div>
						) : (
							<p className="font-medium">{currentDegree}</p>
						)}
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
				<label htmlFor="avatar-file" className="sr-only">
					Change Photo
				</label>
				<Button asChild size="sm" variant="outline" disabled={isUploading}>
					<label
						htmlFor="avatar-file"
						className="cursor-pointer flex items-center gap-1"
					>
						<ImageUp className="h-4 w-4" />
						<span>Change Photo</span>
					</label>
				</Button>
				<LogoutAuthButton />
			</div>

			{/* Crop dialog popup */}
			<AlertDialog
				open={cropOpen}
				onOpenChange={(o) => {
					setCropOpen(o);
					if (!o) {
						resetCrop();
					}
				}}
			>
				<AlertDialogContent className="max-w-md">
					<AlertDialogHeader>
						<AlertDialogTitle>Adjust your profile picture</AlertDialogTitle>
						<AlertDialogDescription>
							Use mouse wheel to adjust and zoom your photo.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<div className="flex flex-col items-center gap-3">
						<div
							onMouseDown={onMouseDown}
							onMouseMove={onMouseMove}
							onMouseUp={onMouseUpOrLeave}
							onMouseLeave={onMouseUpOrLeave}
							onWheel={onWheel}
							onTouchStart={onTouchStart}
							onTouchMove={onTouchMove}
							onTouchEnd={onTouchEnd}
							className="relative select-none"
							style={{ width: VIEW, height: VIEW, touchAction: "none" }}
						>
							<div className="relative rounded-full overflow-hidden w-full h-full bg-black/5 cursor-grab active:cursor-grabbing">
								{photoPreview ? (
									// eslint-disable-next-line @next/next/no-img-element
									<img
										ref={imgRef}
										src={photoPreview}
										alt="Preview"
										onLoad={onImgLoad}
										onError={onImgError}
										draggable={false}
										style={{
											position: "absolute",
											left: pos.x,
											top: pos.y,
											transform: `scale(${scale})`,
											transformOrigin: "top left",
											userSelect: "none",
											pointerEvents: "none",
											opacity: imgReady ? 1 : 0,
											maxWidth: "none",
											maxHeight: "none",
										}}
									/>
								) : null}
							</div>
						</div>
						<div className="text-xs text-muted-foreground">
							A password confirmation will require you after this.
						</div>
					</div>
					<AlertDialogFooter>
						<AlertDialogCancel
							onClick={() => {
								setCropOpen(false);
								resetCrop();
							}}
						>
							Cancel
						</AlertDialogCancel>
						<ConfirmationHandleDialog
							trigger={
								<Button disabled={isUploading}>
									{isUploading ? "Uploading..." : "Upload"}
								</Button>
							}
							title="Confirm upload"
							description="Please confirm to upload your new profile photo."
							label="upload"
							confirmButtonText="Yes, upload"
							onConfirm={performUpload}
						/>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

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
							onSubmit={(e) => {
								// Prevent direct submit to ensure confirmation dialog is used
								e.preventDefault();
							}}
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
								<ConfirmationHandleDialog
									trigger={
										<Button
											type="button"
											disabled={!isPwEditing || isPwPending}
											className="w-full sm:w-auto"
										>
											{isPwPending ? "Updating..." : "Update Password"}
										</Button>
									}
									title="Confirm password change"
									description="Please confirm to change your password."
									label="update-password"
									confirmButtonText="Yes, update"
									onConfirm={async () => {
										const isValid = await pwForm.trigger();
										if (!isValid) {
											toast.error("Please fix the form errors.");
											return false;
										}
										const values = pwForm.getValues();
										try {
											const current = auth.currentUser;
											if (!current || !current.email) {
												toast.error("Not authenticated.");
												return false;
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
											return true;
										} catch (e: unknown) {
											const err = e as { code?: string; message?: string } | undefined;
											const raw = err?.code || err?.message || "unknown";
											const code = typeof raw === "string" ? raw : String(raw ?? "unknown");
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
												return false;
											}
											if (code.includes("weak-password")) {
												pwForm.setError("newPassword", {
													type: "manual",
													message: "Password is too weak.",
												});
												toast.error("New password is too weak.");
												return false;
											}
											if (code.includes("requires-recent-login")) {
												toast.error(
													"Please sign in again to change your password, then retry."
												);
												return false;
											}
											if (code.includes("too-many-requests")) {
												toast.error("Too many attempts. Please wait a moment and try again.");
												return false;
											}
											if (code.includes("network-request-failed")) {
												toast.error(
													"Network error. Check your internet connection and try again."
												);
												return false;
											}
											if (code.includes("user-disabled")) {
												toast.error("This account is disabled. Contact the administrator.");
												return false;
											}
											if (code.includes("invalid-api-key")) {
												toast.error("Configuration error (API key). Please contact support.");
												return false;
											}
											toast.error("Failed to change password.");
											return false;
										}
									}}
								/>
							</div>
						</form>
					</Form>
				</CardContent>
			</Card>
		</div>
	);
}
