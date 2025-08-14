"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import React from "react";

interface ViewClassroomButtonProps {
	id: string;
}

const ViewClassroomButton = ({ id }: ViewClassroomButtonProps) => {
	const router = useRouter();

	const handleViewClassroomClick = async () => {
		router.push(`/admin/building/${id}`);
	};

	return (
		<Button
			variant={"default"}
			onClick={handleViewClassroomClick}
			className="text-center w-full facilium-bg-indigo text-white transition py-[1.5rem]"
		>
			View Classrooms
		</Button>
	);
};

export default ViewClassroomButton;
