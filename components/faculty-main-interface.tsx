"use client";

import { currentDate } from "@/lib/date";
import { Building, Calendar, Download } from "lucide-react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import React from "react";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "./ui/select";
import { Button } from "./ui/button";

type FacultyMainInterfaceProps = {
	data: {
		id: string;
		buildingName: string;
		color?: string;
	}[];
};

const FacultyMainInterface = ({ data }: FacultyMainInterfaceProps) => {
	const router = useRouter();
	const pathname = usePathname();

	const handleClickBuilding = (id: string) => {
		router.push(`${pathname}/${id}`);
	};

	return (
		<div className="border flex flex-col justify-center gap-4 w-5xl">
			<div className="relative border w-full h-[200px] bg-[url('/bsu-meneses-logo.png')] bg-cover bg-center rounded-2xl overflow-hidden">
				{/* Dark pink gradient from bottom to top */}
				<div className="absolute inset-0 bg-gradient-to-t from-pink-800/80 via-pink-800/60 to-pink-600/70 z-10" />

				{/* Content */}
				<div className="relative z-20 flex justify-center items-center h-full">
					<Image
						src="/facilium-logo.png"
						width={60}
						height={60}
						alt="Facilium logo"
						className="w-24"
					/>
					<p className="text-white text-4xl font-bold tracking-wide">
						Facilium
					</p>
				</div>
			</div>

			<div className="buildings-control facilium-bg-whiter flex flex-col gap-4 p-4 rounded-2xl">
				<div className="flex justify-between items-center border-b border-gray-300 pb-4">
					<div className="buildings-control-title flex items-center gap-2">
						<Building />
						<h1 className="font-semibold tracking-wide">
							Meneses Campus Buildings
						</h1>
					</div>
					<div className="buildings-control-title flex items-center gap-2 border p-2 text-sm bg-gray-200 rounded-2xl">
						<Calendar />
						{currentDate}
					</div>
				</div>

				<div className="buildings-item-wrapper flex justify-center gap-4 facilium-color-white flex-wrap py-4">
					{data.map((building) => (
						<div
							key={building.id}
							onClick={() => handleClickBuilding(building.id)}
							className={`buildings-item ${building.color} p-10 rounded w-2xs text-center text-2xl cursor-pointer`}
						>
							<p className="">{building.buildingName}</p>
						</div>
					))}
				</div>
			</div>

			<div className="buidling-actions facilium-bg-whiter flex justify-center items-center gap-8 rounded-2xl p-4">
				<div className="view-schedule group border border-gray-300 rounded-xl p-6 w-full bg-white hover:bg-gray-100 hover:shadow-md transition duration-300 cursor-pointer">
					<div className="view-schedule-action flex flex-col justify-center items-center gap-3">
						<Download className="w-10 h-10 transition-colors duration-300" />
						<p className="font-semibold text-xl text-gray-800 group-hover:text-indigo-800">
							View My Schedule
						</p>
					</div>
				</div>

				<div className="download-schedule flex flex-col gap-2 w-full">
					<h2 className="font-semibold text-gray-500 text-center tracking-wide">
						Download schedule for specific class.
					</h2>
					<Select>
						<SelectTrigger className="w-full border border-black">
							<SelectValue placeholder="Select class" />
						</SelectTrigger>
						<SelectContent>
							<SelectGroup>
								<SelectLabel>Class</SelectLabel>
								<SelectItem value={"complab1"}>Complab1</SelectItem>
							</SelectGroup>
						</SelectContent>
					</Select>
					<Button className="facilium-bg-indigo">
						Download Schedule for This Class
					</Button>
				</div>
			</div>
		</div>
	);
};

export default FacultyMainInterface;
