import { api } from '../api/api';

export function useUser() {
  /**
   * Create a new user.
   * @param {object} data
   * @return {Promise<AxiosResponse>}
   */
  const createUser = (data) => api.post('usuarios/add', data);

  /**
     * Fetch list of users.
     * @param {object} [params] – query params (e.g. { page: 1 })
     * @returns {Promise<AxiosResponse>}
     */
  const listUsers = ({
    page = 1,
    limit = 10,
    search = '',
    order = 'ASC'
  }) => {
    const params = { page, limit, search, order }

    return api.get('usuarios/all_users', { params });
  };

  /**
     * Fetch list of roles.
     * @returns {Promise<AxiosResponse>}
     */
  const listRoles = () => {
    return api.get('usuarios/find_roles');
  };

  /** 
   *  Fetch a single user by id.
   *  @param {string|number} id
   *  @return {Promise<AxiosResponse>}
   */
  const getOneUser = (id) => api.get(`usuarios/find_one/${id}`)

  /**
   * Delete a user.
   * @param {string|number} id
   * @return {Promise<AxiosResponse>}
   */
  const deleteUser = (id) => api.delete(`usuarios/delete_user/${id}`)

  /**
   * @param {string|number} id
   * @return {Promise<AxiosReponse>}
   */
  const updateUser = (id, data) => api.patch(`usuarios/update_user/${id}`, data);

  return {
    createUser,
    listUsers,
    listRoles,
    getOneUser,
    deleteUser,
    updateUser,
  };
}
