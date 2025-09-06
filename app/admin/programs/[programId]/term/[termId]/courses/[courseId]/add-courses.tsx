"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addDocumentToFirestore } from "@/data/actions";
import { Plus } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import React, { useState } from "react";
import toast from "react-hot-toast";

type AddCoursesButtonProps = {
	termId: string;
	programId: string;
	courseCode: string;
	subjectTitle: string;
};

// id here is year level id
const AddCoursesButton = ({ id }: { id: string }) => {
	const [open, setOpen] = useState(false);
	const [inputError, setInputError] = useState("");
	const [courseData, setCourseData] = useState<AddCoursesButtonProps>({
		termId: id,
		programId: "",
		courseCode: "",
		subjectTitle: "",
	});

	const { programId, termId } = useParams();
	const router = useRouter();

	const handleAddCourse = async () => {
		// validate course data
		if (!courseData.courseCode || !courseData.subjectTitle) {
			setInputError("Fields cannot be empty");
			setOpen(true);
			return;
		}

		// add regex validation to check whether the course code is valid by
		const hasNumber = /.*\d+.*/.test(courseData.courseCode);

		if (!hasNumber) {
			setInputError("Course codes should contain at least 1 number");
			setOpen(true);
			return;
		}

		// add regex to check if a value contains characters
		const hasCharacters = /(?:.*[a-zA-Z]){2,}/.test(
			courseData.courseCode.trim()
		);

		if (!hasCharacters) {
			setInputError("Course codes should contain at least 2 letters");
			setOpen(true);
			return;
		}

		setOpen(false);

		// firestore add document function
		const result = await addDocumentToFirestore("courses", {
			...courseData,
			programId,
			yearLevelId: termId,
			created: new Date().toISOString(),
		});

		// result in adding firestore data
		if (result.success) {
			toast.success("New course added successfully");
			router.refresh();
			setCourseData({
				termId: id,
				programId: String(programId),
				courseCode: "",
				subjectTitle: "",
			});
			return;
		}

		setOpen(true);
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(isOpen) => {
				setOpen(isOpen);
				// remove previous values of each field
				if (!isOpen) {
					setCourseData({
						termId: id,
						programId: String(programId),
						courseCode: "",
						subjectTitle: "",
					});

					setInputError("");
				}
			}}
		>
			<DialogTrigger asChild>
				<Button variant={"destructive"}>
					{" "}
					<Plus /> Add Course
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Adding Course</DialogTitle>
					<DialogDescription>Enter course information below</DialogDescription>
				</DialogHeader>

				{inputError && (
					<p className="text-xs text-red-500 text-center">{inputError}</p>
				)}

				<Label htmlFor="course-code">Course Code</Label>
				<Input
					placeholder="(e.g.., IT-101, DSA-102)"
					id="course-code"
					value={courseData.courseCode}
					onChange={(e) => {
						setCourseData((prev) => ({
							...prev,
							courseCode: e.target.value,
						}));
						setInputError("");
					}}
					className={`${inputError ? " border border-red-500" : ""}`}
				/>

				<Label htmlFor="subject-title">Subject Title</Label>
				<Input
					placeholder="(e.g.., Introduction to Computing)"
					id="subject-title"
					value={courseData.subjectTitle}
					onChange={(e) => {
						setCourseData((prev) => ({
							...prev,
							subjectTitle: e.target.value,
						}));
						setInputError("");
					}}
					className={`${inputError ? " border border-red-500" : ""}`}
				/>

				<DialogFooter>
					<Button
						onClick={handleAddCourse}
						className="w-full mt-2 facilium-bg-indigo hover:opacity-80 rounded-full"
					>
						Add now
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default AddCoursesButton;
