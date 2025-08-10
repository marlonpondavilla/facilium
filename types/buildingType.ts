export type BuildingCreate = {
	buildingName: string;
	classroom: number;
};

export type Building = {
	id: string;
	buildingName: string;
	classroom: number;
	created?: Date;
};
