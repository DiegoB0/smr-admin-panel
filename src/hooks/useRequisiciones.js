import { api } from "../api/api";

export function useRequisiciones() {


  const getStats = () => {
    return api.get("requisiciones/stats");
  };

  const createRequisicion = (data) => {
    return api.post("requisiciones", data);
  };

  const listRequisiciones = ({
    page = 1,
    limit = 10,
    search = "",
    order = "ASC",
    status,
  }) => {
    const params = { page, limit, search, order };
    if (status && status !== "ALL") params.status = status;
    return api.get("requisiciones/all_requisiciones", { params });
  };

  const listAprovedRequisiciones = ({
    page = 1,
    limit = 10,
    search = "",
    order = "ASC",
  }) => {
    const params = { page, limit, search, order };
    return api.get("requisiciones/aproved_requisiciones", { params });
  };



  const approveRequisicion = (id) => api.patch(`requisiciones/${id}/approve`);
  const rejectRequisicion = (id) => api.patch(`requisiciones/${id}/reject`);
  const pagarRequisicion = (id, data) => api.patch(`requisiciones/${id}/pagar`, data);

  // Update items
  const updateItems = (id, data) => api.patch(`requisiciones/${id}/items`, data)


  return {
    getStats,
    createRequisicion,
    listRequisiciones,
    approveRequisicion,
    rejectRequisicion,
    pagarRequisicion,
    listAprovedRequisiciones,
    updateItems
  };
}
