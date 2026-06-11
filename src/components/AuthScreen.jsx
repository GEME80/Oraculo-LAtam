import React, { useState, useEffect } from 'react';
import { supabase, isMock } from '../lib/supabaseClient';
import { Eye, EyeOff, Globe, Lock, Mail, User, AlertCircle, Sparkles, Trophy, CheckCircle2 } from 'lucide-react';

const LATAM_COUNTRIES = [
  { code: 'CO', name: 'Colombia 🇨🇴' },
  { code: 'MX', name: 'México 🇲🇽' },
  { code: 'AR', name: 'Argentina 🇦🇷' },
  { code: 'BR', name: 'Brasil 🇧🇷' },
  { code: 'CL', name: 'Chile 🇨🇱' },
  { code: 'PE', name: 'Perú 🇵🇪' }
];

export default function AuthScreen({ onAuthSuccess, forceResetPassword = false, onPasswordResetComplete, isModal = false }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [country, setCountry] = useState('CO');
  
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [registeredEmail, setRegisteredEmail] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState(0);

  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(forceResetPassword);
  const [recoveryEmailSent, setRecoveryEmailSent] = useState(false);

  useEffect(() => {
    if (forceResetPassword) {
      setIsResettingPassword(true);
    }
  }, [forceResetPassword]);

  useEffect(() => {
    if (lockoutTime > 0) {
      const timer = setTimeout(() => {
        setLockoutTime(prev => {
          if (prev - 1 === 0) {
            setFailedAttempts(0);
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [lockoutTime]);



  const handleResetRequest = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setErrorMsg('');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMsg('Por favor ingresa un correo electrónico válido.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin
      });
      if (error) throw error;
      setRecoveryEmailSent(true);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Error al enviar el correo de recuperación.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setErrorMsg('');
    if (password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });
      if (error) throw error;
      alert('Contraseña actualizada con éxito. Ya puedes iniciar sesión.');
      setIsResettingPassword(false);
      setIsLogin(true);
      if (onPasswordResetComplete) {
        onPasswordResetComplete();
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Error al actualizar la contraseña.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (lockoutTime > 0) {
      setErrorMsg(`Demasiados intentos fallidos. Inténtalo de nuevo en ${lockoutTime} segundos.`);
      return;
    }

    setErrorMsg('');

    // Front-end validations
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMsg('Por favor ingresa un correo electrónico válido.');
      return;
    }

    if (!isLogin && password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isLogin) {
        // Log in
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password
        });
        if (error) throw error;
        setFailedAttempts(0);
        onAuthSuccess();
      } else {
        // Sign up
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              username,
              country
            }
          }
        });
        if (error) throw error;
        
        // Show confirmation screen
        setRegisteredEmail(email.trim());
      }
    } catch (err) {
      console.error(err);
      if (isLogin) {
        const nextFailed = failedAttempts + 1;
        setFailedAttempts(nextFailed);
        if (nextFailed >= 5) {
          setLockoutTime(30);
          setErrorMsg('Límite de intentos fallidos superado. Bloqueado por 30 segundos.');
        } else {
          setErrorMsg(err.message || 'Correo o contraseña incorrectos.');
        }
      } else {
        setErrorMsg(err.message || 'Ocurrió un error en el servidor. Inténtalo de nuevo.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google'
      });
      if (error) throw error;
      if (data && data.user) {
        onAuthSuccess();
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error al conectar con Google.');
    }
  };

  const handleSimulateConfirmation = async () => {
    try {
      const { error } = await supabase.auth.mockConfirmEmail(registeredEmail);
      if (error) throw error;
      alert(`[SIMULACIÓN] Correo ${registeredEmail} confirmado con éxito. Ahora puedes iniciar sesión.`);
      setIsLogin(true);
      setRegisteredEmail('');
      setErrorMsg('');
    } catch (err) {
      alert(err.message || 'Error al confirmar correo.');
    }
  };

  return (
    <div className={isModal ? 'auth-modal-mode' : 'auth-page'}>
      <div className="auth-container">
        {/* Left Side: Brand Onboarding */}
        <div className="brand-panel">
          <div style={styles.brandLogo}>
            <Trophy size={36} />
          </div>
          <h2 style={styles.brandTitle}>Oráculo-LATAM</h2>
          <p style={styles.brandSubtitle}>
            La primera plataforma de mercados de predicciones gamificada en América Latina.
          </p>

          <div style={styles.featuresList}>
            <div style={styles.featureItem}>
              <div style={styles.featureIcon}>💡</div>
              <div>
                <h4 style={styles.featureHeading}>Estrategia sin Dinero Real</h4>
                <p style={styles.featureDesc}>Compite usando créditos virtuales de cortesía. Cero riesgos, pura diversión intelectual.</p>
              </div>
            </div>
            <div style={styles.featureItem}>
              <div style={styles.featureIcon}>📈</div>
              <div>
                <h4 style={styles.featureHeading}>Precios Dinámicos (AMM)</h4>
                <p style={styles.featureDesc}>Los precios de las acciones de SÍ/NO cambian al instante según la oferta y demanda colectiva.</p>
              </div>
            </div>
            <div style={styles.featureItem}>
              <div style={styles.featureIcon}>🎁</div>
              <div>
                <h4 style={styles.featureHeading}>Recompensas por Mérito</h4>
                <p style={styles.featureDesc}>Destácate en el ranking mensual y canjea puntos por suscripciones a diarios líderes y Platzi.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Credentials & OAuth forms */}
        <div style={styles.formPanel}>
          {isResettingPassword ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={styles.formTitle}>Restablecer Contraseña</h3>
              <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))', margin: '0 0 1rem 0', lineHeight: 1.4 }}>
                Ingresa tu nueva contraseña para acceder a tu cuenta.
              </p>
              <form onSubmit={handlePasswordUpdate} style={styles.form}>
                <div style={styles.inputGroup}>
                  <label style={styles.label} htmlFor="new-password">Nueva Contraseña</label>
                  <div style={styles.inputWrapper}>
                    <Lock size={16} style={styles.inputIcon} />
                    <input 
                      id="new-password"
                      type={showPassword ? 'text' : 'password'} 
                      placeholder="••••••••" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={styles.input}
                      required
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      style={styles.eyeBtn}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {errorMsg && (
                  <div style={styles.errorAlert}>
                    <AlertCircle size={16} />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  style={{
                    ...styles.submitBtn,
                    ...(isSubmitting ? { opacity: 0.7, cursor: 'not-allowed' } : {})
                  }}
                >
                  {isSubmitting ? 'Actualizando...' : 'Actualizar Contraseña'}
                </button>
              </form>
            </div>
          ) : recoveryEmailSent ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1.25rem', padding: '1rem 0' }}>
              <div style={{ background: 'hsl(var(--yes-bg))', color: 'hsl(var(--yes-color))', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                <CheckCircle2 size={36} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'hsl(var(--text-main))', margin: 0 }}>Enlace Enviado</h3>
                <p style={{ fontSize: '0.875rem', color: 'hsl(var(--text-muted))', margin: 0, lineHeight: 1.5 }}>
                  Te hemos enviado un correo con las instrucciones para restablecer tu contraseña a <strong style={{ color: 'hsl(var(--text-main))' }}>{email}</strong>.
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setRecoveryEmailSent(false); setIsForgotPassword(false); setIsLogin(true); setErrorMsg(''); }}
                style={{
                  background: 'transparent',
                  border: '1px solid hsl(var(--border))',
                  color: 'hsl(var(--text-muted))',
                  padding: '0.6rem 1.25rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  width: '100%',
                  marginTop: '0.5rem'
                }}
              >
                Volver al Inicio de Sesión
              </button>
            </div>
          ) : isForgotPassword ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={styles.formTitle}>Recuperar Contraseña</h3>
              <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))', margin: '0 0 1rem 0', lineHeight: 1.4 }}>
                Ingresa tu correo registrado y te enviaremos un enlace de recuperación.
              </p>
              <form onSubmit={handleResetRequest} style={styles.form}>
                <div style={styles.inputGroup}>
                  <label style={styles.label} htmlFor="reset-email">Correo Electrónico</label>
                  <div style={styles.inputWrapper}>
                    <Mail size={16} style={styles.inputIcon} />
                    <input 
                      id="reset-email"
                      type="email" 
                      placeholder="tu@correo.com" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={styles.input}
                      required
                    />
                  </div>
                </div>

                {errorMsg && (
                  <div style={styles.errorAlert}>
                    <AlertCircle size={16} />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  style={{
                    ...styles.submitBtn,
                    ...(isSubmitting ? { opacity: 0.7, cursor: 'not-allowed' } : {})
                  }}
                >
                  {isSubmitting ? 'Enviando...' : 'Enviar Enlace de Recuperación'}
                </button>

                <button
                  type="button"
                  onClick={() => { setIsForgotPassword(false); setErrorMsg(''); }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'hsl(var(--brand))',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    marginTop: '0.5rem',
                    textAlign: 'center'
                  }}
                >
                  Volver al Inicio de Sesión
                </button>
              </form>
            </div>
          ) : registeredEmail ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '1.25rem', padding: '1rem 0' }}>
              <div style={{ background: 'hsl(var(--yes-bg))', color: 'hsl(var(--yes-color))', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                <CheckCircle2 size={36} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'hsl(var(--text-main))', margin: 0 }}>¡Confirma tu correo!</h3>
                <p style={{ fontSize: '0.875rem', color: 'hsl(var(--text-muted))', margin: 0, lineHeight: 1.5 }}>
                  Hemos enviado un enlace de confirmación a <strong style={{ color: 'hsl(var(--text-main))' }}>{registeredEmail}</strong>.<br />
                  Verifica tu bandeja de entrada para activar tu cuenta antes de iniciar sesión.
                </p>
              </div>

              {isMock && (
                <div style={{
                  background: 'hsl(var(--brand-light) / 0.1)',
                  border: '1px dashed hsl(var(--brand) / 0.3)',
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  marginTop: '0.5rem'
                }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'hsl(var(--brand))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    ⚙️ Simulador de Confirmación
                  </span>
                  <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', margin: 0, lineHeight: 1.4 }}>
                    Estás en modo de simulación. Haz clic abajo para confirmar esta cuenta de prueba de manera instantánea:
                  </p>
                  <button
                    type="button"
                    onClick={handleSimulateConfirmation}
                    style={{
                      background: 'hsl(var(--brand))',
                      color: 'white',
                      border: 'none',
                      padding: '0.65rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    Confirmar Cuenta de Prueba
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => { setRegisteredEmail(''); setIsLogin(true); setErrorMsg(''); }}
                style={{
                  background: 'transparent',
                  border: '1px solid hsl(var(--border))',
                  color: 'hsl(var(--text-muted))',
                  padding: '0.6rem 1.25rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  width: '100%',
                  marginTop: '0.5rem'
                }}
              >
                Volver al Inicio de Sesión
              </button>
            </div>
          ) : (
            <>
              <div style={styles.tabsWrapper}>
                <button 
                  style={{...styles.tabBtn, ...(isLogin ? styles.tabBtnActive : {})}}
                  onClick={() => { setIsLogin(true); setErrorMsg(''); }}
                >
                  Iniciar Sesión
                </button>
                <button 
                  style={{...styles.tabBtn, ...(!isLogin ? styles.tabBtnActive : {})}}
                  onClick={() => { setIsLogin(false); setErrorMsg(''); }}
                >
                  Crear Cuenta
                </button>
              </div>

              <h3 style={styles.formTitle}>
                {isLogin ? '¡Bienvenido de vuelta!' : 'Regístrate hoy en la arena'}
              </h3>

              <form onSubmit={handleSubmit} style={styles.form}>
                {/* Username (Register only) */}
                {!isLogin && (
                  <div style={styles.inputGroup}>
                    <label style={styles.label} htmlFor="username">Nombre de Usuario</label>
                    <div style={styles.inputWrapper}>
                      <User size={16} style={styles.inputIcon} />
                      <input 
                        id="username"
                        type="text" 
                        placeholder="ej: oraculo_analista" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        style={styles.input}
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Country selector (Register only) */}
                {!isLogin && (
                  <div style={styles.inputGroup}>
                    <label style={styles.label} htmlFor="country">País de Residencia</label>
                    <div style={styles.inputWrapper}>
                      <Globe size={16} style={styles.inputIcon} />
                      <select 
                        id="country"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        style={styles.select}
                        required
                      >
                        {LATAM_COUNTRIES.map(c => (
                          <option key={c.code} value={c.code}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Email input */}
                <div style={styles.inputGroup}>
                  <label style={styles.label} htmlFor="email">Correo Electrónico</label>
                  <div style={styles.inputWrapper}>
                    <Mail size={16} style={styles.inputIcon} />
                    <input 
                      id="email"
                      type="email" 
                      autoComplete="username"
                      placeholder="tu@correo.com" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={styles.input}
                      required
                    />
                  </div>
                </div>


                {/* Password input */}
                <div style={styles.inputGroup}>
                  <label style={styles.label} htmlFor="password">Contraseña</label>
                  <div style={styles.inputWrapper}>
                    <Lock size={16} style={styles.inputIcon} />
                    <input 
                      id="password"
                      type={showPassword ? 'text' : 'password'} 
                      autoComplete={isLogin ? 'current-password' : 'new-password'}
                      placeholder="••••••••" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={styles.input}
                      required
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      style={styles.eyeBtn}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {isLogin && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-0.25rem' }}>
                    <button
                      type="button"
                      onClick={() => { setIsForgotPassword(true); setErrorMsg(''); }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'hsl(var(--brand))',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                )}

                {errorMsg && (
                  <div style={styles.errorAlert}>
                    <AlertCircle size={16} />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={isSubmitting || lockoutTime > 0}
                  style={{
                    ...styles.submitBtn,
                    ...(isSubmitting || lockoutTime > 0 ? { opacity: 0.7, cursor: 'not-allowed' } : {})
                  }}
                >
                  {lockoutTime > 0 
                    ? `Bloqueado por ${lockoutTime}s` 
                    : isSubmitting 
                      ? 'Procesando...' 
                      : isLogin 
                        ? 'Ingresar' 
                        : 'Registrarse'}
                </button>
              </form>


            </>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  brandLogo: {
    width: '56px',
    height: '56px',
    background: 'rgba(255,255,255,0.2)',
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1.5rem',
    boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
  },
  brandTitle: {
    fontSize: '2rem',
    fontWeight: 800,
    marginBottom: '0.5rem',
    fontFamily: 'var(--font-heading)'
  },
  brandSubtitle: {
    fontSize: '1rem',
    opacity: 0.9,
    marginBottom: '2.5rem',
    lineHeight: 1.4
  },
  featuresList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem'
  },
  featureItem: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'flex-start'
  },
  featureIcon: {
    fontSize: '1.25rem',
    background: 'rgba(255,255,255,0.15)',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  featureHeading: {
    fontWeight: 700,
    fontSize: '0.95rem',
    marginBottom: '0.2rem'
  },
  featureDesc: {
    fontSize: '0.8rem',
    opacity: 0.85,
    lineHeight: 1.4
  },
  formPanel: {
    padding: '2.5rem',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center'
  },
  tabsWrapper: {
    display: 'flex',
    background: 'hsl(var(--bg-app))',
    padding: '0.25rem',
    borderRadius: 'var(--radius-md)',
    border: '1px solid hsl(var(--border))',
    marginBottom: '2rem'
  },
  tabBtn: {
    flex: 1,
    border: 'none',
    background: 'transparent',
    padding: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: 600,
    color: 'hsl(var(--text-muted))',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },
  tabBtnActive: {
    background: 'white',
    color: 'hsl(var(--brand))',
    boxShadow: 'var(--shadow-sm)'
  },
  formTitle: {
    fontSize: '1.25rem',
    fontWeight: 800,
    color: 'hsl(var(--text-main))',
    marginBottom: '1.5rem'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem'
  },
  label: {
    fontSize: '0.75rem',
    fontWeight: 700,
    color: 'hsl(var(--text-muted))',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  },
  inputIcon: {
    position: 'absolute',
    left: '0.85rem',
    color: 'hsl(var(--text-muted))',
    pointerEvents: 'none'
  },
  input: {
    width: '100%',
    padding: '0.75rem 1rem 0.75rem 2.5rem',
    borderRadius: 'var(--radius-md)',
    border: '1px solid hsl(var(--border))',
    fontSize: '0.875rem',
    outline: 'none',
    transition: 'border-color 0.2s',
    '&:focus': {
      borderColor: 'hsl(var(--brand))'
    }
  },
  select: {
    width: '100%',
    padding: '0.75rem 1rem 0.75rem 2.5rem',
    borderRadius: 'var(--radius-md)',
    border: '1px solid hsl(var(--border))',
    fontSize: '0.875rem',
    outline: 'none',
    backgroundColor: 'white',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 0.85rem center',
    backgroundSize: '16px'
  },
  gmailAlert: {
    display: 'flex',
    gap: '0.5rem',
    background: '#fffbeb',
    border: '1px solid #fde68a',
    padding: '0.75rem',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.75rem',
    color: '#b45309',
    lineHeight: 1.45
  },
  eyeBtn: {
    position: 'absolute',
    right: '0.85rem',
    background: 'transparent',
    border: 'none',
    color: 'hsl(var(--text-muted))',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center'
  },
  submitBtn: {
    border: 'none',
    background: 'hsl(var(--brand))',
    color: 'white',
    padding: '0.85rem',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.875rem',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    marginTop: '0.5rem',
    '&:hover': {
      backgroundColor: 'hsl(var(--brand-hover))'
    }
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    margin: '1.5rem 0',
    color: 'hsl(var(--text-muted))',
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    fontWeight: 700,
    letterSpacing: '0.05em'
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    background: 'hsl(var(--border))'
  },
  dividerText: {
    padding: '0 0.75rem'
  },
  googleBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    background: 'white',
    border: '1px solid hsl(var(--border))',
    padding: '0.85rem',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.875rem',
    fontWeight: 600,
    color: 'hsl(var(--text-main))',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    '&:hover': {
      backgroundColor: 'hsl(var(--bg-app))',
      borderColor: 'hsl(var(--text-muted) / 0.3)'
    }
  },
  errorAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: 'hsl(var(--no-bg))',
    border: '1px solid hsl(var(--no-color) / 0.2)',
    padding: '0.75rem',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.75rem',
    color: 'hsl(var(--no-color))',
    fontWeight: 600
  }
};
