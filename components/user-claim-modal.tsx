"use client";

import React from "react";
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
import { Button } from "./ui/button";
import { SquarePen } from "lucide-react";
import { updateUserField } from "@/data/users";
import toast from "react-hot-toast";

type UserClaimProps = {
	data: {
		id: string;
		designation: string;
	};
};

const UserClaimModal = ({ data }: UserClaimProps) => {
	const handleCustomClaimChange = async () => {
		try {
			const reversedDesignation =
				data.designation === "Faculty" ? "Program Head" : "Faculty";
			await updateUserField(
				data.id,
				reversedDesignation,
				"userData",
				"designation"
			);
			toast.success("Updated successfully!");
			setTimeout(() => {
				window.location.reload();
			}, 2000);
		} catch (e: unknown) {
			const error = e as { message?: string };
			toast.error(`Failed to update: ${error.message}`);
		}
	};

	return (
		<Dialog>
			<DialogTrigger>
				<SquarePen
					size={20}
					className="cursor-pointer facilium-color-indigo hover:text-indigo-500 text-center"
				/>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Change user Designation?</DialogTitle>
					<DialogDescription>
						You are about to modify this user Designation
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<DialogClose asChild>
						<Button size={"sm"} variant={"outline"} className="cursor-pointer">
							No
						</Button>
					</DialogClose>
					<DialogClose asChild>
						<Button
							size={"sm"}
							variant={"destructive"}
							className="cursor-pointer"
							onClick={handleCustomClaimChange}
						>
							Yes, change to{" "}
							{data.designation === "Faculty" ? "Program Head" : "Faculty"}
						</Button>
					</DialogClose>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default UserClaimModal;
