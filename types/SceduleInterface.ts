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
