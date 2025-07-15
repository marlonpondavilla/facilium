"use client";

import { RegisterForm } from "@/app/(auth)/signup/register-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import React from "react";
import { useForm } from "react-hook-form";

const AdminForm = () => {
	const form = useForm();

	const handleSubmit = () => {
		return;
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Admin Login</CardTitle>
			</CardHeader>
			<CardContent>
				<Form {...form}>
					<form action="" onSubmit={form.handleSubmit(handleSubmit)}>
						<fieldset className="flex flex-col justify-center items-center gap-4">
							<FormField
								control={form.control}
								name="email"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Email</FormLabel>
										<FormControl>
											<Input
												type="email"
												placeholder="Admin email"
												{...field}
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
											<Input type="password" placeholder="******" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<Button>Login</Button>
						</fieldset>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
};

export default AdminForm;
