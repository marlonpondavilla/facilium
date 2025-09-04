"use client";

import React from "react";
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "./ui/alert-dialog";
import { TriangleAlert } from "lucide-react";

interface WarningPopUpProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	title: string;
	description: string;
}

const WarningPopUp: React.FC<WarningPopUpProps> = ({
	open,
	setOpen,
	title,
	description,
}) => {
	return (
		<AlertDialog open={open} onOpenChange={setOpen}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<div className="flex items-center justify-center gap-2 text-red-500">
						<TriangleAlert className="w-5 h-5" />
						<AlertDialogTitle className="text-base text-center">
							{title}
						</AlertDialogTitle>
					</div>
					<AlertDialogDescription className="text-sm text-center text-gray-600 py-2">
						{description}
					</AlertDialogDescription>
				</AlertDialogHeader>

				<AlertDialogFooter>
					<AlertDialogCancel
						onClick={() => setOpen(false)}
						className="text-xs px-4 py-2"
					>
						Ok, I understand.
					</AlertDialogCancel>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};

export default WarningPopUp;
