"use client";

import { useAuth } from "@/context/auth";
import React from "react";
import AdminForm from "./(auth)/admin-form";

const Admin = () => {
	const auth = useAuth();

	return (
		<div className="mt-0">
			{!!auth?.customClaims?.admin && (
				<h1 className="text-center text-white text-3xl">Admin Page</h1>
			)}
			<div className="">{!auth?.customClaims?.admin && <AdminForm />}</div>
		</div>
	);
};

export default Admin;
