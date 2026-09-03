import { useEffect, useMemo, useState } from 'react';
import {
  getTrendingBooks,
  getBooksByDecade,
  getDecadesPersonalizadas,
  getAuthorMostRead,
  getBooksByUserGenre,
  getBookById,
  getRecommendationsForBook,
} from '../services/booksService';

const generosRotativos = [
  { genero: 'Aventura', titulo: 'Libros para aventurarse' },
  { genero: 'Romance', titulo: 'Libros para volver a enamorarse' },
  { genero: 'Fantasía', titulo: 'Historias mágicas para escapar' },
  { genero: 'Terror', titulo: 'Para no dormir nunca más' },
  { genero: 'Ciencia Ficción', titulo: 'Explora nuevos mundos' },
  { genero: 'Misterio', titulo: 'Intriga y suspenso' },
  { genero: 'Histórico', titulo: 'Viajes al pasado' },
  { genero: 'Poesía', titulo: 'Versos que inspiran' },
  { genero: 'Clásicos', titulo: 'Obras que perduran' },
  { genero: 'No Ficción', titulo: 'Conocimiento y realidad' },
  { genero: 'Infantil', titulo: 'Cuentos para los más pequeños' },
  { genero: 'Épico', titulo: 'Grandes sagas para grandes lectores' },
  { genero: 'Filosófico', titulo: 'Reflexiones profundas' },
  { genero: 'Gótico', titulo: 'Oscuridad y romance' },
];

const normalizeBookList = (value) => {
  if (Array.isArray(value)) return value;
  return [];
};

const normalizeReadList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

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
  const [generoUsuario, setGeneroUsuario] = useState(null);
  const [librosGeneroUsuario, setLibrosGeneroUsuario] = useState([]);
  const [librosRecomendados, setLibrosRecomendados] = useState([]);
  const [ultimoLibroObj, setUltimoLibroObj] = useState(null);
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
      if (!user?.correo) {
        try {
          const data = await getBooksByDecade();
          setLibrosPorDecada(Array.isArray(data?.decades) ? data.decades.slice(0, 5) : []);
        } catch (error) {
          console.error('Error cargando libros por década:', error);
          setLibrosPorDecada([]);
        }
        return;
      }

      try {
        const data = await getDecadesPersonalizadas(user.correo);
        setLibrosPorDecada(Array.isArray(data?.decades) ? data.decades : []);
      } catch (error) {
        console.error('Error cargando décadas personalizadas:', error);
        setLibrosPorDecada([]);
      }
    };

    fetchDecadasPersonalizadas();
  }, [user?.correo]);

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
    const fetchGeneroUsuario = async () => {
      if (!user?.id) {
        setGeneroUsuario(null);
        setLibrosGeneroUsuario([]);
        return;
      }

      try {
        const data = await getBooksByUserGenre(user.id);
        const genero = data?.generoPreferido || null;
        setGeneroUsuario(genero);
        setLibrosGeneroUsuario(Array.isArray(data?.libros) ? data.libros : []);
      } catch (error) {
        console.error('Error obteniendo género preferido:', error);
        setGeneroUsuario(null);
        setLibrosGeneroUsuario([]);
      }
    };

    fetchGeneroUsuario();
  }, [user?.id]);

  useEffect(() => {
    let isActive = true;

    const fetchRecomendaciones = async () => {
      try {
        if (!user?.id) {
          setLibrosRecomendados([]);
          setUltimoLibroObj(null);
          return;
        }

        const leidos = normalizeReadList(user.libros_leidos);
        if (leidos.length === 0) {
          setLibrosRecomendados([]);
          setUltimoLibroObj(null);
          return;
        }

        const ultimo = leidos[leidos.length - 1];
        const ultimoId = Number(
          typeof ultimo === 'object' && ultimo !== null
            ? ultimo.id ?? ultimo.idLibro ?? ultimo.id_libro ?? 0
            : ultimo
        );

        if (!Number.isInteger(ultimoId) || ultimoId <= 0) {
          setLibrosRecomendados([]);
          setUltimoLibroObj(null);
          return;
        }

        let detalleLibro = null;
        if (typeof ultimo === 'object' && ultimo !== null) {
          const ultimoLibroId = Number(ultimo.id ?? ultimo.idLibro ?? ultimo.id_libro ?? 0);
          if (Number.isInteger(ultimoLibroId) && ultimoLibroId > 0) {
            detalleLibro = {
              ...ultimo,
              id: ultimoLibroId,
            };
          }
        }

        if (!detalleLibro) {
          try {
            detalleLibro = await getBookById(ultimoId);
          } catch (error) {
            console.warn('No se pudo obtener detalle del último libro leído:', error);
          }
        }

        if (isActive) {
          setUltimoLibroObj(detalleLibro || null);
        }

        const data = await getRecommendationsForBook(user.id, ultimoId);

        if (isActive) {
          setLibrosRecomendados(Array.isArray(data?.libros) ? data.libros : []);
        }
      } catch (error) {
        console.error('Error cargando recomendaciones:', error);
        if (isActive) {
          setLibrosRecomendados([]);
        }
      }
    };

    fetchRecomendaciones();

    return () => {
      isActive = false;
    };
  }, [user?.id, user?.libros_leidos]);

  const tituloGenero = useMemo(() => {
    if (!generoUsuario) return null;
    const match = generosRotativos.find((g) => g.genero.toLowerCase() === String(generoUsuario).toLowerCase());
    return match?.titulo || `Recomendados de ${generoUsuario}`;
  }, [generoUsuario]);

  const bookCarousels = useMemo(() => {
    const carousels = [
      { id: 'tendencias', title: 'Novedades y Tendencias', books: librosTendencias },
      {
        id: 'autor',
        title: autorMasLeidoNombre || 'Recomendaciones Personalizadas',
        books: librosAutor,
      },
    ];

    if (librosRecomendados.length > 0) {
      carousels.push({
        id: 'recomendados-ultimo',
        title: ultimoLibroObj?.titulo ? `Porque leíste ${ultimoLibroObj.titulo}` : 'Recomendados para vos',
        books: librosRecomendados,
      });
    }

    if (Array.isArray(librosPorDecada) && librosPorDecada.length > 0) {
      const decades = librosPorDecada.map((group, index) => ({
        id: `decada-${group.decade ?? index}`,
        title: getDecadeTitle(group.decade),
        books: normalizeBookList(group.libros),
      }));

      carousels.push(...decades);
    }

    if (generoUsuario) {
      carousels.push({
        id: 'genero-preferido',
        title: tituloGenero || `Recomendados de ${generoUsuario}`,
        books: librosGeneroUsuario,
      });
    }

    return carousels;
  }, [autorMasLeidoNombre, generoUsuario, librosAutor, librosGeneroUsuario, librosPorDecada, librosRecomendados, librosTendencias, tituloGenero, ultimoLibroObj]);

  return {
    librosTendencias,
    librosAutor,
    autorMasLeidoNombre,
    generoUsuario,
    librosGeneroUsuario,
    librosRecomendados,
    ultimoLibroObj,
    librosPorDecada,
    generoSeleccionado,
    setGeneroSeleccionado,
    tituloGenero,
    bookCarousels,
    generosRotativos,
  };
}

export default usePrincipal;
