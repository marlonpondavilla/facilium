import { z } from "zod";

export const scheduleSchema = z
	.object({
		program: z.string().min(2, "Please select a program"),
		yearLevel: z.string().min(2, "Please select a year level"),
		section: z.string().min(2, "Please select a sectiion"),
		courseCode: z.string().min(2, "Please select a course code"),
		professor: z.string().min(2, "Please select a professor"),
		day: z.string().min(2, "Please select a day"),
		start: z.string().time(),
		end: z.string().time(),
	})
	.refine(
		(data) => {
			if (!data.start && !data.end) {
				return;
			}

			return data.end > data.start;
		},
		{
			message: "End time must be after start time.",
			path: ["end"],
		}
	);
