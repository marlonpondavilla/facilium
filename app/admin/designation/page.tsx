import AdminSideBar from "@/components/admin-side-bar";
import React from "react";
import { getUsersWithPage } from "@/data/users";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Building2, Mail } from "lucide-react";
import DesignationComponent from "../(admin-components)/designation-component";
import UserClaimModal from "@/components/user-claim-modal";
import { PageInterface } from "@/types/pageInterface";
import NextButton from "@/components/next-button";
import { Badge } from "@/components/ui/badge";

const Page = async ({ searchParams }: PageInterface) => {
	const params = await searchParams;

	const currentPage = parseInt(params.page || "1", 10);
	const cursor = params.cursor;
	const search = params.search?.trim() || "";

	const previousCursors = params.previousCursors
		? JSON.parse(params.previousCursors)
		: [];

	const { data, totalPages, nextCursor } = await getUsersWithPage({
		pagination: {
			pageSize: 9,
			startAfterDocId: cursor,
			search,
		},
	});

	return (
		<AdminSideBar>
			<DesignationComponent search={search}>
				<div className="card-component grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					{data.map((user) => (
						<Card
							className={`w-full h-full relative ${
								user.status === "Disabled"
									? "opacity-50 border border-red-500"
									: ""
							}`}
							key={user.id}
						>
							<CardHeader className="flex justify-start items-center gap-4">
								<div>
									<Avatar className="h-16 w-16">
										<AvatarImage
											src={"https://github.com/shadcn.pngg"}
											alt="faculty user avatar"
										/>
										<AvatarFallback className="border facilium-bg-profile text-white">
											{(user.firstName?.[0] ?? "") + (user.lastName?.[0] ?? "")}
										</AvatarFallback>
									</Avatar>
								</div>
								<div>
									<CardTitle>
										<p>{`${user.firstName} ${user.lastName}`}</p>
									</CardTitle>
									<CardDescription>
										<p>{user.degreeEarned}</p>
										<div className="flex items-center gap-2">
											{user.status === "Disabled" ? (
												<Badge variant={"destructive"}>Disabled</Badge>
											) : (
												<Badge
													className={`${
														user.designation === "Faculty"
															? "bg-green-400"
															: user.designation === "Dean"
															? "bg-pink-400"
															: "bg-blue-400"
													} text-black py-[2px] px-[8px] rounded-2xl text-xs mt-1`}
												>
													{user.designation}
												</Badge>
											)}

											<UserClaimModal
												data={{
													id: user.id,
													designation: user.designation,
													status: user.status,
												}}
											/>
										</div>
									</CardDescription>
								</div>
							</CardHeader>
							<CardContent className="text-sm flex flex-col gap-2">
								<div className="flex items-center gap-2">
									<Mail size={20} color="gray" />
									<p>{user.email}</p>
								</div>
								<div className="flex items-center gap-2">
									<Building2 size={20} color="gray" />
									<p>{user.department}</p>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
				{data.length > 0 && (
					<div>
						<NextButton
							currentPage={currentPage}
							totalPages={totalPages}
							nextCursor={nextCursor}
							previousCursors={previousCursors}
						/>
					</div>
				)}
				{data.length === 0 && (
					<>
						<h1 className="text-center my-4 text-base text-gray-500">
							No data to show
						</h1>
						<hr className="border-gray-500" />
					</>
				)}
			</DesignationComponent>
		</AdminSideBar>
	);
};

export default Page;
