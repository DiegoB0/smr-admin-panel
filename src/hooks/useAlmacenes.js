// src/hooks/useAlmacenes.js
import { useState, useEffect } from 'react'
import { api } from '../api/api'

export const addAlmacen = async (data) => {
  try {
    const res = await api.post('/almacenes/add', data)
    return res.data
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 'Error al agregar el almacén'
    )
  }
}

export const getAlmacenes = async () => {
  try {
    const res = await api.get('/almacenes/all_almacenes')
    return res.data
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 'Error al obtener almacenes'
    )
  }
}

export const deleteAlmacen = async (id) => {
  try {
    await api.delete(`/almacenes/delete_almacen/${id}`)
    return { success: true }
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 'Error al eliminar el almacén'
    )
  }
}

export const updateAlmacen = async (id, data) => {
  try {
    const res = await api.patch(`/almacenes/update_almacen/${id}`, data)
    return res.data
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 'Error al actualizar el almacén'
    )
  }
}

export const useAlmacenes = () => {
  const [almacenes, setAlmacenes] = useState([])
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState(null)

  const fetchAlmacenes = async () => {
    setLoading(true)
    try {
      const data = await getAlmacenes()
      setAlmacenes(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async (payload) => {
    try {
      await addAlmacen(payload)
      await fetchAlmacenes()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleUpdate = async (id, payload) => {
    try {
      await updateAlmacen(id, payload)
      await fetchAlmacenes()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteAlmacen(id)
      await fetchAlmacenes()
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    fetchAlmacenes()
  }, [])

  return {
    almacenes,
    loading,
    error,
    fetchAlmacenes,
    handleAdd,
    handleUpdate,
    handleDelete
  }
}