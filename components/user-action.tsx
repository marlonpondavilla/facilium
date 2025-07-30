"use client";

import { Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { setUserStatus } from "@/data/users";

type UserAction = {
	data: {
		id: string;
		status: string;
	};
};

const UserActionButton = ({ data }: UserAction) => {
	const handleDelete = () => {
		alert(`${data.id} is deleting`);
	};

	// we can manipulate this since each row meron nang spec id
	const handleStatusUpdate = async () => {
		const newStatus = data.status === "Enabled" ? "Disabled" : "Enabled";

		try {
			await setUserStatus(data.id, newStatus);
			alert(`${data.id} is ${newStatus}!`);
			window.location.reload();
		} catch (e: unknown) {
			const error = e as { message?: string };
			console.error(error);
		}
	};

	return (
		<div className="flex gap-2">
			<Button
				size={"sm"}
				variant={"outline"}
				onClick={handleStatusUpdate}
				className="cursor-pointer"
			>
				{data.status === "Enabled" ? "Disable" : "Enable"}
			</Button>
			<Button
				size={"sm"}
				variant={"destructive"}
				onClick={handleDelete}
				className="cursor-pointer"
			>
				<Trash2 />
			</Button>
		</div>
	);
};

export default UserActionButton;
