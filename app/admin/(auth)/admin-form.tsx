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
		<div className="flex flex-col lg:flex-row h-screen facilium-bg-red facilium-color-white overflow-auto">
			{/* Left Side */}
			<div className="flex-col justify-center items-center gap-8 px-6 py-8 hidden flex-2 lg:flex">
				<div className="flex items-center">
					<Image
						src="/facilium-logo.png"
						width={80}
						height={80}
						alt="Facilium Logo"
					/>
					<h1 className="text-3xl font-bold ml-4">Facilium</h1>
				</div>

				<h2 className="text-center text-lg sm:text-xl max-w-xl leading-relaxed tracking-widest">
					Secure. Manage. Empower. Your access shapes the system.
				</h2>

				<Image
					src="/admin-login-Illustration.png"
					width={800}
					height={800}
					alt="Admin Dashboard Illustration"
					className="rounded-lg shadow-lg w-full max-w-3xl h-auto"
				/>
			</div>

			{/* Right Side (Login Form) */}
			{/* force on larger screens (2xl) to be flex 1 bwisit gumana din*/}
			<div className="w-full h-full flex-1/7 2xl:flex-1">
				<Card className="flex flex-col h-full w-full facilium-bg-white facilium-color-black shadow-xl p-6 sm:p-8 rounded-none">
					<CardHeader>
						<div className="header-info flex flex-col sm:flex-row items-center sm:justify-center gap-4 text-center sm:text-left">
							<div className="logo-container flex gap-2 items-center justify-center sm:justify-start">
								<Image
									src={"/bsu-main-logo.png"}
									width={40}
									height={40}
									alt="bulsu main logo"
									className="w-10 h-10 sm:w-12 sm:h-12"
								/>
								<Image
									src={"/bsu-meneses-logo.png"}
									width={40}
									height={40}
									alt="bulsu meneses logo"
									className="w-10 h-10 sm:w-12 sm:h-12"
								/>
							</div>
							<h1 className="font-bold leading-tight text-sm sm:text-lg">
								Bulacan State University <br className="hidden sm:block" />
								Meneses Campus
							</h1>
						</div>

						<CardTitle className="text-3xl sm:text-4xl my-6 sm:my-8 text-center lg:text-left">
							Facilium
						</CardTitle>
					</CardHeader>
					<CardContent className="flex-grow">
						<Form {...form}>
							<div className="welcome-msg text-center lg:text-left">
								<h1 className="text-2xl sm:text-3xl">Welcome Back!</h1>
								<h2 className="tracking-widest font-light mt-2 sm:mt-3 text-sm sm:text-base">
									Log in to access your admin dashboard.
								</h2>
							</div>
							<form
								onSubmit={form.handleSubmit(handleSubmit)}
								className="mt-12 sm:mt-16"
							>
								<fieldset className="flex flex-col gap-4 lg:m-0 sm:mx-[12rem]">
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
									<Button type="submit" className="mt-2 w-full">
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
