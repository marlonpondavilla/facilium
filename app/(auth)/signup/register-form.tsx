"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { signupSchema } from "@/validation/signupSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import {
	Form,
	FormField,
	FormItem,
	FormLabel,
	FormControl,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { degreeAttainment, departments } from "@/data/department";
import { useAuth } from "@/context/auth";
import { Separator } from "@/components/ui/separator";
import {
	Eye,
	EyeOff,
	Loader2,
	ChevronRight,
	ChevronLeft,
	CheckCircle2,
} from "lucide-react";
import {
	Select,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectItem,
} from "@/components/ui/select";

const steps = ["Personal", "Academic", "Account", "Review"] as const;

export const RegisterForm = () => {
	const router = useRouter();
	const auth = useAuth();
	const [currentStep, setCurrentStep] = useState(0);
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	const form = useForm<z.infer<typeof signupSchema>>({
		resolver: zodResolver(signupSchema),
		mode: "onBlur",
		defaultValues: {
			firstName: "",
			middleName: "",
			lastName: "",
			degreeEarned: "",
			department: "",
			email: "",
			password: "",
			confirmPassword: "",
		},
	});

	const pw = form.watch("password");

	const passwordChecklist = useMemo(
		() => [
			{ label: "8+ characters", pass: pw.length >= 8 },
			{ label: "Number", pass: /\d/.test(pw) },
			{ label: "Symbol", pass: /[^A-Za-z0-9]/.test(pw) },
			{ label: "Capital letter", pass: /[A-Z]/.test(pw) },
		],
		[pw]
	);

	const strengthScore = passwordChecklist.filter((c) => c.pass).length;
	const strengthLabel =
		strengthScore <= 1
			? "Weak"
			: strengthScore === 2
			? "Fair"
			: strengthScore === 3
			? "Good"
			: "Strong";
	const strengthColor =
		strengthScore <= 1
			? "bg-red-500"
			: strengthScore === 2
			? "bg-amber-500"
			: strengthScore === 3
			? "bg-blue-500"
			: "bg-green-600";

	const goNext = async () => {
		// Validate fields relevant to the current step before advancing
		let fields: (keyof z.infer<typeof signupSchema>)[] = [];
		if (currentStep === 0) fields = ["firstName", "lastName"]; // middle optional
		if (currentStep === 1) fields = ["degreeEarned", "department"]; // both required
		if (currentStep === 2) fields = ["email", "password", "confirmPassword"];

		if (fields.length) {
			const valid = await form.trigger(fields, { shouldFocus: true });
			if (!valid) return;
		}
		setCurrentStep((s) => Math.min(s + 1, steps.length - 1));
	};

	const goBack = () => setCurrentStep((s) => Math.max(s - 1, 0));

	const handleSubmit = async (data: z.infer<typeof signupSchema>) => {
		try {
			await auth?.signup(data);
			toast.success("Signup successful! Please verify your email.");
			router.push("/verify-email");
		} catch (error: unknown) {
			const err = error as { code?: string; message?: string } | undefined;
			const errorCode = err?.code || "";
			const errorMessage = err?.message || "Signup failed";
			if (errorCode === "auth/email-already-in-use") {
				form.setError("email", {
					type: "server",
					message: "Email is already in use.",
				});
				toast.error("Email is already in use.");
				setCurrentStep(2);
			} else if (errorCode === "auth/weak-password") {
				form.setError("password", {
					type: "server",
					message: "Password is too weak.",
				});
				toast.error("Password is too weak.");
				setCurrentStep(2);
			} else {
				toast.error(errorMessage);
			}
		}
	};

	// Progress indicator
	const progressPct = (currentStep / (steps.length - 1)) * 100;

	// Review data
	const values = form.getValues();

	return (
		<div className="w-full flex flex-col gap-8 max-w-md mx-auto px-3 sm:px-4 py-4">
			{/* Step indicators */}
			<div className="flex items-center gap-3 text-[11px] justify-center flex-wrap">
				{steps.map((label, i) => {
					const active = i === currentStep;
					const done = i < currentStep;
					return (
						<div key={label} className="flex items-center gap-1">
							<div
								className={`h-6 px-3 rounded-full flex items-center gap-1 border text-[11px] font-medium transition ${
									active
										? "bg-pink-600 text-white border-pink-600"
										: done
										? "bg-green-600 text-white border-green-600"
										: "bg-white text-neutral-600"
								}`}
							>
								{done ? <CheckCircle2 size={14} /> : <span>{i + 1}</span>}
								<span className="hidden sm:inline">{label}</span>
							</div>
							{i < steps.length - 1 && (
								<ChevronRight className="text-neutral-400" size={14} />
							)}
						</div>
					);
				})}
			</div>
			<div className="w-full h-1 bg-neutral-200 rounded overflow-hidden mt-1">
				<div
					className="h-full bg-pink-600 transition-all"
					style={{ width: `${progressPct}%` }}
				/>
			</div>

			<Form {...form}>
				<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-10">
					<fieldset
						disabled={form.formState.isSubmitting}
						className="space-y-10"
					>
						{currentStep === 0 && (
							<div className="space-y-8">
								{/* Personal info stacked for breathable spacing */}
								<div className="flex flex-col gap-6">
									<FormField
										name="firstName"
										control={form.control}
										render={({ field }) => (
											<FormItem>
												<FormLabel>First Name</FormLabel>
												<FormControl>
													<Input
														autoComplete="given-name"
														placeholder="Juan"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										name="middleName"
										control={form.control}
										render={({ field }) => (
											<FormItem>
												<FormLabel>Middle (Optional)</FormLabel>
												<FormControl>
													<Input placeholder="M." {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										name="lastName"
										control={form.control}
										render={({ field }) => (
											<FormItem>
												<FormLabel>Last Name</FormLabel>
												<FormControl>
													<Input
														autoComplete="family-name"
														placeholder="Dela Cruz"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
							</div>
						)}

						{currentStep === 1 && (
							<div className="grid gap-8 md:grid-cols-2">
								<FormField
									name="degreeEarned"
									control={form.control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>Highest Degree Earned</FormLabel>
											<Select
												onValueChange={field.onChange}
												value={field.value}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Select degree" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{degreeAttainment.map((d) => (
														<SelectItem key={d} value={d}>
															{d}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									name="department"
									control={form.control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>Department</FormLabel>
											<Select
												onValueChange={field.onChange}
												value={field.value}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Select department" />
													</SelectTrigger>
												</FormControl>
												<SelectContent className="max-h-60">
													{departments.map((dep) => (
														<SelectItem key={dep} value={dep}>
															{dep}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						)}

						{currentStep === 2 && (
							<div className="space-y-10">
								<FormField
									name="email"
									control={form.control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>Email</FormLabel>
											<FormControl>
												<Input
													type="email"
													autoComplete="email"
													placeholder="you@school.edu.ph"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<div className="grid gap-8 md:grid-cols-2">
									<FormField
										name="password"
										control={form.control}
										render={({ field }) => (
											<FormItem>
												<FormLabel>Password</FormLabel>
												<FormControl>
													<div className="relative">
														<Input
															type={showPassword ? "text" : "password"}
															placeholder="••••••••"
															autoComplete="new-password"
															{...field}
														/>
														<button
															type="button"
															onClick={() => setShowPassword((p) => !p)}
															className="absolute inset-y-0 right-2 flex items-center text-neutral-500 hover:text-neutral-800"
															tabIndex={-1}
														>
															{showPassword ? (
																<EyeOff size={16} />
															) : (
																<Eye size={16} />
															)}
														</button>
													</div>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										name="confirmPassword"
										control={form.control}
										render={({ field }) => (
											<FormItem>
												<FormLabel>Confirm Password</FormLabel>
												<FormControl>
													<div className="relative">
														<Input
															type={showConfirmPassword ? "text" : "password"}
															placeholder="Repeat password"
															{...field}
														/>
														<button
															type="button"
															onClick={() => setShowConfirmPassword((p) => !p)}
															className="absolute inset-y-0 right-2 flex items-center text-neutral-500 hover:text-neutral-800"
															tabIndex={-1}
														>
															{showConfirmPassword ? (
																<EyeOff size={16} />
															) : (
																<Eye size={16} />
															)}
														</button>
													</div>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
								{/* Password strength */}
								<div className="space-y-3">
									<div className="flex items-center justify-between text-xs">
										<span className="text-neutral-500">Password strength</span>
										<span className="font-medium">{strengthLabel}</span>
									</div>
									<div className="h-2 w-full rounded bg-neutral-200 overflow-hidden">
										<div
											className={`h-full transition-all duration-300 ${strengthColor}`}
											style={{ width: `${(strengthScore / 4) * 100}%` }}
										/>
									</div>
									<ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
										{passwordChecklist.map((c) => (
											<li
												key={c.label}
												className={
													c.pass ? "text-green-600" : "text-neutral-500"
												}
											>
												{c.pass ? "✓" : "•"} {c.label}
											</li>
										))}
									</ul>
								</div>
							</div>
						)}

						{currentStep === 3 && (
							<div className="space-y-6 text-sm">
								<h2 className="font-semibold text-base">Review Information</h2>
								<div className="grid gap-3 md:grid-cols-2 bg-neutral-50 p-4 rounded border text-xs">
									<div>
										<span className="font-medium">First Name:</span>{" "}
										{values.firstName || (
											<span className="text-neutral-400">—</span>
										)}
									</div>
									<div>
										<span className="font-medium">Middle:</span>{" "}
										{values.middleName || (
											<span className="text-neutral-400">—</span>
										)}
									</div>
									<div>
										<span className="font-medium">Last Name:</span>{" "}
										{values.lastName || (
											<span className="text-neutral-400">—</span>
										)}
									</div>
									<div>
										<span className="font-medium">Degree:</span>{" "}
										{values.degreeEarned || (
											<span className="text-neutral-400">—</span>
										)}
									</div>
									<div>
										<span className="font-medium">Department:</span>{" "}
										{values.department || (
											<span className="text-neutral-400">—</span>
										)}
									</div>
									<div className="md:col-span-2">
										<span className="font-medium">Email:</span>{" "}
										{values.email || (
											<span className="text-neutral-400">—</span>
										)}
									</div>
								</div>
								<p className="text-xs text-neutral-500">
									By submitting, you agree to campus usage policies. A
									verification email will be sent.
								</p>
							</div>
						)}

						{/* Navigation Buttons */}
						<div className="flex items-center justify-between pt-4 gap-4">
							<Button
								type="button"
								variant="outline"
								disabled={currentStep === 0 || form.formState.isSubmitting}
								onClick={goBack}
								className="min-w-[100px]"
							>
								<ChevronLeft size={16} className="mr-1" /> Back
							</Button>
							{currentStep < steps.length - 1 && (
								<Button
									type="button"
									onClick={goNext}
									className="min-w-[130px] facilium-bg-indigo"
								>
									Next <ChevronRight size={16} className="ml-1" />
								</Button>
							)}
							{currentStep === steps.length - 1 && (
								<Button
									type="submit"
									disabled={form.formState.isSubmitting}
									className="min-w-[150px] facilium-bg-indigo"
								>
									{form.formState.isSubmitting && (
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									)}{" "}
									Create Account
								</Button>
							)}
						</div>

						<Separator className="mt-6" />
						<p className="text-center text-sm">
							Already have an account?{" "}
							<Link href="/login" className="underline font-medium">
								Log in
							</Link>
						</p>
					</fieldset>
				</form>
			</Form>
		</div>
	);
};
