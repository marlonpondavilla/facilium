"use client";

import { currentDate } from "@/lib/date";
import { Building, Calendar, Eye, FilePlus2 } from "lucide-react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";
import {
	getDocumentsFromFirestore,
	getSingleDocumentFromFirestore,
	getFirstUserByDesignation,
} from "@/data/actions";
import type { ApprovedScheduleDoc } from "@/types/SceduleInterface";
import type { ScheduleItem } from "@/types/SceduleInterface";
import type { AcademicYear } from "@/types/academicYearType";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "./ui/select";
import { Button } from "./ui/button";
import Loading from "./loading";

type FacultyMainInterfaceProps = {
	data: {
		id: string;
		buildingName: string;
		color?: string;
	}[];
};

const FacultyMainInterface = ({ data }: FacultyMainInterfaceProps) => {
	const [isLoading, setIsLoading] = useState(false);
	// Export classroom schedule states
	const [classrooms, setClassrooms] = useState<{ id: string; name: string }[]>(
		[]
	);
	const [selectedClassroom, setSelectedClassroom] = useState<string>("");
	const [isExporting, setIsExporting] = useState(false);
	const [activeAYLabel, setActiveAYLabel] = useState<string>("");
	const [deanName, setDeanName] = useState<string>("");

	const router = useRouter();
	const pathname = usePathname();
	const isProgramHead = pathname.startsWith("/program-head");
	const isDean = pathname.startsWith("/dean");

	const handleClickBuilding = (id: string) => {
		setIsLoading(true);

		setTimeout(() => {
			setIsLoading(false);
		}, 2000);
		router.push(`${pathname}/${id}`);
	};

	const handleViewScheduleClick = () => {
		router.push(`${pathname}/view-schedule`);
	};

	const handleManageLoadClick = () => {
		// If current route is already /program-head, push to manage-load
		if (pathname.startsWith("/program-head")) {
			router.push(`/program-head/manage-load`);
			return;
		}
		// Otherwise default to program-head path
		router.push(`/program-head/manage-load`);
	};

	// Document type for classroom collection
	interface ClassroomDoc {
		id: string;
		classroomName?: string;
	}

	// Load classrooms that have approved schedules only
	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				const approved = await getDocumentsFromFirestore<ApprovedScheduleDoc>(
					"approvedScheduleData"
				);
				const approvedClassroomIds = new Set(
					(approved || []).map((d) => d.classroomId).filter(Boolean)
				);
				if (approvedClassroomIds.size === 0) {
					if (!cancelled) setClassrooms([]);
					return;
				}
				// Fetch classrooms and filter to approved ones
				const rooms = await getDocumentsFromFirestore<ClassroomDoc>(
					"classrooms"
				);
				if (!cancelled) {
					setClassrooms(
						(rooms || [])
							.filter((r) => r.classroomName && approvedClassroomIds.has(r.id))
							.map((r) => ({ id: r.id, name: r.classroomName as string }))
							.sort((a, b) => a.name.localeCompare(b.name))
					);
				}
			} catch (e) {
				console.error("Failed to load classrooms", e);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, []);

	// Load active academic year for labeling
	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				const years = await getDocumentsFromFirestore<AcademicYear>(
					"academic-years"
				);
				const active = years.find((y) => y.isActive);
				if (active && !cancelled) {
					setActiveAYLabel(
						`Academic Year ${active.startAcademicYear}-${active.endAcademicYear}, ${active.term} Term`
					);
				}
			} catch (e) {
				console.error("Failed AY load", e);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, []);

	// Fetch dean name for signature
	useEffect(() => {
		(async () => {
			try {
				const dean = await getFirstUserByDesignation("Dean");
				if (dean)
					setDeanName(`${dean.firstName ?? ""} ${dean.lastName ?? ""}`.trim());
			} catch (e) {
				console.error("Dean fetch failed", e);
			}
		})();
	}, []);

	const generateClassroomPdf = useCallback(
		async (classroomId: string, targetWin?: Window | null) => {
			// Pull approved schedule items for the classroom
			const docs = await getDocumentsFromFirestore<ApprovedScheduleDoc>(
				"approvedScheduleData"
			);
			const items: ScheduleItem[] = [];
			let submittedByName: string | undefined;
			for (const doc of docs) {
				if (doc.classroomId === classroomId) {
					for (const it of doc.scheduleItems || []) {
						items.push({ ...it, classroomId: doc.classroomId });
					}
					// Capture the submittedBy (Program Head) name if present
					if (!submittedByName && doc.submittedBy) {
						submittedByName = doc.submittedBy;
					}
				}
			}
			if (!items.length)
				throw new Error("No approved schedule for this classroom");
			// Get classroom name
			const classroomName =
				(await getSingleDocumentFromFirestore(
					classroomId,
					"classrooms",
					"classroomName"
				)) || classroomId;
			// Resolve professor names
			const uniqueProfessors = Array.from(
				new Set(items.map((i) => i.professor))
			);
			const professorNames: Record<string, string> = {};
			await Promise.all(
				uniqueProfessors.map(async (pid) => {
					const first = await getSingleDocumentFromFirestore(
						pid,
						"userData",
						"firstName"
					);
					const last = await getSingleDocumentFromFirestore(
						pid,
						"userData",
						"lastName"
					);
					professorNames[pid] =
						[first, last].filter(Boolean).join(" ") || "Unknown";
				})
			);
			// Grid building like schedule-table (7 to 20)
			const days = ["Mon", "Tues", "Wed", "Thurs", "Fri", "Sat"];
			function getStartIndex(start: number) {
				return Math.round((start - 7) * 2);
			}
			function getRowSpan(dur: number, halfHour?: number) {
				return dur * 2 + (halfHour === 30 ? 1 : 0);
			}
			const skipMap: Record<string, boolean> = {};
			const slotsCount = (20 - 7) * 2 + 1; // same logic
			const hours: string[] = Array.from({ length: slotsCount }, (_, i) => {
				const baseMinutes = i * 30;
				const startHour24 = 7 + Math.floor(baseMinutes / 60);
				const startMin = baseMinutes % 60 === 0 ? "00" : "30";
				const endMinutes = baseMinutes + 30;
				const endHour24 = 7 + Math.floor(endMinutes / 60);
				const endMin = endMinutes % 60 === 0 ? "00" : "30";
				const formatHour = (h: number) => {
					const h12 = h % 12 === 0 ? 12 : h % 12;
					return h12.toString();
				};
				return `${formatHour(startHour24)}:${startMin} - ${formatHour(
					endHour24
				)}:${endMin}`;
			});
			// Build table body
			const bodyRows = hours
				.map((label, rowIdx) => {
					const cells: string[] = [];
					cells.push(`<td class='time'>${label}</td>`);
					days.forEach((day) => {
						const cellKey = `${day}-${rowIdx}`;
						if (skipMap[cellKey]) return;
						const item = items.find(
							(it) => it.day === day && getStartIndex(it.start) === rowIdx
						);
						if (item) {
							const rowSpan = getRowSpan(item.duration, item.halfHour);
							for (let r = 1; r < rowSpan; r++)
								skipMap[`${day}-${rowIdx + r}`] = true;
							const prof = professorNames[item.professor] || "";
							const content = `${item.courseCode}<br/>${item.section}<br/>${prof}<br/>(${classroomName})`;
							cells.push(
								`<td class='entry' rowspan='${rowSpan}'>${content}</td>`
							);
						} else {
							cells.push(`<td></td>`);
						}
					});
					return `<tr>${cells.join("")}</tr>`;
				})
				.join("");
			const timestamp = new Date().toLocaleString("en-PH", {
				dateStyle: "medium",
				timeStyle: "short",
			});
			const preparedByDisplay = submittedByName
				? `${submittedByName}`
				: "_________";
			const html = `<!DOCTYPE html><html><head><title>${classroomName} Schedule</title><meta charset='utf-8' />
<style>
@page { size:A4 portrait; margin:10mm 8mm 10mm 8mm; }
:root { --accent:#4f46e5; --border:#cbd5e1; --muted:#64748b; }
body { font-family:system-ui, Arial, sans-serif; margin:0; padding:0; color:#0f172a; }
.header { display:flex; align-items:center; gap:12px; border-bottom:1.5px solid var(--accent); padding:6px 0 4px; margin-bottom:8px; }
.logo { height:46px; width:auto; object-fit:contain; }
.branding h1 { font-size:16px; margin:0; letter-spacing:0.25px; }
.branding h2 { font-size:11px; margin:1px 0 0; font-weight:600; color:var(--muted); }
.meta { font-size:9px; margin-top:2px; color:#334155; }
table { width:100%; border-collapse:collapse; font-size:9.2px; table-layout:fixed; }
thead th { background:#fbcfe8; font-weight:700; font-size:9px; color:#000; padding:6px 4px; vertical-align:middle; border-bottom:2px solid var(--accent); box-shadow: inset 0 0 0 1000px #fbcfe8; -webkit-print-color-adjust: exact; }
th, td { border:1px solid var(--border); padding:6px 4px; text-align:center; vertical-align:middle; word-wrap:break-word; line-height:1.35; }
tbody td { font-size:8.4px; }
tbody tr:nth-child(odd) { background:#fafafa; }
.badge { display:inline-block; padding:1px 6px; border:1px solid var(--accent); border-radius:999px; font-size:9.2px; font-weight:600; color:var(--accent); }
.footer { margin-top:8px; font-size:8px; color:var(--muted); text-align:right; }
.time { font-weight:600; background:#f8fafc; }
.entry { font-weight:500; }
.signatures { margin-top:20px; font-size:10px; display:flex; justify-content:space-between; }
.signatures div { min-width:45%; }
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
<h2>Official Classroom Schedule</h2>
<div class='meta'>Room: <span class='badge'>${classroomName}</span>${
				activeAYLabel ? ` &nbsp; | &nbsp; ${activeAYLabel}` : ""
			} &nbsp; | &nbsp; Printed: ${timestamp}</div>
</div>
</div>
<table><thead><tr><th>Time</th>${days
				.map((d) => `<th>${d}</th>`)
				.join("")}</tr></thead><tbody>${bodyRows}</tbody></table>
<div class='signatures'>
<div>Prepared by: ${preparedByDisplay}</div>
<div>Approved by: ${deanName || "Campus Dean"}${
				deanName ? ", Campus Dean" : ""
			}</div>
</div>
<div class='footer'>Generated via Facilium</div>
</div>
<script>(function(){
 function scale(){ const w=document.getElementById('page-wrapper'); if(!w) return; const maxH=Math.floor((11.69-0.8)*96); const cur=w.getBoundingClientRect().height; if(cur>maxH){ const s=maxH/cur; w.style.transform='scale('+s.toFixed(3)+')'; }}
 function doPrint(){ scale(); setTimeout(()=>window.print(),60);} const imgs=[...document.images]; if(!imgs.length){doPrint();return;} let done=0; imgs.forEach(img=>{ if(img.complete){ if(++done===imgs.length) doPrint(); } else { img.addEventListener('load',()=>{ if(++done===imgs.length) doPrint();}); img.addEventListener('error',()=>{ if(++done===imgs.length) doPrint();}); }});
})();</script>
			</body></html>`;
			const w =
				targetWin || window.open("", "_blank", "width=1000,height=1200");
			if (!w) throw new Error("Popup blocked");
			w.document.open();
			w.document.write(html);
			w.document.close();
		},
		[activeAYLabel, deanName]
	);

	const handleDownload = useCallback(async () => {
		if (!selectedClassroom) return;
		// Open popup synchronously so browser allows it
		const popup = window.open("", "_blank", "width=1000,height=1200");
		if (!popup) {
			alert("Please allow popups to generate the classroom schedule PDF.");
			return;
		}
		popup.document.write(
			`<!DOCTYPE html><html><head><title>Generating…</title><meta charset='utf-8' /></head><body style="font-family:system-ui,Arial,sans-serif;padding:16px"><p style="font-size:14px;">Generating classroom schedule PDF… Please wait.</p></body></html>`
		);
		popup.document.close();
		setIsExporting(true);
		try {
			await generateClassroomPdf(selectedClassroom, popup);
		} catch (e: unknown) {
			console.error(e);
			if (!popup.closed) {
				popup.document.open();
				popup.document.write(
					`<!DOCTYPE html><html><head><title>Error</title><meta charset='utf-8' /></head><body style="font-family:system-ui,Arial,sans-serif;padding:16px;color:#b91c1c"><h1 style="font-size:16px;margin-top:0;">Failed to generate schedule</h1><pre style="white-space:pre-wrap;font-size:12px;">${
						(e && typeof e === "object" && "message" in e
							? (e as { message?: string }).message
							: "Unknown error") || ""
					}</pre><p>Please try again.</p></body></html>`
				);
				popup.document.close();
			}
			const msg =
				e && typeof e === "object" && "message" in e
					? (e as { message?: string }).message
					: undefined;
			alert(msg || "Failed to export");
		} finally {
			setIsExporting(false);
		}
	}, [selectedClassroom, generateClassroomPdf]);

	return (
		<div className="border flex flex-col justify-center gap-4 w-full max-w-4xl mx-auto md:px-4 sm:px-0">
			{/* Banner Section */}
			<div className="relative border w-full h-[160px] bg-[url('/bsu-meneses-interface-bg.jpg')] bg-cover bg-center rounded-2xl overflow-hidden">
				{/* Loading Spinner */}
				{isLoading && <Loading />}
				{/* Dark pink gradient from bottom to top */}
				<div className="absolute inset-0 bg-gradient-to-b from-pink-700/80 via-pink-700/60 to-pink-500/60 z-10" />

				{/* Content */}
				<div className="relative z-20 flex justify-center items-center h-full">
					<Image
						src="/facilium-logo.png"
						width={60}
						height={60}
						alt="Facilium logo"
						className="w-24 sm:w-32"
					/>
					<p className="text-white text-3xl sm:text-4xl font-bold tracking-wide">
						Facilium
					</p>
				</div>
			</div>

			{/* Buildings Control Section */}
			<div className="buildings-control facilium-bg-whiter flex flex-col gap-4 p-4 rounded-2xl">
				<div className="flex flex-col sm:flex-row justify-between items-center border-b border-gray-300 pb-2 sm:pb-4">
					{/* Building Title */}
					<div className="buildings-control-title flex items-center gap-2">
						<Building />
						<h1 className="font-semibold tracking-wide text-sm sm:text-xl">
							Meneses Campus Facilities
						</h1>
					</div>

					{/* Calendar and Current Date */}
					<div className="buildings-control-title flex items-center gap-2 border p-2 text-xs sm:text-sm bg-gray-200 rounded-2xl">
						<Calendar />
						<span className="sm:block">{currentDate}</span>
					</div>
				</div>

				<div className="buildings-item-wrapper flex justify-center gap-4 facilium-color-white flex-wrap py-4">
					{data.map((building) => (
						<div
							key={building.id}
							onClick={() => handleClickBuilding(building.id)}
							className={`buildings-item ${building.color} p-6 sm:p-7 rounded w-full sm:w-48 text-center text-base cursor-pointer`}
						>
							<p>{building.buildingName}</p>
						</div>
					))}
				</div>
			</div>

			{/* Building Actions Section */}
			<div className={`building-actions facilium-bg-whiter grid grid-cols-1 ${isProgramHead ? "lg:grid-cols-2" : ""} gap-3 sm:gap-4 rounded-2xl p-4`}>
				{/* Left column: View + Manage stacked */}
				<div className="flex flex-col gap-2 w-full">
					{/* View Schedule Action */}
					<div className="view-schedule group border border-gray-300 rounded-lg px-3 py-2 w-full bg-white hover:bg-gray-100 hover:shadow-md transition duration-200 cursor-pointer h-12">
						<div
							onClick={handleViewScheduleClick}
							className="view-schedule-action flex flex-row items-center justify-center gap-2 h-full"
						>
							<Eye className="w-4 h-4 sm:w-5 sm:h-5 transition-colors duration-200" />
							<p className="font-medium text-xs sm:text-sm text-gray-800 group-hover:text-indigo-800 truncate" title={isDean ? 'View Schedules' : (isProgramHead ? 'View Department Faculty Schedules' : 'My Academic Schedule')}>
								{isDean
									? "View Faculty Schedules"
									: isProgramHead
									? "View Department Faculty Schedules"
									: "My Academic Schedule"}
							</p>
						</div>
					</div>

					{/* Program Head: Manage Faculty Load */}
					{isProgramHead && (
						<div className="manage-load group border border-gray-300 rounded-lg px-3 py-2 w-full bg-white hover:bg-gray-100 hover:shadow-md transition duration-200 cursor-pointer h-12">
							<div
								onClick={handleManageLoadClick}
								className="flex flex-row items-center justify-center gap-2 h-full"
							>
								<FilePlus2 className="w-4 h-4 sm:w-5 sm:h-5" />
								<p className="font-medium text-xs sm:text-sm text-gray-800 group-hover:text-indigo-800 truncate" title="Manage Faculty Load">
									Manage Faculty Load
								</p>
							</div>
						</div>
					)}
				</div>

				{/* Right column: Download Classroom Schedule */}
				<div className="download-schedule border border-gray-300 rounded-xl p-3 sm:p-4 bg-white flex flex-col gap-2 w-full min-h-[96px] lg:self-start">
					<h2 className="font-semibold text-gray-700 text-center tracking-wide text-sm sm:text-base">
						Download classroom schedule
					</h2>
					<div className="flex flex-col gap-2">
						<Select
							onValueChange={(v) => setSelectedClassroom(v)}
							value={selectedClassroom}
						>
							<SelectTrigger className="w-full border border-gray-300 bg-white h-9">
								<SelectValue placeholder="Select classroom" />
							</SelectTrigger>
							<SelectContent className="max-h-72 overflow-y-auto">
								<SelectGroup>
									<SelectLabel>Classrooms</SelectLabel>
									{classrooms.map((c) => (
										<SelectItem key={c.id} value={c.id}>
											{c.name}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>
						<Button
							disabled={!selectedClassroom || isExporting}
							onClick={handleDownload}
							className="facilium-bg-indigo disabled:opacity-50 h-9 text-xs sm:text-sm"
						>
							{isExporting ? "Generating…" : "Download PDF"}
						</Button>
						{activeAYLabel && (
							<p className="text-[11px] text-center text-gray-500">
								{activeAYLabel}
							</p>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default FacultyMainInterface;
