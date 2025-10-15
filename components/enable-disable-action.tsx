"use client";

import React from "react";
import { Button } from "./ui/button";
import { updateDocumentById } from "@/data/actions";
import { EnableDisableActionProps } from "@/types/userActionType";
import { useRouter } from "next/navigation";
import ConfirmationHandleDialog from "./confirmation-handle-dialog";
import WarningPopUp from "./warning-pop-up";

const EnableDisableAction = ({ data }: EnableDisableActionProps) => {
	const statusLabel = data.status !== "Enabled" ? "Enable" : "Disable";
	const router = useRouter();
	const [warningOpen, setWarningOpen] = React.useState(false);
	const [warningMessage, setWarningMessage] = React.useState("");

	const handleStatusUpdate = async () => {
		const newStatus = data.status === "Enabled" ? "Disabled" : "Enabled";
		try {
			await updateDocumentById(
				data.id,
				data.collectionName,
				"status",
				newStatus
			);
			router.refresh();
		} catch (e: unknown) {
			const error = e as { message?: string };
			setWarningMessage(error.message ?? "Error updating user status");
			setWarningOpen(true);
			return false;
		}
		return true;
	};

	return (
		<>
			<ConfirmationHandleDialog
				trigger={
					<Button
						variant={"outline"}
						className={`${
							data.status === "Enabled"
								? "border border-red-500"
								: "border border-blue-500"
						}`}
					>
						{statusLabel}
					</Button>
				}
				title={`Confirm ${statusLabel.toLowerCase()} user`}
				description={`This will ${statusLabel.toLowerCase()} the ${data.label.toLowerCase()} account.`}
				label={statusLabel.toLowerCase()}
				onConfirm={handleStatusUpdate}
				requirePassword
				passwordPlaceholder="Enter your password to confirm"
				confirmButtonText={`Yes, ${statusLabel}`}
			/>
			<WarningPopUp
				open={warningOpen}
				setOpen={setWarningOpen}
				title="Action failed"
				description={warningMessage}
			/>
		</>
	);
};

export default EnableDisableAction;
