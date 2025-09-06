export type AcademicYear = {
	id: string;
	startAcademicYear: number;
	endAcademicYear: number;
	term: string;
	isActive?: boolean;
};

export type AdminComponentProps = {
	academicYears: AcademicYear[];
};
