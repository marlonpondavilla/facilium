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
import toast from "react-hot-toast";
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
			if (typeof e === "object" && e !== null && "code" in e) {
				const error = e as { code?: string };
				if (error.code === "auth/invalid-credential") {
					form.setError("root", {
						type: "custom",
						message: "Invalid email or password",
					});

					form.setError("email", {
						type: "custom",
						message: "",
					});

					form.setError("password", {
						type: "custom",
						message: "",
					});
				}
			} else {
				toast.error("An error occured");
			}
		}
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(handleSubmit)}>
				{form.formState.errors.root && (
					<div className="error-container text-center">
						<p className="text-red-500">
							{form.formState.errors.root?.message ?? "Invalid credentials"}
						</p>
					</div>
				)}
				<fieldset
					disabled={form.formState.isSubmitting}
					className="flex flex-col gap-4"
				>
					<FormField
						control={form.control}
						name="email"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Email</FormLabel>
								<FormControl>
									<Input
										type="email"
										placeholder="you@example.com"
										{...field}
										className="w-xs"
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
							<FormItem>
								<FormLabel>Password</FormLabel>
								<FormControl>
									<Input
										type="password"
										placeholder="********"
										{...field}
										className="w-xs"
									/>
								</FormControl>
								<FormMessage className="w-xs" />
							</FormItem>
						)}
					/>
					<Button type="submit" className="mt-2">
						{form.formState.isSubmitting ? "Logging in" : "Login"}
					</Button>
					<div className="links flex flex-col justify-center items-center">
						<Link
							href={"/forgot-password"}
							className="text-sm hover:text-amber-600 mb-4"
						>
							Forgot password?
						</Link>
						<Separator />
						<span>or</span>
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
