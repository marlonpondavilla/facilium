"use client";

import React from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { getFacultyLoads } from "@/data/actions";
import type { FacultyLoad } from "@/types/facultyLoadType";
import { BookOpen } from "lucide-react";

type ViewAssignedLoadsDialogProps = {
	professorId: string;
	programs?: { id: string; programCode: string }[];
	yearLevels?: { id: string; programId: string; yearLevel: string }[];
	sections?: { id: string; yearLevelId: string; sectionName: string }[];
};

export default function ViewAssignedLoadsDialog({
	professorId,
	programs,
	yearLevels,
	sections,
}: ViewAssignedLoadsDialogProps) {
	const [open, setOpen] = React.useState(false);
	const [loads, setLoads] = React.useState<FacultyLoad[]>([]);
	const [loading, setLoading] = React.useState(false);
	const [currentPage, setCurrentPage] = React.useState(1);
	const itemsPerPage = 5;

	const fetchLoads = React.useCallback(async () => {
		if (!professorId || !open) return;
		setLoading(true);
		try {
			const result = await getFacultyLoads({ professorId });
			setLoads((result as FacultyLoad[]) || []);
		} catch (e) {
			console.error("Failed to fetch faculty loads", e);
			setLoads([]);
		} finally {
			setLoading(false);
		}
	}, [professorId, open]);

	React.useEffect(() => {
		if (open) {
			fetchLoads();
			setCurrentPage(1); // Reset to first page when dialog opens
		}
	}, [open, fetchLoads]);

	const resolveProgram = (programId: string) => {
		return programs?.find((p) => p.id === programId)?.programCode || programId;
	};

	const resolveYearLevel = (yearLevelId: string) => {
		return (
			yearLevels?.find((y) => y.id === yearLevelId)?.yearLevel || yearLevelId
		);
	};

	const resolveSection = (sectionId: string) => {
		return (
			sections?.find((s) => s.id === sectionId)?.sectionName || sectionId
		);
	};

	// Pagination calculations
	const totalPages = Math.ceil(loads.length / itemsPerPage);
	const startIndex = (currentPage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;
	const currentLoads = loads.slice(startIndex, endIndex);

	const handlePrevious = () => {
		setCurrentPage((prev) => Math.max(1, prev - 1));
	};

	const handleNext = () => {
		setCurrentPage((prev) => Math.min(totalPages, prev + 1));
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<button className="w-full h-full flex items-center justify-center gap-2">
					<BookOpen className="w-4 h-4 sm:w-5 sm:h-5 transition-colors duration-200" />
					<p className="font-medium text-xs sm:text-sm text-gray-800 hover:text-indigo-800 truncate">
						View Assigned Loads
					</p>
				</button>
			</DialogTrigger>
			<DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="facilium-color-indigo">
						Your Assigned Course Loads
					</DialogTitle>
					<DialogDescription>
						Courses assigned to you by the Program Head for this academic year.
					</DialogDescription>
				</DialogHeader>
				<div className="mt-4">
					{loading ? (
						<p className="text-sm text-gray-500 text-center py-8">
							Loading assigned loads...
						</p>
					) : loads.length === 0 ? (
						<p className="text-sm text-gray-500 text-center py-8">
							No course loads assigned yet.
						</p>
					) : (
						<div className="overflow-x-auto">
							<table className="min-w-full text-sm border border-gray-200 rounded">
								<thead>
									<tr className="bg-pink-200 text-black">
										<th className="px-3 py-2 text-left border">Program</th>
										<th className="px-3 py-2 text-left border">Year Level</th>
										<th className="px-3 py-2 text-left border">Section</th>
										<th className="px-3 py-2 text-left border">Course Code</th>
									</tr>
								</thead>
								<tbody>
									{currentLoads.map((load, index) => (
										<tr key={load.id || index} className="odd:bg-gray-50">
											<td className="px-3 py-2 border">
												{resolveProgram(load.programId)}
											</td>
											<td className="px-3 py-2 border">
												{resolveYearLevel(load.yearLevelId)}
											</td>
											<td className="px-3 py-2 border">
												{resolveSection(load.sectionId)}
											</td>
											<td className="px-3 py-2 border">{load.courseCode}</td>
										</tr>
									))}
								</tbody>
							</table>
							{/* Pagination Controls */}
							{totalPages > 1 && (
								<div className="flex items-center justify-between mt-4 px-2">
									<button
										onClick={handlePrevious}
										disabled={currentPage === 1}
										className="px-3 py-1 text-sm border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
									>
										Previous
									</button>
									<span className="text-sm text-gray-600">
										Page {currentPage} of {totalPages}
									</span>
									<button
										onClick={handleNext}
										disabled={currentPage === totalPages}
										className="px-3 py-1 text-sm border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
									>
										Next
									</button>
								</div>
							)}
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
