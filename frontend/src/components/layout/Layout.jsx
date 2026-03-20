import { useTranslation } from 'react-i18next';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Layout = ({ children }) => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    document.dir = lang === 'ar' ? 'rtl' : 'ltr';
  };

  const getNavLinks = () => {
    const links = [
      { to: '/dashboard', label: t('dashboard'), icon: '📊' }
    ];

    if (user?.role === 'applicant') {
      links.push({ to: '/book-appointment', label: t('bookAppointment'), icon: '📅' });
      links.push({ to: '/my-appointments', label: t('myAppointments'), icon: '📋' });
      links.push({ to: '/assessment', label: t('assessment') || 'Assessment', icon: '📝' });
      links.push({ to: '/eligibility', label: t('eligibility') || 'Eligibility', icon: '✅' });
      links.push({ to: '/membership', label: t('membership'), icon: '👑' });
      links.push({ to: '/meetings', label: t('meetings'), icon: '🤝' });
    }

    if (user?.role === 'agent') {
      links.push({ to: '/book-appointment', label: t('bookAppointment'), icon: '📅' });
      links.push({ to: '/my-appointments', label: t('myAppointments'), icon: '📋' });
    }

    return links;
  };

  const getMembershipBadge = () => {
    const tier = user?.membership?.tier || 'free';
    const colors = {
      free: 'bg-gray-500',
      gold: 'bg-yellow-500',
      premium: 'bg-purple-600'
    };
    return (
      <span className={`px-2 py-0.5 rounded text-white text-xs font-bold ${colors[tier]}`}>
        {tier.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-bold text-primary-600">VisaAI</h1>
            <div className="flex gap-2 flex-wrap">
              {getNavLinks().map(link => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`
                  }
                >
                  <span className="mr-1">{link.icon}</span>
                  {link.label}
                </NavLink>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <select
              value={i18n.language}
              onChange={(e) => changeLanguage(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="en">EN</option>
              <option value="fr">FR</option>
              <option value="ar">AR</option>
            </select>

            <div className="flex items-center gap-3">
              <div className="text-sm text-right">
                <p className="font-medium text-gray-900">{user?.fullName}</p>
                <div className="flex items-center gap-2">
                  <p className="text-gray-500 text-xs capitalize">{user?.role}</p>
                  {user?.membership && getMembershipBadge()}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
              >
                {t('logout')}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6">
        {children}
      </main>
    </div>
  );
};

export default Layout;
