import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

// Materials
export const getMaterials    = ()            => api.get('/materials').then(r => r.data)
export const createMaterial  = (data)        => api.post('/materials', data).then(r => r.data)
export const updateMaterial  = (id, data)    => api.put(`/materials/${id}`, data).then(r => r.data)
export const deleteMaterial  = (id)          => api.delete(`/materials/${id}`).then(r => r.data)
export const getPriceHistory = (id)          => api.get(`/materials/${id}/price-history`).then(r => r.data)

// Recipes
export const getRecipes      = (params)      => api.get('/recipes', { params }).then(r => r.data)
export const getRecipe       = (id)          => api.get(`/recipes/${id}`).then(r => r.data)
export const createRecipe    = (data)        => api.post('/recipes', data).then(r => r.data)
export const updateRecipe    = (id, data)    => api.put(`/recipes/${id}`, data).then(r => r.data)
export const deleteRecipe    = (id)          => api.delete(`/recipes/${id}`).then(r => r.data)
export const toggleKnown     = (id, known)   => api.patch(`/recipes/${id}/known`, { known }).then(r => r.data)

// Sales
export const getSales        = (params)      => api.get('/sales', { params }).then(r => r.data)
export const createSale      = (data)        => api.post('/sales', data).then(r => r.data)
export const updateSale      = (id, data)    => api.put(`/sales/${id}`, data).then(r => r.data)
export const deleteSale      = (id)          => api.delete(`/sales/${id}`).then(r => r.data)

// Dashboard
export const getDashboardSummary   = ()          => api.get('/dashboard/summary').then(r => r.data)
export const getSalesOverTime      = (days = 30) => api.get('/dashboard/sales-over-time', { params: { days } }).then(r => r.data)
export const getProfitByProfession = ()           => api.get('/dashboard/profit-by-profession').then(r => r.data)
export const getTopItems           = (limit = 10) => api.get('/dashboard/top-items', { params: { limit } }).then(r => r.data)

// Traits
export const getTraits              = ()                       => api.get('/traits').then(r => r.data)
export const getRecipeTraitPrices   = (recipeId)               => api.get(`/recipes/${recipeId}/trait-prices`).then(r => r.data)
export const upsertRecipeTraitPrices = (recipeId, prices)      => api.put(`/recipes/${recipeId}/trait-prices`, prices).then(r => r.data)
export const deleteRecipeTraitPrice  = (recipeId, traitId)     => api.delete(`/recipes/${recipeId}/trait-prices/${traitId}`).then(r => r.data)

// Seed
export const seedDatabase = () => api.post('/seed').then(r => r.data)
