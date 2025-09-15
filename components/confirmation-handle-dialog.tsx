"use client";

import React from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "./ui/alert-dialog";
import { TriangleAlert } from "lucide-react";

interface ConfirmationHandleDialogProps {
	trigger: React.ReactNode;
	title: string;
	description: string;
	label: string;
	onConfirm: () => void;
}

const ConfirmationHandleDialog: React.FC<ConfirmationHandleDialogProps> = ({
	trigger,
	title,
	description,
	label,
	onConfirm,
}) => {
	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle className="facilium-color-indigo flex gap-2">
						{label.includes("delete") && (
							<TriangleAlert className="text-red-500" />
						)}
						{title}
					</AlertDialogTitle>
					<AlertDialogDescription className="text-sm text-muted-foreground">
						{description}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction
						onClick={onConfirm}
						className="bg-red-500 hover:opacity-50 cursor-pointer transition"
					>
						Yes, {label}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};

export default ConfirmationHandleDialog;
