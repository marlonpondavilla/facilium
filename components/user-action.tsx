"use client";

import { EnableDisableActionProps } from "@/types/userActionType";
import DeleteUserWithConfirmation from "./delete-document";
import EnableDisableAction from "./enable-disable-action";

const UserActionButton = ({ data }: EnableDisableActionProps) => {
	return (
		<div className="flex gap-2">
			{/* disable the user */}
			<EnableDisableAction
				data={{
					id: data.id,
					status: data.status,
					collectionName: "userData",
					label: "user",
				}}
			/>
			{/* will target userData with the id passed to delete */}
			<DeleteUserWithConfirmation
				data={{ id: data.id, collectionName: "userData", label: "user" }}
			/>
		</div>
	);
};

export default UserActionButton;
