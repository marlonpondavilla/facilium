import AdminSideBar from "@/components/admin-side-bar";

export default function ProgramsLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return <AdminSideBar>{children}</AdminSideBar>;
}
