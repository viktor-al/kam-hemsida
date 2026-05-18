(function () {
  const draftKey = "kam-site-content-draft";
  const canUseLocalDraft =
    location.protocol === "file:" ||
    ["localhost", "127.0.0.1"].includes(location.hostname);

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function getDraft() {
    if (!canUseLocalDraft) return null;

    try {
      const draft = window.localStorage.getItem(draftKey);
      return draft ? JSON.parse(draft) : null;
    } catch {
      return null;
    }
  }

  function getContent() {
    const content = getDraft() || window.kamSiteContent || {};

    if (content.cv && window.kamSiteContent?.cv?.rawText && !content.cv.rawText) {
      content.cv = {
        ...window.kamSiteContent.cv,
        ...content.cv,
        rawText: window.kamSiteContent.cv.rawText,
      };
    }

    if (
      content.cv?.image === "https://media2.k-a-m.se/2018/03/2018-03-31.png" &&
      window.kamSiteContent?.cv?.image
    ) {
      content.cv.image = window.kamSiteContent.cv.image;
      content.cv.imageAlt = window.kamSiteContent.cv.imageAlt;
    }

    return content;
  }

  function setText(selector, value) {
    const element = document.querySelector(selector);
    if (element && typeof value === "string") {
      element.textContent = value;
    }
  }

  function setLink(selector, text, href) {
    const element = document.querySelector(selector);
    if (!(element instanceof HTMLAnchorElement)) return;
    element.textContent = text;
    element.href = href;
  }

  function renderHeroGallery(works) {
    const gallery = document.querySelector("[data-hero-gallery]");
    if (!gallery || !Array.isArray(works)) return;

    gallery.replaceChildren(
      ...works.slice(0, 4).map((work) => createArtButton(work))
    );
  }

  function renderFeaturedWorks(works) {
    const gallery = document.querySelector("[data-featured-gallery]");
    if (!gallery || !Array.isArray(works)) return;

    const cards = works.map((work) => {
      const article = document.createElement("article");
      const title = document.createElement("h3");
      const medium = document.createElement("p");

      article.className = "art-card";
      title.textContent = work.title || "";
      medium.textContent = work.medium || "";
      article.append(createArtButton(work), title, medium);
      return article;
    });

    gallery.replaceChildren(...cards);
  }

  function createList(items = []) {
    const list = document.createElement("ul");

    items.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      list.append(li);
    });

    return list;
  }

  function createCvSection(id, title, children = []) {
    const section = document.createElement("section");
    const heading = document.createElement("h2");

    section.setAttribute("aria-labelledby", id);
    heading.id = id;
    heading.textContent = title || "";
    section.append(heading, ...children.filter(Boolean));
    return section;
  }

  function paragraph(text) {
    if (!text) return null;
    const p = document.createElement("p");
    p.textContent = text;
    return p;
  }

  function renderCv(cv) {
    const container = document.querySelector("[data-cv-document]");
    if (!container || !cv) return;

    if (cv.rawText) {
      const lines = cv.rawText.split("\n");
      const titleText = lines.shift() || cv.title || "CV";
      const kicker = document.createElement("p");
      const title = document.createElement("h1");
      const figure = document.createElement("figure");
      const image = document.createElement("img");
      const text = document.createElement("div");
      let currentBlock = [];

      function flushBlock() {
        if (currentBlock.length === 0) return;

        const p = document.createElement("p");
        p.textContent = currentBlock.join("\n");
        text.append(p);
        currentBlock = [];
      }

      kicker.className = "section-kicker";
      kicker.textContent = cv.kicker || "CV";
      title.id = "cv-page-title";
      title.textContent = titleText;

      figure.className = "cv-portrait";
      image.src = cv.image || "";
      image.alt = cv.imageAlt || "";
      figure.append(image);

      text.className = "cv-full-text";

      lines.forEach((line) => {
        const trimmed = line.trim();

        if (!trimmed) {
          flushBlock();
          return;
        }

        if (
          /:$/.test(trimmed) ||
          ["Collection exhibitions", "Separate"].includes(trimmed)
        ) {
          flushBlock();
          const heading = document.createElement("h2");
          heading.textContent = trimmed;
          text.append(heading);
          return;
        }

        currentBlock.push(trimmed);
      });

      flushBlock();
      container.replaceChildren(figure, kicker, title, text);
      return;
    }

    const kicker = document.createElement("p");
    const title = document.createElement("h1");
    const figure = document.createElement("figure");
    const image = document.createElement("img");
    const quote = document.createElement("blockquote");
    const email = document.createElement("p");
    const emailLink = document.createElement("a");
    const phone = document.createElement("p");
    const phoneLink = document.createElement("a");

    kicker.className = "section-kicker";
    kicker.textContent = cv.kicker || "CV";
    title.id = "cv-page-title";
    title.textContent = cv.title || "CV";

    figure.className = "cv-portrait";
    image.src = cv.image || "";
    image.alt = cv.imageAlt || "";
    figure.append(image);

    quote.className = "cv-quote";
    quote.textContent = cv.quote || "";

    emailLink.href = `mailto:${cv.contact?.email || ""}`;
    emailLink.textContent = cv.contact?.email || "";
    email.append(emailLink);

    phoneLink.href = `tel:${(cv.contact?.phone || "").replace(/[^\d+]/g, "")}`;
    phoneLink.textContent = cv.contact?.phone || "";
    phone.append(phoneLink);

    container.replaceChildren(
      kicker,
      title,
      figure,
      createCvSection("cv-born", cv.bornTitle, [createList(cv.mediums)]),
      createCvSection("cv-represented", cv.representedTitle, [
        paragraph(cv.representedText),
        quote,
      ]),
      createCvSection("cv-education", cv.educationTitle, [createList(cv.education)]),
      createCvSection("cv-upcoming", cv.upcomingTitle, [
        paragraph(cv.upcomingIntro),
        createList(cv.upcoming),
      ]),
      createCvSection("cv-solo", cv.soloTitle, [createList(cv.solo)]),
      createCvSection("cv-group", cv.groupTitle, [createList(cv.group)]),
      createCvSection("cv-contact", cv.contactTitle, [
        email,
        phone,
        paragraph(cv.contact?.facebook),
      ])
    );
  }

  function createArtButton(work) {
    const button = document.createElement("button");
    const image = document.createElement("img");

    button.className = "art-image";
    button.type = "button";
    button.setAttribute("data-full", work.image || "");
    button.setAttribute("data-title", work.title || "");

    image.src = work.image || "";
    image.alt = work.alt || work.title || "";
    image.loading = "lazy";

    button.append(image);
    return button;
  }

  function applyContent(content = getContent()) {
    const home = content.home;
    if (!home) return;

    setText("[data-home-hero-kicker]", home.hero?.kicker);
    setText("[data-home-hero-title]", home.hero?.title);
    setText("[data-home-hero-text]", home.hero?.text);
    setLink(
      "[data-home-hero-button]",
      home.hero?.buttonText || "Galleri",
      home.hero?.buttonHref || "galleri.html"
    );

    setText("[data-home-intro-title]", home.intro?.title);
    const introText = document.querySelector("[data-home-intro-text]");
    if (introText && Array.isArray(home.intro?.paragraphs)) {
      introText.replaceChildren(
        ...home.intro.paragraphs.map((paragraph) => {
          const p = document.createElement("p");
          p.textContent = paragraph;
          return p;
        })
      );
    }

    setText("[data-home-contact-kicker]", home.contact?.kicker);
    setText("[data-home-contact-title]", home.contact?.title);
    setLink(
      "[data-home-contact-email]",
      home.contact?.email || "",
      `mailto:${home.contact?.email || ""}`
    );
    setLink(
      "[data-home-contact-phone]",
      home.contact?.phone || "",
      `tel:${(home.contact?.phone || "").replace(/[^\d+]/g, "")}`
    );
    setText("[data-home-contact-facebook]", home.contact?.facebook);

    renderHeroGallery(home.featuredWorks);
    renderFeaturedWorks(home.featuredWorks);
    renderCv(content.cv);
  }

  window.kamContent = {
    draftKey,
    clone,
    getContent,
    getDraft,
    applyContent,
  };

  applyContent();
})();
