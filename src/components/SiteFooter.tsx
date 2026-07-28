import { Link } from "@tanstack/react-router";

/**
 * Static, server-rendered link hub.
 *
 * The Today screen only renders its cross-links after the panchang is computed
 * client-side, so crawlers never saw them and pages like /tithi-today and
 * /muhurat/choghadiya were orphaned. This footer is plain markup with no data
 * dependency, so every indexable route stays reachable in the initial HTML.
 */
export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-10 border-t border-border/60 px-5 pb-8 pt-6">
      <nav aria-label="Site" className="grid grid-cols-2 gap-x-4 gap-y-6 text-sm sm:grid-cols-3">
        <div>
          <h2 className="label-caps text-muted-foreground">Panchang</h2>
          <ul className="mt-2 space-y-1.5">
            <li>
              <Link to="/" search={{ d: undefined }} className="hover:text-primary">
                Today's panchang
              </Link>
            </li>
            <li>
              <Link to="/tithi-today" className="hover:text-primary">
                Tithi today
              </Link>
            </li>
            <li>
              <Link to="/muhurat/choghadiya" className="hover:text-primary">
                Choghadiya muhurat
              </Link>
            </li>
            <li>
              <Link to="/calendar" className="hover:text-primary">
                Monthly calendar
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="label-caps text-muted-foreground">Festivals</h2>
          <ul className="mt-2 space-y-1.5">
            <li>
              <Link to="/festivals/$year" params={{ year: "2025" }} className="hover:text-primary">
                Festivals 2025
              </Link>
            </li>
            <li>
              <Link to="/festivals/$year" params={{ year: "2026" }} className="hover:text-primary">
                Festivals 2026
              </Link>
            </li>
            <li>
              <Link to="/reminders" className="hover:text-primary">
                Reminders
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="label-caps text-muted-foreground">App</h2>
          <ul className="mt-2 space-y-1.5">
            <li>
              <Link to="/settings" className="hover:text-primary">
                Settings
              </Link>
            </li>
            <li>
              <Link to="/feedback" className="hover:text-primary">
                Feedback
              </Link>
            </li>
            <li>
              <Link to="/privacy" className="hover:text-primary">
                Privacy
              </Link>
            </li>
            <li>
              <Link to="/terms" className="hover:text-primary">
                Terms
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
        © {year} Panchāṅga · Drik ganita with the Lahiri ayanamsa, computed at your local sunrise.
      </p>
    </footer>
  );
}