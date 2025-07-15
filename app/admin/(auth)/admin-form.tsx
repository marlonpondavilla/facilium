"use client";

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
import Image from "next/image";
import React from "react";
import { useForm } from "react-hook-form";

const AdminForm = () => {
	const form = useForm();

	const handleSubmit = () => {
		return;
	};

	return (
		<div className="flex h-screen facilium-bg-red facilium-color-white">
			{/* Left Side */}
			<div className="flex flex-col justify-center items-center flex-2 gap-8 px-12">
				<div className="flex items-center">
					<Image
						src="/facilium-logo.png"
						width={80}
						height={80}
						alt="Facilium Logo"
					/>
					<h1 className="text-3xl font-bold">Facilium</h1>
				</div>

				<h2 className="text-center text-xl max-w-lg leading-relaxed tracking-widest">
					Secure. Manage. Empower. Your access shapes the system.
				</h2>

				<Image
					src="/admin-login-Illustration.png"
					width={800}
					height={800}
					alt="Admin Dashboard Illustration"
					className="rounded-lg shadow-lg"
				/>
			</div>

			{/* Right Side (Login Form) */}
			<div className="flex flex-col flex-1 h-full">
				<Card className="flex flex-col h-full w-full facilium-bg-white facilium-color-black shadow-xl p-8 rounded-none">
					<CardHeader>
						<div className="header-info flex justify-center gap-8 items-center">
							<div className="logo-container flex items-center justify-center relative">
								<Image
									src={"/bsu-main-logo.png"}
									width={75}
									height={100}
									alt="bulsu main logo"
									className=""
								/>
								<Image
									src={"/bsu-meneses-logo.png"}
									width={40}
									height={100}
									alt="bulsu meneses logo"
									className="absolute left-[60px]"
								/>
							</div>
							<h1 className="font-bold leading-tight text-center sm:text-left text-base sm:text-lg">
								Bulacan State University <br /> Meneses Campus
							</h1>
						</div>
						<CardTitle className="text-4xl my-8">Facilium</CardTitle>
					</CardHeader>
					<CardContent className="flex-grow">
						<Form {...form}>
							<div className="welcome-msg">
								<h1 className="text-3xl">Welcome Back!</h1>
								<h2 className="tracking-widest font-light mt-3">
									Log in to access your admin dashboard.
								</h2>
							</div>
							<form
								onSubmit={form.handleSubmit(handleSubmit)}
								className="mt-16"
							>
								<fieldset className="flex flex-col gap-4">
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
													<Input
														type="password"
														placeholder="******"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<Button type="submit" className="mt-2">
										Login
									</Button>
								</fieldset>
							</form>
						</Form>
					</CardContent>
				</Card>
			</div>
		</div>
	);
};

export default AdminForm;
