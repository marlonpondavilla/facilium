"use client";

import { useAuth } from "@/context/auth";
import React from "react";

const Admin = () => {
	const auth = useAuth();

	return (
		<div>
			{!!auth?.customClaims?.admin && (
				<h1 className="text-center text-white text-3xl">Admin Page</h1>
			)}
			;
			{!auth?.customClaims?.admin && (
				<h1 className="text-center text-white text-3xl">Login</h1>
			)}
			;
		</div>
	);
};

export default Admin;
