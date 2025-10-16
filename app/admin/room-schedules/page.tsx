import AdminSideBar from "@/components/admin-side-bar";
import RoomSchedulesExport from "./room-schedules-export";

export const dynamic = "force-dynamic";

export default function AdminRoomSchedulesPage() {
  return (
    <AdminSideBar>
      <RoomSchedulesExport />
    </AdminSideBar>
  );
}
