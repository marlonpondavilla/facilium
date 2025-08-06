import AdminSideBar from "@/components/admin-side-bar";
import React from "react";
import { getUserData } from "@/data/users";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Building2, Mail, SquarePen } from "lucide-react";
import DesignationComponent from "../(admin-components)/designation-component";

const page = async () => {
	// try to get getUserWithPage to have pagination
	const data = await getUserData();

	return (
		<AdminSideBar>
			<DesignationComponent>
				<div className="card-component grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					{data.map((user) => (
						<Card className="w-full h-full" key={user.id}>
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
											{user.designation}
											<SquarePen
												size={20}
												className="cursor-pointer facilium-color-indigo"
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
			</DesignationComponent>
		</AdminSideBar>
	);
};

export default page;
