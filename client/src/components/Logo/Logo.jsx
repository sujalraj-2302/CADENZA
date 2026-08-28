import './logo.css';

export default function Logo({ size = 28 }) {
  return (
    <span className="cad-logo" style={{ fontSize: size }}>
      CAD<span className="cad-logo-e">E</span>NZA
    </span>
  );
}
