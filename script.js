const menuButton = document.querySelector(".menu-button");
const siteNav = document.querySelector(".site-nav");
const lightbox = document.querySelector(".lightbox");
const lightboxImage = lightbox?.querySelector("img");
const lightboxTitle = lightbox?.querySelector("p");
const lightboxClose = lightbox?.querySelector(".lightbox-close");
const lightboxPrev = document.createElement("button");
const lightboxNext = document.createElement("button");
let lightboxItems = [];
let lightboxIndex = 0;
const galleryGroups = {
  collage: { title: "Collage", count: 6 },
  olja: { title: "Olja", count: 65 },
  litografi: { title: "Litografi", count: 7 },
  skulptur: { title: "Skulptur", count: 25 },
  akvarell: { title: "Akvarell", count: 8 },
  teckning: { title: "Teckning", count: 2 },
};
const galleryDraft = (() => {
  try {
    return JSON.parse(window.localStorage.getItem("kam-site-content-draft"))?.galleries || {};
  } catch {
    return {};
  }
})();
const galleryContent = window.kamSiteContent?.galleries || {};

Object.entries(galleryGroups).forEach(([key, gallery]) => {
  const container = document.querySelector(`[data-gallery-section="${key}"]`);
  if (!container) return;

  const fragment = document.createDocumentFragment();
  for (let index = 1; index <= gallery.count; index += 1) {
    const number = String(index).padStart(2, "0");
    const src = `assets/gallery/${key}/${number}.jpg`;
    const button = document.createElement("button");
    const image = document.createElement("img");

    button.className = "art-image";
    button.type = "button";
    button.setAttribute("data-full", src);
    button.setAttribute("data-title", `${gallery.title} ${index}`);

    image.src = src;
    image.alt = `${gallery.title} ${index}`;
    image.loading = "lazy";

    button.append(image);
    fragment.append(button);
  }

  [...(galleryContent[key] || []), ...(galleryDraft[key] || [])].forEach((item, index) => {
    const button = document.createElement("button");
    const image = document.createElement("img");
    const title = item.title || `${gallery.title} ${gallery.count + index + 1}`;

    button.className = "art-image";
    button.type = "button";
    button.setAttribute("data-full", item.image || "");
    button.setAttribute("data-title", title);

    image.src = item.image || "";
    image.alt = item.alt || title;
    image.loading = "lazy";

    button.append(image);
    fragment.append(button);
  });
  container.append(fragment);
});

const archiveGrid = document.querySelector("#archive-grid");
const instagramFeed = document.querySelector("#instagram-feed");

function getImageSource(imageData) {
  if (!imageData) return "";
  return typeof imageData === "string" ? imageData : imageData.src;
}

function renderInstagramPosts(posts) {
  if (!instagramFeed || !Array.isArray(posts)) return;

  instagramFeed.replaceChildren();

  const createPost = (post, isFeatured = false) => {
    const article = document.createElement("article");
    const imageWrap = document.createElement("a");
    const image = document.createElement("img");
    const meta = document.createElement("p");
    const title = document.createElement("h3");
    const caption = document.createElement("p");

    article.className = isFeatured ? "instagram-post instagram-post-featured" : "instagram-post";
    imageWrap.className = "instagram-post-image";
    imageWrap.href = post.url || "https://www.instagram.com/kristina.a.malmberg/";
    imageWrap.target = "_blank";
    imageWrap.rel = "noreferrer";

    image.src = post.image;
    image.alt = post.title;
    image.loading = "lazy";

    meta.className = "date";
    title.textContent = post.title;
    caption.textContent = post.caption || "";
    meta.textContent = [post.category, post.date].filter(Boolean).join(" | ");

    imageWrap.append(image);
    article.append(imageWrap, meta, title, caption);
    return article;
  };

  posts.slice(0, 5).forEach((post, index) => {
    instagramFeed.append(createPost(post, index === 0));
  });

  const accountLink = document.createElement("a");

  accountLink.className = "instagram-account-link";
  accountLink.href = "https://www.instagram.com/kristina.a.malmberg/";
  accountLink.target = "_blank";
  accountLink.rel = "noreferrer";
  accountLink.textContent = "Se fler inlägg på Instagram";
  instagramFeed.append(accountLink);
}

if (instagramFeed) {
  renderInstagramPosts(window.instagramPosts);
}

if (archiveGrid && Array.isArray(window.archivePosts)) {
  const fragment = document.createDocumentFragment();
  const archiveModal = document.createElement("dialog");
  const archiveModalBody = document.createElement("div");
  const archiveModalClose = document.createElement("button");

  archiveModal.className = "archive-modal";
  archiveModalBody.className = "archive-modal-body";
  archiveModalClose.className = "archive-modal-close";
  archiveModalClose.type = "button";
  archiveModalClose.setAttribute("aria-label", "Stäng inlägg");
  archiveModalClose.textContent = "×";
  archiveModal.append(archiveModalClose, archiveModalBody);
  document.body.append(archiveModal);

  window.archivePosts.forEach((post) => {
    const card = document.createElement("article");
    const cardButton = document.createElement("button");
    const thumbnail = document.createElement("span");
    const meta = document.createElement("span");
    const title = document.createElement("strong");
    const excerpt = document.createElement("span");
    const firstImage = getImageSource(post.thumbnail || post.images?.[0]);

    card.className = "archive-card";
    cardButton.className = "archive-card-button";
    cardButton.type = "button";
    thumbnail.className = "archive-card-thumbnail";
    meta.className = "date";
    title.className = "archive-card-title";
    excerpt.className = "archive-card-excerpt";

    const useTextCard = () => {
      thumbnail.replaceChildren();
      card.classList.add("archive-card-no-image");
    };

    if (firstImage) {
      const image = document.createElement("img");
      image.src = firstImage;
      image.alt = post.title;
      image.loading = "lazy";
      image.addEventListener("error", useTextCard, { once: true });
      thumbnail.append(image);
    } else {
      useTextCard();
    }

    meta.textContent = post.date;
    title.textContent = post.title;
    excerpt.textContent = post.excerpt || "";

    cardButton.append(thumbnail, meta, title, excerpt);
    card.append(cardButton);

    cardButton.addEventListener("click", () => {
      archiveModalBody.replaceChildren();

      const modalHeader = document.createElement("header");
      const modalMeta = document.createElement("p");
      const modalTitle = document.createElement("h2");
      const text = document.createElement("div");
      const links = document.createElement("div");
      const gallery = document.createElement("div");
      const contentHtml = post.contentHtml || "";

      modalHeader.className = "archive-modal-header";
      modalMeta.className = "date";
      modalTitle.className = "archive-modal-title";
      text.className = "archive-card-text";
      links.className = "archive-link-grid";
      gallery.className = "archive-gallery";

      modalMeta.textContent = post.date;
      modalTitle.textContent = post.title;
      text.innerHTML = contentHtml;
      modalHeader.append(modalMeta, modalTitle);

      post.links?.forEach((link) => {
        if (!link.href) return;

        const anchor = document.createElement("a");
        const label = document.createElement("strong");
        const url = document.createElement("span");

        anchor.className = "archive-link-card";
        anchor.href = link.href;
        anchor.target = "_blank";
        anchor.rel = "noreferrer";
        label.textContent = link.label || link.href;

        try {
          const parsedUrl = new URL(link.href);
          url.textContent = parsedUrl.hostname.replace(/^www\./, "");
        } catch {
          url.textContent = link.href;
        }

        anchor.append(label, url);
        links.append(anchor);
      });

      post.images?.forEach((imageData, imageIndex) => {
        const button = document.createElement("button");
        const image = document.createElement("img");
        const imageSrc = getImageSource(imageData);

        if (!imageSrc) return;

        button.className = "art-image";
        button.type = "button";
        button.setAttribute("data-full", imageSrc);
        button.setAttribute("data-title", `${post.title} ${imageIndex + 1}`);

        image.src = imageSrc;
        image.alt = post.title;
        image.loading = "lazy";
        image.addEventListener("error", () => button.remove(), { once: true });

        button.append(image);
        gallery.append(button);
      });

      archiveModalBody.append(modalHeader);
      if (contentHtml) archiveModalBody.append(text);
      if (post.links?.length) archiveModalBody.append(links);
      if (post.images?.length) archiveModalBody.append(gallery);
      archiveModal.showModal();
    });

    fragment.append(card);
  });

  archiveGrid.append(fragment);

  archiveModalClose.addEventListener("click", () => archiveModal.close());
  archiveModal.addEventListener("click", (event) => {
    if (event.target === archiveModal) {
      archiveModal.close();
    }
  });
}

if (lightbox) {
  lightboxPrev.className = "lightbox-nav lightbox-prev";
  lightboxPrev.type = "button";
  lightboxPrev.setAttribute("aria-label", "Föregående bild");
  lightboxPrev.textContent = "‹";

  lightboxNext.className = "lightbox-nav lightbox-next";
  lightboxNext.type = "button";
  lightboxNext.setAttribute("aria-label", "Nästa bild");
  lightboxNext.textContent = "›";

  lightbox.append(lightboxPrev, lightboxNext);
}

menuButton?.addEventListener("click", () => {
  const isOpen = siteNav.classList.toggle("is-open");
  menuButton.setAttribute("aria-expanded", String(isOpen));
});

siteNav?.addEventListener("click", (event) => {
  if (event.target instanceof HTMLAnchorElement) {
    siteNav.classList.remove("is-open");
    menuButton?.setAttribute("aria-expanded", "false");
  }
});

window.addEventListener("hashchange", () => {
  siteNav?.classList.remove("is-open");
  menuButton?.setAttribute("aria-expanded", "false");
});

document.addEventListener("click", (event) => {
  const button = event.target instanceof Element ? event.target.closest(".art-image") : null;
  if (!(button instanceof HTMLButtonElement)) return;
  if (!lightbox || !lightboxImage || !lightboxTitle) return;

  const gallery = button.closest(".archive-gallery, .category-page-gallery, .technique-gallery, .gallery-grid, .hero-gallery");
  lightboxItems = Array.from(gallery?.querySelectorAll(".art-image") || document.querySelectorAll(".art-image"));
  lightboxIndex = Math.max(0, lightboxItems.indexOf(button));
  showLightboxItem(lightboxIndex);
  lightbox.showModal();
});

lightboxClose?.addEventListener("click", () => lightbox?.close());

function showLightboxItem(index) {
  if (!lightboxImage || !lightboxTitle || lightboxItems.length === 0) return;

  lightboxIndex = (index + lightboxItems.length) % lightboxItems.length;
  const item = lightboxItems[lightboxIndex];
  const src = item.getAttribute("data-full");
  const title = item.getAttribute("data-title") || "";

  if (!src) return;

  lightboxImage.src = src;
  lightboxImage.alt = title;
  lightboxTitle.textContent = title;
}

lightboxPrev.addEventListener("click", (event) => {
  event.stopPropagation();
  showLightboxItem(lightboxIndex - 1);
});

lightboxNext.addEventListener("click", (event) => {
  event.stopPropagation();
  showLightboxItem(lightboxIndex + 1);
});

lightbox?.addEventListener("click", (event) => {
  if (event.target === lightbox) {
    lightbox.close();
  }
});

document.addEventListener("keydown", (event) => {
  if (lightbox?.open && event.key === "ArrowLeft") {
    showLightboxItem(lightboxIndex - 1);
  }

  if (lightbox?.open && event.key === "ArrowRight") {
    showLightboxItem(lightboxIndex + 1);
  }

  if (event.key === "Escape") {
    siteNav?.classList.remove("is-open");
    menuButton?.setAttribute("aria-expanded", "false");
  }
});
