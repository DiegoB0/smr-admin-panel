// useEntradas.js
import { api } from "../api/api"

export function useEntradas() {
  const listEntradas = ({
    page = 1,
    limit = 10,
    search = "",
    order = "DESC",
  }) => {
    const params = { page, limit, search, order };
    return api.get("/entradas", { params });
  };

  const registrarEntrada = (id, data) =>
    api.patch(`/entradas/${id}/recibir`, data);

  return {
    listEntradas,
    registrarEntrada,
  };
}