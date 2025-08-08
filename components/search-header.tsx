"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";

type SearchHeaderProps = {
	search: string;
	placeholder: string;
	usersCount?: number;
};

const SearchHeader = ({
	search,
	placeholder,
	usersCount,
}: SearchHeaderProps) => {
	const router = useRouter();
	const searchParams = useSearchParams();

	const [query, setQuery] = useState(search ?? "");

	const DEBOUNCE_DELAY = 500;

	useEffect(() => {
		const timeout = setTimeout(() => {
			const params = new URLSearchParams(searchParams.toString());

			if ((query ?? "").trim()) {
				params.set("search", query.trim());
			} else {
				params.delete("search");
			}

			params.delete("page");
			params.delete("cursor");
			params.delete("previousCursors");

			router.push(`?${params.toString()}`);
		}, DEBOUNCE_DELAY);

		return () => clearTimeout(timeout);
	}, [query]);

	useEffect(() => {
		setQuery(search);
	}, [search]);

	return (
		<div className="search-wrapper">
			<div
				className={`facilium-bg-whiter tracking-wide p-8 ${
					usersCount ? "flex justify-between" : ""
				}`}
			>
				{!!usersCount && (
					<h2 className="text-2xl">Total Users: {usersCount}</h2>
				)}
				<div className="relative text-base">
					<input
						type="text"
						placeholder={placeholder}
						className="border border-gray-400 rounded w-[100%] py-2 px-8"
						value={query ?? ""}
						onChange={(e) => setQuery(e.target.value)}
					/>
					<Search size={20} className="absolute top-1 mt-[7px] ml-2" />
				</div>
			</div>
		</div>
	);
};

export default SearchHeader;
