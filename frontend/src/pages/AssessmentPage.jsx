import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

const AssessmentPage = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    visaType: 'tourist',
    nationality: '',
    age: '',
    duration: '',
    entryType: 'single',
    hasTravelHistory: false,
    hasPriorVisa: false,
    financialStable: false,
    employmentStatus: 'employed',
    purpose: ''
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [docs, setDocs] = useState([]);

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
      const [res, docsRes] = await Promise.all([
        api.post('/assessment/assess', {
          ...formData,
          age: parseInt(formData.age),
          duration: parseInt(formData.duration)
        }),
        api.get(`/assessment/required-docs/${formData.visaType}`)
      ]);
      setResult(res.data);
      setDocs(docsRes.data.documents || []);
    } catch (error) {
      alert(error.response?.data?.message || 'Assessment failed');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (score >= 40) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getEligibilityBadge = (eligibility) => {
    const badges = {
      eligible: { text: 'Eligible', class: 'bg-green-100 text-green-700' },
      likely_eligible: { text: 'Likely Eligible', class: 'bg-yellow-100 text-yellow-700' },
      review: { text: 'Needs Review', class: 'bg-orange-100 text-orange-700' },
      not_eligible: { text: 'Not Eligible', class: 'bg-red-100 text-red-700' }
    };
    return badges[eligibility] || badges.review;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{t('assessment') || 'Visa Assessment Tool'}</h1>
        <p className="text-gray-500">Check your eligibility and get personalized recommendations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <form onSubmit={handleSubmit} className="card space-y-4">
          <h3 className="font-semibold text-lg">Your Information</h3>

          <div>
            <label className="label">{t('visaType')}</label>
            <select name="visaType" className="input" value={formData.visaType} onChange={handleChange}>
              <option value="tourist">{t('tourist')}</option>
              <option value="business">{t('business')}</option>
              <option value="student">{t('student')}</option>
              <option value="work">{t('work')}</option>
              <option value="family">{t('family')}</option>
              <option value="transit">{t('transit')}</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">{t('nationality')}</label>
              <input type="text" name="nationality" className="input" placeholder="e.g. Algeria"
                value={formData.nationality} onChange={handleChange} required />
            </div>
            <div>
              <label className="label">Age</label>
              <input type="number" name="age" className="input" placeholder="Your age"
                value={formData.age} onChange={handleChange} min="0" max="120" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">{t('duration')} (days)</label>
              <input type="number" name="duration" className="input" placeholder="Stay duration"
                value={formData.duration} onChange={handleChange} min="1" required />
            </div>
            <div>
              <label className="label">{t('entryType')}</label>
              <select name="entryType" className="input" value={formData.entryType} onChange={handleChange}>
                <option value="single">{t('single')}</option>
                <option value="multiple">{t('multiple')}</option>
                <option value="double">{t('double')}</option>
              </select>
            </div>
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

          <div>
            <label className="label">{t('purpose')}</label>
            <input type="text" name="purpose" className="input" placeholder="Purpose of travel"
              value={formData.purpose} onChange={handleChange} />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input type="checkbox" name="financialStable" checked={formData.financialStable} onChange={handleChange} />
              <span className="text-sm">I have stable financial resources (bank statements, salary)</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="hasPriorVisa" checked={formData.hasPriorVisa} onChange={handleChange} />
              <span className="text-sm">I have had a visa before (any country)</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="hasTravelHistory" checked={formData.hasTravelHistory} onChange={handleChange} />
              <span className="text-sm">I have international travel history</span>
            </label>
          </div>

          <button type="submit" className="btn btn-primary w-full py-3" disabled={loading}>
            {loading ? 'Assessing...' : 'Run Assessment'}
          </button>
        </form>

        <div className="space-y-4">
          {result ? (
            <>
              <div className={`card border-2 ${getScoreColor(result.score)}`}>
                <div className="text-center">
                  <p className="text-sm font-medium mb-1">Your Score</p>
                  <p className="text-5xl font-bold">{result.score}</p>
                  <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${getEligibilityBadge(result.eligibility).class}`}>
                    {result.eligibilityLabel}
                  </span>
                </div>
              </div>

              <div className="card">
                <h3 className="font-semibold mb-3">Assessment Result</h3>
                <p className="text-sm text-gray-600 mb-4">{result.recommendation}</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-2 bg-gray-50 rounded">
                    <p className="text-gray-500">Processing Time</p>
                    <p className="font-medium">{result.estimatedProcessingDays} days</p>
                  </div>
                  <div className="p-2 bg-gray-50 rounded">
                    <p className="text-gray-500">Suggested Tier</p>
                    <p className="font-medium capitalize">{result.suggestedMembershipTier}</p>
                  </div>
                </div>
              </div>

              {result.factors?.length > 0 && (
                <div className="card">
                  <h3 className="font-semibold mb-3">Positive Factors</h3>
                  <div className="space-y-2">
                    {result.factors.map((f, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span>{f.factor}</span>
                        <span className="text-green-600 font-medium">+{f.points}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.issues?.length > 0 && (
                <div className="card border border-red-200 bg-red-50">
                  <h3 className="font-semibold mb-3 text-red-700">Issues Found</h3>
                  <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                    {result.issues.map((issue, i) => <li key={i}>{issue}</li>)}
                  </ul>
                </div>
              )}

              {result.recommendations?.length > 0 && (
                <div className="card border border-blue-200 bg-blue-50">
                  <h3 className="font-semibold mb-3 text-blue-700">Recommendations</h3>
                  <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
                    {result.recommendations.map((rec, i) => <li key={i}>{rec}</li>)}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <div className="card text-center py-12 text-gray-500">
              <div className="text-5xl mb-4">📋</div>
              <p>Fill in your details and run the assessment</p>
              <p className="text-sm mt-1">Get personalized recommendations</p>
            </div>
          )}
        </div>
      </div>

      {docs.length > 0 && (
        <div className="card mt-6">
          <h3 className="font-semibold mb-4">Required Documents for {formData.visaType} Visa</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {docs.map((doc) => (
              <div key={doc.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded">
                <span className="text-lg">📄</span>
                <div>
                  <p className="font-medium text-sm">{doc.name}</p>
                  <p className="text-xs text-gray-500">{doc.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AssessmentPage;
