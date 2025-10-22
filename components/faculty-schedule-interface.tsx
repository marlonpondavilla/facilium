"use client";

import { ArrowLeft, Building, Check, Info, NotebookPen, RotateCcw, TriangleAlert, X } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FieldPath, FieldPathValue } from "react-hook-form";
import { scheduleSchema } from "@/validation/scheduleSchema";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";
import { Button } from "./ui/button";
import {
	FormControl,
	Form,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "./ui/form";
import toast from "react-hot-toast";
import { validateScheduleTimeRange } from "@/lib/utils";
import { Checkbox } from "./ui/checkbox";
import ScheduleTable from "./schedule-table";
import {
	ScheduleItem,
	PendingSchedule,
	ApprovedScheduleDoc,
} from "@/types/SceduleInterface";
import {
	addDocumentToFirestore,
	checkIfDocumentExists,
	checkIfScheduleConflictExists,
	deleteDocumentById,
	getDocumentsFromFirestore,
	getDocumentsWithNestedObject,
	getSingleDocumentFromFirestore,
	updateScheduleDocument,
	getEligibleProfessorsForLoad,
		getFacultyLoads,
} from "@/data/actions";
import Loading from "./loading";
import Link from "next/link";
import WarningPopUp from "./warning-pop-up";
import { AcademicYear } from "@/types/academicYearType";
import type { FacultyLoad } from "@/types/facultyLoadType";
import ConfirmationHandleDialog from "./confirmation-handle-dialog";
import { useAuth } from "@/context/auth";

type FacultyScheduleInterfaceProps = {
	buildingName: string;
	data: {
		id: string;
		status: string;
		classroomName: string;
	}[];
	programs?: {
		id: string;
		programCode: string;
		department?: string;
	}[];
	// Explicit department of the currently logged-in Program Head, passed from server page
	programHeadDept?: string;
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
		department?: string;
	}[];
	scheduleItems: ScheduleItem[];
};

type ScheduleFormValues = z.infer<typeof scheduleSchema>;

type ScheduleForDean = {
	id: string;
	classroomId: string;
};

type PendingScheduleDetailsDB = {
	id: string;
	classroomId: string;
	professorId: string;
	submitted: string;
};

type PendingScheduleDetails = {
	classroomName: string;
	professorName: string;
	dateSubmitted: string;
};
interface Professor {
	uid: string;
	firstName: string;
	lastName: string;
}

const FacultyScheduleInterface = ({
	buildingName,
	data,
	programs,
	programHeadDept,
	yearLevels,
	sections,
	courses,
	academicTerms,
	academicYears,
	professors,
	scheduleItems,
}: FacultyScheduleInterfaceProps) => {
	const [isLoading, setIsLoading] = useState(false);
	// Local state for optimistic schedule updates
	const [localScheduleItems, setLocalScheduleItems] = useState<ScheduleItem[]>(
		() => scheduleItems
	);

	// Editing state for updating existing schedule entries
	const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);

	// Keep localScheduleItems in sync with prop updates (post-refresh reconciliation)
	useEffect(() => {
		setLocalScheduleItems(scheduleItems);
	}, [scheduleItems]);
	const [openConflict, setOpenConflict] = useState(false);
	const [openNoClassroom, setOpenNoClassroom] = useState(false);
	const [openNoSchedule, setOpenNoSchedule] = useState(false);
	const [openPendingScheduleExist, setOpenPendingScheduleExist] =
		useState(false);
	const [isPendingScheduleExist, setIsPendingScheduleExist] = useState(false);
	const [isApprovedScheduleExist, setIsApprovedScheduleExist] = useState(false);
	const [approvedSubmittedBy, setApprovedSubmittedBy] = useState<string>("");
	const [error, setError] = useState("");
	// Dialog for weekly subject hour cap exceeded
	const [openSubjectCapDialog, setOpenSubjectCapDialog] = useState(false);
	const [subjectCapMessage, setSubjectCapMessage] = useState("");
	const [pendingScheduleDetails, setPendingScheduleDetails] =
		useState<PendingScheduleDetails>({
			classroomName: "",
			professorName: "",
			dateSubmitted: "",
		});

	const auth = useAuth();
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

	// Derive route and department for filtering programs in the dropdown (program-head route only)
	const isProgramHeadRoute = pathname.startsWith("/program-head");
	const normalizedDept = (programHeadDept || "").trim().toLowerCase();

	// (removed deprecated beginEditItem / cancelEdit in favor of handleEditFromTable)

	const days = ["Mon", "Tues", "Wed", "Thurs", "Fri", "Sat"];
	const activeYear = academicYears?.find((year) => year.isActive);
	const activeTermName = activeYear?.term;

	const matchingTerm = academicTerms?.find(
		(term) =>
			term.term.trim().toLowerCase() === activeTermName?.trim().toLowerCase() &&
			term.yearLevelId === yearLevelId
	);

	const filteredCourses = useMemo(() => {
		if (!(matchingTerm && Array.isArray(courses))) return [] as NonNullable<typeof courses>;
		return courses.filter(
			(course) =>
				course.yearLevelId === yearLevelId && course.termId === matchingTerm.id
		);
	}, [courses, matchingTerm, yearLevelId]);

	// Ensure the currently editing item's course appears as an option even if filtered out
	const displayedCourses = useMemo(() => {
		const out = [...filteredCourses];
		if (editingItem?.courseCode) {
			const has = out.some((c) => c.courseCode === editingItem.courseCode);
			if (!has) {
				out.unshift({
					id: `editing-${editingItem.courseCode}`,
					termId: matchingTerm?.id || "",
					yearLevelId: yearLevelId || "",
					courseCode: editingItem.courseCode,
				});
			}
		}
		return out;
	}, [filteredCourses, editingItem?.courseCode, matchingTerm?.id, yearLevelId]);

	// Eligible professors according to Program Head assigned load
	const [eligibleProfessorIds, setEligibleProfessorIds] = useState<string[] | null>(null);

	// Faculty loads for the selected professor within the current context (program/year)
	const [professorLoads, setProfessorLoads] = useState<FacultyLoad[]>([]);

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

	// Watch courseCode for eligibility updates
	const watchedCourseCode = form.watch("courseCode");
	const watchedProfessorId = form.watch("professor");

	useEffect(() => {
		let cancelled = false;
		(async () => {
			setEligibleProfessorIds(null);
			if (!programId || !yearLevelId || !sectionId) return;
			if (!watchedCourseCode) return;
			try {
				const ids = await getEligibleProfessorsForLoad({
					programId,
					yearLevelId,
					sectionId,
					courseCode: watchedCourseCode,
				});
				if (!cancelled) setEligibleProfessorIds(ids);
			} catch (e) {
				console.error("eligible professor fetch failed", e);
				if (!cancelled) setEligibleProfessorIds([]);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [programId, yearLevelId, sectionId, watchedCourseCode]);

	// Load professor's assigned loads for the current program/year when a professor is selected
	useEffect(() => {
		let cancelled = false;
		(async () => {
			if (!programId || !yearLevelId || !watchedProfessorId) {
				if (!cancelled) setProfessorLoads([]);
				return;
			}
			try {
				const loads = await getFacultyLoads({
					professorId: watchedProfessorId,
					programId,
					yearLevelId,
				});
				if (!cancelled) setProfessorLoads((loads as FacultyLoad[]) || []);
			} catch (e) {
				console.error("failed to load professor loads", e);
				if (!cancelled) setProfessorLoads([]);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [programId, yearLevelId, watchedProfessorId]);

	const updateQueryParamAndForm = <T extends FieldPath<ScheduleFormValues>>(
		key: string,
		value: FieldPathValue<ScheduleFormValues, T>,
		options?: { clearParams?: string[] }
	) => {
		const params = new URLSearchParams(window.location.search);
		params.set(key, String(value));
		if (options?.clearParams?.length) {
			for (const k of options.clearParams) params.delete(k);
		}
		router.push(`${pathname}?${params.toString()}`, { scroll: false });
	};

	// Helper: keep only classroomId in the URL
	const navigateToClassroomOnly = React.useCallback(() => {
		if (!classroomId) return;
		const params = new URLSearchParams();
		params.set("classroomId", classroomId);
		router.push(`${pathname}?${params.toString()}`, { scroll: false });
	}, [classroomId, pathname, router]);

	// Utility: manage loading tied only to real async operations
	const withLoading = async <T,>(fn: () => Promise<T>): Promise<T> => {
		setIsLoading(true);
		try {
			return await fn();
		} finally {
			setIsLoading(false);
		}
	};

	// Single subscription to form changes instead of large dependency array.
	useEffect(() => {
		const subscription = form.watch((_value, { name }) => {
			if (!name) return;
			form.clearErrors();
			setError("");
		});
		if (data.length < 1) {
			setOpenNoClassroom(true);
		}
		return () => subscription.unsubscribe();
	}, [data.length, form]);

	// Keep local (optimistic) schedule items in sync with server-provided scheduleItems
	useEffect(() => {
		setLocalScheduleItems((prev) => {
			const serverIds = new Set(scheduleItems.map((s) => s.id));
			const stillOptimistic = prev.filter(
				(i) =>
					i.id?.toString().startsWith("optimistic-") && !serverIds.has(i.id)
			);
			return [...scheduleItems, ...stillOptimistic];
		});
	}, [scheduleItems]);

	// Reactive derived booleans: use form.watch so parent re-renders when values change.
	const programSelected = !!form.watch("program");
	const yearLevelSelected = !!form.watch("yearLevel");
	const sectionSelected = !!form.watch("section");
	const courseCodeSelected = !!form.watch("courseCode");
	const professorSelected = !!form.watch("professor");
	const daySelected = !!form.watch("day");
	const startSelected = !!form.watch("start");
	// Numeric duration in hours; we use this to enforce the 5hr max when toggling +30mins
	const durationHours = Number(form.watch("duration") ?? 0);
	const disableHalfHour = !durationHours || durationHours >= 5;

	// Resolve selected section object and allowed sets based on professor loads
	const selectedSectionObj = React.useMemo(() => {
		if (!sections || !yearLevelId) return undefined;
		const name = form.watch("section");
		return sections.find((s) => s.sectionName === name && s.yearLevelId === yearLevelId);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [sections, yearLevelId, form.watch("section")]);

	const allowedSectionIds = React.useMemo(() => {
		if (!professorSelected) return undefined;
		// If loads are not yet available or empty, don't restrict; show all for now
		if (!professorLoads || professorLoads.length === 0) return undefined;
		const set = new Set<string>();
		professorLoads.forEach((l) => {
			if (l.sectionId) set.add(l.sectionId);
		});
		return set;
	}, [professorSelected, professorLoads]);

	const allowedCourseCodesForSelectedSection = React.useMemo(() => {
		if (!professorSelected || !selectedSectionObj) return undefined;
		const set = new Set<string>();
		(professorLoads || [])
				.filter((l) => l.sectionId === selectedSectionObj.id)
				.forEach((l) => {
					if (l.courseCode) set.add(l.courseCode);
				});
		return set;
	}, [professorSelected, professorLoads, selectedSectionObj]);

	// Enable Add only when form is fully filled (halfHour is optional).
	const canAddSchedule = Boolean(
		classroomId &&
			programSelected &&
			yearLevelSelected &&
			sectionSelected &&
			courseCodeSelected &&
			professorSelected &&
			daySelected &&
			startSelected &&
			durationHours > 0
	);

	// If duration reaches 5hrs, ensure +30mins gets unchecked to keep state valid
	useEffect(() => {
		if (durationHours >= 5 && form.getValues("halfHour")) {
			form.setValue("halfHour", 0, { shouldValidate: true });
		}
	}, [durationHours, form]);

	// When a professor is selected/changed, ensure section and course adhere to assigned loads
	useEffect(() => {
		// Avoid auto-clearing values while actively editing a selected item
		if (editingItem) return;
		if (!professorSelected) return;
		// Validate section
		const currentSectionName = form.getValues("section");
		if (currentSectionName && allowedSectionIds) {
			const sec = sections?.find((s) => s.sectionName === currentSectionName);
			if (sec && !allowedSectionIds.has(sec.id)) {
				// clear invalid section and dependent fields
				form.setValue("section", "");
				form.setValue("courseCode", "");
				form.setValue("day", "");
				form.setValue("start", 0);
				form.setValue("duration", 0);
				form.setValue("halfHour", 0);
			}
		}
		// Validate course for current section
		const currentCourse = form.getValues("courseCode");
		if (currentCourse && allowedCourseCodesForSelectedSection) {
			if (!allowedCourseCodesForSelectedSection.has(currentCourse)) {
				form.setValue("courseCode", "");
				form.setValue("day", "");
				form.setValue("start", 0);
				form.setValue("duration", 0);
				form.setValue("halfHour", 0);
			}
		}
		// keep URL params in sync if we cleared items
		// note: we don't store section/course in URL currently, so nothing to delete
	}, [editingItem, professorSelected, allowedSectionIds, allowedCourseCodesForSelectedSection, form, sections]);

	// NOTE: Program filtering by department now handled at the feeder (wrapper/page) level.

	// Pop up state and effect
	useEffect(() => {
		if (!classroomId) return;

		setIsPendingScheduleExist(false);
		setIsApprovedScheduleExist(false);
		setApprovedSubmittedBy("");

		if (!hasSchedule) {
			setOpenNoSchedule(true);
		}

		let isCancelled = false;

		const checkPendingSchedule = async () => {
			try {
				const pendingExists = await checkIfDocumentExists(
					"pendingScheduleData",
					"classroomId",
					classroomId
				);

				const approveExists = await checkIfDocumentExists(
					"approvedScheduleData",
					"classroomId",
					classroomId
				);

				if (!isCancelled && pendingExists) {
					setIsPendingScheduleExist(true);
				}

				if (!isCancelled && approveExists) {
					setIsApprovedScheduleExist(true);
					// Fetch the submittedBy information from approved schedule
					const approvedSchedules =
						await getDocumentsWithNestedObject<ApprovedScheduleDoc>(
							"approvedScheduleData",
							"approved"
						);
					const approvedSchedule = approvedSchedules.find(
						(s) => s.classroomId === classroomId
					);
					if (approvedSchedule?.submittedBy) {
						setApprovedSubmittedBy(approvedSchedule.submittedBy);
					}
				}
			} catch (error) {
				console.error("Error checking pending schedule:", error);
			}
		};

		checkPendingSchedule();

		return () => {
			isCancelled = true;
		};
		// Only dependent on classroomId & hasSchedule to prevent redundant async fetches.
	}, [classroomId, hasSchedule]);

	// retrieve pending schedule details submitted by program head
	useEffect(() => {
		if (!classroomId) return;
		if (!pathname.startsWith("/dean")) return;
		if (!hasSchedule) return;

		const fetchPendingScheduleDetails = async () => {
			// Get all pending schedules
			const pendingSchedules =
				await getDocumentsWithNestedObject<PendingScheduleDetailsDB>(
					"pendingScheduleData",
					"submitted"
				);

			// Filter only schedules matching this classroom
			const ids = pendingSchedules
				.filter((schedule) => schedule.classroomId === classroomId)
				.map((schedule) => ({
					classroomId: schedule.classroomId,
					professorId: schedule.professorId,
					submitted: schedule.submitted,
				}));

			// Fetch all professors
			const allProfessors = await getDocumentsFromFirestore<Professor>(
				"userData"
			);

			for (const { classroomId, professorId, submitted } of ids) {
				// Get classroom name by doc ID
				const classroomDoc = await getSingleDocumentFromFirestore(
					classroomId,
					"classrooms",
					"classroomName"
				);

				// Match professor by UID field
				const matchedProfessor = allProfessors.find(
					(prof) => prof.uid === professorId
				);

				// Build full name
				const fullName =
					matchedProfessor?.firstName && matchedProfessor?.lastName
						? `${matchedProfessor.firstName} ${matchedProfessor.lastName}`
						: "Unknown";

				// Format date
				const formattedDate = submitted
					? new Date(submitted).toLocaleString("en-US", {
							dateStyle: "medium",
							timeStyle: "short",
					  })
					: "";

				// Set the final state
				setPendingScheduleDetails({
					classroomName: classroomDoc ?? "Unknown",
					professorName: fullName,
					dateSubmitted: formattedDate,
				});
			}
		};

		fetchPendingScheduleDetails();
	}, [classroomId, hasSchedule, pathname]);

	const handleClassroomClick = (id: string) => {
		const params = new URLSearchParams({
			classroomId: id,
		});

		router.push(`${pathname}?${params.toString()}`);
		form.reset();
		setError("");
	};

	// When clicking Edit on a plotted cell, prefill the form and enter edit mode
	const handleEditFromTable = (item: ScheduleItem) => {
		// Do not allow editing when pending or approved – UI should already gate, but double-check
		if (isPendingScheduleExist || isApprovedScheduleExist) return;

		setEditingItem(item);

		// Resolve IDs for URL from current catalogs
		const selectedProgram = programs?.find((p) => p.programCode === item.program);
		// yearLevel in existing schedule could be either the id or the label (e.g., "1st"). Try both.
		const resolvedYearObj = (yearLevels || []).find((y) => y.id === item.yearLevel) ||
			(yearLevels || []).find((y) => {
				if (!item.yearLevel) return false;
				const matchesLabel = y.yearLevel === item.yearLevel;
				const matchesProgram = selectedProgram ? y.programId === selectedProgram.id : true;
				return matchesLabel && matchesProgram;
			});
		const resolvedYearLevelId = resolvedYearObj?.id || item.yearLevel;
		const selectedSection = sections?.find(
			(s) => s.sectionName === item.section && s.yearLevelId === resolvedYearLevelId
		) || sections?.find((s) => s.sectionName === item.section);

		// Prefill form values to match the selected item first (so selects have value labels immediately)
		form.setValue("professor", item.professor);
		form.setValue("program", item.program);
		form.setValue("yearLevel", resolvedYearLevelId);
		form.setValue("section", item.section);
		form.setValue("courseCode", item.courseCode);
		form.setValue("day", item.day);
		form.setValue("start", item.start);
		form.setValue("duration", item.duration);
		form.setValue("halfHour", item.halfHour ?? 0);
		setError("");

		// Then update URL params for consistency
		const params = new URLSearchParams();
		if (classroomId) params.set("classroomId", classroomId);
		if (item.professor) params.set("professorId", item.professor);
		if (selectedProgram?.id) params.set("programId", selectedProgram.id);
		if (resolvedYearLevelId) params.set("yearLevelId", resolvedYearLevelId);
		if (selectedSection?.id) params.set("sectionId", selectedSection.id);
		router.push(`${pathname}?${params.toString()}`, { scroll: false });
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

		const scheduleData: ScheduleItem = {
			...values,
			classroomId,
			id: editingItem?.id,
		};

		// ------------------------------------------------------------------
		// Edge Case: Limit total weekly hours for the SAME professor + course
		// Business rule: A single subject (courseCode) taught by the same professor
		// across the entire week must not exceed a TOTAL of 5 hours (including +30 mins).
		// We compute the aggregate of existing plotted segments for that professor+course
		// excluding the item currently being edited (if any), then add the new segment.
		// ------------------------------------------------------------------
		const MAX_SUBJECT_HOURS = 5;
		const newSegmentHours =
			(scheduleData.duration || 0) + (scheduleData.halfHour ? 0.5 : 0);
		const existingSubjectHours = localScheduleItems
			.filter(
				(i) =>
					i.professor === scheduleData.professor &&
					i.courseCode === scheduleData.courseCode &&
					(!editingItem || i.id !== editingItem.id)
			)
			.reduce(
				(acc, cur) => acc + (cur.duration || 0) + (cur.halfHour ? 0.5 : 0),
				0
			);
		const projectedTotal = existingSubjectHours + newSegmentHours;
		if (projectedTotal > MAX_SUBJECT_HOURS) {
			setSubjectCapMessage(
				`Weekly maximum load reached (max ${MAX_SUBJECT_HOURS}h). Already plotted: ${existingSubjectHours
					.toFixed(1)
					.replace(
						/\.0$/,
						""
					)}h. Adding this block would push it to ${projectedTotal
					.toFixed(1)
					.replace(/\.0$/, "")}h.`
			);
			setOpenSubjectCapDialog(true);
			return;
		}

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

		if (editingItem?.id) {
			await withLoading(async () => {
				const result = await updateScheduleDocument(
					editingItem.id!,
					scheduleData
				);
				if (result.success) {
					setLocalScheduleItems((prev) =>
						prev.map((it) =>
							it.id === editingItem.id ? { ...it, ...scheduleData } : it
						)
					);
					toast.success("Schedule updated!");
					setEditingItem(null);
					form.reset();
					setError("");
					navigateToClassroomOnly();
				} else {
					toast.error("Failed to update schedule.");
				}
				router.refresh();
			});
		} else {
			const optimisticId = `optimistic-${Date.now()}`;
			setLocalScheduleItems((prev) => [
				...prev,
				{
					...scheduleData,
					id: optimisticId,
					status: false,
					created: new Date().toISOString(),
				},
			]);
			await withLoading(async () => {
				const result = await addDocumentToFirestore("scheduleData", {
					...scheduleData,
					status: false,
					created: new Date().toISOString(),
				});
				if (result.success) {
					toast.success("New schedule added!");
					form.reset();
					setError("");
					navigateToClassroomOnly();
					setOpenNoSchedule(false);
				} else {
					setLocalScheduleItems((prev) =>
						prev.filter((i) => i.id !== optimisticId)
					);
					toast.error("Failed to add schedule.");
				}
				router.refresh();
			});
		}
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

			await withLoading(async () => {
				const result = await addDocumentToFirestore("pendingScheduleData", {
					scheduleItems: scheduleForDean,
					classroomId,
					professorId: auth?.user?.uid,
					submitted: new Date().toISOString(),
				});

				if (result.success) {
					toast.success("Your schedule is submitted to the Dean.");
					// immediate UI reflection
					setIsPendingScheduleExist(true);
					router.refresh();
					if (classroomId) {
						const params = new URLSearchParams();
						params.set("classroomId", classroomId);
						router.push(`${pathname}?${params.toString()}`, { scroll: false });
					}
				}
			});
		} catch (e) {
			console.error(e);
		}
	};

	// Approve handle for dean
	const handleApproveSchedule = async () => {
		if (!classroomId) return;

		const pendingSchedules =
			await getDocumentsWithNestedObject<PendingSchedule>(
				"pendingScheduleData",
				"submitted"
			);

		// Find the pending schedule for this classroom only
		const target = pendingSchedules.find((p) => p.classroomId === classroomId);

		if (!target) {
			toast.error("No pending schedule found for this classroom.");
			return;
		}

		await withLoading(async () => {
			try {
				// Only approve the items for this classroom
				const result = await addDocumentToFirestore("approvedScheduleData", {
					id: target.id,
					scheduleItems: target.scheduleItems,
					classroomId,
					dean: auth?.user?.displayName,
					deanUid: auth?.user?.uid,
					deanEmail: auth?.user?.email,
					approved: new Date().toISOString(),
					submittedBy: pendingScheduleDetails.professorName,
				});

				if (result.success) {
					toast.success("Schedule has been approved by you.");
					setIsApprovedScheduleExist(true);
					router.refresh();
				}
			} catch (e) {
				console.error("Error on approving schedule", e);
			}
		});
	};

	// Reject handle for dean
	const handleRejectSchedule = async () => {
		if (!classroomId) return;

		const rejectSchedules = await getDocumentsWithNestedObject<PendingSchedule>(
			"pendingScheduleData",
			"submitted"
		);

		for (const rejectSchedule of rejectSchedules) {
			try {
				if (rejectSchedule.classroomId === classroomId) {
					await withLoading(async () => {
						await deleteDocumentById({
							id: rejectSchedule.id,
							collectionName: "pendingScheduleData",
						});
						toast.success(
							`Schedule for ${pendingScheduleDetails.classroomName} is rejected successfully!`
						);
						router.refresh();
					});
					return;
				}
			} catch (e) {
				console.error("error rejecting a schedule", e);
				toast.error(`Failed to reject schedule ${rejectSchedule.id}`);
				return;
			}
		}
	};

	// Reset handle for program-head
	const handleResetSchedule = async () => {
		if (!classroomId) return;

		try {
			const updateSchedules =
				await getDocumentsWithNestedObject<PendingSchedule>(
					"pendingScheduleData",
					"submitted"
				);

			for (const updateSchedule of updateSchedules) {
				if (updateSchedule.classroomId === classroomId) {
					await withLoading(async () => {
						await deleteDocumentById({
							id: updateSchedule.id,
							collectionName: "pendingScheduleData",
							relatedFields: [
								{ collectionName: "approvedScheduleData", fieldName: "id" },
							],
						});
						toast.success(`The schedule has been reset by you.`);
						// Immediate local UI state adjustments
						setIsPendingScheduleExist(false);
						setIsApprovedScheduleExist(false);
						setLocalScheduleItems((prev) =>
							prev.filter(
								(i) =>
									!i.id?.toString().startsWith("optimistic-") &&
									i.classroomId !== classroomId
							)
						);
						router.refresh();
					});
					return;
				}
			}
		} catch (e) {
			console.error("Error on updating schedule", e);
			return;
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
					{data
						.filter((classroom) => classroom.status === "Enabled")
						.map((classroom) => (
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

			{/* Dialog for weekly subject hour cap exceedance */}
			<WarningPopUp
				open={openSubjectCapDialog}
				setOpen={setOpenSubjectCapDialog}
				title="Subject Weekly Hour Limit"
				description={subjectCapMessage || "Weekly hour limit exceeded."}
			/>

			{/* Schedule Form & Table Container */}
			<div className="w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-0 grid grid-cols-1 xl:grid-cols-[1fr_2fr] gap-4 lg:gap-6">
				{/* Schedule Form */}
				<div
					className={`schedule-actions-wrapper facilium-bg-whiter p-3 sm:p-4 rounded w-full self-start ${
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
					{/* Editing banner */}
					{editingItem && (
						<div className="w-full flex flex-col sm:flex-row items-start sm:items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-md p-2 mt-2">
							<div className="text-xs sm:text-sm">
								Editing: <span className="font-semibold">{editingItem.courseCode}</span> • {editingItem.section} • {editingItem.day} • {editingItem.duration}h{editingItem.halfHour ? "+30m" : ""}
							</div>
							<div className="ml-auto flex gap-2">
								<Button
									onClick={() => {
										setEditingItem(null);
										form.reset();
										setError("");
										navigateToClassroomOnly();
									}}
									variant={"secondary"}
									className="h-7 px-2 text-xs"
								>
									Clear Selection
								</Button>
							</div>
						</div>
					)}
					<Form {...form}>
						<form
							onSubmit={(e) => {
								e.preventDefault();
								return false;
							}}
							className={`p-4 flex-col gap-4 ${
								!pathname.startsWith("/program-head") ? "hidden" : "flex"
							}`}
						>
							<fieldset
								disabled={form.formState.isSubmitting}
								className="flex flex-col gap-3"
							>
								{/* Professor Select Field (now first; enables Section/Course filtering by loads) */}
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
															const selectedProf = professors?.find((p) => p.id === value);
															if (!selectedProf) return;
															updateQueryParamAndForm("professorId", selectedProf.id, {
																clearParams: ["programId", "yearLevelId", "sectionId"],
															});
															form.setValue("professor", value);
															// Reset dependent selections for consistency with new professor loads
															form.setValue("program", "");
															form.setValue("yearLevel", "");
															form.setValue("section", "");
															form.setValue("courseCode", "");
															form.setValue("day", "");
															form.setValue("start", 0);
															form.setValue("duration", 0);
															form.setValue("halfHour", 0);
														}}
														defaultValue={field.value}
														{...field}
														disabled={!classroomId}
													>
														<FormControl>
															<SelectTrigger>
																<SelectValue placeholder="Select Professor" />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															<SelectGroup>
																{professors
																	?.filter((professor) => {
																		// Exclude Admins
																		if (professor.designation === "Admin") return false;
																		// If not on program-head route OR no known dept, show all non-admin professors
																		if (!isProgramHeadRoute || !normalizedDept) return true;
																		const profDept = (professor.department || "").trim().toLowerCase();
																		// If eligible list exists (after choosing a course), restrict further
																		if (eligibleProfessorIds && eligibleProfessorIds.length > 0) {
																			return profDept === normalizedDept && eligibleProfessorIds.includes(professor.id);
																		}
																		return profDept === normalizedDept;
																	})
																	.map((professor) => (
																		<SelectItem key={professor.id} value={`${professor.id}`}>
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
																selectedProgram.id,
																{
																	clearParams: [
																		"yearLevelId",
																		"sectionId",
																	],
																}
															);
															form.setValue("program", value);
															// reset dependent fields in form
															form.setValue("yearLevel", "");
															form.setValue("section", "");
															form.setValue("courseCode", "");
															// keep professor selection to preserve load filtering
															form.setValue("day", "");
															form.setValue("start", 0);
															form.setValue("duration", 0);
															form.setValue("halfHour", 0);
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
																{programs?.length ? (
																	programs
																		.filter((program) => {
																			if (!isProgramHeadRoute) return true;
																			if (!program.department) return false;
																			return (
																				program.department
																					.trim()
																					.toLowerCase() === normalizedDept
																			);
																		})
																		.map((program) => (
																			<SelectItem
																				key={program.id}
																				value={program.programCode}
																			>
																				{program.programCode}
																			</SelectItem>
																		))
																) : (
																	<SelectItem disabled value="no-programs">
																		No programs available
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
																selectedYear.id,
																{ clearParams: ["sectionId"] }
															);

															form.setValue("yearLevel", value);
															// reset dependent fields in form
															form.setValue("section", "");
															form.setValue("courseCode", "");
															// keep professor selection to preserve load filtering
															form.setValue("day", "");
															form.setValue("start", 0);
															form.setValue("duration", 0);
															form.setValue("halfHour", 0);
														}}
														defaultValue={field.value}
														{...field}
														disabled={!(programSelected && programId)}
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
															// reset dependent fields in form
															form.setValue("courseCode", "");
															// keep professor selection to preserve load filtering
															form.setValue("day", "");
															form.setValue("start", 0);
															form.setValue("duration", 0);
															form.setValue("halfHour", 0);
														}}
														defaultValue={field.value}
														{...field}
														disabled={!(yearLevelId && yearLevelSelected)}
													>
														<FormControl>
															<SelectTrigger>
																<SelectValue placeholder="Select Section" />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															<SelectGroup>
																{sections
																	?.filter((section) => section.yearLevelId === yearLevelId)
																	.filter((section) => {
																		// If professor is selected and allowedSectionIds set, restrict
																		if (professorSelected && allowedSectionIds) {
																			// Always allow the currently editing section
																			if (
																				editingItem?.section === section.sectionName
																			) {
																				return true;
																			}
																			return allowedSectionIds.has(section.id);
																		}
																		return true;
																	})
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
														value={field.value || editingItem?.courseCode || ""}
														disabled={!(sectionSelected && sectionId)}
													>
														<FormControl>
															<SelectTrigger>
																<SelectValue placeholder="Select Course" />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															<SelectGroup>
																{displayedCourses.length > 0 ? (
																	displayedCourses
																		.filter((course) => {
																			// If professor is selected with allowed courses for the chosen section, restrict
																				if (professorSelected && allowedCourseCodesForSelectedSection) {
																					// Always allow the currently editing course or the current selection to keep it visible
																					if (editingItem?.courseCode === course.courseCode || form.watch("courseCode") === course.courseCode) return true;
																					return allowedCourseCodesForSelectedSection.has(course.courseCode);
																				}
																			return true;
																		})
																		.map((course) => (
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
														disabled={!professorSelected}
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
															disabled={!daySelected}
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
																		// Display in 12-hour format without leading zero
																		const hour12 =
																			hour % 12 === 0 ? 12 : hour % 12;
																		const label = `${hour12}:${minute}`;
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
															disabled={!startSelected}
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
																disabled={disableHalfHour}
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
									{!daySelected && data.length > 1 && (
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

								{/* Add/Update schedule Button */}
								{classroomId && !canAddSchedule && (
									<Button
										type="button"
										className="facilium-bg-indigo text-white w-full"
										disabled
									>
										{editingItem ? "Update Schedule" : "Add Schedule"}
									</Button>
								)}
								{classroomId && canAddSchedule && (
									<ConfirmationHandleDialog
										trigger={
											<Button
												type="button"
												className="facilium-bg-indigo text-white w-full"
												disabled={isPendingScheduleExist}
											>
												{form.formState.isSubmitting
													? editingItem ? "Updating" : "Adding"
													: editingItem ? "Update Schedule" : "Add Schedule"}
											</Button>
										}
										title={editingItem ? "Confirm updating this schedule" : "Confirm adding this schedule"}
										description={
											editingItem
												? 'Before updating, please type "confirm" to proceed.'
												: 'Before adding, please type "confirm" to proceed.'
										}
										label={editingItem ? "update" : "add"}
										onConfirm={async () => {
											const valid = await form.trigger(undefined, {
												shouldFocus: true,
											});
											if (!valid) return false;
											await handleScheduleAdd(form.getValues());
										}}
										requireText
										expectedText="confirm"
										textPlaceholder={'Type "confirm"'}
										textLabel={editingItem ? 'Type "confirm" to update this schedule' : 'Type "confirm" to add this schedule'}
										caseSensitive={false}
										confirmButtonText={editingItem ? "Yes, update" : "Yes, add"}
									/>
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
												Submit schedule for approval
											</Button>
										}
										title="Are you sure you want to submit this schedule to Dean?"
										description="You cannot make changes in this schedule until the Dean change the status of your plotted schedule."
										label="submit"
										onConfirm={handleSubmitScheduleToDean}
										requirePassword
										passwordPlaceholder="Confirm with your password"
									/>
								)}

								{/* Reset schedule for pending and approve will be deleted*/}
								{isApprovedScheduleExist && classroomId && (
									<ConfirmationHandleDialog
										trigger={
											<Button type="button" className="facilium-bg-indigo">
												<RotateCcw />
												Update classroom schedule
											</Button>
										}
										title="Are you sure you want to update this approved schedule?"
										description="You will have to submit this schedule again and dean has to review it."
										label="update"
										onConfirm={handleResetSchedule}
									/>
								)}
							</fieldset>
						</form>
					</Form>
				</div>

				{/* Dean + Schedule (side-by-side when dean route with pending schedule) */}
				{pathname.startsWith("/dean") &&
				!isApprovedScheduleExist &&
				classroomId &&
				hasSchedule &&
				pendingScheduleDetails ? (
					<div className="flex flex-col lg:flex-row w-full xl:col-span-2 gap-4 lg:gap-6 items-start">
						{/* Submission summary card styled similar width to scheduling form for visual parity */}
						<div className="facilium-bg-whiter p-3 sm:p-4 rounded-lg shadow w-full lg:w-1/4 lg:max-w-md shrink-0 space-y-3 sm:space-y-4">
							<h2 className="text-base sm:text-lg font-semibold text-gray-800">
								Submission Details
							</h2>
							<ul className="text-sm text-gray-600 space-y-1">
								<li>
									<span className="font-medium facilium-color-indigo">
										Plotted By:
									</span>{" "}
									{pendingScheduleDetails.professorName || "Loading..."}
								</li>
								<li>
									<span className="font-medium facilium-color-indigo">
										Classroom:
									</span>{" "}
									{pendingScheduleDetails.classroomName || "Loading..."}
								</li>
								<li>
									<span className="font-medium facilium-color-indigo">
										Date:
									</span>{" "}
									{pendingScheduleDetails.dateSubmitted || "Loading..."}
								</li>
							</ul>
							<div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 pt-2">
								<ConfirmationHandleDialog
									trigger={
										<Button
											size="sm"
											className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
										>
											<Check className="mr-1 h-4 w-4" /> Approve
										</Button>
									}
									title={`Final approval for ${pendingScheduleDetails.classroomName}`}
									description="Approving will publish this schedule to all faculty. Please confirm with your password to proceed."
									label="approve"
									onConfirm={handleApproveSchedule}
									requirePassword
									passwordPlaceholder="Enter your password"
									confirmButtonText="Yes, approve"
								/>
								<ConfirmationHandleDialog
									trigger={
										<Button
											size="sm"
											variant="destructive"
											className="text-white w-full sm:w-auto"
										>
											<X className="mr-1 h-4 w-4" /> Reject
										</Button>
									}
									title={`Are you sure you want to reject this schedule for ${pendingScheduleDetails.classroomName}?`}
									description="This action cannot be undone. Confirm with your password to proceed."
									label="reject"
									onConfirm={handleRejectSchedule}
									requirePassword
									passwordPlaceholder="Enter your password"
								/>
							</div>
						</div>
						<div className="schedule-action-controls facilium-bg-whiter p-3 sm:p-4 rounded flex-1 min-w-0 w-full">
							{/* status message when pending schedule (program-head only) intentionally omitted for dean */}
							{!pathname.startsWith("/faculty") &&
								classroomId &&
								isApprovedScheduleExist && (
									<div className="flex w-full border justify-center gap-2 bg-blue-200 text-blue-500 items-center text-center text-xs tracking-wide mb-2 p-2">
										You are viewing the approved schedule for this room.
									</div>
								)}
							<ScheduleTable
								scheduleItems={localScheduleItems}
								isPending={isPendingScheduleExist}
								isApproved={isApprovedScheduleExist}
								plottedBy={
									isApprovedScheduleExist && approvedSubmittedBy
										? approvedSubmittedBy
										: pendingScheduleDetails.professorName
								}
								onEditItem={handleEditFromTable}
							/>
						</div>
					</div>
				) : (
					<div
						className={`schedule-action-controls facilium-bg-whiter p-3 sm:p-4 rounded w-full ${
							!pathname.startsWith("/program-head")
								? "xl:col-span-2"
								: "max-w-full"
						}`}
					>
						{/* status message when pending schedule */}
						{isPendingScheduleExist &&
							!isApprovedScheduleExist &&
							pathname.startsWith("/program-head") &&
							classroomId && (
								<div className="w-full flex bg-red-300 p-2 sm:p-3 text-xs sm:text-sm justify-center items-center gap-2 facilium-color-indigo rounded-md mb-4">
									<TriangleAlert className="flex-shrink-0" />
									<p className="text-center">
										{"This schedule is pending approval from the Campus Dean."}
									</p>
								</div>
							)}

						{/* rejected status */}
						{!isPendingScheduleExist &&
							!isApprovedScheduleExist &&
							pathname.startsWith("/program-head") &&
							classroomId && (
								<div className="w-full flex bg-blue-300 p-2 text-xs justify-center items-center gap-2 facilium-color-indigo">
									<Info />
									<p>{"You can add, update, or delete now."}</p>
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

						{/* approved status */}
						{!pathname.startsWith("/faculty") &&
							classroomId &&
							isApprovedScheduleExist && (
								<div className="flex w-full border justify-center gap-2 bg-blue-200 text-blue-500 items-center text-center text-xs tracking-wide mb-2 p-2">
									You are viewing the approved schedule for this room.
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
						<ScheduleTable
							scheduleItems={localScheduleItems}
							isPending={isPendingScheduleExist}
							isApproved={isApprovedScheduleExist}
							plottedBy={
								isApprovedScheduleExist && approvedSubmittedBy
									? approvedSubmittedBy
									: pendingScheduleDetails.professorName
							}
							onEditItem={handleEditFromTable}
						/>
					</div>
				)}
			</div>
		</div>
	);
};

export default FacultyScheduleInterface;
