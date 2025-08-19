import AdminHeaderTitle from "@/components/admin-header-title";
import {
	getDocumentsFromFirestore,
	getSingleDocumentFromFirestore,
} from "@/data/actions";
import React from "react";
import AddSectionButton from "./add-section";
import { Button } from "@/components/ui/button";
import DeleteSectionButton from "./delete-section";

type PageProps = {
	params: {
		sectionId: string;
	};
};

type Sections = {
	id: string;
	yearLevelId: string;
	sectionName: string;
};

const Page = async ({ params }: PageProps) => {
	const { sectionId } = await Promise.resolve(params);

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

			<div className="flex flex-col justify-center facilium-bg-whiter gap-4">
				<div className="flex items-center justify-between py-6 px-8 border">
					<h2 className="text-2xl tracking-wide font-semibold text-gray-500">
						{yearLevel} Year
					</h2>
					<AddSectionButton id={sectionId} />
				</div>
			</div>

			<div className="bg-white rounded-lg shadow-sm p-6 w-full">
				<div className="flex justify-between">
					<p className="text-xl font-semibold text-gray-700 mb-4">Sections</p>
					<p className="text-xl font-semibold text-gray-700 mb-4">Actions</p>
				</div>

				{sections.filter((section) => sectionId === section.yearLevelId)
					.length === 0 ? (
					<p className="text-gray-400 text-sm text-center py-4">
						No sections found.
					</p>
				) : (
					<div className="space-y-4">
						{sections
							.filter((section) => sectionId === section.yearLevelId)
							.map((section) => (
								<div
									key={section.id}
									className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-md p-4 w-full"
								>
									<span className="text-lg text-gray-800">
										{section.sectionName}
									</span>

									<DeleteSectionButton id={section.id} />
								</div>
							))}
					</div>
				)}
			</div>
		</div>
	);
};

export default Page;
