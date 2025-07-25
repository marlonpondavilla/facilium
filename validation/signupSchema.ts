import { z } from "zod";

export const signupSchema = z
	.object({
		fullName: z.string().min(2, "Please provide a name"),
		email: z.string().trim().email("Invalid email address"),
		department: z.string(),
		password: z.string().refine(
			(value) => {
				const regex =
					/^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{6,}$/;
				return regex.test(value);
			},
			{
				message:
					"Password must include upper, lower, number, and special character",
			}
		),

		confirmPassword: z.string(),
	})
	.superRefine((data, ctx) => {
		if (data.password !== data.confirmPassword) {
			ctx.addIssue({
				message: "Passwords do not match",
				path: ["confirmPassword"],
				code: "custom",
			});
		}
	});
