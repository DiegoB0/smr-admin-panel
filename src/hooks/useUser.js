import { api } from '../api/api';

export function useUser() {
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
   *  Fetch a single user by id.
   *  @param {string|number} id
   *  @return {Promise<AxiosResponse>}
   */
  const getOneUser = (id) => api.get(`usuarios/find_one/${id}`)

  /**
   * Create a new user.
   * @param {object} data
   * @return {Promise<AxiosResponse>}
   */
  const createUser = (data) => api.post('usuarios/add', data);

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
  const updateUser = (id, data) => api.put(`usuarios/update_user/${id}`, data);

  return {
    createUser,
    listUsers,
    getOneUser,
    deleteUser,
    updateUser,
  };
}
