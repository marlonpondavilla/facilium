import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
	try {
		const { token } = await req.json();
		if (!token) {
			return NextResponse.json(
				{ success: false, error: "Missing token" },
				{ status: 400 }
			);
		}

		const secret = process.env.RECAPTCHA_SECRET_KEY;
		if (!secret) {
			return NextResponse.json(
				{ success: false, error: "Server not configured" },
				{ status: 500 }
			);
		}

		const params = new URLSearchParams();
		params.append("secret", secret);
		params.append("response", token);

		const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: params.toString(),
			cache: "no-store",
		});

		const data = (await res.json()) as {
			success: boolean;
			score?: number;
			action?: string;
			[k: string]: unknown;
		};

		if (!data.success) {
			return NextResponse.json({ success: false }, { status: 400 });
		}

		return NextResponse.json({ success: true });
	} catch {
		return NextResponse.json({ success: false }, { status: 500 });
	}
}
