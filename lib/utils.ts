import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function validateScheduleTimeRange(
	startTime: string,
	endTime: string,
	maxDurationMinutes: number = 360
): { isValid: boolean; error?: string } {
	if (!startTime || !endTime) {
		return { isValid: false, error: "Start and end time are required." };
	}

	const [startHour, startMinute] = startTime.split(":").map(Number);
	const [endHour, endMinute] = endTime.split(":").map(Number);

	const startTotal = startHour * 60 + startMinute;
	const endTotal = endHour * 60 + endMinute;

	const minStart = 7 * 60;
	const maxEnd = 20 * 60 + 30;

	// checks if start time set to 12pm
	if (startHour === 12 && startMinute === 0) {
		return {
			isValid: false,
			error: "Start time cannot be at 12:00pm (Lunch break)",
		};
	}

	// checks if start begins at or after 7am
	if (startTotal < minStart) {
		return {
			isValid: false,
			error: "Start time must be at or after 7:00 AM.",
		};
	}

	// checks if end time at or before 8:30pm
	if (endTotal > maxEnd) {
		return { isValid: false, error: "End time must be at or before 8:30 PM." };
	}

	if (startTotal >= endTotal) {
		return { isValid: false, error: "End time must be after start time." };
	}

	const duration = endTotal - startTotal;

	if (duration > maxDurationMinutes) {
		return {
			isValid: false,
			error: `Time duration must not exceed ${maxDurationMinutes / 60} hours.`,
		};
	}

	return { isValid: true };
}
