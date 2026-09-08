import api from './api';

export const getBookReviews = async (bookId) => {
  const response = await api.get(`/nextread/resenas/${bookId}`);
  return response.data;
};

export const createReview = async (bookId, review) => {
  const response = await api.post(`/nextread/resena/${bookId}`, review);
  return response.data;
};

export const likeReview = async (reviewId) => {
  const response = await api.post(`/nextread/resena/${reviewId}/like`);
  return response.data;
};

export const unlikeReview = async (reviewId) => {
  const response = await api.delete(`/nextread/resena/${reviewId}/like`);
  return response.data;
};

export const deleteOwnReview = async (reviewId) => {
  const response = await api.delete(`/nextread/resena/${reviewId}`);
  return response.data;
};

export const createReviewReply = async (reviewId, comentario) => {
  const response = await api.post(`/nextread/resena/${reviewId}/respuestas`, { comentario });
  return response.data;
};

export const deleteReviewAsAdmin = async (reviewId, descargo) => {
  const response = await api.delete(`/nextread/admin/resena/${reviewId}`, { data: { descargo } });
  return response.data;
};