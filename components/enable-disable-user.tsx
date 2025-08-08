"use client";

import { updateUserField } from "@/data/users";
import { Button } from "./ui/button";
import { UserActionProps } from "@/types/userActionType";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "./ui/dialog";
import toast from "react-hot-toast";

const EnableDisableUser = ({ data }: UserActionProps) => {
	const statusLabel = data.status !== "Enabled" ? "Enable" : "Disable";

	const handleStatusUpdate = async () => {
		const newStatus = data.status === "Enabled" ? "Disabled" : "Enabled";

		try {
			await updateUserField(data.id, newStatus, "userData", "status");
			toast.success("Updated successfully!");
			setTimeout(() => {
				window.location.reload();
			}, 2000);
		} catch (e: unknown) {
			const error = e as { message?: string };
			toast.error(error.message ?? "error in updating user");
		}
	};

	return (
		<div>
			<Dialog>
				<DialogTrigger asChild>
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
				</DialogTrigger>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							Are you sure you want to {statusLabel.toLowerCase()} this user?
						</DialogTitle>
						<DialogDescription>
							This will allow or restrict user based on their status
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<DialogClose asChild>
							<Button size={"sm"} variant={"outline"}>
								No
							</Button>
						</DialogClose>
						<DialogClose asChild>
							<Button
								onClick={handleStatusUpdate}
								size={"sm"}
								variant={"default"}
								className="cursor-pointer facilium-bg-indigo"
							>
								{`Yes, ${statusLabel}`}
							</Button>
						</DialogClose>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
};

export default EnableDisableUser;
