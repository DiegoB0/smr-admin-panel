import { api } from '../api/api';

export function useEntradas() {
  const listEntradas = ({
    almacenId,
    page = 1,
    limit = 10,
    search = '',
    order = 'ASC'
  }) => {
    const params = { page, limit, search, order };
    return api.get(`entradas/${almacenId}`, { params });
  };

  const recibirEntradas = (id, data) => api.patch(`entradas/${id}/recibir`, data);

  return {
    listEntradas,
    recibirEntradas,
  };
}