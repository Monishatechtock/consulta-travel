import { Link } from 'react-router-dom';

export default function Brand({
  to = '/',
  light = false,
  subtitle = 'Travel Information',
}) {
  return (
    <Link to={to} className={`brand ${light ? 'brand-light' : ''}`}>
      <span className="brand-mark brand-mark-plane" aria-hidden>
        <img src="/logo.svg" alt="" width="44" height="44" />
      </span>
      <span className="brand-text">
        <strong>Consulta</strong>
        <span>{subtitle}</span>
      </span>
    </Link>
  );
}
