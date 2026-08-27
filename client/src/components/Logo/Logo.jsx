import './logo.css';

/**
 * Static CADENZA wordmark for use in navbars/headers. Keeps the same
 * signature detail as the intro animation: the E sits slightly lower,
 * tilted, and in the accent red.
 */
export default function Logo({ size = 28 }) {
  return (
    <span className="cad-logo" style={{ fontSize: size }}>
      CAD<span className="cad-logo-e">E</span>NZA
    </span>
  );
}
