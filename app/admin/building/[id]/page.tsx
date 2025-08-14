import React from "react";
import ClassroomComponent from "../../(admin-components)/classroom-component";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { getDocumentsFromFirestore } from "@/data/actions";
import { ClassroomType } from "@/types/classroomType";
import ClassroomTable from "./classroom-table";

const Page = async () => {
	const classrooms = await getDocumentsFromFirestore<ClassroomType>(
		"classrooms"
	);
	return (
		<div>
			<ClassroomComponent>
				<Table>
					<TableHeader>
						<TableRow className="facilium-bg-indigo ">
							<TableHead className="text-white">Classroom Name</TableHead>
							<TableHead className="text-white">Scheduled Subjects</TableHead>
							<TableHead className="text-white">Status</TableHead>
							<TableHead className="text-white">Action</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody className="facilium-bg-whiter">
						{classrooms.length < 1 ? (
							<TableRow>
								<TableCell colSpan={4} className="text-center py-6">
									No data found
								</TableCell>
							</TableRow>
						) : (
							<ClassroomTable classrooms={classrooms} />
						)}
					</TableBody>
				</Table>
			</ClassroomComponent>
		</div>
	);
};

export default Page;
