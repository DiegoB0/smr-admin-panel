import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Swal from 'sweetalert2';
import { login } from '../store/features/auth/authSlice';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [genericError, setGenericError] = useState(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { status, error } = useSelector(s => s.auth)

  const handleLogin = async (e) => {
    e.preventDefault();
    setGenericError(null);

    try {
      const result = await dispatch(login({ email, password })).unwrap()
      console.log('Login response:', result);

      Swal.fire({
        title: '¡Éxito!',
        text: 'Inicio de sesión exitoso',
        icon: 'success',
        confirmButtonColor: '#1F2937',
        confirmButtonText: 'Continuar',
      }).then(() => {
        navigate('/dashboard/');
      });

    } catch (err) {
      Swal.fire({
        title: 'Error',
        text: err.message || 'Fallo al iniciar sesión',
        icon: 'error',
        confirmButtonColor: '#1F2937',
        confirmButtonText: 'Intentar de nuevo',
      });

      console.error('Login error:', err);
      setGenericError('An error occurred during login');
    }
  };

  return (
    <div className="flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-sm bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold text-center mb-6">Iniciar Sesion</h2>

        {genericError && (
          <p className="text-red-500 text-sm text-center mb-4">{genericError}</p>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            {status === 'loading' ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        {status === 'failed' && (
          <p className='mt-4 text-red-500 text-center'> {error} </p>

        )}
      </div>
    </div>
  );
}

export default LoginPage;

