"use client";

import { Button } from "@/components/ui/button";
import { useParams, useRouter } from "next/navigation";
import React from "react";

const ActionButtons = ({ yearLevelId }: { yearLevelId: string }) => {
	const router = useRouter();
	const { programId } = useParams();

	const handleAddSection = () => {
		router.push(`/admin/programs/${programId}/section/${yearLevelId}`);
	};

	const handleAddCourses = () => {
		router.push(`/admin/programs/${programId}/term/${yearLevelId}`);
	};

	return (
		<div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
			<Button
				variant={"outline"}
				onClick={handleAddSection}
				className="w-full sm:w-auto rounded-lg cursor-pointer hover:bg-indigo-500 hover:text-white transition-all text-indigo-600 border-indigo-500 text-sm sm:text-base"
			>
				Add Section
			</Button>
			<Button
				className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 cursor-pointer rounded-lg text-sm sm:text-base"
				onClick={handleAddCourses}
			>
				Add Courses
			</Button>
		</div>
	);
};

export default ActionButtons;
