import { useEffect, useMemo, useState } from 'react';
import {
  getTrendingBooks,
  getBooksByDecade,
  getAuthorMostRead,
  getPersonalizedCarousels,
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
  const [librosAutor, setLibrosAutor] = useState([]);
  const [autorMasLeidoNombre, setAutorMasLeidoNombre] = useState(null);
  const [personalizedCarousels, setPersonalizedCarousels] = useState([]);
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
    const fetchLibrosAutor = async () => {
      if (!user?.correo) {
        setLibrosAutor([]);
        setAutorMasLeidoNombre('Inicia sesión para ver recomendaciones');
        return;
      }

      setAutorMasLeidoNombre('Cargando recomendaciones...');

      try {
        const data = await getAuthorMostRead(user.correo);

        if (data?.libros) {
          setLibrosAutor(normalizeBookList(data.libros));
          const nombre = data.message?.match?.(/Libros de tu autor más leído: (.+)/);
          setAutorMasLeidoNombre(nombre ? nombre[1] : 'Más Libros del Autor');
        } else {
          setLibrosAutor([]);
          setAutorMasLeidoNombre(data?.message || 'No hay recomendaciones');
        }
      } catch (error) {
        console.error('Error cargando libros del autor más leído:', error);
        setLibrosAutor([]);
        setAutorMasLeidoNombre('Error al cargar las recomendaciones');
      }
    };

    fetchLibrosAutor();
  }, [user?.correo]);

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

  const bookCarousels = useMemo(() => {
    const carousels = [
      { id: 'tendencias', title: 'Novedades y Tendencias', books: librosTendencias },
      {
        id: 'autor',
        title: autorMasLeidoNombre || 'Recomendaciones Personalizadas',
        books: librosAutor,
      },
    ];

    if (user?.id && recommendationStatus === 'ready') {
      carousels.push(...personalizedCarousels);
    } else if (!user?.id && Array.isArray(librosPorDecada) && librosPorDecada.length > 0) {
      carousels.push(...librosPorDecada.map((group, index) => ({
        id: `decada-${group.decade ?? index}`,
        title: getDecadeTitle(group.decade),
        books: normalizeBookList(group.libros),
      })));
    }

    return carousels;
  }, [autorMasLeidoNombre, librosAutor, librosPorDecada, librosTendencias, personalizedCarousels, recommendationStatus, user?.id]);

  return {
    librosTendencias,
    librosAutor,
    autorMasLeidoNombre,
    recommendationStatus,
    librosPorDecada,
    generoSeleccionado,
    setGeneroSeleccionado,
    bookCarousels,
  };
}

export default usePrincipal;
