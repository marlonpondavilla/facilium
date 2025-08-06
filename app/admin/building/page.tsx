import AdminSideBar from "@/components/admin-side-bar";
import React from "react";
import BuildingComponent from "../(admin-components)/building-component";

const page = () => {
	return (
		<AdminSideBar>
			<BuildingComponent />
		</AdminSideBar>
	);
};

export default page;
