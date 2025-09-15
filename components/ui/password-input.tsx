"use client";
import * as React from "react";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PasswordInputProps extends React.ComponentProps<typeof Input> {
	toggleAriaLabel?: string;
}

export const PasswordInput = React.forwardRef<
	HTMLInputElement,
	PasswordInputProps
>(
	(
		{ className, toggleAriaLabel = "Toggle password visibility", ...props },
		ref
	) => {
		const [visible, setVisible] = React.useState(false);
		return (
			<div className={cn("relative w-full", className)}>
				<Input
					ref={ref}
					type={visible ? "text" : "password"}
					className={cn("pr-10")}
					{...props}
				/>
				<button
					type="button"
					aria-label={toggleAriaLabel}
					aria-pressed={visible}
					onClick={() => setVisible((v) => !v)}
					className="absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
					tabIndex={0}
				>
					{visible ? (
						<EyeOff className="h-4 w-4" />
					) : (
						<Eye className="h-4 w-4" />
					)}
				</button>
			</div>
		);
	}
);
PasswordInput.displayName = "PasswordInput";

export default PasswordInput;
