"use client";

import AdminHeaderTitle from "@/components/admin-header-title";
import React from "react";

const CoursesComponent = ({ children }: { children: React.ReactNode }) => {
	return (
		<div className="flex flex-col gap-8">
			<AdminHeaderTitle title="Courses" />

			<div>testing</div>

			{children}
		</div>
	);
};

export default CoursesComponent;
