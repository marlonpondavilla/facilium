"use client";

import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/auth";
import { loginSchema } from "@/validation/loginSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const LoginForm = () => {
	const auth = useAuth();
	const router = useRouter();

	const form = useForm<z.infer<typeof loginSchema>>({
		resolver: zodResolver(loginSchema),
		defaultValues: {
			email: "",
			password: "",
		},
	});

	const handleSubmit = async (data: z.infer<typeof loginSchema>) => {
		try {
			await auth?.login(data.email, data.password);
			router.push("/dashboard");
		} catch (e: unknown) {
			if (typeof e === "object" && e !== null) {
				const error = e as { code?: string; message?: string };

				if (error.code === "auth/invalid-credential") {
					form.setError("root", {
						type: "custom",
						message: "Invalid email or password",
					});
					form.setError("email", { type: "custom", message: "" });
					form.setError("password", { type: "custom", message: "" });
					await auth?.logout();
				} else if (
					error.message === "Please verify your email before logging in."
				) {
					form.setError("root", {
						type: "custom",
						message: "Please verify your email before logging in.",
					});
					form.setError("email", { type: "custom", message: "" });
					form.setError("password", { type: "custom", message: "" });
					await auth?.logout();
				} else {
					form.setError("root", {
						type: "custom",
						message: error.message ?? "An error occurred",
					});
					form.setError("email", { type: "custom", message: "" });
					form.setError("password", { type: "custom", message: "" });
				}
			} else {
				form.setError("root", { type: "custom", message: "An error occurred" });
			}
		}
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(handleSubmit)} className="w-full">
				{form.formState.errors.root && (
					<div className="error-container text-center mb-2">
						<p className="text-red-500">
							{form.formState.errors.root?.message ?? "Invalid credentials"}
						</p>
					</div>
				)}
				<fieldset
					disabled={form.formState.isSubmitting}
					className="flex flex-col gap-4 w-full max-w-sm mx-auto"
				>
					<FormField
						control={form.control}
						name="email"
						render={({ field }) => (
							<FormItem className="text-left">
								<FormLabel>Email</FormLabel>
								<FormControl>
									<Input
										type="email"
										placeholder="you@example.com"
										{...field}
										className="w-full"
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="password"
						render={({ field }) => (
							<FormItem className="text-left">
								<FormLabel>Password</FormLabel>
								<FormControl>
									<Input
										type="password"
										placeholder="********"
										{...field}
										className="w-full"
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<Button type="submit" className="mt-2 w-full">
						{form.formState.isSubmitting ? "Logging in" : "Login"}
					</Button>
					<div className="links flex flex-col justify-center items-center mt-2">
						<Link
							href={"/forgot-password"}
							className="text-sm hover:text-amber-600 mb-4"
						>
							Forgot password?
						</Link>
						<Separator className="w-full" />
						<span className="mt-2">or</span>
						<Link href={"/signup"} className="underline mt-2 font-medium">
							Create new account
						</Link>
					</div>
				</fieldset>
			</form>
		</Form>
	);
};

export default LoginForm;
