import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function validateScheduleTimeRange(
	startHour: number,
	durationHours: number,
	additionalMinutes: number = 0,
	maxDurationMinutes: number = 300
): { isValid: boolean; error?: string } {
	if (startHour == null || durationHours == null) {
		return { isValid: false, error: "Start time and duration are required." };
	}

	if (startHour === 12) {
		return {
			isValid: false,
			error: "Start time cannot be at 12pm (Lunchbreak)",
		};
	}

	if (startHour === 20 || startHour === 20.5) {
		return {
			isValid: false,
			error: "Start time must be before 8:00pm",
		};
	}

	if (durationHours <= 0) {
		return { isValid: false, error: "Duration must be greater than 0." };
	}

	const totalDurationMinutes = durationHours * 60 + additionalMinutes;

	if (totalDurationMinutes > maxDurationMinutes) {
		return {
			isValid: false,
			error: `Total duration cannot exceed ${maxDurationMinutes} minutes.`,
		};
	}

	return { isValid: true };
}

export function formatProfessorName(fullName: string): string {
	const parts = fullName.trim().split(" ");
	if (parts.length < 2) return fullName;

	const firstInitial = parts[0][0];
	const lastName = parts.slice(-1)[0]; // handles middle names
	return `${firstInitial}. ${lastName}`;
}
