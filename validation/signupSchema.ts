import { z } from "zod";

const nameRegex = /^[A-Za-z\s'-]+$/;

export const signupSchema = z
	.object({
		firstName: z
			.string()
			.min(2, "Please provide a First Name")
			.regex(
				nameRegex,
				"First Name must not contain numbers or special characters"
			),
		middleName: z
			.string()
			.min(2, "Please provide a Middle Name")
			.regex(
				nameRegex,
				"Middle Name must not contain numbers or special characters"
			)
			.or(z.literal("")),
		lastName: z
			.string()
			.min(2, "Please provide a Last Name")
			.regex(
				nameRegex,
				"Last Name must not contain numbers or special characters"
			),
		degreeEarned: z.string().min(2, "This field is required."),
		email: z.string().email(),
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
