import { Link } from 'react-router-dom';
import Logo from '../components/Logo/Logo';
import AuthForm from '../components/Auth/AuthForm';

export default function Login() {
  return (
    <div className="cad-auth-page">
      <Logo size={36} />
      <AuthForm mode="login" />
      <p className="cad-auth-switch">
        New to CADENZA? <Link to="/signup"><button type="button">Sign up</button></Link>
      </p>
    </div>
  );
}
