"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import React from "react";

const ViewProgramButton = ({ id }: ViewIdButton) => {
	const router = useRouter();

	const handleClick = () => {
		router.push(`/admin/programs/${id}`);
	};

	return (
		<Button variant={"outline"} onClick={handleClick} className="flex w-full">
			View Program
		</Button>
	);
};

export default ViewProgramButton;
