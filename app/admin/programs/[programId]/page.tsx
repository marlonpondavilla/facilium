import AdminHeaderTitle from "@/components/admin-header-title";
import React from "react";
import AddYearLevel from "./add-year-level";
import {
	getDocumentsFromFirestore,
	getSingleDocumentFromFirestore,
} from "@/data/actions";
import { Button } from "@/components/ui/button";
import DeleteYearLevel from "./delete-year-level";

type PageProps = {
	params: {
		programId: string;
	};
};

type YearLevels = {
	id: string;
	programId: string;
	yearLevel: string;
};

const Page = async ({ params }: PageProps) => {
	// watch out for this tinry ko lang i-wrap since nagco-complain na (params should be awaited)
	const { programId } = await Promise.resolve(params);

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

			<div className="flex items-center justify-between facilium-bg-whiter py-6 px-8">
				<h1 className="text-2xl tracking-wide font-semibold text-gray-500">
					{programName ?? "Unknown Program"}
				</h1>
				<AddYearLevel id={programId} />
			</div>

			<div className="flex flex-col justify-center facilium-bg-whiter py-6 px-8 gap-4">
				<div className="flex items-center justify-between facilium-bg-indigo py-6 px-8 border facilium-color-white rounded-t-2xl">
					<h2 className="text-2xl tracking-wide font-semibold ">Year Level</h2>
					<h3 className="text-2xl tracking-wide font-semibold ">Actions</h3>
				</div>

				{yearLevels.filter((yearLevel) => yearLevel.programId === programId)
					.length < 1 && (
					<p className="text-center text-gray-500">
						No data available for this year level.
					</p>
				)}

				{/* year level data  */}
				{yearLevels
					.filter((yearLevel) => yearLevel.programId === programId)
					.map((yearLevel) => {
						return (
							<div
								className="flex items-center justify-between bg-muted py-6 px-8 border-2 text-gray-500"
								key={yearLevel.id}
							>
								<h2 className="text-xl tracking-wide font-semibold ">
									{yearLevel.yearLevel} Year
								</h2>

								<div className="delete">
									<DeleteYearLevel id={yearLevel.id} />
								</div>

								<div className="actions flex gap-2">
									<Button
										variant={"outline"}
										className="rounded-full cursor-pointer hover:bg-indigo-500 hover:text-white transition-all facilium-color-indigo border-indigo-500"
									>
										Add Section
									</Button>
									<Button className="facilium-bg-indigo cursor-pointer rounded-2xl">
										Add Courses
									</Button>
								</div>
							</div>
						);
					})}
			</div>
		</div>
	);
};

export default Page;
