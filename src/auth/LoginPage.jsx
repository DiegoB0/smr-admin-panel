import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../hooks/useAuth';
import { useDispatch } from 'react-redux';
import Swal from 'sweetalert2';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null); // Clear previous errors

    try {
      const result = await login({ email, password }, dispatch);
      console.log('Login response:', result);

      if (result.success) {
        Swal.fire({
          title: '¡Éxito!',
          text: 'Inicio de sesión exitoso',
          icon: 'success',
          confirmButtonColor: '#1F2937',
          confirmButtonText: 'Continuar',
        }).then(() => {
          navigate('/dashboard/');
        });
      } else {
        Swal.fire({
          title: 'Error',
          text: result.message || 'Fallo al iniciar sesión',
          icon: 'error',
          confirmButtonColor: '#1F2937',
          confirmButtonText: 'Intentar de nuevo',
        });
        setError(result.message || 'Login failed');
      }
    } catch (err) {
      Swal.fire({
        title: 'Error',
        text: err.message || 'Fallo al iniciar sesión',
        icon: 'error',
        confirmButtonColor: '#1F2937',
        confirmButtonText: 'Intentar de nuevo',
      });

      console.error('Login error:', err);
      setError('An error occurred during login');
    }
  };

  return (
    <div className="flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-sm bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold text-center mb-6">Iniciar Sesion</h2>

        {error && (
          <p className="text-red-500 text-sm text-center mb-4">{error}</p>
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
            className="w-full py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Ingresar
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;

