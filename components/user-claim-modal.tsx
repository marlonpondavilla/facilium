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
	hasActiveDean: boolean;
};

const UserClaimModal = ({ data, hasActiveDean }: UserClaimProps) => {
	const router = useRouter();
	const [warningOpen, setWarningOpen] = React.useState(false);
	const [warningMessage, setWarningMessage] = React.useState<string>("");
	const [selectedDesignation, setSelectedDesignation] = React.useState<string>(data.designation);

	const allowedOptions = React.useMemo(() => {
		const base = ["Faculty", "Program Head"] as const;
		return hasActiveDean ? base : ([...base, "Dean"] as const);
	}, [hasActiveDean]);

	const handleCustomClaimChange = async () => {
		try {
				if (!selectedDesignation || selectedDesignation === data.designation) {
					setWarningMessage("Please choose a different designation to update.");
					setWarningOpen(true);
					return false;
				}

				const res = await updateUserDesignationWithGuard({
					docId: data.id,
					newDesignation: selectedDesignation,
				});
				if (!res.success) {
					setWarningMessage(res.error || "Failed to update");
					setWarningOpen(true);
					return false;
				}
				router.refresh();
				return true;
		} catch (e: unknown) {
			const error = e as { message?: string };
				setWarningMessage(`Failed to update: ${error.message ?? "Unknown error"}`);
				setWarningOpen(true);
				throw error; // propagate to keep dialog open if desired
		}
	};

	const nextRoleLabel = "Change designation";

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
			description={`Select a new designation for this user. Confirm with your password to proceed.`}
			label="update"
			onConfirm={handleCustomClaimChange}
			requirePassword
			passwordPlaceholder="Enter your password"
			confirmButtonText={`Yes, ${nextRoleLabel}`}
			contentClassName="sm:max-w-md"
		>
			<div className="space-y-2">
				<label className="text-xs font-medium text-gray-700">Designation</label>
				<div className="flex gap-2 flex-wrap">
					{allowedOptions.map((opt) => (
						<button
							key={opt}
							type="button"
							onClick={() => setSelectedDesignation(opt)}
							className={`px-3 py-1 rounded border text-sm ${
								selectedDesignation === opt
									? "bg-indigo-100 border-indigo-500 text-indigo-700"
									: "bg-white border-gray-300 hover:bg-gray-50"
							}`}
						>
							{opt}
						</button>
					))}
				</div>
				{selectedDesignation === data.designation && (
					<p className="text-[11px] text-gray-500">Currently set to {data.designation}. Choose another to enable update.</p>
				)}
			</div>
		</ConfirmationHandleDialog>
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
