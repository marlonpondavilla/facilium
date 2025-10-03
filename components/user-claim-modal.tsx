"use client";

import React from "react";
import { SquarePen } from "lucide-react";
import toast from "react-hot-toast";
import { updateDocumentById } from "@/data/actions";
import { useRouter } from "next/navigation";
import ConfirmationHandleDialog from "./confirmation-handle-dialog";

type UserClaimProps = {
	data: {
		id: string;
		designation: string;
		status: string;
	};
};

const UserClaimModal = ({ data }: UserClaimProps) => {
	const router = useRouter();
	const handleCustomClaimChange = async () => {
		try {
			const reversedDesignation =
				data.designation === "Faculty" ? "Program Head" : "Faculty";
			await updateDocumentById(
				data.id,
				"userData",
				"designation",
				reversedDesignation
			);
			toast.success("Updated successfully!");
			router.refresh();
		} catch (e: unknown) {
			const error = e as { message?: string };
			toast.error(`Failed to update: ${error.message}`);
			throw error; // propagate to keep dialog open if desired
		}
	};

	const nextRole = data.designation === "Faculty" ? "Program Head" : "Faculty";

	return (
		<ConfirmationHandleDialog
			trigger={
				<button
					type="button"
					disabled={data.status === "Disabled"}
					className="disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center p-1 rounded hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-400"
				>
					<SquarePen
						size={18}
						className="facilium-color-indigo hover:text-indigo-500"
					/>
				</button>
			}
			title="Change user designation"
			description={`You are about to change this user's designation to ${nextRole}. Confirm with your password to proceed.`}
			label="update"
			onConfirm={handleCustomClaimChange}
			requirePassword
			passwordPlaceholder="Enter your password"
			confirmButtonText={`Yes, change to ${nextRole}`}
			contentClassName="sm:max-w-md"
		/>
	);
};

export default UserClaimModal;
