"use client";
import { TableCell, TableRow } from "@/components/ui/table";
import { ClassroomType } from "@/types/classroomType";
import { useParams } from "next/navigation";
import React from "react";

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
						<TableCell>{classroom.id}</TableCell>
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
