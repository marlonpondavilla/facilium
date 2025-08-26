import { getDocumentsByFieldIds } from "@/data/actions";
import React from "react";

type PageProps = {
	params: {
		id: string;
	};
};

type Classroom = {
	id: string;
	classroomName: string;
};

const Page = async ({ params }: PageProps) => {
	const { id } = await Promise.resolve(params);
	const classrooms = await getDocumentsByFieldIds<Classroom>(
		"classrooms",
		"buildingId",
		id
	);

	return (
		<div>
			{classrooms.map((classroom) => {
				return <h1 key={classroom.id}>{classroom.classroomName}</h1>;
			})}
		</div>
	);
};

export default Page;
