import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/header';
import Footer from '../components/footer';
import BookCard from '../components/cardLibro';
import { useAuth } from '../hooks/useAuth';
import { getAuthorDetails } from '../services/booksService';
import '../pagescss/carrouselLibros.css';
import './AuthorPage.css';

const PAGE_SIZE = 50;

export default function AuthorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [author, setAuthor] = useState(null);
  const [books, setBooks] = useState([]);
  const [nextPage, setNextPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isActive = true;

    const fetchAuthor = async () => {
      setLoading(true);
      setError('');
      setAuthor(null);
      setBooks([]);
      setNextPage(1);
      setHasMore(false);

      try {
        const data = await getAuthorDetails(id, { limit: PAGE_SIZE, page: 1 });
        if (!isActive) return;
        setAuthor(data.autor);
        setBooks(Array.isArray(data.libros) ? data.libros : []);
        setHasMore(data.hasMore === true);
        setNextPage(data.nextPage || 1);
      } catch (requestError) {
        console.error('Error loading author page:', requestError);
        if (isActive) setError('No se pudieron cargar los datos del autor.');
      } finally {
        if (isActive) setLoading(false);
      }
    };

    fetchAuthor();
    return () => {
      isActive = false;
    };
  }, [id]);

  const loadMoreBooks = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    setError('');

    try {
      const data = await getAuthorDetails(id, {
        limit: PAGE_SIZE,
        page: nextPage,
      });
      setBooks((currentBooks) => {
        const existingIds = new Set(currentBooks.map((book) => Number(book.id)));
        return [
          ...currentBooks,
          ...(Array.isArray(data.libros) ? data.libros : [])
            .filter((book) => !existingIds.has(Number(book.id))),
        ];
      });
      setHasMore(data.hasMore === true);
      setNextPage(data.nextPage || nextPage);
    } catch (requestError) {
      console.error('Error loading more author books:', requestError);
      setError('No se pudieron cargar más libros.');
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, id, loadingMore, nextPage]);

  return (
    <div className="author-page">
      <Header user={user} />
      <main className="author-page-main">
        {loading ? (
          <p role="status">Cargando autor...</p>
        ) : error && !author ? (
          <p role="alert">{error}</p>
        ) : author ? (
          <>
            <header className="author-page-header">
              {author.url_cara ? (
                <img src={author.url_cara} alt="" className="author-page-image" />
              ) : null}
              <h1>{author.nombre}</h1>
            </header>
            <section aria-label={`Libros de ${author.nombre}`}>
              {books.length > 0 ? (
                <div className="author-books-grid">
                  {books.map((book) => (
                    <BookCard
                      book={book}
                      key={book.id}
                      onClick={(bookId) => navigate(`/libro/${bookId}`)}
                    />
                  ))}
                </div>
              ) : (
                <p>No hay libros disponibles para este autor.</p>
              )}
              {error ? <p role="alert">{error}</p> : null}
              {hasMore ? (
                <button
                  className="author-load-more"
                  disabled={loadingMore}
                  onClick={loadMoreBooks}
                  type="button"
                >
                  {loadingMore ? 'Cargando...' : 'Cargar más libros'}
                </button>
              ) : null}
            </section>
          </>
        ) : (
          <p role="alert">Autor no encontrado.</p>
        )}
      </main>
      <Footer />
    </div>
  );
}
