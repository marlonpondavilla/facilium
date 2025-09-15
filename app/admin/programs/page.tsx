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
								<ViewProgramButton id={program.id} />
								<ProgramActionsDropdown program={program} />
							</CardFooter>
						</CardContent>
					</Card>
				))}
			</div>
		</ProgramsComponent>
	);
};

export default Page;
