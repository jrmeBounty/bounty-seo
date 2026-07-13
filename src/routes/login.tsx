import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/login")({
	component: LoginLayout,
	beforeLoad: ({ location }) => {
		// ONLY redirect if the user lands exactly on "/login" or "/login/"
		if (location.pathname === "/login" || location.pathname === "/login/") {
			throw redirect({
				to: "/login/viewer",
			});
		}
	},
});

/**
 * Parent layout for login routes
 * Redirects /login to /login/viewer
 * Renders child routes via <Outlet/>
 */
function LoginLayout() {
	return <Outlet />;
}
