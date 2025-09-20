import { z } from "zod";

export const scheduleSchema = z.object({
	program: z.string().min(2, "Please select a program"),
	yearLevel: z.string().min(2, "Please select a year level"),
	section: z.string().min(2, "Please select a section"),
	courseCode: z.string().min(2, "Please select a course code"),
	professor: z.string().min(2, "Please select a professor"),
	day: z.string().min(2, "Please select a day"),
	start: z.number().min(1, "Please select start time"),
	duration: z.number().min(1, "Please select duration"),
	halfHour: z.number().optional(),
});
