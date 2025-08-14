import AdminSideBar from "@/components/admin-side-bar";

export default function BuildingLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return <AdminSideBar>{children}</AdminSideBar>;
}
