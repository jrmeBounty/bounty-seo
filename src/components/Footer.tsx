/**
 * Footer used by the /about page and demo routes.
 * The main SEO app layout does not render a footer.
 */
export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="border-t px-4 py-6 text-xs"
      style={{
        backgroundColor: "var(--bounty-sidebar-bg)",
        borderColor: "var(--bounty-sidebar-border)",
        color: "#4B5563",
      }}
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 sm:flex-row">
        <p className="m-0">
          &copy; {year}{" "}
          <span className="text-white font-semibold">Bounty Supermarket</span> —
          Great Savings Everyday. All rights reserved.
        </p>
        <p
          className="m-0 text-[10px] font-semibold tracking-widest uppercase"
          style={{ color: "var(--bounty-gold)" }}
        >
          SEO Ranking Tracker
        </p>
      </div>
    </footer>
  );
}
