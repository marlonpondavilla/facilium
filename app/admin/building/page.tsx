import AdminSideBar from "@/components/admin-side-bar";
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
import { EllipsisVertical, Notebook } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getBuilding } from "./actions";
import { Building } from "@/types/buildingType";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuPortal,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { BuildingActionsDropdown } from "./building-actions-dropdown";

const page = async () => {
	const buildings: Building[] = await getBuilding();

	return (
		<AdminSideBar>
			<BuildingComponent>
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
									<Button
										variant={"default"}
										className="text-center w-full facilium-bg-indigo text-white transition py-[1.5rem]"
									>
										View Classrooms
									</Button>
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
		</AdminSideBar>
	);
};

export default page;
