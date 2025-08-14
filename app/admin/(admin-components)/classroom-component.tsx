"use client";

import AdminHeaderTitle from "@/components/admin-header-title";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	addDocumentToFirestore,
	incrementDocumentCountById,
} from "@/data/actions";
import { useParams } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

type ClassroomComponentProps = {
	children: React.ReactNode;
};

const ClassroomComponent = ({ children }: ClassroomComponentProps) => {
	const [classroomName, setClassroomName] = useState("");
	const [status, setStatus] = useState("Enabled");
	const [submitting, setSubmitting] = useState(false);
	const { id } = useParams();

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setSubmitting(true);

		try {
			if (classroomName === "") {
				toast.error("field is empty");
				return;
			}

			const result = await addDocumentToFirestore("classrooms", {
				buildingId: id,
				classroomName: classroomName,
				status: status,
				created: new Date().toISOString(),
			});

			if (result.success) {
				if (id) {
					await incrementDocumentCountById(
						id?.toString(),
						"buildings",
						"classroom",
						1
					);
				}
				toast.success("New classroom has been added!");
				setTimeout(() => {
					window.location.reload();
				}, 2000);
			} else {
				toast.error("Error on adding a classroom");
			}
		} catch (e: unknown) {
			const error = e as { message?: string };
			toast.error(
				error.message ?? "There is an error when submitting the form"
			);
			console.error(error);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className="flex flex-col gap-8">
			<AdminHeaderTitle title="Building Details" />
			<div className="flex items-center justify-between facilium-bg-whiter py-4 px-8">
				<h1 className="text-2xl tracking-wide font-semibold text-gray-500">
					Classrooms
				</h1>
				<Dialog>
					<DialogTrigger asChild>
						<Button variant="destructive" className="py-6">
							Add New Classroom
						</Button>
					</DialogTrigger>

					<DialogContent className="sm:max-w-[425px]">
						<form onSubmit={handleSubmit} className="flex flex-col gap-4">
							<DialogHeader>
								<DialogTitle>Create Classroom</DialogTitle>
								<DialogDescription>
									This action reflects to faculty account.
								</DialogDescription>
							</DialogHeader>

							<div>
								<Label htmlFor="classroom-name" className="mb-2">
									Classroom Name
								</Label>
								<Input
									id="classroom-name"
									value={classroomName}
									onChange={(e) => setClassroomName(e.target.value)}
								/>
							</div>

							<div>
								<Label>Status</Label>
								<Select value={status} onValueChange={setStatus}>
									<SelectTrigger>
										<SelectValue placeholder="Enable" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="Enabled">Enable</SelectItem>
										<SelectItem value="Disabled">Disable</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<DialogFooter>
								<Button
									type="submit"
									variant={"destructive"}
									className="flex w-full"
									disabled={submitting}
								>
									Add Now
								</Button>
							</DialogFooter>
						</form>
					</DialogContent>
				</Dialog>
			</div>

			<div className="table-wrapper flex flex-col gap-2">{children}</div>
		</div>
	);
};

export default ClassroomComponent;
