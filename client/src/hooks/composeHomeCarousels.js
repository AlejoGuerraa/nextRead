function has_carousel_content(carousel) {
  const books = Array.isArray(carousel.books) ? carousel.books.length : 0;
  const authors = Array.isArray(carousel.authors) ? carousel.authors.length : 0;
  return books > 0 || authors > 0;
}

export function compose_home_carousels({
  globalCarousels = [],
  personalizedCarousels = [],
  contextualCarousels = [],
  publicDecadeCarousels = [],
  userId,
  recommendationStatus,
}) {
  const carousels = [...globalCarousels];

  if (userId) {
    if (recommendationStatus === 'ready') {
      carousels.push(...personalizedCarousels);
    }
    carousels.push(...contextualCarousels);
  } else {
    carousels.push(...publicDecadeCarousels);
  }

  return carousels.filter(has_carousel_content);
}
