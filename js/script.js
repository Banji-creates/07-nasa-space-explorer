const apiKey = 'w0ppj9eAxaE3MYENhboVNKbD4lpipb82N3sv76Ex';
const gallery = document.getElementById('gallery');
const fetchButton = document.getElementById('fetchButton');
const modal = document.getElementById('imageModal');
const modalMedia = document.getElementById('modalMedia');
const modalTitle = document.getElementById('modalTitle');
const modalDate = document.getElementById('modalDate');
const modalExplanation = document.getElementById('modalExplanation');
const modalClose = document.querySelector('.modal-close');

const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');
const factTextEl = document.getElementById('factText');

// Call the setupDateInputs function from dateRange.js
// This sets up the date pickers to:
// - Default to a range of 9 days (from 9 days ago to today)
// - Restrict dates to NASA's image archive (starting from 1995)
setupDateInputs(startInput, endInput);

// Random space facts to show on load
const spaceFacts = [
  "A day on Venus is longer than a year on Venus.",
  "Neutron stars can spin up to 700 times per second.",
  "There are more stars in the observable universe than grains of sand on Earth.",
  "Mars has the largest volcano in the solar system: Olympus Mons.",
  "A teaspoon of a neutron star would weigh about 6 billion tons.",
  "Saturn could float in water because it's mostly gas (but there's no bathtub big enough!).",
  "Light from the Sun takes about 8 minutes and 20 seconds to reach Earth.",
  "Jupiter's magnetic field is 20,000 times stronger than Earth's.",
];

function showRandomFact() {
  if (!factTextEl) return;
  const idx = Math.floor(Math.random() * spaceFacts.length);
  factTextEl.textContent = spaceFacts[idx];
}

// Show a random fact when the app loads
showRandomFact();

fetchButton.addEventListener('click', () => {
  const startDate = startInput.value;
  const endDate = endInput.value;

  if (!startDate || !endDate) {
    showPlaceholder('Please choose both a start and end date before searching.');
    return;
  }

  fetchApodImages(startDate, endDate);
});

modalClose.addEventListener('click', closeModal);
modal.addEventListener('click', (event) => {
  if (event.target === modal) {
    closeModal();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && modal.classList.contains('open')) {
    closeModal();
  }
});

function fetchApodImages(startDate, endDate) {
  const url = `https://api.nasa.gov/planetary/apod?api_key=${apiKey}&start_date=${startDate}&end_date=${endDate}`;

  gallery.innerHTML = `
    <div class="placeholder">
      <div class="placeholder-icon">🔄</div>
      <p>Loading space photos…</p>
    </div>
  `;

  fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error('Unable to load images from NASA.');
      }
      return response.json();
    })
    .then((data) => {
      if (!Array.isArray(data) || data.length === 0) {
        showPlaceholder('No images found for that date range. Try a different range.');
        return;
      }

      const results = data
        .filter((item) => item.media_type === 'image' || item.media_type === 'video')
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      if (results.length === 0) {
        showPlaceholder('The NASA APOD results include no displayable items. Try a different date range.');
        return;
      }

      renderGallery(results);
    })
    .catch((error) => {
      console.error(error);
      showPlaceholder('There was a problem fetching NASA images. Please try again later.');
    });
}

function renderGallery(items) {
  gallery.innerHTML = '';

  items.forEach((item) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'gallery-item';

    if (item.media_type === 'image') {
      card.innerHTML = `
        <img src="${item.url}" alt="${item.title}" />
        <div>
          <h3>${item.title}</h3>
          <p>${item.date}</p>
        </div>
      `;
    } else {
      // Video entry: try to get a thumbnail, otherwise show a generic play placeholder
      const thumb = getThumbnailForVideo(item) || '';
      const thumbImg = thumb
        ? `<div class="video-thumb"><img src="${thumb}" alt="${item.title}" /><div class="video-play">▶</div></div>`
        : `<div class="video-thumb"><div class="video-play-large">▶</div></div>`;

      card.innerHTML = `
        ${thumbImg}
        <div>
          <h3>${item.title}</h3>
          <p>${item.date}</p>
        </div>
      `;
    }

    card.addEventListener('click', () => openModal(item));
    gallery.appendChild(card);
  });
}

function openModal(item) {
  // Clear previous media
  modalMedia.innerHTML = '';

  if (item.media_type === 'image') {
    const img = document.createElement('img');
    img.src = item.url;
    img.alt = item.title;
    modalMedia.appendChild(img);
  } else if (item.media_type === 'video') {
    // Try to embed when possible
    const embed = getEmbedForVideo(item.url);
    if (embed.type === 'iframe') {
      const iframe = document.createElement('iframe');
      iframe.src = embed.src;
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      iframe.allowFullscreen = true;
      modalMedia.appendChild(iframe);
    } else if (embed.type === 'video') {
      const video = document.createElement('video');
      video.controls = true;
      const source = document.createElement('source');
      source.src = embed.src;
      video.appendChild(source);
      modalMedia.appendChild(video);
    } else {
      // Fallback: provide a clear link to open the video in a new tab
      const link = document.createElement('a');
      link.href = item.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = 'Open video in a new tab';
      link.className = 'external-video-link';
      modalMedia.appendChild(link);
    }
  }

  modalTitle.textContent = item.title;
  modalDate.textContent = item.date;
  modalExplanation.textContent = item.explanation || 'No explanation available for this item.';
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
}

// Helpers for video handling
function getThumbnailForVideo(item) {
  // Use NASA-provided thumbnail_url when available
  if (item.thumbnail_url) return item.thumbnail_url;
  if (!item.url) return null;
  // YouTube short/long link support
  const ytId = extractYouTubeId(item.url);
  if (ytId) return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
  return null;
}

function extractYouTubeId(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1);
    if (u.hostname.includes('youtube.com')) return u.searchParams.get('v');
  } catch (e) {
    return null;
  }
  return null;
}

function getEmbedForVideo(url) {
  if (!url) return { type: 'link' };
  // YouTube
  const ytId = extractYouTubeId(url);
  if (ytId) return { type: 'iframe', src: `https://www.youtube.com/embed/${ytId}` };

  // Vimeo (direct embed)
  try {
    const u = new URL(url);
    if (u.hostname.includes('vimeo.com')) {
      // transform vimeo.com/123 -> https://player.vimeo.com/video/123
      const parts = u.pathname.split('/').filter(Boolean);
      const id = parts.pop();
      if (id) return { type: 'iframe', src: `https://player.vimeo.com/video/${id}` };
    }
  } catch (e) {
    /* ignore */
  }

  // Direct video file (mp4, webm)
  if (url.match(/\.(mp4|webm|ogg)(\?|$)/i)) return { type: 'video', src: url };

  // Otherwise, cannot embed reliably — return link fallback
  return { type: 'link' };
}

function closeModal() {
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
}

function showPlaceholder(message) {
  gallery.innerHTML = `
    <div class="placeholder">
      <div class="placeholder-icon">🔭</div>
      <p>${message}</p>
    </div>
  `;
}
