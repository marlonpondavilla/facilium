"use client";

import { ScheduleItem } from "@/types/SceduleInterface";
import React, { useEffect, useState } from "react";
import { getSingleDocumentFromFirestore } from "@/data/actions";
import { formatProfessorName } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import { scheduleColors } from "@/data/colors";

const days: string[] = ["Mon", "Tues", "Wed", "Thurs", "Fri", "Sat"];

interface ScheduleTableProps {
	scheduleItems: ScheduleItem[];
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

export default function ScheduleTable({ scheduleItems }: ScheduleTableProps) {
	const skipMap: Record<string, boolean> = {};
	const [classroomNames, setClassroomNames] = useState<Record<string, string>>(
		{}
	);
	const [professorNames, setProfessorNames] = useState<Record<string, string>>(
		{}
	);

	const searchParams = useSearchParams();
	const classroomId = searchParams.get("classroomId");

	// Filter after reading classroomId
	const filteredScheduleItems = scheduleItems.filter(
		(item) => item.classroomId === classroomId
	);

	// Fetch classroom and professor name
	useEffect(() => {
		const fetchProfessorAndClassroomNames = async () => {
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
		};

		fetchProfessorAndClassroomNames();
	}, [classroomId]);

	function getStartIndexFromDecimal(startDecimal: number): number {
		return Math.round((startDecimal - 7) * 2);
	}

	function getRowSpanFromDuration(
		durationHours: number,
		halfHour: number = 0
	): number {
		return durationHours * 2 + (halfHour === 30 ? 1 : 0);
	}

	return (
		<div className="overflow-x-auto border rounded-lg">
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
											className={`border p-2 font-medium ${colorClass}`}
										>
											{item.courseCode}
											<br />
											{item.section}
											<br />
											{formatProfessorName(professorName)}
											<br />
											{`(${classroomName})`}
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
