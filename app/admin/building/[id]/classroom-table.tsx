"use client";

import { TableCell, TableRow } from "@/components/ui/table";
import { ClassroomType } from "@/types/classroomType";
import { useParams } from "next/navigation";
import React from "react";
import DeleteDocumentWithConfirmation from "@/components/delete-document";
import EnableDisableAction from "@/components/enable-disable-action";

type ClassroomTableProps = {
	classrooms: ClassroomType[];
};

const ClassroomTable = ({ classrooms }: ClassroomTableProps) => {
	const { id } = useParams();
	return (
		<>
			{classrooms
				.filter((classroom) => classroom.buildingId === id)
				.map((classroom) => (
					<TableRow key={classroom.id}>
						<TableCell>{classroom.classroomName}</TableCell>
						<TableCell>{classroom.scheduledSubjects ?? 0}</TableCell>
						<TableCell
							className={`${
								classroom.status === "Enabled"
									? "text-green-500"
									: "text-red-500"
							}`}
						>
							{classroom.status}
						</TableCell>
						<TableCell className="flex gap-2 items-center">
							{/* disable the classroom */}
							<EnableDisableAction
								data={{
									id: classroom.id,
									status: classroom.status,
									collectionName: "classrooms",
									label: "classroom",
								}}
							/>
							{/* the relatedfields will subtract 1 to the field (classroom) in building with the id inn the useParams */}
							<DeleteDocumentWithConfirmation
								data={{
									id: classroom.id,
									collectionName: "classrooms",
									label: "classroom",
									relatedFields: {
										id: String(id),
										collectionName: "buildings",
										fieldName: "classroom",
										amount: -1,
									},
								}}
							/>
						</TableCell>
					</TableRow>
				))}

			{classrooms.filter((classroom) => classroom.buildingId === id).length ===
				0 && (
				<TableRow>
					<TableCell colSpan={4} className="text-center text-gray-500 py-4">
						No classrooms found for this building
					</TableCell>
				</TableRow>
			)}
		</>
	);
};

export default ClassroomTable;
