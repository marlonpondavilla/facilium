import React from "react";

const PleaseWait = () => {
	return (
		<div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
			<div className="flex flex-col items-center gap-2">
				<div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
				<p className="text-white text-base">
					Please wait while we fetch data for you...
				</p>
			</div>
		</div>
	);
};

export default PleaseWait;
