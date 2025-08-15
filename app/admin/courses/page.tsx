import AdminSideBar from "@/components/admin-side-bar";
import React from "react";
import CoursesComponent from "../(admin-components)/courses-component";

const Page = () => {
	return (
		<AdminSideBar>
			<CoursesComponent>
				<h1>test</h1>
			</CoursesComponent>
		</AdminSideBar>
	);
};

export default Page;
