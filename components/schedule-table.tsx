"use client";

import { ScheduleItem } from "@/types/SceduleInterface";
import React, { useEffect, useMemo, useState } from "react";
import {
	deleteDocumentById,
	getSingleDocumentFromFirestore,
} from "@/data/actions";
import { formatProfessorName } from "@/lib/utils";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { scheduleColors } from "@/data/colors";
import PleaseWait from "./please-wait";
import ConfirmationHandleDialog from "./confirmation-handle-dialog";
import toast from "react-hot-toast";
const days: string[] = ["Mon", "Tues", "Wed", "Thurs", "Fri", "Sat"];

interface ScheduleTableProps {
	scheduleItems: ScheduleItem[];
	isPending: boolean;
	isApproved: boolean;
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
}: ScheduleTableProps) {
	const skipMap: Record<string, boolean> = {};
	const [classroomNames, setClassroomNames] = useState<Record<string, string>>(
		{}
	);
	const [professorNames, setProfessorNames] = useState<Record<string, string>>(
		{}
	);
	const [isLoading, setIsLoading] = useState(false);

	const searchParams = useSearchParams();
	const classroomId = searchParams.get("classroomId");
	const pathname = usePathname();
	const router = useRouter();

	// Filter after reading classroomId (memoized for stable reference)
	const filteredScheduleItems = useMemo(
		() => scheduleItems.filter((item) => item.classroomId === classroomId),
		[scheduleItems, classroomId]
	);

	// Fetch classroom and professor name
	useEffect(() => {
		const fetchProfessorAndClassroomNames = async () => {
			setIsLoading(true);

			try {
				const uniqueProfIds = Array.from(
					new Set(filteredScheduleItems.map((i) => i.professor))
				);

				const uniqueClassroomIds = Array.from(
					new Set(filteredScheduleItems.map((i) => i.classroomId))
				);

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
						return [id, name ?? "Unknown"];
					})
				);

				setProfessorNames(Object.fromEntries(profEntries));
				setClassroomNames(Object.fromEntries(classroomEntries));
			} catch (error) {
				console.error("Error fetching data:", error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchProfessorAndClassroomNames();
	}, [classroomId, filteredScheduleItems]);

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

	return (
		<div className="overflow-x-auto border rounded-lg">
			{/* please wait loader synchronous when classroom and professor fetch in use effect */}
			{isLoading && <PleaseWait />}

			<table className="min-w-full border-collapse table-fixed text-center text-sm">
				<thead>
					<tr className="bg-pink-100 text-gray-800">
						<th className="border p-2 w-20">Time</th>
						{days.map((day) => (
							<th key={day} className="border p-2">
								{day}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{hours.map((hourLabel, rowIndex) => (
						<tr key={rowIndex} className="h-12">
							<td className="border p-2 font-semibold bg-gray-50">
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
											className={`border p-2 font-medium transition-colors ${colorClass}`}
										>
											{pathname.startsWith("/program-head") && !isApproved ? (
												<ConfirmationHandleDialog
													trigger={
														<div className="hover:opacity-50 cursor-pointer transition-colors">
															{item.courseCode}
															<br />
															{item.section}
															<br />
															{formatProfessorName(professorName)}
															<br />
															{`(${classroomName})`}
														</div>
													}
													title={`You are about to delete schedule for ${item.section}`}
													description="This action cannot be undone."
													label="delete"
													onConfirm={() =>
														handleDeleteSpecificSchedule(item.id ?? "no id")
													}
												/>
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

								return <td key={cellKey} className="border p-2"></td>;
							})}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
