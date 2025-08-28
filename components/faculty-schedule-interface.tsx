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
import { FieldPath, FieldPathValue, useForm } from "react-hook-form";
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
	yearLevels: {
		id: string;
		programId: string;
		yearLevel: string;
	}[];
	sections: {
		id: string;
		yearLevelId: string;
		sectionName: string;
	}[];
	courses: {
		id: string;
		yearLevelId: string;
		courseCode: string;
	}[];
	professors: {
		id: string;
		designation: string;
		firstName: string;
		lastName: string;
	}[];
};

type ScheduleFormValues = z.infer<typeof scheduleSchema>;

const FacultyScheduleInterface = ({
	buildingName,
	data,
	programs,
	yearLevels,
	sections,
	courses,
	professors,
}: FacultyScheduleInterfaceProps) => {
	const pathname = usePathname();
	const router = useRouter();
	const searchParams = useSearchParams();
	const classroomId = searchParams.get("classroomId");
	const programId = searchParams.get("programId");
	const yearLevelId = searchParams.get("yearLevelId");
	const sectionId = searchParams.get("sectionId");

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

	const updateQueryParamAndForm = <T extends FieldPath<ScheduleFormValues>>(
		key: string,
		value: FieldPathValue<ScheduleFormValues, T>
	) => {
		const params = new URLSearchParams(window.location.search);
		params.set(key, String(value));
		router.push(`${pathname}?${params.toString()}`, { scroll: false });
	};

	// form watchers
	const programWatcher = form.watch("program");
	const yearLevelWatcher = form.watch("yearLevel");
	const sectionWatcher = form.watch("section");
	const courseCodeWatcher = form.watch("courseCode");
	const professorWatcher = form.watch("professor");

	// designation allowed as professor in (professor select)
	const designationAllowed = ["Faculty", "Program Head", "Dean"];

	const handleClassroomClick = (id: string) => {
		const params = new URLSearchParams({
			classroomId: id,
		});
		router.push(`${pathname}?${params.toString()}`);
		form.reset();
	};

	const handleScheduleSubmit = async (
		values: z.infer<typeof scheduleSchema>
	) => {
		// send to db
		const scheduleData = {
			...values,
			classroomId: classroomId,
		};
		await new Promise((resolve) => {
			form.reset();
			setTimeout(resolve, 1000);
		});

		console.table(scheduleData);
		toast.success("Schedule submitted!");

		router.push(pathname);
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
														onValueChange={(value) => {
															// match the selected program
															const selectedProgram = programs.find(
																(p) => p.programCode === value
															);
															// exit early if nothing found
															if (!selectedProgram) {
																return;
															}

															updateQueryParamAndForm(
																"programId",
																selectedProgram.id
															);

															form.setValue("program", value);
														}}
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
														onValueChange={(value) => {
															// reflects select item change
															const selectedYear = yearLevels.find(
																(y) => y.id === value
															);

															if (!selectedYear) {
																return;
															}

															updateQueryParamAndForm(
																"yearLevelId",
																selectedYear.id
															);

															form.setValue("yearLevel", value);
														}}
														defaultValue={field.value}
														{...field}
														disabled={!(programWatcher && programId)}
													>
														<FormControl>
															<SelectTrigger>
																<SelectValue placeholder="Select Year Level" />
															</SelectTrigger>
														</FormControl>
														{programId ? (
															<SelectContent>
																<SelectGroup>
																	{yearLevels
																		.filter(
																			(yearLevel) =>
																				yearLevel.programId === programId
																		)
																		.map((yearLevel) => (
																			<SelectItem
																				key={yearLevel.id}
																				value={yearLevel.id}
																			>
																				{yearLevel.yearLevel}
																			</SelectItem>
																		))}
																</SelectGroup>
															</SelectContent>
														) : null}
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
														onValueChange={(value) => {
															const selectedSection = sections.find(
																(s) => s.sectionName === value
															);

															if (!selectedSection) {
																return;
															}

															updateQueryParamAndForm(
																"sectionId",
																selectedSection.id
															);

															form.setValue("section", value);
														}}
														defaultValue={field.value}
														{...field}
														disabled={!(yearLevelId && yearLevelWatcher)}
													>
														<FormControl>
															<SelectTrigger>
																<SelectValue placeholder="Select Section" />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															<SelectGroup>
																{sections
																	.filter(
																		(section) =>
																			section.yearLevelId === yearLevelId
																	)
																	.map((section) => (
																		<SelectItem
																			key={section.id}
																			value={section.sectionName}
																		>
																			{section.sectionName}
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
								{/* Courses Select Field */}
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
														disabled={!(sectionWatcher && sectionId)}
													>
														<FormControl>
															<SelectTrigger>
																<SelectValue placeholder="Select Course" />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															<SelectGroup>
																{courses
																	.filter(
																		(course) =>
																			course.yearLevelId === yearLevelId
																	)
																	.map((course) => (
																		<SelectItem
																			key={course.id}
																			value={course.courseCode}
																		>
																			{course.courseCode}
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
														disabled={!courseCodeWatcher}
													>
														<FormControl>
															<SelectTrigger>
																<SelectValue placeholder="Select Professor" />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															<SelectGroup>
																{professors
																	.filter(
																		(professor) =>
																			professor.designation !== "Admin"
																	)
																	.map((professor) => (
																		<SelectItem
																			key={professor.id}
																			value={`${professor.firstName} ${professor.lastName}`}
																		>
																			{`${professor.firstName} ${professor.lastName}`}
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
