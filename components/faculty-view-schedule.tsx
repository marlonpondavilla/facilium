"use client";

import React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth";
import {
	getDocumentsFromFirestore,
	getDocumentsByFieldIds,
	getSingleDocumentFromFirestore,
} from "@/data/actions";
import type { User } from "@/types/userInterface";
import type { ScheduleItem } from "@/types/SceduleInterface";
import type { AcademicYear } from "@/types/academicYearType";
import type { ApprovedScheduleDoc } from "@/types/SceduleInterface";
import { Button } from "./ui/button";

type EnrichedSchedule = ScheduleItem & {
	classroomName?: string | null;
};

// Local shape for professor list items (userData docs)
type ProfessorRecord = User & { uid?: string };

const dayOrder: Record<string, number> = {
	Mon: 1,
	Tues: 2,
	Wed: 3,
	Thurs: 4,
	Fri: 5,
	Sat: 6,
	Sun: 7,
};

function toTimeLabel(start: number): string {
	// start is decimal hours from 7.. e.g., 7, 7.5, etc.
	const hour24 = Math.floor(start);
	const minutes = Math.round((start - hour24) * 60);
	// Convert to 12-hour format (no leading zero on hour)
	const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
	const mm = minutes.toString().padStart(2, "0");
	return `${hour12}:${mm}`;
}

// calculate total and when there is additional 30mins
function computeEnd(
	start: number,
	duration: number,
	halfHour?: number
): number {
	const extra = halfHour ? 0.5 : 0;
	return start + duration + extra;
}

function fullName(u: Pick<User, "firstName" | "lastName" | "middleName">) {
	const f = u.firstName ?? "";
	const m = u.middleName ? ` ${u.middleName}` : "";
	const l = u.lastName ? ` ${u.lastName}` : "";
	return `${f}${m}${l}`.trim() || "Unknown";
}

export default function FacultyViewSchedule() {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const { user } = useAuth() || {};

	const professorId = searchParams.get("professorId") || "";
	const isDean = pathname.startsWith("/dean");

	const [professors, setProfessors] = React.useState<User[]>([]);
	const [loadingProfessors, setLoadingProfessors] = React.useState(true);
	const [profFilter, setProfFilter] = React.useState("");

	const [schedule, setSchedule] = React.useState<EnrichedSchedule[]>([]);
	const [loadingSchedule, setLoadingSchedule] = React.useState(false);

	// Active academic year/term label for non-dean header
	const [activeAYLabel, setActiveAYLabel] = React.useState<string>("");

	React.useEffect(() => {
		let cancelled = false;
		const loadAY = async () => {
			try {
				const years = await getDocumentsFromFirestore<AcademicYear>(
					"academic-years"
				);
				const active = years.find((y) => y.isActive);
				if (active && !cancelled) {
					const label = `Academic Year ${active.startAcademicYear}-${active.endAcademicYear}, ${active.term} Term`;
					setActiveAYLabel(label);
				}
			} catch {
				throw new Error("Error in fetching academic year");
			}
		};
		loadAY();
		return () => {
			cancelled = true;
		};
	}, []);

	// Load professors list (Enabled and not Admin). Only needed for Dean view.
	React.useEffect(() => {
		let cancelled = false;
		const load = async () => {
			// If not Dean, skip fetching full professors list
			if (!isDean) {
				setProfessors([]);
				setLoadingProfessors(false);
				return;
			}
			setLoadingProfessors(true);
			try {
				const all = await getDocumentsFromFirestore<User>("userData");
				const filtered = (all || []).filter(
					(u) => u.status === "Enabled" && u.designation !== "Admin"
				);
				if (!cancelled) setProfessors(filtered);
			} catch (e) {
				console.error("Failed to load professors", e);
				if (!cancelled) setProfessors([]);
			} finally {
				if (!cancelled) setLoadingProfessors(false);
			}
		};
		load();
		return () => {
			cancelled = true;
		};
	}, [isDean]);

	// Determine effective professor to view: Dean uses query param; others use logged-in user only
	const effectiveProfessorId = isDean ? professorId : user?.uid || "";

	// Load schedule when effective professor changes (from approvedScheduleData)
	React.useEffect(() => {
		let cancelled = false;
		const load = async () => {
			if (!effectiveProfessorId) {
				setSchedule([]);
				return;
			}
			setLoadingSchedule(true);
			try {
				// Resolve provided professor identifier (which may be a uid) to the user document id
				let resolvedProfessorDocId = effectiveProfessorId;
				// If dean has the list, try matching by id or uid
				if (isDean && professors.length > 0) {
					const found = (professors as ProfessorRecord[]).find(
						(p) =>
							p.id === effectiveProfessorId || p.uid === effectiveProfessorId
					);
					if (found) {
						resolvedProfessorDocId = found.id;
					}
				}
				// Otherwise look up userData by uid to get the document id
				if (resolvedProfessorDocId === effectiveProfessorId) {
					try {
						const matches = await getDocumentsByFieldIds<User>(
							"userData",
							"uid",
							effectiveProfessorId
						);
						if (matches && matches.length > 0) {
							resolvedProfessorDocId = matches[0].id;
						}
					} catch {}
				}
				const approvedDocs =
					await getDocumentsFromFirestore<ApprovedScheduleDoc>(
						"approvedScheduleData"
					);
				// Flatten schedule items for the selected professor
				const items: ScheduleItem[] = [];
				for (const doc of approvedDocs) {
					for (const it of doc.scheduleItems || []) {
						if (
							it.professor === resolvedProfessorDocId ||
							it.professor === effectiveProfessorId
						) {
							// trust item's classroomId, fallback to doc-level if missing
							items.push({
								...it,
								classroomId: it.classroomId || doc.classroomId,
							});
						}
					}
				}

				// Enrich with classroom name (batched by unique ids)
				const uniqueClassrooms = Array.from(
					new Set(items.map((i) => i.classroomId))
				);
				const classroomNameMap: Record<string, string | null> = {};
				await Promise.all(
					uniqueClassrooms.map(async (id) => {
						classroomNameMap[id] = await getSingleDocumentFromFirestore(
							id,
							"classrooms",
							"classroomName"
						);
					})
				);

				const enriched: EnrichedSchedule[] = items.map((i) => ({
					...i,
					classroomName: classroomNameMap[i.classroomId] ?? null,
				}));

				enriched.sort((a, b) => {
					const d1 = dayOrder[a.day] ?? 99;
					const d2 = dayOrder[b.day] ?? 99;
					if (d1 !== d2) return d1 - d2;
					return a.start - b.start;
				});

				if (!cancelled) setSchedule(enriched);
			} catch (e) {
				console.error("Failed to load schedule", e);
				if (!cancelled) setSchedule([]);
			} finally {
				if (!cancelled) setLoadingSchedule(false);
			}
		};
		load();
		return () => {
			cancelled = true;
		};
	}, [effectiveProfessorId, isDean, professors, user?.uid]);

	const pushProfessor = React.useCallback(
		(id: string) => {
			const params = new URLSearchParams(searchParams.toString());
			params.set("professorId", id);
			router.push(`${pathname}?${params.toString()}`, { scroll: false });
		},
		[router, pathname, searchParams]
	);

	const clearProfessor = React.useCallback(() => {
		const params = new URLSearchParams(searchParams.toString());
		params.delete("professorId");
		router.push(`${pathname}?${params.toString()}`, { scroll: false });
	}, [router, pathname, searchParams]);

	const mySchedule = React.useCallback(() => {
		if (user?.uid) pushProfessor(user.uid);
	}, [user?.uid, pushProfessor]);

	const filteredProfessors = React.useMemo(() => {
		const q = profFilter.trim().toLowerCase();
		if (!q) return professors;
		return professors.filter((p) => {
			const name = `${p.firstName ?? ""} ${p.middleName ?? ""} ${
				p.lastName ?? ""
			}`.toLowerCase();
			return name.includes(q) || p.email?.toLowerCase().includes(q) || false;
		});
	}, [profFilter, professors]);

	// Resolve selected professor name for header
	const selectedProfName = React.useMemo(() => {
		if (isDean) {
			const prof = (professors as ProfessorRecord[]).find(
				(p) => p.id === professorId || p.uid === professorId
			);
			if (prof) return fullName(prof);
			if (user && professorId === user.uid)
				return user.displayName || "My Schedule";
			return "";
		}
		// For non-dean, it's the logged-in user's schedule
		return user ? `${user.displayName || "My"} Schedule` : "My Schedule";
	}, [isDean, professors, professorId, user]);

	return (
		<div className="w-full max-w-6xl mx-auto p-4 sm:p-6 space-y-4">
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
				<div>
					<h1 className="text-xl sm:text-2xl font-semibold facilium-color-indigo">
						{isDean
							? "Faculty Schedules"
							: activeAYLabel
							? `Your schedule for ${activeAYLabel}`
							: "Your schedule for the current semester"}
					</h1>
					{isDean && activeAYLabel ? (
						<div className="text-sm text-gray-600 mt-1">{activeAYLabel}</div>
					) : null}
				</div>
				<div className="flex gap-2">
					{isDean ? (
						<>
							<Button
								className="facilium-bg-indigo text-white"
								onClick={mySchedule}
								disabled={!user?.uid}
							>
								View my schedule
							</Button>
							{professorId && (
								<Button variant="outline" onClick={clearProfessor}>
									Clear selection
								</Button>
							)}
						</>
					) : null}
				</div>
			</div>

			{/* Professors list */}
			{isDean && (
				<div className="facilium-bg-whiter rounded p-3 sm:p-4 space-y-3">
					<div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
						<div className="font-medium">Professors</div>
						<input
							value={profFilter}
							onChange={(e) => setProfFilter(e.target.value)}
							className="border border-gray-300 rounded px-3 py-2 text-sm w-full sm:w-64"
							placeholder="Search by name or email"
						/>
					</div>
					{loadingProfessors ? (
						<p className="text-sm text-gray-500">Loading professors…</p>
					) : filteredProfessors.length === 0 ? (
						<p className="text-sm text-gray-500">No professors found.</p>
					) : (
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
							{filteredProfessors.map((p) => (
								<div
									key={p.id}
									className={`border rounded p-3 flex items-center justify-between ${
										professorId === p.id ? "bg-pink-50 border-pink-300" : ""
									}`}
								>
									<div className="min-w-0">
										<div className="font-semibold truncate">{fullName(p)}</div>
										<div className="text-xs text-gray-500 truncate">
											{p.email}
										</div>
									</div>
									<Button size="sm" onClick={() => pushProfessor(p.id)}>
										View schedule
									</Button>
								</div>
							))}
						</div>
					)}
				</div>
			)}

			{/* Schedule table for selected professor */}
			<div className="facilium-bg-whiter rounded p-3 sm:p-4">
				<div className="flex items-center justify-between mb-3">
					<div className="font-medium">
						{effectiveProfessorId
							? isDean
								? `Schedule for ${selectedProfName || "Selected Professor"}`
								: selectedProfName
							: isDean
							? "Select a professor to view schedule"
							: "Sign in to view your schedule"}
					</div>
				</div>
				{effectiveProfessorId ? (
					loadingSchedule ? (
						<p className="text-sm text-gray-500">Loading schedule…</p>
					) : schedule.length === 0 ? (
						<p className="text-sm text-gray-500">No schedules found.</p>
					) : (
						<div className="overflow-x-auto">
							<table className="min-w-full text-sm border border-gray-200 rounded">
								<thead>
									<tr className="bg-pink-200 text-black">
										<th className="px-3 py-2 text-left border">Day</th>
										<th className="px-3 py-2 text-left border">Start</th>
										<th className="px-3 py-2 text-left border">End</th>
										<th className="px-3 py-2 text-left border">Course</th>
										<th className="px-3 py-2 text-left border">Section</th>
										<th className="px-3 py-2 text-left border">Classroom</th>
									</tr>
								</thead>
								<tbody>
									{schedule.map((s) => {
										const end = computeEnd(s.start, s.duration, s.halfHour);
										return (
											<tr key={s.id} className="odd:bg-gray-50">
												<td className="px-3 py-2 border">{s.day}</td>
												<td className="px-3 py-2 border">
													{toTimeLabel(s.start)}
												</td>
												<td className="px-3 py-2 border">{toTimeLabel(end)}</td>
												<td className="px-3 py-2 border">{s.courseCode}</td>
												<td className="px-3 py-2 border">{s.section}</td>
												<td className="px-3 py-2 border">
													{s.classroomName ?? "-"}
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					)
				) : null}
			</div>
		</div>
	);
}
