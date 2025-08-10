"use client";

import AdminHeaderTitle from "@/components/admin-header-title";
import { Building, NotebookPen } from "lucide-react";
import React from "react";
import NewBuildingModal from "../building/new-building-modal";

const BuildingComponent = ({ children }: { children: React.ReactNode }) => {
	return (
		<div className="flex flex-col gap-10">
			<AdminHeaderTitle title="Building" />

			<div className="actions-container grid grid-cols-1 md:grid-cols-3 gap-6 bg-white rounded-lg shadow p-6">
				<div className="flex items-center justify-center gap-2 bg-blue-600  md:text-lg py-4 rounded-md ">
					<NewBuildingModal />
				</div>

				<div className="bg-green-500 text-white rounded-md flex items-center py-6 px-4 shadow-md">
					<div className="mr-4 text-white">
						<Building className="w-10 h-10" />
					</div>

					<div className="flex flex-col items-start justify-center">
						<div className="text-sm uppercase tracking-wide">
							Total Buildings
						</div>
						<div className="text-3xl font-bold mt-1">12</div>
					</div>
				</div>

				<div className="bg-yellow-500 text-white rounded-md flex items-center py-6 px-4 shadow-md">
					<div className="mr-4 text-white">
						<NotebookPen className="w-10 h-10" />
					</div>

					<div className="flex flex-col items-start justify-center">
						<div className="text-sm uppercase tracking-wide">
							Total Classrooms
						</div>
						<div className="text-3xl font-bold mt-1">48</div>
					</div>
				</div>
			</div>

			<div className="grid ">{children}</div>
		</div>
	);
};

export default BuildingComponent;
