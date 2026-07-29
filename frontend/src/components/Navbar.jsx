import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import PulseMark from './PulseMark.jsx';

const ROLE_LABEL = {
  patient: 'Patient',
  doctor: 'Doctor',
  receptionist: 'Front Desk',
};

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-20 bg-sage-50/90 backdrop-blur border-b border-pine-900/10">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <PulseMark className="w-9 h-9" />
          <span className="font-display font-semibold text-lg tracking-tight text-pine-900">
            MediBook
          </span>
        </Link>

        {isAuthenticated ? (
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-pine-900 leading-tight">{user.name}</p>
              <p className="text-xs text-pine-700 leading-tight">{ROLE_LABEL[user.role]}</p>
            </div>
            <button onClick={handleLogout} className="btn-secondary !py-2 !px-4 text-sm">
              Log out
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-semibold text-pine-900 hover:text-teal-600">
              Log in
            </Link>
            <Link to="/register" className="btn-primary !py-2 !px-4 text-sm">
              Sign up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
