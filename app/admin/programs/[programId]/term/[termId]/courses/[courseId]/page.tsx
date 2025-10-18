import AdminHeaderTitle from "@/components/admin-header-title";
import BackButton from "@/components/back-button";
import {
	getDocumentsFromFirestore,
	getSingleDocumentFromFirestore,
} from "@/data/actions";
import React from "react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import AddCoursesButton from "./add-courses";
import CoursesActions from "./courses-actions";

type PageProps = { params: Promise<{ courseId: string }> };

type Courses = {
	id: string;
	termId: string;
	programId: string;
	courseCode: string;
	subjectTitle: string;
};

const Page = async ({ params }: PageProps) => {
	const { courseId } = await params;

	const term = await getSingleDocumentFromFirestore(
		courseId,
		"academic-terms",
		"term"
	);

	const courses: Courses[] = await getDocumentsFromFirestore("courses");

	return (
		<div className="flex flex-col gap-8">
			<div>
				<BackButton />
			</div>
			<AdminHeaderTitle title="Courses" />

			{/* Header Section - Responsive */}
			<div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
					<h1 className="text-xl sm:text-2xl text-gray-700 font-semibold tracking-wide truncate">
						{term} Semester
					</h1>
					<div className="flex-shrink-0">
						<AddCoursesButton id={courseId} />
					</div>
				</div>
			</div>

			{/* Courses Table - Responsive */}
			<div className="bg-white rounded-lg shadow-sm overflow-hidden">
				{/* Desktop Table */}
				<div className="hidden sm:block overflow-x-auto">
					<Table>
						<TableHeader className="facilium-bg-indigo">
							<TableRow>
								<TableHead className="text-white font-semibold">
									Course Code
								</TableHead>
								<TableHead className="text-white font-semibold">
									Subject Title
								</TableHead>
								<TableHead className="text-white font-semibold text-center">
									Actions
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{courses
								.filter((course) => courseId === course.termId)
								.map((course) => (
									<TableRow className="hover:bg-gray-50" key={course.id}>
										<TableCell className="font-medium">
											<code className="bg-gray-100 px-2 py-1 rounded text-sm">
												{course.courseCode}
											</code>
										</TableCell>
										<TableCell className="max-w-xs">
											<div className="truncate" title={course.subjectTitle}>
												{course.subjectTitle}
											</div>
										</TableCell>
										<TableCell className="text-center">
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
				</div>

				{/* Mobile Cards */}
				<div className="sm:hidden divide-y divide-gray-200">
					{courses
						.filter((course) => courseId === course.termId)
						.map((course) => (
							<div key={course.id} className="p-4 space-y-3">
								<div className="flex items-start justify-between">
									<div className="flex-1 min-w-0">
										<h3 className="font-medium text-gray-900 mb-1">
											<code className="bg-gray-100 px-2 py-1 rounded text-sm">
												{course.courseCode}
											</code>
										</h3>
										<p className="text-sm text-gray-600 break-words">
											{course.subjectTitle}
										</p>
									</div>
									<div className="ml-3 flex-shrink-0">
										<CoursesActions
											data={{
												id: course.id,
												courseCode: course.courseCode,
												subjectTitle: course.subjectTitle,
											}}
										/>
									</div>
								</div>
							</div>
						))}
				</div>

				{/* Empty State */}
				{courses.filter((course) => courseId === course.termId).length < 1 && (
					<div className="p-8 text-center">
						<p className="text-gray-500">No courses found for this term.</p>
					</div>
				)}
			</div>
		</div>
	);
};

export default Page;
