import { useEffect, useMemo, useState } from 'react';
import { compose_home_carousels } from './composeHomeCarousels';
import {
  getGlobalHomeCarousels,
  getBooksByDecade,
  getPersonalizedCarousels,
  getUserContextualCarousels,
} from '../services/booksService';

const normalizeBookList = (value) => {
  if (Array.isArray(value)) return value;
  return [];
};

const getDecadeTitle = (decade) => {
  const raw = String(decade ?? '').replace(/s$/, '');
  if (!raw) return 'Libros de la década';

  if (/^\d{4}$/.test(raw)) {
    return `Libros de los ${raw.slice(2)}`;
  }

  return `Libros de los ${raw}`;
};

export function usePrincipal(user) {
  const [globalCarousels, setGlobalCarousels] = useState([]);
  const [personalizedCarousels, setPersonalizedCarousels] = useState([]);
  const [contextualCarousels, setContextualCarousels] = useState([]);
  const [recommendationStatus, setRecommendationStatus] = useState('idle');
  const [librosPorDecada, setLibrosPorDecada] = useState([]);

  useEffect(() => {
    let isActive = true;

    const fetchGlobalCarousels = async () => {
      try {
        const data = await getGlobalHomeCarousels();
        if (data?.status !== 'ready' || !Array.isArray(data.carousels)) {
          throw new Error('Respuesta inválida de los carruseles globales.');
        }

        if (isActive) {
          setGlobalCarousels(data.carousels
            .filter((carousel) => Array.isArray(carousel.libros))
            .map((carousel) => ({
              id: carousel.id,
              title: carousel.title,
              books: carousel.libros,
              period: carousel.period,
            })));
        }
      } catch (error) {
        console.error('Error cargando carruseles globales:', error);
        if (isActive) setGlobalCarousels([]);
      }
    };

    fetchGlobalCarousels();
    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    const fetchDecadasPersonalizadas = async () => {
      if (user?.id) {
        setLibrosPorDecada([]);
        return;
      }

      try {
        const data = await getBooksByDecade();
        setLibrosPorDecada(Array.isArray(data?.decades) ? data.decades.slice(0, 5) : []);
      } catch (error) {
        console.error('Error cargando libros por década:', error);
        setLibrosPorDecada([]);
      }
    };

    fetchDecadasPersonalizadas();
  }, [user?.id]);

  useEffect(() => {
    let isActive = true;

    const fetchRecomendaciones = async () => {
      if (!user?.id) {
        setPersonalizedCarousels([]);
        setRecommendationStatus('idle');
        return;
      }

      setPersonalizedCarousels([]);
      setRecommendationStatus('loading');

      try {
        const data = await getPersonalizedCarousels();
        if (data?.status === 'pending') {
          if (isActive) {
            setPersonalizedCarousels([]);
            setRecommendationStatus('pending');
          }
          return;
        }

        if (data?.status !== 'ready' || !Array.isArray(data.carousels)) {
          throw new Error('Respuesta inválida del servicio de recomendaciones.');
        }

        if (isActive) {
          setPersonalizedCarousels(data.carousels
            .filter((carousel) => Array.isArray(carousel.libros))
            .map((carousel) => ({
              id: carousel.id,
              title: carousel.title,
              books: carousel.libros,
            })));
          setRecommendationStatus('ready');
        }
      } catch (error) {
        console.error('Error cargando recomendaciones:', error);
        if (isActive) {
          setPersonalizedCarousels([]);
          setRecommendationStatus('error');
        }
      }
    };

    fetchRecomendaciones();

    return () => {
      isActive = false;
    };
  }, [user?.id]);

  useEffect(() => {
    let isActive = true;

    const fetchContextualCarousels = async () => {
      if (!user?.id) {
        setContextualCarousels([]);
        return;
      }

      try {
        const data = await getUserContextualCarousels();
        if (data?.status !== 'ready' || !Array.isArray(data.carousels)) {
          throw new Error('Respuesta inválida de los carruseles de usuario.');
        }

        if (isActive) {
          setContextualCarousels(data.carousels
            .filter((carousel) =>
              carousel.kind === 'authors'
                ? Array.isArray(carousel.autores)
                : Array.isArray(carousel.libros)
            )
            .map((carousel) => ({
              id: carousel.id,
              title: carousel.title,
              kind: carousel.kind,
              books: carousel.libros || [],
              authors: carousel.autores || [],
            })));
        }
      } catch (error) {
        console.error('Error cargando carruseles de usuario:', error);
        if (isActive) setContextualCarousels([]);
      }
    };

    fetchContextualCarousels();
    return () => {
      isActive = false;
    };
  }, [user?.id]);

  const bookCarousels = useMemo(() => {
    const publicDecadeCarousels = !user?.id && Array.isArray(librosPorDecada)
      ? librosPorDecada.map((group, index) => ({
        id: `decada-${group.decade ?? index}`,
        title: getDecadeTitle(group.decade),
        books: normalizeBookList(group.libros),
      }))
      : [];

    return compose_home_carousels({
      globalCarousels,
      personalizedCarousels,
      contextualCarousels,
      publicDecadeCarousels,
      userId: user?.id,
      recommendationStatus,
    });
  }, [contextualCarousels, globalCarousels, librosPorDecada, personalizedCarousels, recommendationStatus, user?.id]);

  return {
    recommendationStatus,
    librosPorDecada,
    bookCarousels,
  };
}

export default usePrincipal;
