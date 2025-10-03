"use client";

import { EnableDisableActionProps } from "@/types/userActionType";
import EnableDisableAction from "./enable-disable-action";
import ConfirmationHandleDialog from "./confirmation-handle-dialog";
import { deleteUserCompletely } from "@/data/actions";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Trash2 } from "lucide-react";

const UserActionButton = ({ data }: EnableDisableActionProps) => {
	const router = useRouter();

	const handleDelete = async () => {
		const res = await deleteUserCompletely(data.id);
		if (!res.success) {
			throw new Error("Failed to delete user account.");
		}
		toast.success("User account deleted successfully!");
		router.refresh();
	};

	return (
		<div className="flex gap-2">
			<EnableDisableAction
				data={{
					id: data.id,
					status: data.status,
					collectionName: "userData",
					label: "user",
				}}
			/>
			<ConfirmationHandleDialog
				trigger={
					<button
						type="button"
						className="bg-red-600 hover:bg-red-700 text-white rounded-md px-2 py-1 text-xs flex items-center gap-1"
					>
						<Trash2 className="w-3.5 h-3.5" /> Delete
					</button>
				}
				title="Delete user account"
				description="This will permanently remove the user's data and authentication account. This action cannot be undone."
				label="delete"
				onConfirm={handleDelete}
				requirePassword
				passwordPlaceholder="Confirm with your password"
				confirmButtonText="Yes, delete user"
				contentClassName="sm:max-w-md"
			/>
		</div>
	);
};

export default UserActionButton;
