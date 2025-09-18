import AdminHeaderTitle from "@/components/admin-header-title";
import React from "react";
import AddYearLevel from "./add-year-level";
import {
	getDocumentsFromFirestore,
	getSingleDocumentFromFirestore,
} from "@/data/actions";
import DeleteYearLevel from "./delete-year-level";
import ActionButtons from "./actions-btn";

// Using Promise-wrapped params to align with Next.js generated types for this route
type PageProps = { params: Promise<{ programId: string }> };

type YearLevels = {
	id: string;
	programId: string;
	yearLevel: string;
};

const Page = async ({ params }: PageProps) => {
	const { programId } = await params;

	const programName = await getSingleDocumentFromFirestore(
		programId,
		"programs",
		"programName"
	);

	const yearLevels: YearLevels[] = await getDocumentsFromFirestore(
		"year-levels",
		true
	);

	return (
		<div className="flex flex-col gap-8">
			<AdminHeaderTitle title="Year-Level" />

			{/* Program Header - Responsive */}
			<div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
					<h1 className="text-xl sm:text-2xl tracking-wide font-semibold text-gray-700 truncate">
						{programName ?? "Unknown Program"}
					</h1>
					<div className="flex-shrink-0">
						<AddYearLevel id={programId} />
					</div>
				</div>
			</div>

			{/* Year Levels Content - Responsive */}
			<div className="bg-white rounded-lg shadow-sm overflow-hidden">
				{/* Header */}
				<div className="facilium-bg-indigo text-white px-4 sm:px-6 py-4">
					<div className="flex items-center justify-between">
						<h2 className="text-lg sm:text-xl tracking-wide font-semibold">
							Year Levels
						</h2>
						<h3 className="hidden sm:block text-lg sm:text-xl tracking-wide font-semibold">
							Actions
						</h3>
					</div>
				</div>

				{/* Content */}
				<div className="divide-y divide-gray-200">
					{yearLevels.filter((yearLevel) => yearLevel.programId === programId)
						.length < 1 && (
						<div className="p-8 text-center">
							<p className="text-gray-500">
								No year levels available for this program.
							</p>
						</div>
					)}

					{/* Year Level Items - Responsive */}
					{yearLevels
						.filter((yearLevel) => yearLevel.programId === programId)
						.map((yearLevel) => {
							return (
								<div
									className="p-4 sm:p-6 hover:bg-gray-50 transition-colors"
									key={yearLevel.id}
								>
									{/* Mobile Layout */}
									<div className="sm:hidden space-y-4">
										<h3 className="text-lg font-semibold text-gray-800">
											{yearLevel.yearLevel} Year
										</h3>
										<div className="flex flex-col sm:flex-row gap-3">
											<ActionButtons yearLevelId={yearLevel.id} />
											<DeleteYearLevel id={yearLevel.id} />
										</div>
									</div>

									{/* Desktop Layout */}
									<div className="hidden sm:flex sm:items-center sm:justify-between">
										<h3 className="text-xl font-semibold text-gray-800">
											{yearLevel.yearLevel} Year
										</h3>

										<div className="flex items-center gap-3">
											<ActionButtons yearLevelId={yearLevel.id} />
											<DeleteYearLevel id={yearLevel.id} />
										</div>
									</div>
								</div>
							);
						})}
				</div>
			</div>
		</div>
	);
};

export default Page;
