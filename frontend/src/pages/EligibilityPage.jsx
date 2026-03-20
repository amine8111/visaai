import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

const EligibilityPage = () => {
  const { t } = useTranslation();
  const [countries, setCountries] = useState([]);
  const [formData, setFormData] = useState({
    destination: '',
    visaType: 'tourist',
    nationality: '',
    age: '',
    bankBalance: '',
    monthlyIncome: '',
    accountAge: '12',
    employmentStatus: 'employed',
    hasTravelHistory: false,
    hasPriorRejection: false,
    passportValidity: '12'
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCountries();
  }, []);

  const loadCountries = async () => {
    try {
      const res = await api.get('/eligibility/countries');
      setCountries(res.data.countries || []);
    } catch (error) {
      setCountries([
        { country: 'France', region: 'Schengen Area' },
        { country: 'Germany', region: 'Schengen Area' },
        { country: 'United Kingdom', region: 'United Kingdom' },
        { country: 'United States', region: 'United States' },
        { country: 'Canada', region: 'Canada' },
        { country: 'Spain', region: 'Schengen Area' },
        { country: 'Italy', region: 'Schengen Area' },
        { country: 'United Arab Emirates', region: 'UAE / GCC' }
      ]);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/eligibility/check', {
        ...formData,
        age: parseInt(formData.age),
        bankBalance: parseFloat(formData.bankBalance),
        monthlyIncome: parseFloat(formData.monthlyIncome),
        accountAge: parseInt(formData.accountAge),
        passportValidity: parseInt(formData.passportValidity)
      });
      setResult(res.data);
    } catch (error) {
      alert(error.response?.data?.message || 'Eligibility check failed');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 85) return { text: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' };
    if (score >= 70) return { text: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' };
    if (score >= 50) return { text: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' };
    return { text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
  };

  const getStatusIcon = (status) => {
    const icons = { pass: '✓', fail: '✗', warn: '⚠', recommend: '★' };
    const colors = { pass: 'text-green-600', fail: 'text-red-600', warn: 'text-yellow-600', recommend: 'text-blue-600' };
    return { icon: icons[status] || '•', color: colors[status] || 'text-gray-400' };
  };

  const scoreColors = result ? getScoreColor(result.overallScore) : {};

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{t('eligibility') || 'Eligibility Checker'}</h1>
        <p className="text-gray-500">Check if you meet the requirements for your destination</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <form onSubmit={handleSubmit} className="card space-y-4">
          <h3 className="font-semibold text-lg">Your Details</h3>

          <div>
            <label className="label">Destination Country</label>
            <select name="destination" className="input" value={formData.destination} onChange={handleChange} required>
              <option value="">Select country...</option>
              {countries.map(c => (
                <option key={c.country} value={c.country}>{c.country} ({c.region})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Visa Type</label>
              <select name="visaType" className="input" value={formData.visaType} onChange={handleChange}>
                <option value="tourist">Tourist</option>
                <option value="business">Business</option>
                <option value="student">Student</option>
                <option value="work">Work</option>
              </select>
            </div>
            <div>
              <label className="label">{t('nationality')}</label>
              <input type="text" name="nationality" className="input" placeholder="Your nationality"
                value={formData.nationality} onChange={handleChange} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Age</label>
              <input type="number" name="age" className="input" placeholder="Your age"
                value={formData.age} onChange={handleChange} min="0" max="120" required />
            </div>
            <div>
              <label className="label">Passport Validity (months)</label>
              <input type="number" name="passportValidity" className="input"
                value={formData.passportValidity} onChange={handleChange} min="0" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Bank Balance (DA)</label>
              <input type="number" name="bankBalance" className="input" placeholder="Total savings"
                value={formData.bankBalance} onChange={handleChange} min="0" required />
            </div>
            <div>
              <label className="label">Monthly Income (DA)</label>
              <input type="number" name="monthlyIncome" className="input" placeholder="Monthly income"
                value={formData.monthlyIncome} onChange={handleChange} min="0" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Bank Account Age (months)</label>
              <input type="number" name="accountAge" className="input"
                value={formData.accountAge} onChange={handleChange} min="0" />
            </div>
            <div>
              <label className="label">Employment Status</label>
              <select name="employmentStatus" className="input" value={formData.employmentStatus} onChange={handleChange}>
                <option value="employed">Employed</option>
                <option value="self_employed">Self-Employed</option>
                <option value="student">Student</option>
                <option value="retired">Retired</option>
                <option value="unemployed">Unemployed</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input type="checkbox" name="hasTravelHistory" checked={formData.hasTravelHistory} onChange={handleChange} />
              <span className="text-sm">I have international travel history</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="hasPriorRejection" checked={formData.hasPriorRejection} onChange={handleChange} />
              <span className="text-sm">I have had a visa rejection before</span>
            </label>
          </div>

          <button type="submit" className="btn btn-primary w-full py-3" disabled={loading}>
            {loading ? 'Checking...' : 'Check Eligibility'}
          </button>
        </form>

        <div className="space-y-4">
          {result ? (
            <>
              <div className={`card border-2 ${scoreColors.bg} ${scoreColors.border}`}>
                <div className="text-center">
                  <p className="text-sm font-medium mb-1">Eligibility Score</p>
                  <p className={`text-5xl font-bold ${scoreColors.text}`}>{result.overallScore}</p>
                  <p className={`text-sm font-medium mt-2 ${scoreColors.text}`}>{result.eligibilityLabel}</p>
                </div>
              </div>

              <div className="card">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-2 bg-gray-50 rounded">
                    <p className="text-gray-500">Destination</p>
                    <p className="font-medium">{result.destination}</p>
                  </div>
                  <div className="p-2 bg-gray-50 rounded">
                    <p className="text-gray-500">Region</p>
                    <p className="font-medium">{result.region}</p>
                  </div>
                  <div className="p-2 bg-gray-50 rounded">
                    <p className="text-gray-500">Processing Time</p>
                    <p className="font-medium">{result.processingTime}</p>
                  </div>
                  <div className="p-2 bg-gray-50 rounded">
                    <p className="text-gray-500">Assessment ID</p>
                    <p className="font-medium text-xs">{result.eligibilityId}</p>
                  </div>
                </div>
              </div>

              <div className="card">
                <h3 className="font-semibold mb-3">Requirements Check</h3>
                <div className="space-y-2">
                  {result.checks?.map((check, i) => {
                    const { icon, color } = getStatusIcon(check.status);
                    return (
                      <div key={i} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                        <span>{check.item}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">{check.detail}</span>
                          <span className={`font-bold ${color}`}>{icon}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {result.missingRequirements?.length > 0 && (
                <div className="card border border-red-200 bg-red-50">
                  <h3 className="font-semibold mb-3 text-red-700">Missing Requirements</h3>
                  <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                    {result.missingRequirements.map((m, i) => <li key={i}>{m}</li>)}
                  </ul>
                </div>
              )}

              {result.suggestions?.length > 0 && (
                <div className="card border border-blue-200 bg-blue-50">
                  <h3 className="font-semibold mb-3 text-blue-700">Suggestions</h3>
                  <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
                    {result.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}

              {result.recommendedDocs?.length > 0 && (
                <div className="card">
                  <h3 className="font-semibold mb-3">Recommended Documents</h3>
                  <div className="flex flex-wrap gap-2">
                    {result.recommendedDocs.map((doc, i) => (
                      <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded capitalize">
                        {doc.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="card text-center py-12 text-gray-500">
              <div className="text-5xl mb-4">🔍</div>
              <p>Enter your details to check eligibility</p>
              <p className="text-sm mt-1">Get detailed requirements for your destination</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EligibilityPage;
