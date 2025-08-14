import React from "react";
import BuildingComponent from "../(admin-components)/building-component";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Notebook } from "lucide-react";
import { getBuilding } from "./actions";
import { Building } from "@/types/buildingType";
import { BuildingActionsDropdown } from "./building-actions-dropdown";
import ViewClassroomButton from "./view-classroom-btn";
import { getCollectionSize } from "@/data/actions";

const page = async () => {
	const buildings: Building[] = await getBuilding();
	const buildingsCount = await getCollectionSize("buildings");
	const classroomsCount = await getCollectionSize("classrooms");

	const data = {
		buildings: buildingsCount,
		classrooms: classroomsCount,
	};

	return (
		<BuildingComponent data={data}>
			<div className="card-component grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				{buildings.map((building) => (
					<Card key={building.id}>
						<CardHeader>
							<CardTitle className="flex items-center justify-between">
								<p>{building.buildingName}</p>
								<BuildingActionsDropdown building={building} />
							</CardTitle>
							<CardDescription>
								<div className="flex items-center gap-1 mt-1">
									<Notebook width={15} height={15} />
									<p>Classrooms: {building.classroom}</p>
								</div>
							</CardDescription>
						</CardHeader>
						<CardContent>
							<CardAction className="w-full text-center">
								<ViewClassroomButton id={building.id} />
							</CardAction>
						</CardContent>
					</Card>
				))}
			</div>
			{buildings.length < 1 && (
				<div className="empty-building-state flex justify-center items-center">
					<h1 className="text-base">No data available</h1>
				</div>
			)}
		</BuildingComponent>
	);
};

export default page;
