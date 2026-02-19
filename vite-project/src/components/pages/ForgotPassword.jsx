import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import '../../index.css';

const ForgotPassword = () => {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await forgotPassword(email);
    setLoading(false);

    if (result.success) {
      toast.success(result.message || 'Reset link sent! Check your email.');
      setEmail('');
    } else {
      setError(result.message || 'Something went wrong.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Forgot Password</h1>
        <p>Enter your email to receive a reset link</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          {error && (
            <div className="alert">
              <AlertCircle className="alert-icon" />
              <span className="alert-text">{error}</span>
            </div>
          )}

          <button type="submit" className="submit-btn" disabled={loading}>
            <Mail size={16} /> {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
