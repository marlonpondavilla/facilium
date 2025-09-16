export interface ScheduleItem {
	id?: string;
	program: string;
	yearLevel: string;
	section: string;
	courseCode: string;
	professor: string;
	day: string;
	start: number;
	duration: number;
	halfHour?: number;
	classroomId: string;
}

export type PendingSchedule = {
	id: string;
	classroomId: string;
	scheduleItems: ScheduleItem[];
	submitted: string;
};

// Firestore document shape for approved schedules (mirrors PendingSchedule but with approval metadata)
export type ApprovedScheduleDoc = {
	id: string;
	classroomId: string;
	scheduleItems: ScheduleItem[];
	approved: string;
	dean?: string;
	submittedBy?: string;
};
