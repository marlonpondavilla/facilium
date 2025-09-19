import FacultyHeader from "@/components/faculty-header";
import FacultyScheduleInterface from "@/components/faculty-schedule-interface";
import {
	Classroom,
	getBuildingName,
	getFilteredClassrooms,
} from "@/data/faculty-building";
import React from "react";
import { ApprovedScheduleDoc, ScheduleItem } from "@/types/SceduleInterface";
import { getDocumentsFromFirestore } from "@/data/actions";

type PageProps = { params: Promise<{ id: string }> };

const Page = async ({ params }: PageProps) => {
	const { id } = await params;

	// --- Fetch & normalize approved schedule data (kept inline: simple & transparent) ---
	const raw = await getDocumentsFromFirestore("approvedScheduleData");

	const looksLikeApprovedDoc = (d: unknown): d is ApprovedScheduleDoc => {
		if (!d || typeof d !== "object") return false;
		const maybe = d as Partial<ApprovedScheduleDoc> & { classroomId?: unknown };
		return (
			Array.isArray(maybe.scheduleItems) &&
			typeof maybe.classroomId === "string"
		);
	};
	const looksLikeScheduleItem = (r: unknown): r is ScheduleItem => {
		if (!r || typeof r !== "object") return false;
		const maybe = r as Record<string, unknown>;
		return (
			typeof maybe.classroomId === "string" &&
			typeof maybe.day === "string" &&
			"start" in maybe &&
			"duration" in maybe
		);
	};

	const normalizeDay = (day: unknown): string | undefined => {
		if (typeof day !== "string") return undefined;
		switch (day.trim().toLowerCase()) {
			case "mon":
			case "monday":
				return "Mon";
			case "tue":
			case "tues":
			case "tuesday":
				return "Tues";
			case "wed":
			case "wednesday":
				return "Wed";
			case "thu":
			case "thur":
			case "thurs":
			case "thursday":
				return "Thurs";
			case "fri":
			case "friday":
				return "Fri";
			case "sat":
			case "saturday":
				return "Sat";
			default:
				return undefined;
		}
	};

	let approvedScheduleData: ScheduleItem[] = [];
	if (Array.isArray(raw) && raw.length) {
		const allApprovedShape = raw.every(looksLikeApprovedDoc);
		if (allApprovedShape) {
			for (const doc of raw as ApprovedScheduleDoc[]) {
				for (const item of doc.scheduleItems || []) {
					if (!looksLikeScheduleItem(item)) continue; // skip malformed
					const itemRecord = item as unknown as Record<string, unknown>;
					const start = Number(itemRecord.start);
					const duration = Number(itemRecord.duration);
					const day = normalizeDay(itemRecord.day);
					if (!Number.isFinite(start) || !Number.isFinite(duration) || !day)
						continue;
					approvedScheduleData.push({
						...(item as ScheduleItem),
						start,
						duration,
						day,
					});
				}
			}
		} else {
			// Assume already flat rows (legacy shape)
			for (const r of raw) {
				if (!looksLikeScheduleItem(r)) continue;
				const rec = r as unknown as Record<string, unknown>;
				const start = Number(rec.start);
				const duration = Number(rec.duration);
				const day = normalizeDay(rec.day);
				if (!Number.isFinite(start) || !Number.isFinite(duration) || !day)
					continue;
				approvedScheduleData.push({
					...(r as ScheduleItem),
					start,
					duration,
					day,
				});
			}
		}
	}
	// Deduplicate optimistic duplicates if any (by composite key)
	if (approvedScheduleData.length) {
		const seen = new Set<string>();
		approvedScheduleData = approvedScheduleData.filter((r) => {
			const key = `${r.classroomId}|${r.day}|${r.start}|${r.courseCode}|${r.section}`;
			if (seen.has(key)) return false;
			seen.add(key);
			return true;
		});
	}
	const buildingName = await getBuildingName(id);
	const clasrooms: Classroom[] = await getFilteredClassrooms(id);

	return (
		<FacultyHeader>
			<FacultyScheduleInterface
				scheduleItems={approvedScheduleData}
				buildingName={buildingName}
				data={clasrooms}
			/>
		</FacultyHeader>
	);
};

export default Page;
