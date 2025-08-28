"use client";

import { Building, NotebookPen } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useState } from "react";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";
import { Button } from "./ui/button";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { scheduleSchema } from "@/validation/scheduleSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import {
	Form,
	FormLabel,
	FormControl,
	FormField,
	FormItem,
	FormMessage,
} from "./ui/form";
import toast from "react-hot-toast";

type FacultyScheduleInterfaceProps = {
	buildingName: string;
	data: {
		id: string;
		classroomName: string;
	}[];
	programs: {
		id: string;
		programCode: string;
	}[];
};

type ScheduleProps = {
	program: string;
};

const FacultyScheduleInterface = ({
	buildingName,
	data,
	programs,
}: FacultyScheduleInterfaceProps) => {
	const pathname = usePathname();
	const router = useRouter();
	const searchParams = useSearchParams();
	const classroomId = searchParams.get("classroomId");

	const form = useForm<z.infer<typeof scheduleSchema>>({
		resolver: zodResolver(scheduleSchema),
		defaultValues: {
			program: "",
			yearLevel: "",
			section: "",
			courseCode: "",
			professor: "",
		},
	});

	// form watchers
	const program = form.watch("program");
	const yearLevel = form.watch("yearLevel");
	const section = form.watch("section");
	const courseCode = form.watch("courseCode");
	const professor = form.watch("professor");

	const handleClassroomClick = (id: string) => {
		const params = new URLSearchParams({
			classroomId: id,
		});
		router.push(`${pathname}?${params.toString()}`);
	};

	const handleScheduleSubmit = async (
		values: z.infer<typeof scheduleSchema>
	) => {
		await new Promise((resolve) => {
			form.reset();
			setTimeout(resolve, 1000);
		});

		console.log("Form values:", values);
		toast.success("Schedule submitted!");
	};

	return (
		<div className="flex flex-col gap-4 w-6xl scroll-smooth">
			{/* Building Header */}
			<div className="building-title facilium-bg-whiter flex items-center justify-center gap-3 py-8 rounded-2xl">
				<Building className="w-10 h-10" />
				<h1 className="text-4xl facilium-color-indigo font-bold tracking-wide">
					{buildingName}
				</h1>
			</div>

			{/* Classrooms */}
			<div className="classrooms-container facilium-bg-whiter py-4 px-4 rounded-2xl">
				<div className="classrom-title flex items-center gap-2 border-b border-gray-300">
					<NotebookPen className="w-5 h-5" />
					<p className="facilium-color-indigo font-bold text-lg py-2">
						Classrooms
					</p>
				</div>
				<div className="classroom-item flex justify-start gap-3 py-3 flex-wrap">
					{data.map((classroom) => (
						<p
							key={classroom.id}
							onClick={() => handleClassroomClick(classroom.id)}
							className={`${
								classroom.id === classroomId
									? "facilium-bg-indigo facilium-color-white"
									: "border border-black font-semibold facilium-color-indigo"
							} py-2 px-4 rounded cursor-pointer text-sm`}
						>
							{classroom.classroomName}
						</p>
					))}
				</div>
				{data.length < 1 && (
					<p className="text-center text-gray-500">
						No available classrooms for this building.
					</p>
				)}
			</div>

			{/* Schedule Form */}
			<div className="schedule-container grid grid-cols-3 gap-4 w-full">
				<div className="schedule-actions-wrapper facilium-bg-whiter">
					<div className="text-xl facilium-color-indigo text-center font-semibold border-b border-gray-400 py-4">
						<h2>
							{classroomId
								? `Schedule ${
										data.find((classroom) => classroom.id === classroomId)
											?.classroomName || "--"
								  }`
								: "Schedule Classroom"}
						</h2>
					</div>

					<Form {...form}>
						<form
							onSubmit={form.handleSubmit(handleScheduleSubmit)}
							className="p-4 flex flex-col gap-4"
						>
							<fieldset
								disabled={form.formState.isSubmitting}
								className="flex flex-col gap-3"
							>
								{!classroomId && (
									<p className="text-center text-red-400 text-sm">
										*select a classroom first to start scheduling
									</p>
								)}
								{/* Program Select Field */}
								<div>
									<FormField
										control={form.control}
										name="program"
										render={({ field }) => (
											<FormItem>
												<div className="flex items-center gap-4">
													<FormLabel>Program</FormLabel>
													<Select
														onValueChange={field.onChange}
														{...field}
														defaultValue={field.value}
														disabled={!classroomId}
													>
														<FormControl>
															<SelectTrigger>
																<SelectValue placeholder="Select Program" />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															<SelectGroup>
																{programs.map((program) => (
																	<SelectItem
																		key={program.id}
																		value={program.programCode}
																	>
																		{program.programCode}
																	</SelectItem>
																))}
															</SelectGroup>
														</SelectContent>
													</Select>
												</div>
												<FormMessage className="text-xs" />
											</FormItem>
										)}
									/>
								</div>
								{/* Year Select Field */}
								<div>
									<FormField
										control={form.control}
										name="yearLevel"
										render={({ field }) => (
											<FormItem>
												<div className="flex items-center gap-4">
													<FormLabel>Year Level</FormLabel>
													<Select
														onValueChange={field.onChange}
														defaultValue={field.value}
														{...field}
														disabled={!program}
													>
														<FormControl>
															<SelectTrigger>
																<SelectValue placeholder="Select Year Level" />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															<SelectGroup>
																{programs.map((program) => (
																	<SelectItem
																		key={program.id}
																		value={program.programCode}
																	>
																		{program.programCode}
																	</SelectItem>
																))}
															</SelectGroup>
														</SelectContent>
													</Select>
												</div>
												<FormMessage className="text-xs" />
											</FormItem>
										)}
									/>
								</div>
								{/* Section Select Field */}
								<div>
									<FormField
										control={form.control}
										name="section"
										render={({ field }) => (
											<FormItem>
												<div className="flex items-center gap-4">
													<FormLabel>Section</FormLabel>
													<Select
														onValueChange={field.onChange}
														defaultValue={field.value}
														{...field}
														disabled={!yearLevel}
													>
														<FormControl>
															<SelectTrigger>
																<SelectValue placeholder="Select Section" />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															<SelectGroup>
																{programs.map((program) => (
																	<SelectItem
																		key={program.id}
																		value={program.programCode}
																	>
																		{program.programCode}
																	</SelectItem>
																))}
															</SelectGroup>
														</SelectContent>
													</Select>
												</div>
												<FormMessage className="text-xs" />
											</FormItem>
										)}
									/>
								</div>
								{/* Course Select Field */}
								<div>
									<FormField
										control={form.control}
										name="courseCode"
										render={({ field }) => (
											<FormItem>
												<div className="flex items-center gap-4">
													<FormLabel>Course Code</FormLabel>
													<Select
														onValueChange={field.onChange}
														defaultValue={field.value}
														{...field}
														disabled={!section}
													>
														<FormControl>
															<SelectTrigger>
																<SelectValue placeholder="Select Course" />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															<SelectGroup>
																{programs.map((program) => (
																	<SelectItem
																		key={program.id}
																		value={program.programCode}
																	>
																		{program.programCode}
																	</SelectItem>
																))}
															</SelectGroup>
														</SelectContent>
													</Select>
												</div>
												<FormMessage className="text-xs" />
											</FormItem>
										)}
									/>
								</div>
								{/* Professor Select Field */}
								<div>
									<FormField
										control={form.control}
										name="professor"
										render={({ field }) => (
											<FormItem>
												<div className="flex items-center gap-4">
													<FormLabel>Professor</FormLabel>
													<Select
														onValueChange={field.onChange}
														defaultValue={field.value}
														{...field}
														disabled={!courseCode}
													>
														<FormControl>
															<SelectTrigger>
																<SelectValue placeholder="Select Professor" />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															<SelectGroup>
																{programs.map((program) => (
																	<SelectItem
																		key={program.id}
																		value={program.programCode}
																	>
																		{program.programCode}
																	</SelectItem>
																))}
															</SelectGroup>
														</SelectContent>
													</Select>
												</div>
												<FormMessage className="text-xs" />
											</FormItem>
										)}
									/>
								</div>

								{/* Submit Button */}
								<Button
									type="submit"
									className="facilium-bg-indigo text-white w-full"
								>
									{form.formState.isSubmitting
										? "Submitting"
										: "Submit Schedule"}
								</Button>
							</fieldset>
						</form>
					</Form>
				</div>

				{/* Right Column Placeholder */}
				<div className="schedule-action-controls facilium-bg-whiter p-4 rounded col-span-2 row-span-12">
					test
				</div>
			</div>
		</div>
	);
};

export default FacultyScheduleInterface;
