import { z } from "zod";

export const signupSchema = z
	.object({
		firstName: z.string().min(2, "Please provide a First Name"),
		middleName: z
			.string()
			.min(2, "Please provide a Middle Name")
			.or(z.literal("")),
		lastName: z.string().min(2, "Please provide a Last Name"),
		degreeEarned: z.string().min(2, "Please provide a Last Name"),
		email: z.string(),
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
