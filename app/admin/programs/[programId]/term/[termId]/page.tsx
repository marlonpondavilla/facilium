import AdminHeaderTitle from "@/components/admin-header-title";
import BackButton from "@/components/back-button";
import React from "react";
import AddTerm from "./add-term";
import { getDocumentsFromFirestore } from "@/data/actions";
import ActionTermBtn from "./actions-term";

type PageProps = { params: Promise<{ termId: string }> };

type Term = {
	id: string;
	yearLevelId: string;
	term: string;
};

const Page = async ({ params }: PageProps) => {
	const { termId } = await params;
	const termData = await getDocumentsFromFirestore<Term>(
		"academic-terms",
		true
	);

	return (
		<div className="flex flex-col gap-8">
			<div>
				<BackButton />
			</div>
			<AdminHeaderTitle title="Term" />

			<div className="flex flex-col justify-center facilium-bg-whiter gap-4">
				<div className="flex items-center justify-between py-6 px-8 border">
					<h1 className="text-2xl text-gray-500 font-semibold tracking-wide">
						Adding Term
					</h1>

					<AddTerm id={termId} />
				</div>
			</div>

			{termData
				.filter((t) => t.yearLevelId === termId)
				.map((term) => {
					return (
						<div
							key={term.id}
							className="flex flex-col justify-center facilium-bg-whiter gap-4"
						>
							<div className="flex items-center justify-between py-6 px-8 border">
								<h1 className="text-2xl facilium-color-indigo font-semibold tracking-wide">
									{term.term}
								</h1>

								<ActionTermBtn id={term.id} />
							</div>
						</div>
					);
				})}
		</div>
	);
};

export default Page;
