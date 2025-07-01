"use client";

import { Input } from "@/components/ui/input";
import React from "react";

const AdminLogin = () => {
	return (
		<div className="flex flex-col justify-center items-center h-screen">
			<h1>Admin Login</h1>
			<Input type="email" placeholder="admin email" />
		</div>
	);
};

export default AdminLogin;
