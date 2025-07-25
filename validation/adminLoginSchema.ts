import { z } from "zod";

export const adminLoginSchema = z.object({
	email: z.string().trim().email("Invalid email address"),

	password: z
		.string()
		.min(6, "Passwords must be at least 6 characters long")
		.refine(
			(val) => {
				const regex =
					/^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{6,}$/;
				return regex.test(val);
			},
			{
				message:
					"Password must include upper, lower, number, and special character",
			}
		),
});
