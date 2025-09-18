"use client";

import { currentDate } from "@/lib/date";
import { CalendarFold } from "lucide-react";
import Image from "next/image";

type Props = {
	title: string;
};

const AdminHeaderTitle = ({ title }: Props) => {
	return (
		<div className="mb-6">
			<div className="header-container flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-2">
				<div className="flex items-center gap-3">
					<Image
						src={"/icons/window-icon.png"}
						height={40}
						width={40}
						alt="window icon"
						className="w-6 h-6 sm:w-6 sm:h-6 flex-shrink-0"
					/>
					<h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-gray-800 leading-tight">
						{title}
					</h1>
				</div>

				<div className="date flex gap-2 items-center text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
					<CalendarFold className="w-4 h-4 sm:w-5 sm:h-5" />
					<p className="text-sm sm:text-base font-medium">{currentDate}</p>
				</div>
			</div>
		</div>
	);
};

export default AdminHeaderTitle;
