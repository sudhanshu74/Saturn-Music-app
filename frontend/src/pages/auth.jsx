import React, { useState, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { EyeIcon, EyeOffIcon } from '../components/Icons'; // <-- NEW: Imported the icons

const Auth = () => {
  const location = useLocation();
  // 'login', 'signup', 'forgot', or 'reset'
  const initialMode = location.state?.isSignUp ? 'signup' : 'login';
  const [authMode, setAuthMode] = useState(initialMode);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { login } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    otp: '' 
  });

  // NEW: State to track if the password should be visible
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      
      setSuccess("OTP sent to your email!");
      setAuthMode('reset'); // Move to the OTP verification screen
    } catch (err) {
      setError(err.message);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, otp: formData.otp, newPassword: formData.password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      
      setSuccess("Password reset successful! You can now log in.");
      setFormData({ username: '', email: '', password: '', otp: '' });
      setAuthMode('login');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLoginSignup = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');

    if (authMode === 'signup') {
      const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
      if (!passwordRegex.test(formData.password)) {
        return setError("Password must be at least 8 characters long, with 1 uppercase, 1 number, and 1 special character.");
      }
    }

    const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/signup';
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: formData.username, email: formData.email, password: formData.password })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Something went wrong');

      if (authMode === 'login') {
        login(data.accessToken, data.user);
      } else {
        setAuthMode('login');
        setFormData({ username: '', email: '', password: '', otp: '' });
        setSuccess(data.message || 'Account created successfully! Please check your email to verify.');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen w-full bg-[#121212] font-boogaloo">
      <div className="bg-[#1a1a1a] p-10 rounded-2xl shadow-2xl w-[90%] sm:w-[400px] border border-[#333] flex flex-col items-center">
        
        <img src="/saturnlogo.svg" alt="Saturn Logo" className="h-16 mb-6" />
        <h2 className="text-3xl text-white font-luckiest mb-6 tracking-wider text-center">
          {authMode === 'login' && 'Welcome Back!'}
          {authMode === 'signup' && 'Join Saturn'}
          {authMode === 'forgot' && 'Reset Password'}
          {authMode === 'reset' && 'Enter OTP'}
        </h2>

        {error && <div className="w-full p-3 mb-4 bg-red-500/20 text-red-500 border border-red-500 rounded-lg text-center leading-tight">{error}</div>}
        {success && <div className="w-full p-3 mb-4 bg-[#31c93b]/20 text-[#31c93b] border border-[#31c93b] rounded-lg text-center leading-tight">{success}</div>}

        <form 
          onSubmit={
            authMode === 'forgot' ? handleForgotPassword : 
            authMode === 'reset' ? handleResetPassword : 
            handleLoginSignup
          } 
          className="w-full flex flex-col gap-4"
        >
          
          {authMode === 'signup' && (
            <input 
              type="text" name="username" placeholder="Username" 
              value={formData.username} onChange={handleChange} required 
              className="w-full px-4 py-3 rounded-lg bg-[#2a2a2a] text-white outline-none focus:ring-2 focus:ring-[#31c93b]"
            />
          )}

          {(authMode !== 'reset') && (
            <input 
              type="email" name="email" placeholder="Email Address" 
              value={formData.email} onChange={handleChange} required 
              className="w-full px-4 py-3 rounded-lg bg-[#2a2a2a] text-white outline-none focus:ring-2 focus:ring-[#31c93b]"
            />
          )}

          {authMode === 'reset' && (
            <input 
              type="text" name="otp" placeholder="Enter 6-Digit OTP" 
              value={formData.otp} onChange={handleChange} required 
              className="w-full px-4 py-3 rounded-lg bg-[#2a2a2a] text-[#31c93b] text-center font-luckiest tracking-[0.5em] text-xl outline-none focus:ring-2 focus:ring-[#31c93b]"
              maxLength="6"
            />
          )}

          {/* NEW: Updated Password Input Block */}
          {(authMode === 'login' || authMode === 'signup' || authMode === 'reset') && (
            <div className="relative w-full">
              <input 
                type={showPassword ? "text" : "password"} 
                name="password" 
                placeholder={authMode === 'reset' ? "New Password" : "Password"} 
                value={formData.password} 
                onChange={handleChange} 
                required 
                className="w-full px-4 py-3 pr-12 rounded-lg bg-[#2a2a2a] text-white outline-none focus:ring-2 focus:ring-[#31c93b]"
              />
              <button
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#31c93b] transition-colors flex items-center justify-center h-full px-1 outline-none"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            </div>
          )}

          <button type="submit" className="w-full bg-[wheat] text-[#28013f] font-luckiest text-xl py-3 rounded-full mt-4 hover:bg-white transition-transform">
            {authMode === 'login' && 'LOG IN'}
            {authMode === 'signup' && 'SIGN UP'}
            {authMode === 'forgot' && 'SEND OTP'}
            {authMode === 'reset' && 'RESET PASSWORD'}
          </button>
        </form>

        <div className="mt-6 text-[#b3b3b3] text-lg flex flex-col items-center gap-2">
          {authMode === 'login' && (
            <>
              <button type="button" onClick={() => { setAuthMode('forgot'); setError(''); setSuccess(''); }} className="hover:text-white transition-colors text-sm">
                Forgot Password?
              </button>
              <div>
                Don't have an account? <button type="button" onClick={() => setAuthMode('signup')} className="text-[#31c93b] hover:text-white transition-colors underline decoration-2 underline-offset-4">Sign up</button>
              </div>
            </>
          )}

          {authMode === 'signup' && (
             <div>
               Already have an account? <button type="button" onClick={() => setAuthMode('login')} className="text-[#31c93b] hover:text-white transition-colors underline decoration-2 underline-offset-4">Log in</button>
             </div>
          )}

          {(authMode === 'forgot' || authMode === 'reset') && (
            <button type="button" onClick={() => { setAuthMode('login'); setError(''); setSuccess(''); }} className="text-[#31c93b] hover:text-white transition-colors text-sm">
              Back to Login
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;