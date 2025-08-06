"use client";

import { currentDate } from "@/lib/date";
import { CalendarFold } from "lucide-react";
import Image from "next/image";

type Props = {
	title: string;
};

const AdminHeaderTitle = ({ title }: Props) => {
	return (
		<div>
			<div className="header-container flex justify-between items-center">
				<div className="flex items-center gap-2">
					<Image
						src={"/icons/window-icon.png"}
						height={50}
						width={50}
						alt="window icon"
						className="w-auto h-auto"
					/>
					<h1 className="text-2xl font-semibold">{title}</h1>
				</div>

				<div className="date flex gap-2 items-center">
					<CalendarFold />
					<p>{currentDate}</p>
				</div>
			</div>
		</div>
	);
};

export default AdminHeaderTitle;
