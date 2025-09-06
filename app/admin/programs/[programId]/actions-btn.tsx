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
		<div className="flex gap-2">
			<Button
				variant={"outline"}
				onClick={handleAddSection}
				className="rounded-full cursor-pointer hover:bg-indigo-500 hover:text-white transition-all facilium-color-indigo border-indigo-500"
			>
				Add Section
			</Button>
			<Button
				className="facilium-bg-indigo cursor-pointer rounded-2xl"
				onClick={handleAddCourses}
			>
				Add Courses
			</Button>
		</div>
	);
};

export default ActionButtons;
