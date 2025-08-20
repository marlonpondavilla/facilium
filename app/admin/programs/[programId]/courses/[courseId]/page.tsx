import AdminHeaderTitle from "@/components/admin-header-title";
import { Button } from "@/components/ui/button";
import {
	getDocumentsFromFirestore,
	getSingleDocumentFromFirestore,
} from "@/data/actions";
import React from "react";
import AddCoursesButton from "./add-courses";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import CoursesActions from "./courses-actions";

type PageProps = {
	params: {
		courseId: string;
	};
};

type Courses = {
	id: string;
	yearLevelId: string;
	programId: string;
	courseCode: string;
	subjectTitle: string;
};

const Page = async ({ params }: PageProps) => {
	const { courseId } = await Promise.resolve(params);

	const yearLevel = await getSingleDocumentFromFirestore(
		courseId,
		"year-levels",
		"yearLevel"
	);

	const courses: Courses[] = await getDocumentsFromFirestore("courses");

	return (
		<div className="flex flex-col gap-8">
			<AdminHeaderTitle title="Courses" />

			<div className="flex flex-col justify-center facilium-bg-whiter gap-4">
				<div className="flex items-center justify-between py-6 px-8 border">
					<h1 className="text-2xl text-gray-500 font-semibold tracking-wide">
						{yearLevel} Year
					</h1>

					<AddCoursesButton id={courseId} />
				</div>
			</div>

			<Table>
				<TableHeader className="facilium-bg-indigo">
					<TableRow>
						<TableHead className="facilium-color-white">Course Code</TableHead>
						<TableHead className="facilium-color-white">
							Subject Title
						</TableHead>
						<TableHead className="facilium-color-white">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{courses
						.filter((course) => courseId === course.yearLevelId)
						.map((course) => (
							<TableRow className="facilium-bg-whiter" key={course.id}>
								<TableCell>{course.courseCode}</TableCell>
								<TableCell>{course.subjectTitle}</TableCell>
								<TableCell>
									<CoursesActions
										data={{
											id: course.id,
											courseCode: course.courseCode,
											subjectTitle: course.subjectTitle,
										}}
									/>
								</TableCell>
							</TableRow>
						))}
				</TableBody>
			</Table>

			{courses.filter((course) => courseId === course.yearLevelId).length <
				1 && <p className="text-center text-gray-500">No data found.</p>}
		</div>
	);
};

export default Page;
