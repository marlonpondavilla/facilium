import AdminHeaderTitle from "@/components/admin-header-title";
import { GraduationCap, LayoutTemplate } from "lucide-react";
import React from "react";
import AddProgramModal from "../programs/add-program-modal";
import { getCollectionSize } from "@/data/actions";

const ProgramsComponent = async ({
	children,
}: {
	children: React.ReactNode;
}) => {
	const totalCourses = await getCollectionSize("courses");
	const totalSections = await getCollectionSize("sections");

	return (
		<div className="flex flex-col gap-8">
			<AdminHeaderTitle title="Programs" />

			<div className="actions-container grid grid-cols-1 md:grid-cols-3 gap-6 bg-white rounded-lg shadow p-6">
				<div className="flex items-center justify-center gap-2 facilium-bg-indigo  md:text-lg py-4 rounded-md">
					<AddProgramModal />
				</div>

				<div className="bg-indigo-500 text-white rounded-md flex items-center py-6 px-4 shadow-md">
					<div className="mr-4 text-white">
						<LayoutTemplate />
					</div>

					<div className="flex flex-col items-start justify-center">
						<div className="text-sm uppercase tracking-wide">
							Total Sections
						</div>
						<div className="text-3xl font-bold mt-1">{totalSections}</div>
					</div>
				</div>

				<div className="bg-pink-500 text-white rounded-md flex items-center py-6 px-4 shadow-md">
					<div className="mr-4 text-white">
						<GraduationCap />
					</div>

					<div className="flex flex-col items-start justify-center">
						<div className="text-sm uppercase tracking-wide">Total Courses</div>
						<div className="text-3xl font-bold mt-1">
							{totalCourses ?? "--"}
						</div>
					</div>
				</div>
			</div>

			{children}
		</div>
	);
};

export default ProgramsComponent;
