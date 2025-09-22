import { api } from '../api/api';

export function useEquipos() {

  const createEquipo = (data) => api.post('equipos/add', data);

  const listEquipos = ({
    page = 1,
    limit = 10,
    search = '',
    order = 'ASC'
  }) => {
    const params = { page, limit, search, order }

    return api.get('equipos/all_equipos', { params });
  };

  const getOneEquipo = (id) => api.get(`equipos/find_one/${id}`)

  const deleteEquipo = (id) => api.delete(`equipos/delete_equipo/${id}`)

  const updateEquipo = (id, data) => api.patch(`equipos/update_equipo/${id}`, data);

  return {
    createEquipo,
    listEquipos,
    getOneEquipo,
    deleteEquipo,
    updateEquipo,
  };
}
