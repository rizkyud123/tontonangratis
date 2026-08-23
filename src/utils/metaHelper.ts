export interface MetaDataOptions {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}

/**
 * Updates the document title and Open Graph / Twitter Card meta tags dynamically.
 * This ensures that browser title, browser native share dialogs (navigator.share),
 * and client-side web sharing use the exact active movie or video thumbnail.
 */
export function updateDocumentMeta(options: MetaDataOptions) {
  if (typeof document === 'undefined') return;

  const defaultTitle = 'Tontonan Gratis - Streaming Film HD & Live TV';
  const defaultDesc = 'Nonton film streaming gratis tanpa batas dengan pemutar video embed berkualitas tinggi dan shortlink otomatis.';
  const defaultImage = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200&auto=format&fit=crop&q=80';

  const title = options.title ? `${options.title} - Tontonan Gratis` : defaultTitle;
  const description = options.description || defaultDesc;
  const image = options.image || defaultImage;
  const url = options.url || (typeof window !== 'undefined' ? window.location.href : '');

  // Update Page Title
  document.title = title;

  // Helper to update or create meta tags
  const setMetaTag = (attrName: string, attrValue: string, content: string) => {
    let element = document.querySelector(`meta[${attrName}="${attrValue}"]`);
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute(attrName, attrValue);
      document.head.appendChild(element);
    }
    element.setAttribute('content', content);
  };

  // Standard Meta
  setMetaTag('name', 'description', description);

  // Open Graph
  setMetaTag('property', 'og:title', title);
  setMetaTag('property', 'og:description', description);
  setMetaTag('property', 'og:image', image);
  setMetaTag('property', 'og:image:secure_url', image);
  setMetaTag('property', 'og:url', url);
  setMetaTag('property', 'og:type', options.type || 'video.movie');
  setMetaTag('property', 'og:site_name', 'Tontonan Gratis');

  // Twitter Card
  setMetaTag('name', 'twitter:card', 'summary_large_image');
  setMetaTag('name', 'twitter:title', title);
  setMetaTag('name', 'twitter:description', description);
  setMetaTag('name', 'twitter:image', image);
}
