"use client";

import { Button } from "./ui/button";
import Link from "next/link";

type NextButtons = {
	currentPage: number;
	totalPages: number;
	nextCursor: string | null;
	previousCursors: string[];
};

const NextButton = ({
	currentPage,
	totalPages,
	nextCursor,
	previousCursors,
}: NextButtons) => {
	const prevCursor =
		previousCursors.length > 1
			? previousCursors[previousCursors.length - 2]
			: null;

	return (
		<div className="flex justify-center items-center gap-2">
			<Button asChild size={"sm"} variant={"outline"}>
				<Link
					href={{
						pathname: "",
						query: {
							page: currentPage - 1,
							cursor: prevCursor || undefined,
							previousCursors: JSON.stringify(previousCursors.slice(0, -1)),
						},
					}}
					className={`btn ${
						currentPage <= 1 ? "opacity-50 pointer-events-none" : ""
					}`}
				>
					Previous
				</Link>
			</Button>
			<p className="text-gray-600">
				page: {currentPage} / {totalPages}
			</p>
			<Button asChild size={"sm"} variant={"outline"}>
				<Link
					href={{
						pathname: "",
						query: {
							page: currentPage + 1,
							cursor: nextCursor || undefined,
							previousCursors: JSON.stringify([...previousCursors, nextCursor]),
						},
					}}
					className={`btn ${
						currentPage >= totalPages || !nextCursor
							? "opacity-50 pointer-events-none"
							: ""
					}`}
				>
					Next
				</Link>
			</Button>
		</div>
	);
};

export default NextButton;
