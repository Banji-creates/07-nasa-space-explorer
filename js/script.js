const apiKey = 'w0ppj9eAxaE3MYENhboVNKbD4lpipb82N3sv76Ex';
const gallery = document.getElementById('gallery');
const fetchButton = document.getElementById('fetchButton');
const modal = document.getElementById('imageModal');
const modalImage = document.getElementById('modalImage');
const modalTitle = document.getElementById('modalTitle');
const modalDate = document.getElementById('modalDate');
const modalExplanation = document.getElementById('modalExplanation');
const modalClose = document.querySelector('.modal-close');

const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');

// Call the setupDateInputs function from dateRange.js
// This sets up the date pickers to:
// - Default to a range of 9 days (from 9 days ago to today)
// - Restrict dates to NASA's image archive (starting from 1995)
setupDateInputs(startInput, endInput);

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

      const images = data
        .filter((item) => item.media_type === 'image')
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      if (images.length === 0) {
        showPlaceholder('The NASA APOD results include no photos. Try a different date range.');
        return;
      }

      renderGallery(images);
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
    card.innerHTML = `
      <img src="${item.url}" alt="${item.title}" />
      <div>
        <h3>${item.title}</h3>
        <p>${item.date}</p>
      </div>
    `;

    card.addEventListener('click', () => {
      openModal(item);
    });

    gallery.appendChild(card);
  });
}

function openModal(item) {
  modalImage.src = item.url;
  modalImage.alt = item.title;
  modalTitle.textContent = item.title;
  modalDate.textContent = item.date;
  modalExplanation.textContent = item.explanation || 'No explanation available for this photo.';
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
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
