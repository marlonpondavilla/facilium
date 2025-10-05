import React from "react";
export const dynamic = "force-dynamic";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { getDocumentsFromFirestore } from "@/data/actions";
import ProgramActionsDropdown from "./program-actions-dropdown";
import ViewProgramButton from "./view-program-btn";
import ProgramsComponent from "../(admin-components)/programs-component";

type Program = {
	id: string;
	programCode: string;
	programName: string;
};

const Page = async () => {
	const programs: Program[] = await getDocumentsFromFirestore("programs", true);

	return (
		<ProgramsComponent>
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
				{programs.map((program) => (
					<Card
						key={program.id}
						className="hover:shadow-lg transition-shadow duration-200 h-full flex flex-col"
					>
						<CardHeader className="flex-1 text-center space-y-3 pb-4">
							<CardTitle className="text-xl sm:text-2xl tracking-wide font-bold facilium-color-indigo break-words">
								{program.programCode.toUpperCase()}
							</CardTitle>
							<CardDescription className="text-sm sm:text-base tracking-wide text-gray-600 leading-relaxed break-words px-2">
								{program.programName}
							</CardDescription>
						</CardHeader>
						<CardContent className="pt-0">
							<CardFooter className="flex flex-col sm:flex-row gap-2 p-0">
								<div className="flex flex-col sm:flex-row gap-2 w-full">
									<div className="flex-1">
										<ViewProgramButton id={program.id} />
									</div>
									<div className="flex-shrink-0">
										<ProgramActionsDropdown program={program} />
									</div>
								</div>
							</CardFooter>
						</CardContent>
					</Card>
				))}
			</div>
		</ProgramsComponent>
	);
};

export default Page;
