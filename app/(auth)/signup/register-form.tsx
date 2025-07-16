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
import { signupSchema } from "@/validation/signupSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { signupUser } from "./actions";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { departments } from "@/data/department";

type FieldName = keyof z.infer<typeof signupSchema>;

export const RegisterForm = () => {
	const router = useRouter();
	const form = useForm<z.infer<typeof signupSchema>>({
		resolver: zodResolver(signupSchema),
		defaultValues: {
			fullName: "",
			email: "",
			password: "",
			confirmPassword: "",
		},
	});

	const handleSubmit = async (data: z.infer<typeof signupSchema>) => {
		const response = await signupUser(data);
		const fieldKeys: FieldName[] = [
			"fullName",
			"email",
			"department",
			"password",
			"confirmPassword",
		];

		if (response.fieldErrors) {
			for (const key of fieldKeys) {
				const message = response.fieldErrors[key]?.[0];
				if (message) {
					form.setError(key, {
						type: "server",
						message,
					});
					toast.error(message);
				}
			}
			return;
		}
		toast.success("Signup successful");
		router.push("/login");
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(handleSubmit)}>
				<fieldset
					disabled={form.formState.isSubmitting}
					className="flex flex-col gap-4"
				>
					<div className="name-container">
						<FormField
							control={form.control}
							name="fullName"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Fullname</FormLabel>
									<FormControl>
										<Input
											type="text"
											placeholder="Fullname"
											{...field}
											className="w-xs"
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
					<div className="email-container">
						<FormField
							control={form.control}
							name="email"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Email</FormLabel>
									<FormControl>
										<Input
											type="email"
											placeholder="Email"
											{...field}
											className="w-xs"
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
					<div className="department-container">
						<FormField
							control={form.control}
							name="department"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Department</FormLabel>
									<FormControl>
										<select
											{...field}
											className="w-xs border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-500"
										>
											<option value="">Select department</option>
											{departments.map((department, key) => (
												<option value={department} key={key}>
													{department}
												</option>
											))}
										</select>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
					<div className="password-container">
						<FormField
							control={form.control}
							name="password"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Password</FormLabel>
									<FormControl>
										<Input
											type="password"
											placeholder="Password"
											{...field}
											className="w-xs"
										/>
									</FormControl>
									<FormMessage className="w-[20rem]" />
								</FormItem>
							)}
						/>
					</div>
					<div className="confirm-password-container">
						<FormField
							control={form.control}
							name="confirmPassword"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Confirm Password</FormLabel>
									<FormControl>
										<Input
											type="password"
											placeholder="Confirm Password"
											{...field}
											className="w-xs"
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
					<Button type="submit" className="mt-2">
						Signup
					</Button>
					<Separator />
					<Link
						href={"/login"}
						className="text-center text-sm underline font-medium hover:text-gray-500"
					>
						Already have an account?
					</Link>
				</fieldset>
			</form>
		</Form>
	);
};
