import AdminHeaderTitle from "@/components/admin-header-title";
import {
	getDocumentsFromFirestore,
	getSingleDocumentFromFirestore,
} from "@/data/actions";
import React from "react";
import AddSectionButton from "./add-section";
import DeleteSectionButton from "./delete-section";

type PageProps = { params: Promise<{ sectionId: string }> };

type Sections = {
	id: string;
	yearLevelId: string;
	sectionName: string;
};

const Page = async ({ params }: PageProps) => {
	const { sectionId } = await params;

	const yearLevel = await getSingleDocumentFromFirestore(
		sectionId,
		"year-levels",
		"yearLevel"
	);

	const sections: Sections[] = await getDocumentsFromFirestore(
		"sections",
		true
	);

	return (
		<div className="flex flex-col gap-8">
			<AdminHeaderTitle title="Section" />

			{/* Header Section - Responsive */}
			<div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
					<h2 className="text-xl sm:text-2xl tracking-wide font-semibold text-gray-700 truncate">
						{yearLevel} Year
					</h2>
					<div className="flex-shrink-0">
						<AddSectionButton id={sectionId} />
					</div>
				</div>
			</div>

			{/* Sections Content - Responsive */}
			<div className="bg-white rounded-lg shadow-sm overflow-hidden">
				{/* Header */}
				<div className="facilium-bg-indigo text-white px-4 sm:px-6 py-4">
					<div className="flex items-center justify-between">
						<h3 className="text-lg sm:text-xl font-semibold">Sections</h3>
						<h4 className="hidden sm:block text-lg sm:text-xl font-semibold">
							Actions
						</h4>
					</div>
				</div>

				{/* Content */}
				<div className="divide-y divide-gray-200">
					{sections.filter((section) => sectionId === section.yearLevelId)
						.length === 0 ? (
						<div className="p-8 text-center">
							<p className="text-gray-500">
								No sections found for this year level.
							</p>
						</div>
					) : (
						sections
							.filter((section) => sectionId === section.yearLevelId)
							.map((section) => (
								<div
									key={section.id}
									className="p-4 sm:p-6 hover:bg-gray-50 transition-colors"
								>
									{/* Mobile Layout */}
									<div className="sm:hidden space-y-3">
										<h4 className="text-lg font-semibold text-gray-800">
											{section.sectionName}
										</h4>
										<div className="flex justify-end">
											<DeleteSectionButton id={section.id} />
										</div>
									</div>

									{/* Desktop Layout */}
									<div className="hidden sm:flex sm:items-center sm:justify-between">
										<span className="text-lg font-medium text-gray-800">
											{section.sectionName}
										</span>
										<DeleteSectionButton id={section.id} />
									</div>
								</div>
							))
					)}
				</div>
			</div>
		</div>
	);
};

export default Page;
