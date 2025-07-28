import AdminSideBar from "@/components/admin-side-bar";
import React from "react";
import UsersComponent from "../dashboard/(admin-components)/users-component";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { getUsers } from "@/data/users";
import UserActionButton from "@/components/user-action";

const page = async () => {
	const { data } = await getUsers();

	return (
		<AdminSideBar>
			<UsersComponent>
				<Table className="mt-4">
					<TableHeader className="facilium-bg-indigo">
						<TableRow>
							<TableHead className="facilium-color-white">Email</TableHead>
							<TableHead className="facilium-color-white">
								Faculty Name
							</TableHead>
							<TableHead className="facilium-color-white">Role</TableHead>
							<TableHead className="facilium-color-white">Status</TableHead>
							<TableHead className="facilium-color-white">Action</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{data.map((user) => (
							<TableRow key={user.id} className="facilium-bg-whiter">
								<TableCell>{user.email ?? null}</TableCell>
								<TableCell>{user.fullName}</TableCell>
								<TableCell>{user.role ?? null}</TableCell>
								<TableCell>{user.status ?? null}</TableCell>
								<TableCell>
									{/* pass muna ung doc id to see if each row has its own specific id */}
									<UserActionButton data={user.id} />
								</TableCell>
							</TableRow>
						))}
						{data.map((user) => (
							<TableRow key={user.id} className="facilium-bg-whiter">
								<TableCell>{user.email ?? null}</TableCell>
								<TableCell>{user.fullName}</TableCell>
								<TableCell>{user.role ?? null}</TableCell>
								<TableCell>{user.status ?? null}</TableCell>
								<TableCell>
									<UserActionButton data={user.id} />
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</UsersComponent>
		</AdminSideBar>
	);
};

export default page;
