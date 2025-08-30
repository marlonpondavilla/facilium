"use client";

import { ArrowLeft, Building, NotebookPen } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
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
import { validateScheduleTimeRange } from "@/lib/utils";
import { Checkbox } from "./ui/checkbox";
import ScheduleTable from "./schedule-table";
import { ScheduleItem } from "@/types/SceduleInterface";
import {
	addDocumentToFirestore,
	checkIfDocumentExists,
	checkIfScheduleConflictExists,
} from "@/data/actions";
import Loading from "./loading";
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "./ui/alert-dialog";
import Link from "next/link";

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
	scheduleItems: ScheduleItem[];
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
	scheduleItems,
}: FacultyScheduleInterfaceProps) => {
	const [isLoading, setIsLoading] = useState(false);
	const [open, setOpen] = useState(false);
	const [error, setError] = useState("");

	const pathname = usePathname();
	const router = useRouter();
	const searchParams = useSearchParams();
	const classroomId = searchParams.get("classroomId");
	const programId = searchParams.get("programId");
	const yearLevelId = searchParams.get("yearLevelId");
	const sectionId = searchParams.get("sectionId");

	const days = ["Mon", "Tues", "Wed", "Thurs", "Fri", "Sat"];

	const form = useForm<z.infer<typeof scheduleSchema>>({
		resolver: zodResolver(scheduleSchema),
		defaultValues: {
			program: "",
			yearLevel: "",
			section: "",
			courseCode: "",
			professor: "",
			day: "",
			start: 0,
			duration: 0,
			halfHour: 0,
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

	const makeLoading = () => {
		setIsLoading(true);

		setTimeout(() => {
			setIsLoading(false);
		}, 2000);

		return;
	};

	// form watchers
	const programWatcher = form.watch("program");
	const yearLevelWatcher = form.watch("yearLevel");
	const sectionWatcher = form.watch("section");
	const courseCodeWatcher = form.watch("courseCode");
	const professorWatcher = form.watch("professor");
	const dayWatcher = form.watch("day");
	const startWatcher = form.watch("start");
	const durationWatcher = form.watch("duration");
	const halfHourWatcher = form.watch("halfHour");

	useEffect(() => {
		form.clearErrors();
		makeLoading();
		setError("");
	}, [
		programWatcher,
		yearLevelWatcher,
		sectionWatcher,
		courseCodeWatcher,
		professorWatcher,
		dayWatcher,
		startWatcher,
		durationWatcher,
		halfHourWatcher,
	]);

	const handleClassroomClick = (id: string) => {
		const params = new URLSearchParams({
			classroomId: id,
		});
		router.push(`${pathname}?${params.toString()}`);
		form.reset();
		setError("");
		makeLoading();
	};

	// submit function for schedule
	const handleScheduleSubmit = async (
		values: z.infer<typeof scheduleSchema>
	) => {
		const scheduleResult = validateScheduleTimeRange(
			values.start,
			values.duration
		);

		if (!scheduleResult.isValid) {
			toast.error(scheduleResult.error || "Invalid time.");
			setError(scheduleResult.error || "Invalid time.");
			return;
		}

		if (!classroomId) {
			toast.error("Classroom ID is missing.");
			return;
		}

		const scheduleData = {
			...values,
			classroomId,
		};

		const scheduleConflictFound = await checkIfScheduleConflictExists(
			scheduleData
		);

		if (scheduleConflictFound) {
			toast.error(`There is a schedule conflict`);
			setError("A schedule conflict occured.");
			setOpen(true);
			return;
		}

		const result = await addDocumentToFirestore("scheduleData", {
			...scheduleData,
			created: new Date().toISOString(),
		});

		if (result.success) {
			toast.success("Schedule submitted!");
			makeLoading();
			form.reset();
			setError("");
		}

		router.push(pathname);
	};

	return (
		<div className="flex flex-col gap-4 w-full max-w-7xl md:px-8 lg:px-10 mx-auto scroll-smooth">
			{/* loading spinner */}
			{isLoading && <Loading />}

			{/* alert dialog pop up */}
			<AlertDialog open={open} onOpenChange={setOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle className="text-red-600">
							{error}
						</AlertDialogTitle>
						<AlertDialogDescription>
							please check your schedule and other classrooms before plotting
							again.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={() => setOpen(false)}>
							Ok, I understand.
						</AlertDialogCancel>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Building Header */}
			<div className="building-title facilium-bg-whiter flex flex-wrap items-center justify-center gap-3 py-6 px-4 sm:px-6 md:px-10 rounded-2xl text-center">
				<Link className="flex" href={"/dashboard"}>
					<ArrowLeft />
					Go to Home
				</Link>
				<Building className="w-10 h-10" />
				<h1 className="text-4xl facilium-color-indigo font-bold tracking-wide">
					{buildingName}
				</h1>
			</div>

			{/* Classrooms */}
			<div className="classrooms-container facilium-bg-whiter py-4 px-2 sm:px-4 rounded-t-2xl max-w-full">
				<div className="classrom-title flex items-center gap-2 border-b border-gray-300">
					<NotebookPen className="w-5 h-5" />
					<p className="facilium-color-indigo font-bold text-lg py-2">
						Classrooms
					</p>
				</div>

				<div className="classroom-item flex flex-wrap gap-3 py-3 justify-center sm:justify-start">
					{data.map((classroom) => (
						<p
							key={classroom.id}
							onClick={() => handleClassroomClick(classroom.id)}
							className={`${
								classroom.id === classroomId
									? "facilium-bg-indigo facilium-color-white"
									: "border border-black font-semibold facilium-color-indigo"
							} cursor-pointer rounded text-sm py-3 px-5 sm:py-2 sm:px-4 transition-colors`}
						>
							{classroom.classroomName}
						</p>
					))}
				</div>

				{data.length < 1 && (
					<p className="text-center text-gray-500 text-sm sm:text-base">
						No available classrooms for this building.
					</p>
				)}
			</div>

			{/* Schedule Form & Table Container */}
			<div className="w-full max-w-7xl mx-auto px-0 grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6">
				{/* Schedule Form */}
				<div className="schedule-actions-wrapper facilium-bg-whiter p-4 rounded w-full max-w-full self-start">
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
															const selectedProgram = programs.find(
																(p) => p.programCode === value
															);
															if (!selectedProgram) return;
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
														onValueChange={(value) => {
															// reflects select item change
															const selectedProf = professors.find(
																(p) => p.id === value
															);

															if (!selectedProf) {
																return;
															}

															updateQueryParamAndForm(
																"professorId",
																selectedProf.id
															);

															form.setValue("professor", value);
														}}
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
																			value={`${professor.id}`}
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
								{/* Day select */}
								<div>
									<FormField
										control={form.control}
										name="day"
										render={({ field }) => (
											<FormItem>
												<div className="flex items-center gap-4">
													<FormLabel>Day</FormLabel>
													<Select
														onValueChange={field.onChange}
														value={field.value}
														disabled={!professorWatcher}
													>
														<FormControl>
															<SelectTrigger>
																<SelectValue placeholder="Select day" />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															<SelectGroup>
																{days.map((day) => (
																	<SelectItem key={day} value={day}>
																		{day}
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

								{/* Start and Duration Section */}
								<div className="border-t-2 border-t-pink-400 py-4">
									<div className="flex flex-wrap items-center gap-2">
										{/* Start Time */}
										<FormField
											control={form.control}
											name="start"
											render={({ field }) => (
												<FormItem className="flex flex-col">
													<div className="flex items-center gap-2">
														<FormLabel className="text-xs w-16">
															Start:
														</FormLabel>
														<Select
															onValueChange={(value) =>
																field.onChange(Number(value))
															}
															value={field.value?.toString()}
															disabled={!dayWatcher}
														>
															<FormControl>
																<SelectTrigger className="w-24 border-gray-500">
																	<SelectValue placeholder="Start time" />
																</SelectTrigger>
															</FormControl>
															<SelectContent>
																<SelectGroup>
																	{Array.from({ length: 28 }, (_, i) => {
																		const hour = 7 + Math.floor(i / 2);
																		const minute = i % 2 === 0 ? "00" : "30";
																		const label = `${hour}:${minute}`;
																		// Value: encode as a number with `.5` for half hour, e.g. 7, 7.5, 8, 8.5 etc.
																		const value =
																			hour + (minute === "30" ? 0.5 : 0);
																		return (
																			<SelectItem
																				key={i}
																				value={value.toString()}
																			>
																				{label}
																			</SelectItem>
																		);
																	})}
																</SelectGroup>
															</SelectContent>
														</Select>
													</div>
													<FormMessage className="text-xs" />
												</FormItem>
											)}
										/>

										{/* Duration */}
										<FormField
											control={form.control}
											name="duration"
											render={({ field }) => (
												<FormItem className="flex flex-col">
													<div className="flex items-center gap-2">
														<FormLabel className="text-xs w-16">
															Duration:
														</FormLabel>
														<Select
															onValueChange={(value) =>
																field.onChange(Number(value))
															}
															value={field.value?.toString()}
															disabled={!startWatcher}
														>
															<FormControl>
																<SelectTrigger className="w-24 border-gray-500">
																	<SelectValue placeholder="Select" />
																</SelectTrigger>
															</FormControl>
															<SelectContent>
																<SelectGroup>
																	{Array.from({ length: 5 }, (_, i) => {
																		const durationHour = i + 1;
																		const label = `${durationHour} ${
																			durationHour === 1 ? "hr" : "hrs"
																		}`;
																		return (
																			<SelectItem
																				key={durationHour}
																				value={durationHour.toString()}
																			>
																				{label}
																			</SelectItem>
																		);
																	})}
																</SelectGroup>
															</SelectContent>
														</Select>
													</div>
													<FormMessage className="text-xs" />
												</FormItem>
											)}
										/>

										{/* +30 Minutes Checkbox */}
										<FormField
											control={form.control}
											name="halfHour"
											render={({ field }) => (
												<FormItem className="flex flex-col">
													<div className="flex items-center gap-2 h-10">
														<FormLabel className="text-xs w-16">
															+30mins:
														</FormLabel>
														<FormControl>
															<Checkbox
																checked={!!field.value}
																disabled={!durationWatcher}
																className="border-gray-500"
																onCheckedChange={(checked) =>
																	field.onChange(checked ? 30 : 0)
																}
															/>
														</FormControl>
													</div>
													<FormMessage className="text-xs" />
												</FormItem>
											)}
										/>
									</div>

									{/* Conditional error messages */}
									{!dayWatcher && (
										<p className="text-red-400 text-xs text-center mt-2">
											Complete the information above first.
										</p>
									)}

									{error && (
										<p className="text-red-400 text-sm text-center mt-4">
											Note: {error}
										</p>
									)}
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

				{/* Schedule Table */}
				<div className="schedule-action-controls facilium-bg-whiter p-4 rounded w-full max-w-full">
					{!classroomId && (
						<p className="text-base text-center py-2 text-pink-600">
							Select a classroom first to view plotted schedule.
						</p>
					)}
					<ScheduleTable scheduleItems={scheduleItems} />
				</div>
			</div>
		</div>
	);
};

export default FacultyScheduleInterface;
