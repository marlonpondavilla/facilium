export type AcademicYear = {
	id: string;
	startAcademicYear: number;
	endAcademicYear: number;
	term: string;
	isActive?: boolean;
};

export type AdminAnalytics = {
	users: number;
	schedules: {
		total: number;
		planned: number;
		pending: number;
		approved: number;
	};
	facilities: number;
	classrooms: number;
	courses: number;
	sections: number;
};

export type AdminComponentProps = {
	academicYears: AcademicYear[];
	analytics?: AdminAnalytics;
};
