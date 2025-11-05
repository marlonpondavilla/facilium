"use client";

import { ScheduleItem } from "@/types/SceduleInterface";
import React, {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import {
	deleteDocumentById,
	getSingleDocumentFromFirestore,
	getFirstUserByDesignation,
	getDocumentsFromFirestore,
} from "@/data/actions";
import type { AcademicYear } from "@/types/academicYearType";
import { formatProfessorName } from "@/lib/utils";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { scheduleColors } from "@/data/colors";
import PleaseWait from "./please-wait";
import ConfirmationHandleDialog from "./confirmation-handle-dialog";
import toast from "react-hot-toast";
import { useAuth } from "@/context/auth";
const days: string[] = ["Mon", "Tues", "Wed", "Thurs", "Fri", "Sat"];

interface ScheduleTableProps {
	scheduleItems: ScheduleItem[];
	isPending: boolean;
	isApproved: boolean;
	enableExport?: boolean;
	enablePrint?: boolean;
	enableLegend?: boolean;
	plottedBy?: string;
	onEditItem?: (item: ScheduleItem) => void;
}

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

export default function ScheduleTable({
	scheduleItems,
	isPending,
	isApproved,
	enableExport = true,
	enablePrint = true,
	enableLegend = true,
	plottedBy,
	onEditItem,
}: ScheduleTableProps) {
	const skipMap: Record<string, boolean> = {};
	const [classroomNames, setClassroomNames] = useState<Record<string, string>>(
		{}
	);
	const [professorNames, setProfessorNames] = useState<Record<string, string>>(
		{}
	);
	const [isLoading, setIsLoading] = useState(false);
	const tableRef = useRef<HTMLTableElement | null>(null);

	// Simple in-memory caches (reset per component lifecycle)
	const profCache = useRef<Record<string, string>>({});
	const classroomCache = useRef<Record<string, string>>({});

	const searchParams = useSearchParams();
	const classroomId = searchParams.get("classroomId");
	const pathname = usePathname();
	const router = useRouter();
	const { user } = useAuth() || {};

	// State for signatures
	const [deanName, setDeanName] = useState<string>("");
	const [activeAYLabel, setActiveAYLabel] = useState<string>("");

	// Filter after reading classroomId (memoized for stable reference)
	const filteredScheduleItems = useMemo(
		() => scheduleItems.filter((item) => item.classroomId === classroomId),
		[scheduleItems, classroomId]
	);

	const showEmptyBanner =
		classroomId && filteredScheduleItems.length === 0 && !isLoading;

	// Fetch dean name and set prepared by
	useEffect(() => {
		const fetchSignatures = async () => {
			try {
				const dean = await getFirstUserByDesignation("Dean");
				if (dean) {
					setDeanName(`${dean.firstName} ${dean.lastName}`);
				}
			} catch (error) {
				console.error("Error fetching dean", error);
			}
		};
		fetchSignatures();
	}, [user]);

	// Fetch active academic year label for header consistency
	useEffect(() => {
		let cancelled = false;
		const loadAY = async () => {
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
				console.error("Error fetching academic year", e);
			}
		};
		loadAY();
		return () => {
			cancelled = true;
		};
	}, []);

	// Fetch classroom and professor name
	useEffect(() => {
		let cancelled = false;
		const fetchProfessorAndClassroomNames = async () => {
			setIsLoading(true);
			try {
				const uniqueProfIds = Array.from(
					new Set(filteredScheduleItems.map((i) => i.professor))
				).filter((id) => !profCache.current[id]);
				const uniqueClassroomIds = Array.from(
					new Set(filteredScheduleItems.map((i) => i.classroomId))
				).filter((id) => !classroomCache.current[id]);

				const profEntries = await Promise.all(
					uniqueProfIds.map(async (id) => {
						const firstName = await getSingleDocumentFromFirestore(
							id,
							"userData",
							"firstName"
						);
						const lastName = await getSingleDocumentFromFirestore(
							id,
							"userData",
							"lastName"
						);
						const fullName =
							firstName && lastName ? `${firstName} ${lastName}` : "Unknown";
						profCache.current[id] = fullName;
						return [id, fullName];
					})
				);

				const classroomEntries = await Promise.all(
					uniqueClassroomIds.map(async (id) => {
						const name = await getSingleDocumentFromFirestore(
							id,
							"classrooms",
							"classroomName"
						);
						const finalName = name ?? "Unknown";
						classroomCache.current[id] = finalName;
						return [id, finalName];
					})
				);

				if (!cancelled) {
					setProfessorNames((prev) => ({
						...prev,
						...profCache.current,
						...Object.fromEntries(profEntries),
					}));
					setClassroomNames((prev) => ({
						...prev,
						...classroomCache.current,
						...Object.fromEntries(classroomEntries),
					}));
				}
			} catch (error) {
				console.error("Error fetching data:", error);
			} finally {
				if (!cancelled) setIsLoading(false);
			}
		};
		if (filteredScheduleItems.length) fetchProfessorAndClassroomNames();
		return () => {
			cancelled = true;
		};
	}, [classroomId, filteredScheduleItems]);

	const exportCsv = useCallback(() => {
		if (!filteredScheduleItems.length) return;
		const header = [
			"Course Code",
			"Section",
			"Professor",
			"Classroom",
			"Day",
			"Start",
			"Duration",
			"HalfHour",
		];
		const rows = filteredScheduleItems.map((i) => [
			i.courseCode,
			i.section,
			professorNames[i.professor] || "",
			classroomNames[i.classroomId] || "",
			i.day,
			i.start,
			i.duration,
			i.halfHour ?? 0,
		]);
		const csv = [header, ...rows]
			.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
			.join("\n");
		const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `schedule-${classroomId}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	}, [filteredScheduleItems, professorNames, classroomNames, classroomId]);

	const handlePrint = useCallback(() => {
		if (!tableRef.current) return;

		// Restrict printing if not approved or still pending
		if (!isApproved) {
			toast.error("Cannot print: Schedule must be approved first.");
			return;
		}

		const tableHtml = tableRef.current.outerHTML;
		// Derive classroom display (first item's classroom or query)
		const classroomDisplay =
			classroomId && classroomNames[classroomId]
				? classroomNames[classroomId]
				: classroomId || "Classroom";
		const timestamp = new Date().toLocaleString("en-PH", {
			dateStyle: "medium",
			timeStyle: "short",
		});
		const win = window.open("", "_blank", "width=1400,height=900");
		if (!win) return;
		win.document
			.write(`<!DOCTYPE html><html><head><title>${classroomDisplay} Schedule</title>
<meta charset='utf-8'/>
<style>
	/* Portrait orientation A4 */
	@page { size: A4 portrait; margin: 10mm 8mm 10mm 8mm; }
	:root {
		--accent: #4f46e5;
		--border: #cbd5e1;
		--muted: #64748b;
	}

	body {
		font-family: system-ui, Arial, sans-serif;
		margin: 0;
		padding: 0;
		color: #0f172a;
	}

	.header {
		display: flex;
		align-items: center;
		gap: 12px;
		border-bottom: 1.5px solid var(--accent);
		padding: 6px 0 4px;
		margin-bottom: 8px;
	}

	.logo {
		height: 46px;
		width: auto;
		object-fit: contain;
	}

	.branding h1 {
		font-size: 16px;
		margin: 0;
		letter-spacing: 0.25px;
	}

	.branding h2 {
		font-size: 11px;
		margin: 1px 0 0;
		font-weight: 600;
		color: var(--muted);
	}

	.meta {
		font-size: 9px;
		margin-top: 2px;
		color: #334155;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 9.2px;
		table-layout: fixed;
	}

	thead th {
	background: #fbcfe8; /* for screen */
	font-weight: 700;
	font-size: 9px;
	color: #000000;
	padding: 6px 4px;
	vertical-align: middle;
	border-bottom: 2px solid var(--accent);

	/* Print-safe background workaround */
	box-shadow: inset 0 0 0 1000px #fbcfe8;
	-webkit-print-color-adjust: exact;
	color-adjust: exact;
}


	th, td {
		border: 1px solid var(--border);
		padding: 6px 4px;
		text-align: center;
		vertical-align: middle;
		word-wrap: break-word;
		line-height: 1.4;
	}

	tbody td {
		font-size: 8.6px;
	}

	tbody tr:nth-child(odd) {
		background-color: #fafafa;
	}

	.badge {
		display: inline-block;
		padding: 1px 6px;
		border: 1px solid var(--accent);
		border-radius: 999px;
		font-size: 9.2px;
		font-weight: 600;
		color: var(--accent);
	}

	.footer {
		margin-top: 8px;
		font-size: 8px;
		color: var(--muted);
		text-align: right;
	}

	@media print {
		.no-print { display: none !important; }
	}

	#page-wrapper {
		transform-origin: top left;
	}
</style>

</head><body>
	<div id='page-wrapper'>
		<div class='header'>
			<img class='logo' src='${
				window.location.origin
			}/bsu-meneses-logo.png' alt='Bulsu Meneses Logo' />
			<div class='branding'>
				<h1>Bulacan State University – Meneses Campus</h1>
				<h2>Official Classroom Schedule</h2>
				<div class='meta'>Room: <span class='badge'>${classroomDisplay}</span>${
			activeAYLabel ? ` &nbsp; | &nbsp; ${activeAYLabel}` : ""
		} &nbsp; | &nbsp; Printed: ${timestamp}</div>
			</div>
		</div>
		${tableHtml}
		<div class='signatures' style='margin-top: 20px; display: flex; justify-content: space-between; font-size: 10px;'>
			<div>Prepared by: ${plottedBy || "Unknown"}</div>
			<div>Approved by: ${deanName || "Campus Dean"}${
			deanName ? ", Campus Dean" : ""
		}</div>
		</div>
		<div class='footer'>Generated via Facilium</div>
	</div>
	<script>
	(function(){
		const wrapper = document.getElementById('page-wrapper');
		if (!wrapper) return;

		// Approximate printable height in px for A4 portrait at 96dpi minus margins
		const maxHeight = Math.floor((11.69 - 0.8) * 96); // ~1050px
		const current = wrapper.getBoundingClientRect().height;
		if (current > maxHeight) {
			const scale = maxHeight / current;
			wrapper.style.transform = 'scale(' + scale.toFixed(3) + ')';
		}
	})();
	</script>
</body></html>`);

		win.document.close();
		// Ensure styles applied before print (small delay helps some browsers)
		win.onload = () => {
			win.focus();
			win.print();
		};
	}, [
		classroomId,
		classroomNames,
		plottedBy,
		deanName,
		isApproved,
		activeAYLabel,
	]);

	function getStartIndexFromDecimal(startDecimal: number): number {
		return Math.round((startDecimal - 7) * 2);
	}

	function getRowSpanFromDuration(
		durationHours: number,
		halfHour: number = 0
	): number {
		return durationHours * 2 + (halfHour === 30 ? 1 : 0);
	}

	// handle delete class schedule
	const handleDeleteSpecificSchedule = async (id: string) => {
		if (isApproved || isPending) {
			toast.error("Cannot delete schedule, status: Pending");
			return;
		}

		try {
			await deleteDocumentById({ id: id, collectionName: "scheduleData" });
			toast.success("Schedule deleted successfully!");

			router.refresh();
		} catch (e) {
			console.error("Cannot delete specific schedule", e);
		}
	};

	// Fixed compact density (removed toggle: always use compact view)
	const densityClasses = {
		cell: "px-2 py-1",
		row: "h-9",
		font: "text-xs",
	};

	return (
		<div className="w-full border rounded-lg">
			{/* please wait loader synchronous when classroom and professor fetch in use effect */}
			{isLoading && <PleaseWait />}

			{showEmptyBanner && (
				<div className="p-3 sm:p-4 text-sm bg-amber-50 border-b border-amber-200 text-amber-800 flex flex-col sm:flex-row items-start gap-2">
					<span className="font-medium">
						No approved schedule for this classroom.
					</span>
					<span className="opacity-80">
						Select another classroom from the list or wait for approval.
					</span>
				</div>
			)}

			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 border-b bg-gray-50">
				<div className="flex items-center gap-2 text-xs">
					<span className="font-semibold">Export:</span>
					{enableExport && (
						<button
							onClick={exportCsv}
							disabled={!filteredScheduleItems.length || !isApproved}
							className="border rounded px-2 py-0.5 text-xs hover:bg-indigo-50 disabled:opacity-40"
							aria-label="Export classroom schedule as CSV"
						>
							CSV
						</button>
					)}
					{enablePrint && (
						<button
							onClick={handlePrint}
							disabled={!filteredScheduleItems.length || !isApproved}
							className="border rounded px-2 py-0.5 text-xs hover:bg-indigo-50 disabled:opacity-40"
							aria-label="Print classroom schedule"
						>
							Print
						</button>
					)}
				</div>
				<div className="flex items-center gap-2 text-xs">
					{/* kept intentionally empty for alignment - header right area reserved */}
				</div>
			</div>
			<div className="overflow-x-auto">
				<table
					ref={tableRef}
					role="table"
					aria-label="Classroom schedule"
					className={`w-full min-w-[800px] border-collapse text-center ${densityClasses.font}`}
				>
					<thead>
						<tr className="bg-pink-100 text-gray-800 sticky top-0 z-10">
							<th scope="col" className={`border ${densityClasses.cell} w-16`}>
								Time
							</th>
							{days.map((day) => (
								<th
									scope="col"
									key={day}
									className={`border ${densityClasses.cell}`}
									aria-label={day}
								>
									{day}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{hours.map((hourLabel, rowIndex) => (
							<tr key={rowIndex} className={densityClasses.row} role="row">
								<td
									className={`border font-semibold bg-gray-50 ${densityClasses.cell}`}
									role="rowheader"
								>
									{hourLabel}
								</td>
								{days.map((day) => {
									const cellKey = `${day}-${rowIndex}`;
									if (skipMap[cellKey]) return null;

									const item = filteredScheduleItems.find((item) => {
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

										const classroomName =
											classroomNames[item.classroomId] || "Loading...";
										const professorName =
											professorNames[item.professor] || "Loading...";

										// Determine color index based on current index in filteredScheduleItems
										const itemIndex = filteredScheduleItems.indexOf(item);
										const colorClass =
											scheduleColors[itemIndex % scheduleColors.length];

										return (
											<td
												key={cellKey}
												rowSpan={rowSpan}
												title={`${item.section}`}
												className={`border px-2 py-1 font-medium transition-colors ${colorClass}`}
											>
												{pathname.startsWith("/program-head") && !isApproved ? (
													<div className="relative group">
														<div className="hover:opacity-50 cursor-pointer transition-colors text-[11px] leading-tight">
															{item.courseCode}
															<br />
															{item.section}
															<br />
															{formatProfessorName(professorName)}
															<br />
															{`(${classroomName})`}
														</div>
														{/* action pill */}
														<div className="absolute hidden group-hover:flex flex-col gap-1 top-1 right-1 z-20">
															{onEditItem && (
																<button
																	onClick={(e) => {
																		e.stopPropagation();
																		onEditItem(item);
																	}}
																	className="bg-indigo-600 text-white rounded-md px-2 py-1 text-xs shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
																>
																	Edit
																</button>
															)}
															<ConfirmationHandleDialog
																trigger={
																	<button
																		onClick={(e) => e.stopPropagation()}
																		className="bg-red-600 text-white rounded-md px-2 py-1 text-xs shadow hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400"
																	>
																		Delete
																	</button>
																}
																title={`You are about to delete schedule for ${item.section}`}
																description="This action cannot be undone. Please confirm with your password to proceed."
																label="delete"
																onConfirm={() =>
																	handleDeleteSpecificSchedule(
																		item.id ?? "no id"
																	)
																}
																requirePassword
																passwordPlaceholder="Enter your password"
																contentClassName="sm:max-w-lg"
															/>
														</div>
													</div>
												) : (
													<>
														{item.courseCode}
														<br />
														{item.section}
														<br />
														{formatProfessorName(professorName)}
														<br />
														{`(${classroomName})`}
													</>
												)}
											</td>
										);
									}

									return (
										<td
											key={cellKey}
											className={`border ${densityClasses.cell}`}
											role="gridcell"
										/>
									);
								})}
							</tr>
						))}
					</tbody>
				</table>
			</div>
			{enableLegend && filteredScheduleItems.length > 0 && (
				<div className="p-3 border-t bg-gray-50 text-[10px] sm:text-xs flex flex-wrap gap-3">
					{filteredScheduleItems.slice(0, 20).map((item, idx) => {
						const colorClass = scheduleColors[idx % scheduleColors.length];
						return (
							<div key={item.id || idx} className="flex items-center gap-1">
								<span
									className={`inline-block w-3 h-3 rounded-sm ${colorClass}`}
									aria-hidden="true"
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
