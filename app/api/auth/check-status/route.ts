import { NextRequest, NextResponse } from "next/server";
import { firestore } from "@/firebase/server";

export async function POST(req: NextRequest) {
	try {
		const body = await req.json().catch(() => ({}));
		const email = (body.email as string | undefined)?.trim();
		if (!email) {
			return NextResponse.json({ error: "Email required" }, { status: 400 });
		}

		if (!firestore) {
			return NextResponse.json(
				{ error: "Server not configured" },
				{ status: 500 }
			);
		}

		const snap = await firestore
			.collection("userData")
			.where("email", "==", email)
			.limit(1)
			.get();

		if (snap.empty) {
			return NextResponse.json({ status: "NotFound" as const });
		}

		const data = snap.docs[0].data() as { status?: string };
		const status = (data.status || "Enabled").trim();
		if (status.toLowerCase() === "disabled") {
			return NextResponse.json({ status: "Disabled" as const });
		}
		return NextResponse.json({ status: "Enabled" as const });
	} catch (e) {
		console.error("/api/auth/check-status error", e);
		return NextResponse.json({ error: "Internal error" }, { status: 500 });
	}
}
