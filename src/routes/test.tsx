import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/test")({
	component: TestPage,
});

function TestPage() {
	return (
		<div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
			<h1>Test Page</h1>
			<p>If you can see this, routing works!</p>
			<p>
				<a href="/login/viewer">Go to /login/viewer</a>
			</p>
		</div>
	);
}
