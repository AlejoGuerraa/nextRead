import { useEffect, useMemo, useState } from 'react';
import {
  getTrendingBooks,
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
  const [librosTendencias, setLibrosTendencias] = useState([]);
  const [personalizedCarousels, setPersonalizedCarousels] = useState([]);
  const [contextualCarousels, setContextualCarousels] = useState([]);
  const [recommendationStatus, setRecommendationStatus] = useState('idle');
  const [librosPorDecada, setLibrosPorDecada] = useState([]);
  const [generoSeleccionado, setGeneroSeleccionado] = useState('Género...');

  useEffect(() => {
    const fetchTendencias = async () => {
      try {
        const params = {};
        if (generoSeleccionado && generoSeleccionado !== 'Género...') {
          params.genero = generoSeleccionado;
        }

        const data = await getTrendingBooks(params);
        setLibrosTendencias(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error cargando los libros de tendencias:', error);
        setLibrosTendencias([]);
      }
    };

    fetchTendencias();
  }, [generoSeleccionado]);

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
    const carousels = [];
    if (librosTendencias.length > 0) {
      carousels.push({
        id: 'tendencias',
        title: 'Tendencias de lectura',
        books: librosTendencias,
      });
    }

    if (user?.id && recommendationStatus === 'ready') {
      carousels.push(...personalizedCarousels);
    } else if (!user?.id && Array.isArray(librosPorDecada) && librosPorDecada.length > 0) {
      carousels.push(...librosPorDecada.map((group, index) => ({
        id: `decada-${group.decade ?? index}`,
        title: getDecadeTitle(group.decade),
        books: normalizeBookList(group.libros),
      })));
    }
    if (user?.id) carousels.push(...contextualCarousels);

    return carousels;
  }, [contextualCarousels, librosPorDecada, librosTendencias, personalizedCarousels, recommendationStatus, user?.id]);

  return {
    librosTendencias,
    recommendationStatus,
    librosPorDecada,
    generoSeleccionado,
    setGeneroSeleccionado,
    bookCarousels,
  };
}

export default usePrincipal;
