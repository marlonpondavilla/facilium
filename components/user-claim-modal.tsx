"use client";

import React from "react";
import { SquarePen } from "lucide-react";
import { updateUserDesignationWithGuard } from "@/data/actions";
import { useRouter } from "next/navigation";
import ConfirmationHandleDialog from "./confirmation-handle-dialog";
import WarningPopUp from "./warning-pop-up";

type UserClaimProps = {
	data: {
		id: string;
		designation: string;
		status: string;
	};
};

const UserClaimModal = ({ data }: UserClaimProps) => {
	const router = useRouter();
	const [warningOpen, setWarningOpen] = React.useState(false);
	const [warningMessage, setWarningMessage] = React.useState<string>("");
	const handleCustomClaimChange = async () => {
		try {
				const reversedDesignation =
					data.designation === "Faculty" ? "Program Head" : "Faculty";
				const res = await updateUserDesignationWithGuard({
					docId: data.id,
					newDesignation: reversedDesignation,
				});
				if (!res.success) {
					setWarningMessage(res.error || "Failed to update");
					setWarningOpen(true);
					return;
				}
				router.refresh();
		} catch (e: unknown) {
			const error = e as { message?: string };
				setWarningMessage(`Failed to update: ${error.message ?? "Unknown error"}`);
				setWarningOpen(true);
				throw error; // propagate to keep dialog open if desired
		}
	};

	const nextRole = data.designation === "Faculty" ? "Program Head" : "Faculty";

	return (
		<>
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
		<WarningPopUp
			open={warningOpen}
			setOpen={setWarningOpen}
			title="Action blocked"
			description={warningMessage}
		/>
		</>
	);
};

export default UserClaimModal;
