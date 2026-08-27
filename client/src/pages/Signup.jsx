import { Link } from 'react-router-dom';
import Logo from '../components/Logo/Logo';
import AuthForm from '../components/Auth/AuthForm';

export default function Signup() {
  return (
    <div className="cad-auth-page">
      <Logo size={36} />
      <AuthForm mode="signup" />
      <p className="cad-auth-switch">
        Already have an account? <Link to="/login"><button type="button">Log in</button></Link>
      </p>
    </div>
  );
}
