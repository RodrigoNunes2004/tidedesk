import Link from "next/link";

const productLinks = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
];

const companyLinks = [
  { href: "/", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/support", label: "Support" },
];

const legalLinks = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/cookie-policy", label: "Cookie Policy" },
  { href: "/refund-policy", label: "Refund Policy" },
  { href: "/acceptable-use", label: "Acceptable Use Policy" },
];

export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-primary/20 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="font-semibold">Product</h3>
            <ul className="mt-3 space-y-2">
              {productLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-primary-foreground/85 hover:text-primary-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/login"
                  className="text-sm text-primary-foreground/85 hover:text-primary-foreground"
                >
                  Sign in
                </Link>
              </li>
              <li>
                <Link
                  href="/register"
                  className="text-sm text-primary-foreground/85 hover:text-primary-foreground"
                >
                  Start Free Trial
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold">Company</h3>
            <ul className="mt-3 space-y-2">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-primary-foreground/85 hover:text-primary-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold">Legal</h3>
            <ul className="mt-3 space-y-2">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-primary-foreground/85 hover:text-primary-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-primary-foreground/20 pt-8 text-center text-sm text-primary-foreground/85">
          © {currentYear} TideDesk
        </div>
      </div>
    </footer>
  );
}
