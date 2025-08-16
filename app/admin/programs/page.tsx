import AdminSideBar from "@/components/admin-side-bar";
import React from "react";
import CoursesComponent from "../(admin-components)/programs-component";

const Page = () => {
	return (
		<AdminSideBar>
			<CoursesComponent>
				<h1>test test</h1>
			</CoursesComponent>
		</AdminSideBar>
	);
};

export default Page;
