import AdminSideBar from "@/components/admin-side-bar";

export default function AdminDashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <AdminSideBar>{children}</AdminSideBar>;
}
