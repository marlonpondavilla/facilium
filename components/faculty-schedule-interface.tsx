"use client";

import { ArrowLeft, Building, NotebookPen, TriangleAlert } from "lucide-react";
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
	getDocumentsByFieldIds,
	getDocumentsFromFirestore,
	getSingleDocumentFromFirestore,
} from "@/data/actions";
import Loading from "./loading";
import Link from "next/link";
import WarningPopUp from "./warning-pop-up";
import { AcademicYear } from "@/types/academicYearType";
import ConfirmationHandleDialog from "./confirmation-handle-dialog";

type FacultyScheduleInterfaceProps = {
	buildingName: string;
	data: {
		id: string;
		classroomName: string;
	}[];
	programs?: {
		id: string;
		programCode: string;
	}[];
	yearLevels?: {
		id: string;
		programId: string;
		yearLevel: string;
	}[];
	sections?: {
		id: string;
		yearLevelId: string;
		sectionName: string;
	}[];
	courses?: {
		id: string;
		termId: string;
		yearLevelId: string;
		courseCode: string;
	}[];
	academicTerms?: {
		id: string;
		programId: string;
		yearLevelId: string;
		term: string;
	}[];
	academicYears?: AcademicYear[];
	professors?: {
		id: string;
		designation: string;
		firstName: string;
		lastName: string;
	}[];
	scheduleItems: ScheduleItem[];
};

type ScheduleFormValues = z.infer<typeof scheduleSchema>;

type ScheduleForDean = {
	id: string;
	classroomId: string;
};

const FacultyScheduleInterface = ({
	buildingName,
	data,
	programs,
	yearLevels,
	sections,
	courses,
	academicTerms,
	academicYears,
	professors,
	scheduleItems,
}: FacultyScheduleInterfaceProps) => {
	const [isLoading, setIsLoading] = useState(false);
	const [openConflict, setOpenConflict] = useState(false);
	const [openNoClassroom, setOpenNoClassroom] = useState(false);
	const [openNoSchedule, setOpenNoSchedule] = useState(false);
	const [openPendingScheduleExist, setOpenPendingScheduleExist] =
		useState(false);
	const [isPendingScheduleExist, setIsPendingScheduleExist] = useState(false);
	const [error, setError] = useState("");

	const pathname = usePathname();
	const router = useRouter();
	const searchParams = useSearchParams();
	const classroomId = searchParams.get("classroomId");
	const programId = searchParams.get("programId");
	const yearLevelId = searchParams.get("yearLevelId");
	const sectionId = searchParams.get("sectionId");
	const hasSchedule = scheduleItems.some(
		(schedule) => schedule.classroomId === classroomId
	);
	const scheduleLength = scheduleItems.filter(
		(schedule) => schedule.classroomId === classroomId
	).length;

	const days = ["Mon", "Tues", "Wed", "Thurs", "Fri", "Sat"];
	const activeYear = academicYears?.find((year) => year.isActive);
	const activeTermName = activeYear?.term;

	const matchingTerm = academicTerms?.find(
		(term) =>
			term.term.trim().toLowerCase() === activeTermName?.trim().toLowerCase() &&
			term.yearLevelId === yearLevelId
	);

	const filteredCourses =
		matchingTerm && Array.isArray(courses)
			? courses.filter(
					(course) =>
						course.yearLevelId === yearLevelId &&
						course.termId === matchingTerm.id
			  )
			: [];

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

		if (data.length < 1) {
			setOpenNoClassroom(true);
		}
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

	// Pop up state and effect
	useEffect(() => {
		if (!classroomId) return;

		setIsPendingScheduleExist(false);

		if (!hasSchedule) {
			setOpenNoSchedule(true);
		}

		let isCancelled = false;

		const checkPendingSchedule = async () => {
			try {
				const exists = await checkIfDocumentExists(
					"pendingScheduleData",
					"classroomId",
					classroomId
				);

				if (!isCancelled && exists) {
					setIsPendingScheduleExist(true);
				}
			} catch (error) {
				console.error("Error checking pending schedule:", error);
			}
		};

		checkPendingSchedule();

		return () => {
			isCancelled = true;
		};
	}, [classroomId, hasSchedule]);

	const handleClassroomClick = (id: string) => {
		const params = new URLSearchParams({
			classroomId: id,
		});

		router.push(`${pathname}?${params.toString()}`);
		form.reset();
		setError("");
		makeLoading();
	};

	// add function for schedule
	const handleScheduleAdd = async (values: z.infer<typeof scheduleSchema>) => {
		if (isPendingScheduleExist) {
			setOpenPendingScheduleExist(true);
			setError("Schedule submitted can be updated once the Dean reviewed it.");
			return;
		}

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

		const scheduleConflictId = await checkIfScheduleConflictExists(
			scheduleData
		);

		if (scheduleConflictId) {
			const classroomId = await getSingleDocumentFromFirestore(
				scheduleConflictId,
				"scheduleData",
				"classroomId"
			);

			const classroomConflictName = await getSingleDocumentFromFirestore(
				classroomId,
				"classrooms",
				"classroomName"
			);

			toast.error(`There is a schedule conflict`);
			setError(`A schedule conflict occured with ${classroomConflictName}`);
			setOpenConflict(true);
			return;
		}

		const result = await addDocumentToFirestore("scheduleData", {
			...scheduleData,
			status: false,
			created: new Date().toISOString(),
		});

		if (result.success) {
			toast.success("New schedule added!");
			makeLoading();
			form.reset();
			setError("");
		}

		router.push(pathname);
	};

	// Submit schedule to dean function
	const handleSubmitScheduleToDean = async () => {
		if (!classroomId) return;
		try {
			if (isPendingScheduleExist) {
				toast.error(
					"This schedule is already in pending, wait for the Dean to Approve"
				);
				return;
			}

			const scheduleData = await getDocumentsFromFirestore<ScheduleForDean>(
				"scheduleData"
			);

			const scheduleForDean = scheduleData.filter(
				(schedule) => schedule.classroomId === classroomId
			);

			const result = await addDocumentToFirestore("pendingScheduleData", {
				scheduleItems: scheduleForDean,
				classroomId,
				submitted: new Date().toISOString(),
			});

			if (result.success) {
				toast.success("Your schedule is submitted to the Dean.");
				// maybe create a pop up dialog here
				router.push(pathname);
				return;
			}
		} catch (e) {
			console.error(e);
		}
	};

	return (
		<div className="flex flex-col gap-4 w-full max-w-7xl md:px-8 lg:px-10 mx-auto scroll-smooth">
			{/* loading spinner */}
			{isLoading && <Loading />}

			{/* alert dialog pop up when conflict arise */}
			<WarningPopUp
				open={openConflict}
				setOpen={setOpenConflict}
				title={error}
				description="please check your schedule and other classrooms before plotting again."
			/>

			{/* Building Header */}
			<div className="building-title facilium-bg-whiter items-center gap-3 py-6 px-4 sm:px-6 md:px-10 rounded-2xl text-center">
				<Link className="flex items-center text-xs" href={"/dashboard"}>
					<ArrowLeft className="w-4 h-auto" />
					<p className="hover:opacity-50">Home</p>
				</Link>
				<div className="flex justify-center items-center">
					<Building className="w-10 h-10" />
					<h1 className="text-4xl facilium-color-indigo font-bold tracking-wide">
						{buildingName}
					</h1>
				</div>
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
									: "border border-black font-semibold facilium-color-indigo hover:bg-gray-200"
							} cursor-pointer rounded text-sm py-3 px-5 sm:py-2 sm:px-4 transition-colors`}
						>
							{classroom.classroomName}
						</p>
					))}
				</div>
				{!classroomId && data.length > 1 && (
					<p className={`text-start text-red-400 text-xs `}>
						Select a classroom first to
						{pathname.startsWith("/faculty") || pathname.startsWith("/dean")
							? " view a schedule"
							: " start scheduling"}
					</p>
				)}

				{data.length < 1 && (
					<p className="text-center text-gray-500 text-sm sm:text-base">
						No available classrooms for this building.
					</p>
				)}

				{!hasSchedule && classroomId && (
					<p className="text-xs text-red-500">
						No available schedules for this classroom
					</p>
				)}
			</div>

			{/* Pop up message when there is no classrooms available */}
			<WarningPopUp
				open={openNoClassroom}
				setOpen={setOpenNoClassroom}
				title="There is no classroom available in this building."
				description="If you think this is wrong please contact your admin or try viewing other buildings available."
			/>

			{/* Pop up message when there is no schedules available */}
			<WarningPopUp
				open={openNoSchedule}
				setOpen={setOpenNoSchedule}
				title="There is no available schedule in this classroom."
				description="If you think this is wrong please contact your admin"
			/>

			{/* Pop up message when there is pending schedule and add try to a schedule */}
			<WarningPopUp
				open={openPendingScheduleExist}
				setOpen={setOpenPendingScheduleExist}
				title="Please wait until the Dean approve or reject this schedule."
				description="You can make changes again once the status of this schedule is updated."
			/>

			{/* Schedule Form & Table Container */}
			<div className="w-full max-w-7xl mx-auto px-0 grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6">
				{/* Schedule Form */}
				<div
					className={`schedule-actions-wrapper facilium-bg-whiter p-4 rounded w-full self-start ${
						!pathname.startsWith("/program-head") ? "hidden" : "max-w-full"
					}`}
				>
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
							onSubmit={form.handleSubmit(handleScheduleAdd)}
							className={`p-4 flex-col gap-4 ${
								!pathname.startsWith("/program-head") ? "hidden" : "flex"
							}`}
						>
							<fieldset
								disabled={form.formState.isSubmitting}
								className="flex flex-col gap-3"
							>
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
															const selectedProgram = programs?.find(
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
																{programs?.map((program) => (
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
															const selectedYear = yearLevels?.find(
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
																		?.filter(
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
															const selectedSection = sections?.find(
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
																	?.filter(
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
																{filteredCourses.length > 0 ? (
																	filteredCourses.map((course) => (
																		<SelectItem
																			key={course.id}
																			value={course.courseCode}
																		>
																			{course.courseCode}
																		</SelectItem>
																	))
																) : (
																	<SelectItem disabled value="no-course">
																		No courses found
																	</SelectItem>
																)}
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
															const selectedProf = professors?.find(
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
																	?.filter(
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
									{!dayWatcher && data.length > 1 && (
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

								{/* Add schedule Button */}
								{classroomId && (
									<Button
										type="submit"
										className="facilium-bg-indigo text-white w-full"
										disabled={data.length < 1}
									>
										{form.formState.isSubmitting ? "Adding" : "Add Schedule"}
									</Button>
								)}

								{/* Submit schedule to dean */}
								{classroomId && (
									<ConfirmationHandleDialog
										trigger={
											<Button
												type="button"
												variant={"destructive"}
												disabled={scheduleLength < 3 || isPendingScheduleExist}
												className="w-full"
											>
												Submit schedule to Dean
											</Button>
										}
										title="Are you sure you want to submit this schedule to Dean?"
										description="You cannot make changes in this schedule until the Dean change the status of your plotted schedule."
										onConfirm={handleSubmitScheduleToDean}
									/>
								)}
							</fieldset>
						</form>
					</Form>
				</div>

				{/* Schedule Table */}
				<div
					className={`schedule-action-controls facilium-bg-whiter p-4 rounded w-full ${
						!pathname.startsWith("/program-head")
							? "lg:col-span-2"
							: "max-w-full"
					}`}
				>
					{/* status message */}
					{isPendingScheduleExist &&
						pathname.startsWith("/program-head") &&
						classroomId && (
							<div className="w-full flex bg-red-300 p-2 text-xs justify-center items-center gap-2 facilium-color-indigo">
								<TriangleAlert />
								<p>
									{"This schedule is pending approval from the Campus Dean."}
								</p>
							</div>
						)}

					{/* warning message for faculty */}
					{pathname.startsWith("/faculty") && (
						<div className="flex w-full border justify-center gap-2 bg-blue-200 text-blue-500 items-center text-center text-xs tracking-wide mb-2 p-2">
							<TriangleAlert color="black" className="w-6 h-auto" />
							Read-Only Access: You can download and view all room schedules,
							but only Program Chairs can add, edit, and delete schedules.
						</div>
					)}
					{!classroomId && data.length > 1 && (
						<p
							className={`text-base text-center py-2 text-pink-600 ${
								!pathname.startsWith("/program-head") ? "hidden" : "block"
							}`}
						>
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
