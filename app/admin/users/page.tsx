import AdminSideBar from "@/components/admin-side-bar";
import UsersComponent from "../(admin-components)/users-component";
import {
	Table,
	TableBody,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { getUsersWithPage } from "@/data/users";
import UserActionButton from "@/components/user-action";
import NextButton from "@/components/next-button";
import { PageInterface } from "@/types/pageInterface";

const Page = async ({ searchParams }: PageInterface) => {
	const params = await searchParams;

	const currentPage = parseInt(params.page || "1", 10);
	const cursor = params.cursor;
	const search = params.search?.trim() || "";

	const previousCursors = params.previousCursors
		? JSON.parse(params.previousCursors)
		: [];

	const { data, totalUsers, totalPages, nextCursor } = await getUsersWithPage({
		pagination: {
			pageSize: 10,
			startAfterDocId: cursor,
			search,
		},
	});

	return (
		<AdminSideBar>
			<UsersComponent userCount={totalUsers} search={search}>
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
								<TableCell>
									{user.firstName && user.lastName
										? `${user.firstName} ${user.lastName}`
										: null}
								</TableCell>
								<TableCell>{user.designation ?? null}</TableCell>
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

					{data.length > 0 && (
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
					)}
				</Table>
				{data.length === 0 && (
					<>
						<h1 className="text-center my-4 text-base text-gray-500">
							No data to show
						</h1>
						<hr className="border-gray-500" />
					</>
				)}
			</UsersComponent>
		</AdminSideBar>
	);
};

export default Page;
