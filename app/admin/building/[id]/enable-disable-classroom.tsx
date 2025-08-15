import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { updateDocumentById } from "@/data/actions";
import { EnableDisableActionProps } from "@/types/userActionType";
import React from "react";
import toast from "react-hot-toast";

const EnableDisableClassroom = ({ data }: EnableDisableActionProps) => {
	const statusLabel = data.status !== "Enabled" ? "Enable" : "Disable";

	const handleStatusUpdate = async () => {
		const newStatus = data.status === "Enabled" ? "Disabled" : "Enabled";

		try {
			await updateDocumentById(data.id, "classrooms", "status", newStatus);
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
		<Dialog>
			<DialogTrigger asChild>
				<Button
					variant={"outline"}
					className={`${
						data.status === "Enabled"
							? "border border-red-500"
							: "border border-green-500"
					}`}
				>
					{statusLabel}
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						Are you sure you want to {statusLabel.toLowerCase()} this classroom?
					</DialogTitle>
					<DialogDescription>
						This will allow or restrict classroom based on their status
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
	);
};

export default EnableDisableClassroom;
