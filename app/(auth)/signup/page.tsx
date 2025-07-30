import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RegisterForm } from "./register-form";

export default function Signup() {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-3xl font-bold text-center">Signup</CardTitle>
			</CardHeader>
			<CardContent>
				<RegisterForm />
			</CardContent>
		</Card>
	);
}
