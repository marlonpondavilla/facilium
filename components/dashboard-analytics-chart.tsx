"use client";

import React from "react";
import { Bar } from "react-chartjs-2";
import "chart.js/auto"; // auto-registrations for chart.js
import type { ChartData, ChartOptions, TooltipItem } from "chart.js";
import { AdminAnalytics } from "@/types/academicYearType";

export type DashboardAnalyticsChartProps = {
	analytics: AdminAnalytics;
};

const DashboardAnalyticsChart: React.FC<DashboardAnalyticsChartProps> = ({
	analytics,
}) => {
	const labels = [
		"Users",
		"Approved Schedules",
		"Buildings",
		"Classrooms",
		"Courses",
		"Sections",
	];

	const data: ChartData<"bar"> = {
		labels,
		datasets: [
			{
				label: "Count",
				data: [
					analytics.users,
					analytics.schedules.approved,
					analytics.facilities,
					analytics.classrooms,
					analytics.courses,
					analytics.sections,
				],
				backgroundColor: [
					"#3b82f6", // blue-500
					"#22c55e", // green-500
					"#f97316", // orange-500
					"#8b5cf6", // violet-500
					"#06b6d4", // cyan-500
					"#ef4444", // red-500
				],
				borderRadius: 6,
				borderSkipped: false as const,
			},
		],
	};

	const options: ChartOptions<"bar"> = {
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			legend: {
				display: false,
			},
			tooltip: {
				callbacks: {
					label: (ctx: TooltipItem<"bar">) => ` ${ctx.formattedValue}`,
				},
			},
			title: {
				display: false,
			},
		},
		scales: {
			x: {
				grid: { display: false },
				ticks: {
					color: "#6b7280", // gray-500
					font: { size: 12 },
				},
			},
			y: {
				beginAtZero: true,
				grid: { color: "#e5e7eb" },
				ticks: {
					stepSize: 1,
					precision: 0,
					color: "#6b7280",
				},
			},
		},
	};

	return (
		<div className="w-full h-80">
			<Bar data={data} options={options} />
		</div>
	);
};

export default DashboardAnalyticsChart;
