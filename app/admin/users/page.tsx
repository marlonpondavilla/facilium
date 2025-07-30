import AdminSideBar from "@/components/admin-side-bar";
import React from "react";
import UsersComponent from "../dashboard/(admin-components)/users-component";
import {
	Table,
	TableBody,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { getUsers } from "@/data/users";
import UserActionButton from "@/components/user-action";
import NextButton from "@/components/next-button";

type PageProps = {
	// the fcking line of code that breaks my builddddd!
	searchParams: Promise<Record<string, string | undefined>>;
};

const Page = async ({ searchParams }: PageProps) => {
	const params = await searchParams;

	const currentPage = parseInt(params.page || "1", 10);
	const cursor = params.cursor;

	const previousCursors = params.previousCursors
		? JSON.parse(params.previousCursors)
		: [];

	const { data, totalUsers, totalPages, nextCursor } = await getUsers({
		pagination: {
			pageSize: 10,
			startAfterDocId: cursor,
		},
	});

	return (
		<AdminSideBar>
			<UsersComponent userCount={totalUsers}>
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
								<TableCell
									className={`${
										user.status === "Enabled"
											? "text-green-500"
											: "text-red-500"
									} font-semibold`}
								>
									{user.status ?? null}
								</TableCell>
								<TableCell>
									<UserActionButton
										data={{ id: user.id, status: user.status }}
									/>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
					<TableFooter>
						<TableRow>
							<TableCell colSpan={5} className="text-center">
								<NextButton
									currentPage={currentPage}
									totalPages={totalPages}
									nextCursor={nextCursor}
									previousCursors={previousCursors}
								/>
							</TableCell>
						</TableRow>
					</TableFooter>
				</Table>
			</UsersComponent>
		</AdminSideBar>
	);
};

export default Page;
