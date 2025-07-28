"use client";
import { Button } from "./ui/button";

const UserActionButton = ({ data }: { data: string }) => {
	const handleEnable = () => {
		alertTrue();
	};

	const alertTrue = () => {
		// we can manipulate this since each row meron nang spec id
		alert(data);
	};
	return (
		<div className="flex gap-2">
			<Button
				size={"sm"}
				onClick={handleEnable}
				className="cursor-pointer bg-green-500 hover:bg-green-400"
			>
				Enable
			</Button>
			<Button
				size={"sm"}
				onClick={handleEnable}
				className="cursor-pointer bg-red-500 hover:bg-red-400"
			>
				Disable
			</Button>
		</div>
	);
};

export default UserActionButton;
