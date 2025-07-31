"use client";

import { UserActionProps } from "@/types/userActionType";
import DeleteUserWithConfirmation from "./delete-user";
import EnableDisableUser from "./enable-disable-user";

const UserActionButton = ({ data }: UserActionProps) => {
	return (
		<div className="flex gap-2">
			<EnableDisableUser data={{ id: data.id, status: data.status }} />
			<DeleteUserWithConfirmation id={data.id} />
		</div>
	);
};

export default UserActionButton;
