import { Trash2, TriangleAlert } from "lucide-react";
import { Button } from "./ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	DialogDescription,
	DialogFooter,
	DialogClose,
} from "./ui/dialog";
import toast from "react-hot-toast";
import { deleteDocumentById } from "@/data/actions";

type DeleteUserWithConfirmationProps = {
	id: string;
};

const DeleteUserWithConfirmation = ({
	id,
}: DeleteUserWithConfirmationProps) => {
	const handleDelete = async () => {
		try {
			await deleteDocumentById(id, "userData");
			toast.success("Deleted successfully!");
			setTimeout(() => {
				window.location.reload();
			}, 2000);
		} catch (e: unknown) {
			const error = e as { message?: string };
			console.error(error.message);
		}
	};

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button size={"sm"} variant={"destructive"} className="cursor-pointer">
					<Trash2 />
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						<div className="flex items-center gap-2">
							<TriangleAlert className="text-red-500" />
							You are deleting a user
						</div>
					</DialogTitle>
					<DialogDescription>This action cannot be undone.</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<DialogClose asChild>
						<Button variant={"outline"}>Cancel</Button>
					</DialogClose>
					<DialogClose asChild>
						<Button
							onClick={handleDelete}
							variant={"default"}
							className="bg-red-500 text-white hover:bg-red-400"
						>
							Confirm
						</Button>
					</DialogClose>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default DeleteUserWithConfirmation;
