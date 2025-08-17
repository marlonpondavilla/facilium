import AdminSideBar from "@/components/admin-side-bar";
import React from "react";
import CoursesComponent from "../(admin-components)/programs-component";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getDocumentsFromFirestore } from "@/data/actions";
import CardActionsDropdown from "@/components/card-actions-dropdown";
import ProgramActionsDropdown from "./program-actions-dropdown";

type Program = {
	id: string;
	programCode: string;
	programName: string;
};

const Page = async () => {
	const programs: Program[] = await getDocumentsFromFirestore("programs");

	return (
		<AdminSideBar>
			<CoursesComponent>
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
					{programs.map((program) => (
						<Card key={program.id}>
							<CardHeader>
								<CardTitle className="text-center text-2xl tracking-wide">
									{program.programCode.toUpperCase()}
								</CardTitle>
								<CardDescription className="text-center tracking-wide">
									{program.programName}
								</CardDescription>
							</CardHeader>
							<CardContent>
								<CardFooter>
									<Button variant={"outline"} className="flex w-full">
										View Program
									</Button>
									<ProgramActionsDropdown program={program} />
								</CardFooter>
							</CardContent>
						</Card>
					))}
				</div>
			</CoursesComponent>
		</AdminSideBar>
	);
};

export default Page;
