import Link from "next/link";
import type { ReactNode } from "react";

interface PortalEmptyStateProps {
  icon?: ReactNode;
  kicker?: string;
  title: string;
  description: string;
  ctaText: string;
  ctaHref: string;
  secondaryText?: string;
  secondaryHref?: string;
}

export function PortalEmptyState({
  icon = "🏠",
  kicker,
  title,
  description,
  ctaText,
  ctaHref,
  secondaryText,
  secondaryHref,
}: PortalEmptyStateProps) {
  return (
    <div className="portal-empty-card">
      <div className="portal-empty-icon" aria-hidden="true">
        {icon}
      </div>
      {kicker && <span className="section-kicker" style={{ marginBottom: "8px" }}>{kicker}</span>}
      <h2>{title}</h2>
      <p>{description}</p>
      <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", justifyContent: "center", alignItems: "center" }}>
        <Link className="primary-button button-link" href={ctaHref}>
          {ctaText}
        </Link>
        {secondaryText && secondaryHref && (
          <Link className="secondary-button button-link" href={secondaryHref}>
            {secondaryText}
          </Link>
        )}
      </div>
    </div>
  );
}
