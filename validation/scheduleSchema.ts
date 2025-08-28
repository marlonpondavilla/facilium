import { z } from "zod";

export const scheduleSchema = z.object({
	program: z.string().min(2, "Please select a program"),
	yearLevel: z.string().min(2, "Please select a year level"),
	section: z.string().min(2, "Please select a sectiion"),
	courseCode: z.string().min(2, "Please select a course code"),
	professor: z.string().min(2, "Please select a professor"),
});
