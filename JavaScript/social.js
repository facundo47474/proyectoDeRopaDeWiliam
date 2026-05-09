/**
 * instagram-section.js
 * Urban Hustler Indumentaria — Sección Instagram
 *
 * Funcionalidades:
 *  1. Animación de entrada al hacer scroll (IntersectionObserver)
 *  2. Función helper para reemplazar imágenes de los posts fácilmente
 */

/* ============================================================
   1. ANIMACIÓN DE ENTRADA AL HACER SCROLL
   ============================================================ */

/* ============================================================
   2. HELPER PARA ACTUALIZAR LAS IMÁGENES DE LOS POSTS
   ============================================================
   USO:
     Llamá a setInstagramPosts() con un array de URLs de imágenes
     (pueden ser URLs externas o rutas locales).
     También podés pasar un href distinto por post (link individual).

   EJEMPLO:
     setInstagramPosts([
       { src: 'https://tudominio.com/img/post1.jpg', href: 'https://www.instagram.com/p/ABC123/' },
       { src: 'https://tudominio.com/img/post2.jpg' },
       { src: './images/post3.jpg' },
       // ... hasta 9 items
     ]);
   ============================================================ */
function setInstagramPosts(posts) {
  if (!Array.isArray(posts) || posts.length === 0) {
    console.warn('[Instagram Section] Pasá un array de posts con { src, href? }');
    return;
  }

  const items = document.querySelectorAll('.ig-item');

  items.forEach((item, index) => {
    const post = posts[index];
    if (!post) return;

    const img = item.querySelector('img');

    // Actualizar src y alt
    if (post.src) {
      img.src = post.src;
      img.alt = post.alt || `Post Instagram ${index + 1}`;
    }

    // Actualizar href si se especificó uno individual
    if (post.href) {
      item.href = post.href;
    }
  });
}

// Exponer globalmente para uso externo
window.setInstagramPosts = setInstagramPosts;


/* ============================================================
   EJEMPLO DE USO RÁPIDO (descomenta y completá con tus URLs):
   ============================================================

setInstagramPosts([
  { src: './images/ig1.jpg', href: 'https://www.instagram.com/p/POST_ID_1/' },
  { src: './images/ig2.jpg', href: 'https://www.instagram.com/p/POST_ID_2/' },
  { src: './images/ig3.jpg', href: 'https://www.instagram.com/p/POST_ID_3/' },
  { src: './images/ig4.jpg', href: 'https://www.instagram.com/p/POST_ID_4/' },
  { src: './images/ig5.jpg', href: 'https://www.instagram.com/p/POST_ID_5/' },
  { src: './images/ig6.jpg', href: 'https://www.instagram.com/p/POST_ID_6/' },
  { src: './images/ig7.jpg', href: 'https://www.instagram.com/p/POST_ID_7/' },
  { src: './images/ig8.jpg', href: 'https://www.instagram.com/p/POST_ID_8/' },
  { src: './images/ig9.jpg', href: 'https://www.instagram.com/p/POST_ID_9/' },
]);

============================================================ */