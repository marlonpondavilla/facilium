"use client";

import React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth";
import {
	getDocumentsFromFirestore,
	getDocumentsByFieldIds,
	getSingleDocumentFromFirestore,
	getFirstUserByDesignation,
} from "@/data/actions";
import type { User } from "@/types/userInterface";
import type { ScheduleItem } from "@/types/SceduleInterface";
import type { AcademicYear } from "@/types/academicYearType";
import type { ApprovedScheduleDoc } from "@/types/SceduleInterface";
import { Button } from "./ui/button";
import BackButton from "@/components/back-button";
import { scheduleColors } from "@/data/colors";

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

const days: string[] = ["Mon", "Tues", "Wed", "Thurs", "Fri", "Sat"];

function formatHourNoSuffix(hour24: number) {
	const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
	return hour12.toString();
}

const slotsCount = (20 - 7) * 2 + 1;

const hours = Array.from({ length: slotsCount }, (_, i) => {
	const totalMinutesFrom7 = i * 30;
	const startHour24 = 7 + Math.floor(totalMinutesFrom7 / 60);
	const startMin = totalMinutesFrom7 % 60 === 0 ? "00" : "30";

	const totalMinutesEnd = totalMinutesFrom7 + 30;
	const endHour24 = 7 + Math.floor(totalMinutesEnd / 60);
	const endMin = totalMinutesEnd % 60 === 0 ? "00" : "30";

	return `${formatHourNoSuffix(startHour24)}:${startMin} - ${formatHourNoSuffix(
		endHour24
	)}:${endMin}`;
});

function getStartIndexFromDecimal(startDecimal: number): number {
	return Math.round((startDecimal - 7) * 2);
}

function getRowSpanFromDuration(
	durationHours: number,
	halfHour: number = 0
): number {
	return durationHours * 2 + (halfHour === 30 ? 1 : 0);
}

// Schedule Grid Component
function ProfessorScheduleGrid({ scheduleItems }: { scheduleItems: EnrichedSchedule[] }) {
	const skipMap: Record<string, boolean> = {};

	return (
		<div className="border rounded-lg overflow-hidden">
			<div className="overflow-x-auto">
				<table className="w-full min-w-[800px] border-collapse text-center text-xs">
					<thead>
						<tr className="bg-pink-100 text-gray-800">
							<th className="border px-2 py-1 w-16">Time</th>
							{days.map((day) => (
								<th key={day} className="border px-2 py-1">
									{day}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{hours.map((hourLabel, rowIndex) => (
							<tr key={rowIndex} className="h-9">
								<td className="border font-semibold bg-gray-50 px-2 py-1 text-[10px]">
									{hourLabel}
								</td>
								{days.map((day) => {
									const cellKey = `${day}-${rowIndex}`;
									if (skipMap[cellKey]) return null;

									const item = scheduleItems.find((item) => {
										const startIndex = getStartIndexFromDecimal(item.start);
										return item.day === day && startIndex === rowIndex;
									});

									if (item) {
										const rowSpan = getRowSpanFromDuration(
											item.duration,
											item.halfHour ?? 0
										);

										for (let i = 1; i < rowSpan; i++) {
											skipMap[`${day}-${rowIndex + i}`] = true;
										}

										const itemIndex = scheduleItems.indexOf(item);
										const colorClass =
											scheduleColors[itemIndex % scheduleColors.length];

										return (
											<td
												key={cellKey}
												rowSpan={rowSpan}
												className={`border px-2 py-1 font-medium ${colorClass}`}
											>
												<div className="text-[11px] leading-tight">
													{item.courseCode}
													<br />
													{item.section}
													<br />
													{item.classroomName ? `(${item.classroomName})` : ""}
												</div>
											</td>
										);
									}

									return <td key={cellKey} className="border px-2 py-1" />;
								})}
							</tr>
						))}
					</tbody>
				</table>
			</div>
			{/* Legend */}
			{scheduleItems.length > 0 && (
				<div className="p-3 border-t bg-gray-50 text-[10px] flex flex-wrap gap-3">
					{scheduleItems.map((item, idx) => {
						const colorClass = scheduleColors[idx % scheduleColors.length];
						return (
							<div key={item.id || idx} className="flex items-center gap-1">
								<span
									className={`inline-block w-3 h-3 rounded-sm ${colorClass}`}
								></span>
								<span className="whitespace-nowrap">
									{item.courseCode} – {item.section}
								</span>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}

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
	const isProgramHead = pathname.startsWith("/program-head");
	const isFaculty = pathname.startsWith("/faculty");
	// Roles that can browse: Dean (all), Program Head (own dept). Faculty cannot browse others.
	const canBrowseOthers = isDean || isProgramHead;
	// Dept-limited browsing: only Program Head (not Dean)
	const isDeptLimited = isProgramHead && !isDean;

	const [professors, setProfessors] = React.useState<User[]>([]);
	const [loadingProfessors, setLoadingProfessors] = React.useState(true);
	const [profFilter, setProfFilter] = React.useState(""); // text search (program head only)
	const [deptFilter, setDeptFilter] = React.useState<string>("ALL"); // dean-only department filter

	const [schedule, setSchedule] = React.useState<EnrichedSchedule[]>([]);
	const [loadingSchedule, setLoadingSchedule] = React.useState(false);

	// Active academic year/term label for non-dean header
	const [activeAYLabel, setActiveAYLabel] = React.useState<string>("");
	// Dean name for signature (only fetched when dean prints but lightweight so fine always)
	const [deanName, setDeanName] = React.useState<string>("");

	React.useEffect(() => {
		let cancelled = false;
		const fetchDean = async () => {
			try {
				const dean = await getFirstUserByDesignation("Dean");
				if (dean && !cancelled) {
					setDeanName(`${dean.firstName ?? ""} ${dean.lastName ?? ""}`.trim());
				}
			} catch (e) {
				console.error("Failed to fetch dean for signature", e);
			}
		};
		fetchDean();
		return () => {
			cancelled = true;
		};
	}, []);

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

	// Load professors list:
	React.useEffect(() => {
		let cancelled = false;
		const load = async () => {
			if (!canBrowseOthers) {
				setProfessors([]);
				setLoadingProfessors(false);
				return;
			}
			setLoadingProfessors(true);
			try {
				const all = await getDocumentsFromFirestore<User>("userData");
				let filtered = (all || []).filter(
					(u) => u.status === "Enabled" && u.designation !== "Admin"
				);
				if (isDeptLimited && user) {
					const self = (all || []).find((u) => u.email === user.email);
					const dept = self?.department;
					if (dept) {
						// Program Head: show all in same department (including Dean if present)
						filtered = filtered.filter((u) => u.department === dept);
					}
				}
				// For clarity ensure unique by id (in case of duplicates)
				const uniqMap: Record<string, User> = {};
				filtered.forEach((u) => {
					uniqMap[u.id] = u;
				});
				filtered = Object.values(uniqMap);
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
		}, [canBrowseOthers, isDeptLimited, user?.email, user, isProgramHead, isDean]);

	// Determine effective professor to view: Dean & Program Head can use query param; others use own uid
	const effectiveProfessorId = canBrowseOthers ? professorId : user?.uid || "";

	// If a regular faculty (not dean or program head) somehow has a professorId param in URL, strip it
	React.useEffect(() => {
		if (!canBrowseOthers && professorId) {
			// remove professorId from URL silently
			const params = new URLSearchParams(searchParams.toString());
			params.delete("professorId");
			router.replace(`${pathname}?${params.toString()}`, { scroll: false });
		}
	}, [canBrowseOthers, professorId, pathname, router, searchParams]);

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
				// If browsing role has the list, try matching by id or uid
				if (canBrowseOthers && professors.length > 0) {
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
	}, [effectiveProfessorId, canBrowseOthers, professors, user?.uid, user]);

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
		let base = professors;
		// Dean department filter first
		if (isDean && deptFilter !== "ALL") {
			base = base.filter((p) => p.department === deptFilter);
		}
		// Program Head search filter
		if (isProgramHead) {
			const q = profFilter.trim().toLowerCase();
			if (q) {
				base = base.filter((p) => {
					const name = `${p.firstName ?? ""} ${p.middleName ?? ""} ${
						p.lastName ?? ""
					}`.toLowerCase();
					return (
						name.includes(q) || p.email?.toLowerCase().includes(q) || false
					);
				});
			}
		}
		return base;
	}, [professors, isDean, deptFilter, isProgramHead, profFilter]);

	// Unique departments for dean's department filter dropdown
	const uniqueDepartments = React.useMemo(() => {
		if (!isDean) return [] as string[];
		const set = new Set<string>();
		professors.forEach((p) => {
			if (p.department) set.add(p.department);
		});
		return Array.from(set).sort();
	}, [isDean, professors]);

	// Resolve selected professor name for header
	const selectedProfName = React.useMemo(() => {
		if (canBrowseOthers) {
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
	}, [canBrowseOthers, professors, professorId, user]);

	// CSV export of currently displayed schedule
	const exportCsv = React.useCallback(() => {
		if (!schedule.length) return;
		// Derive a clean file slug from the professor name
		const rawName =
			selectedProfName || (isDean ? "faculty-schedule" : "my-schedule");
		const fileSlug =
			rawName
				.toLowerCase()
				.replace(/schedule$/i, "")
				.replace(/[^a-z0-9]+/gi, "-")
				.replace(/^-+|-+$/g, "") || "schedule";
		const today = new Date();
		const yyyymmdd = `${today.getFullYear()}${String(
			today.getMonth() + 1
		).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
		const header = ["Day", "Start", "End", "Course", "Section", "Classroom"];
		const lines: string[] = [];
		lines.push(header.join(","));
		schedule.forEach((s) => {
			const end = computeEnd(s.start, s.duration, s.halfHour);
			const row = [
				s.day,
				toTimeLabel(s.start),
				toTimeLabel(end),
				s.courseCode,
				s.section,
				s.classroomName || "-",
			];
			lines.push(
				row
					.map((field) => {
						if (field == null) return "";
						const f = String(field);
						return /[",\n]/.test(f) ? `"${f.replace(/"/g, '""')}"` : f;
					})
					.join(",")
			);
		});
		const csv = `\uFEFF${lines.join("\r\n")}`;
		const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `schedule-${fileSlug || "current"}-${yyyymmdd}.csv`;
		document.body.appendChild(a);
		a.click();
		a.remove();
		URL.revokeObjectURL(url);
	}, [schedule, selectedProfName, isDean]);

	// PDF print/export for all roles - styled like classroom schedule but professor-focused
	const exportPdf = React.useCallback(() => {
		if (!schedule.length) return;
		const starts = schedule.map((s) => s.start);
		const ends = schedule.map((s) =>
			computeEnd(s.start, s.duration, s.halfHour)
		);
		const minStart = Math.min(7, ...starts);
		const maxEnd = Math.max(20, ...ends);
		// generate half-hour slots labels
		const slots: number[] = [];
		for (
			let t = Math.floor(minStart * 2) / 2;
			t <= Math.ceil(maxEnd * 2) / 2;
			t += 0.5
		) {
			slots.push(t);
		}
		function timeLabelRange(t: number) {
			const next = t + 0.5;
			return `${toTimeLabel(t)} - ${toTimeLabel(next)}`;
		}
		// Days order
		const days = ["Mon", "Tues", "Wed", "Thurs", "Fri", "Sat"];
		// Pre-index schedule items by day & start for quick lookup
		interface CellItem {
			rowSpan: number;
			html: string;
			day: string;
			start: number;
		}
		const placed: Record<string, boolean> = {};
		const itemsByDayStart: Record<string, CellItem> = {};
		schedule.forEach((s) => {
			const end = computeEnd(s.start, s.duration, s.halfHour);
			const rowSpan = (end - s.start) * 2; // 0.5 hr steps
			const key = `${s.day}-${s.start}`;
			itemsByDayStart[key] = {
				rowSpan,
				html: `${s.courseCode}<br/>${s.section}<br/>${s.classroomName || "-"}`,
				day: s.day,
				start: s.start,
			};
		});
		let bodyRowsHtml = "";
		slots.forEach((slot) => {
			bodyRowsHtml += `<tr>`;
			// time column
			bodyRowsHtml += `<td class='time'>${timeLabelRange(slot)}</td>`;
			days.forEach((d) => {
				const cellKey = `${d}-${slot}`;
				if (placed[cellKey]) return;
				const itemKey = `${d}-${slot}`;
				const item = itemsByDayStart[itemKey];
				if (item) {
					// mark covered slots
					for (let t = slot + 0.5; t < slot + item.rowSpan / 2; t += 0.5) {
						placed[`${d}-${t}`] = true;
					}
					bodyRowsHtml += `<td class='entry' rowspan='${item.rowSpan}'>${item.html}</td>`;
				} else {
					bodyRowsHtml += `<td></td>`;
				}
			});
			bodyRowsHtml += `</tr>`;
		});
		// Clean professor name
		const profDisplay = (selectedProfName || "Selected Professor")
			.replace(/\s*Schedule$/i, "")
			.trim();
		const timestamp = new Date().toLocaleString("en-PH", {
			dateStyle: "medium",
			timeStyle: "short",
		});
		const ayLine = activeAYLabel ? `${activeAYLabel}` : "";
		const html = `<!DOCTYPE html><html><head><title>${profDisplay} Schedule</title><meta charset='utf-8'/>
		<style>
		@page { size: A4 portrait; margin: 10mm 8mm 10mm 8mm; }
		:root { --accent: #4f46e5; --border: #cbd5e1; --muted: #64748b; }
		body { font-family: system-ui, Arial, sans-serif; margin:0; padding:0; color:#0f172a; }
		.header { display:flex; align-items:center; gap:12px; border-bottom:1.5px solid var(--accent); padding:6px 0 4px; margin-bottom:8px; }
		.logo { height:46px; width:auto; object-fit:contain; }
		.branding h1 { font-size:16px; margin:0; letter-spacing:0.25px; }
		.branding h2 { font-size:11px; margin:1px 0 0; font-weight:600; color: var(--muted); }
		.meta { font-size:9px; margin-top:2px; color:#334155; }
		table { width:100%; border-collapse:collapse; font-size:9.2px; table-layout:fixed; }
		thead th { background:#fbcfe8; font-weight:700; font-size:9px; color:#000; padding:6px 4px; vertical-align:middle; border-bottom:2px solid var(--accent); box-shadow: inset 0 0 0 1000px #fbcfe8; -webkit-print-color-adjust: exact; color-adjust: exact; }
		th, td { border:1px solid var(--border); padding:6px 4px; text-align:center; vertical-align:middle; word-wrap:break-word; line-height:1.35; }
		tbody td { font-size:8.4px; }
		tbody tr:nth-child(odd) { background-color:#fafafa; }
		.badge { display:inline-block; padding:1px 6px; border:1px solid var(--accent); border-radius:999px; font-size:9.2px; font-weight:600; color:var(--accent); }
		.footer { margin-top:8px; font-size:8px; color:var(--muted); text-align:right; }
		.time { font-weight:600; background:#f8fafc; }
		.entry { font-weight:500; }
		.signatures { margin-top:20px; font-size:10px; display:flex; justify-content:flex-end; }
		.signatures div { min-width:45%; text-align:right; }
		#page-wrapper { transform-origin: top left; }
		@media print { .no-print { display:none!important; } }
		</style></head><body>
		<div id='page-wrapper'>
			<div class='header'>
				<img class='logo' src='${
					window.location.origin
				}/bsu-meneses-logo.png' alt='Bulsu Meneses Logo' />
				<div class='branding'>
					<h1>Bulacan State University – Meneses Campus</h1>
					<h2>Official Professor Schedule</h2>
					<div class='meta'>Professor: <span class='badge'>${profDisplay}</span>${
			ayLine ? ` &nbsp; | &nbsp; ${ayLine}` : ""
		} &nbsp; | &nbsp; Printed: ${timestamp}</div>
				</div>
			</div>
			<table>
				<thead><tr><th>Time</th>${days
					.map((d) => `<th>${d}</th>`)
					.join("")}</tr></thead>
				<tbody>${bodyRowsHtml}</tbody>
			</table>
			<div class='signatures'>
				<div>Approved by: ${deanName || "Campus Dean"}${
			deanName ? ", Campus Dean" : ""
		}</div>
			</div>
			<div class='footer'>Generated via Facilium</div>
		</div>
		<script>(function(){
			function scalePage(){
				const wrapper = document.getElementById('page-wrapper');
				if(!wrapper) return;
				const maxHeight = Math.floor((11.69 - 0.8) * 96); // approx printable height
				const current = wrapper.getBoundingClientRect().height;
				if (current > maxHeight){
					const scale = maxHeight / current;
					wrapper.style.transform = 'scale(' + scale.toFixed(3) + ')';
				}
			}
			function doPrint(){
				scalePage();
				setTimeout(()=>window.print(), 60); // slight delay to let rendering settle
			}
			// wait for all images (logo) to load so it appears in print
			const imgs = Array.from(document.images || []);
			if (imgs.length === 0){ doPrint(); return; }
			let done = 0;
			imgs.forEach(img => {
				if (img.complete){
					if (++done === imgs.length) doPrint();
				} else {
					img.addEventListener('load', () => { if (++done === imgs.length) doPrint(); });
					img.addEventListener('error', () => { if (++done === imgs.length) doPrint(); });
				}
			});
		})();</script>
		</body></html>`;
		const w = window.open("", "_blank", "width=900,height=1000");
		if (!w) return;
		w.document.write(html);
		w.document.close();
	}, [isDean, schedule, selectedProfName, activeAYLabel, deanName]);

	return (
		<div className="w-full max-w-6xl mx-auto p-4 sm:p-6 space-y-4">
			<div>
				<BackButton />
			</div>
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
				<div>
					<h1 className="text-xl sm:text-2xl font-semibold facilium-color-indigo">
						{isDean
							? "All Faculty Schedules"
							: isProgramHead
							? "Department Faculty Schedules"
							: isFaculty && canBrowseOthers
							? "My Department Schedules"
							: activeAYLabel
							? `Your schedule for ${activeAYLabel}`
							: "Your schedule for the current semester"}
					</h1>
					{isDean && activeAYLabel ? (
						<div className="text-sm text-gray-600 mt-1">{activeAYLabel}</div>
					) : null}
				</div>
				<div className="flex gap-2">
					{canBrowseOthers ? (
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

			{/* Professors list (Dean: all, Program Head & Faculty: own dept) */}
			{canBrowseOthers && (
				<div className="bg-muted rounded p-3 sm:p-4 space-y-3">
					<div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
						<div className="font-medium">Professors</div>
						{/* Dean: department dropdown; Program Head: text search */}
						{isDean ? (
							<select
								value={deptFilter}
								onChange={(e) => setDeptFilter(e.target.value)}
								className="border rounded px-2 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
							>
								<option value="ALL">All Departments</option>
								{uniqueDepartments.map((d) => (
									<option key={d} value={d}>
										{d}
									</option>
								))}
							</select>
						) : isProgramHead ? (
							<input
								type="text"
								value={profFilter}
								onChange={(e) => setProfFilter(e.target.value)}
								placeholder="Search name or email..."
								className="border rounded px-2 py-1 text-sm w-full sm:w-60 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
							/>
						) : null}
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

			{/* Schedule grid for selected professor */}
			<div className="facilium-bg-whiter rounded p-3 sm:p-4">
				<div className="flex items-center justify-between mb-3 gap-3">
					<div className="font-medium">
						{effectiveProfessorId
							? canBrowseOthers
								? `Schedule for ${selectedProfName || "Selected Professor"}`
								: selectedProfName
							: isDean
							? "Select a professor to view schedule"
							: "Select a professor to view schedule"}
					</div>
					{effectiveProfessorId && !loadingSchedule && schedule.length > 0 && (
						<div className="flex gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={exportCsv}
								className="whitespace-nowrap"
							>
								CSV
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={exportPdf}
								className="whitespace-nowrap"
							>
								PDF
							</Button>
						</div>
					)}
				</div>
				{effectiveProfessorId ? (
					loadingSchedule ? (
						<p className="text-sm text-gray-500">Loading schedule…</p>
					) : schedule.length === 0 ? (
						<p className="text-sm text-gray-500">No schedules found.</p>
					) : (
						<ProfessorScheduleGrid scheduleItems={schedule} />
					)
				) : null}
			</div>
		</div>
	);
}
