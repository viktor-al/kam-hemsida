(function () {
  const draftKey = "kam-site-content-draft";
  const form = document.querySelector("[data-admin-form]");
  const status = document.querySelector("[data-admin-status]");
  const workList = document.querySelector("[data-work-list]");
  const galleryList = document.querySelector("[data-gallery-list]");
  const exportOutput = document.querySelector("[data-export-output]");
  const galleryCategory = document.querySelector("[data-gallery-category]");
  const galleryTitle = document.querySelector("[data-gallery-title]");
  const galleryFile = document.querySelector("[data-gallery-file]");
  const cvImageFile = document.querySelector("[data-cv-image-file]");
  const loginButton = document.querySelector("[data-login-button]");
  const logoutButton = document.querySelector("[data-logout-button]");
  const isLiveAdmin = Boolean(window.netlifyIdentity) && location.pathname.startsWith("/admin");
  let contentSha = "";
  const galleryLabels = {
    collage: "Collage",
    olja: "Olja",
    litografi: "Litografi",
    skulptur: "Skulptur",
    akvarell: "Akvarell",
    teckning: "Teckning",
  };
  let content = normalizeContent(loadContent());
  try {
    window.localStorage.setItem(draftKey, JSON.stringify(content));
  } catch {
    // Large image drafts are handled when the user saves or uploads.
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function loadContent() {
    try {
      const draft = window.localStorage.getItem(draftKey);
      return draft ? JSON.parse(draft) : clone(window.kamSiteContent);
    } catch {
      return clone(window.kamSiteContent);
    }
  }

  function normalizeContent(value) {
    const next = clone(value || {});
    next.galleries ||= {};
    next.cv = { ...clone(window.kamSiteContent.cv), ...(next.cv || {}) };
    next.cv.rawText ||= window.kamSiteContent.cv.rawText;
    if (next.cv.image === "https://media2.k-a-m.se/2018/03/2018-03-31.png") {
      next.cv.image = window.kamSiteContent.cv.image;
      next.cv.imageAlt = window.kamSiteContent.cv.imageAlt;
    }

    Object.keys(galleryLabels).forEach((key) => {
      next.galleries[key] ||= [];
    });

    return next;
  }

  function saveDraft(message = "Utkastet är sparat.") {
    try {
      window.localStorage.setItem(draftKey, JSON.stringify(stripTransient(content)));
      setStatus(message);
    } catch {
      setStatus(
        "Bilden är för stor för webbläsarens lokala utkast. Prova en mindre bild."
      );
    }
  }

  function setStatus(message) {
    if (!status) return;
    status.textContent = message;
  }

  function currentUser() {
    return window.netlifyIdentity?.currentUser?.() || null;
  }

  function updateAuthState() {
    if (!isLiveAdmin) {
      if (form) form.hidden = false;
      loginButton?.setAttribute("hidden", "");
      logoutButton?.setAttribute("hidden", "");
      return;
    }

    const user = currentUser();
    if (form) form.hidden = !user;
    if (loginButton) loginButton.hidden = Boolean(user);
    if (logoutButton) logoutButton.hidden = !user;

    if (user) {
      setStatus(`Inloggad som ${user.email || "admin"}.`);
    } else {
      setStatus("Logga in för att redigera och publicera hemsidan.");
    }
  }

  async function getJwt() {
    const user = currentUser();
    if (!user) throw new Error("Du behöver logga in först.");
    return user.jwt();
  }

  async function gitGateway(path, options = {}) {
    const token = await getJwt();
    const response = await fetch(`/.netlify/git/github/contents/${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || "Git Gateway svarade inte som väntat.");
    }

    return response.json();
  }

  function encodeUtf8(value) {
    return btoa(unescape(encodeURIComponent(value)));
  }

  function decodeUtf8(value) {
    return decodeURIComponent(escape(atob(value)));
  }

  async function loadPublishedContent() {
    if (!isLiveAdmin || !currentUser()) return;

    try {
      setStatus("Hämtar senaste innehållet...");
      const file = await gitGateway("content/site.json?ref=main");
      contentSha = file.sha;
      content = normalizeContent(JSON.parse(decodeUtf8(file.content.replace(/\n/g, ""))));
      window.localStorage.setItem(draftKey, JSON.stringify(content));
      fillForm();
      setStatus(`Inloggad som ${currentUser().email || "admin"}. Senaste innehållet är hämtat.`);
    } catch (error) {
      setStatus(`Kunde inte hämta senaste innehållet: ${error.message}`);
    }
  }

  function slugify(value) {
    return String(value || "bild")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 64) || "bild";
  }

  function dataUrlParts(dataUrl) {
    const match = String(dataUrl).match(/^data:([^;]+);base64,(.+)$/);
    if (!match) throw new Error("Bilden kunde inte förberedas.");
    const mime = match[1];
    const extension = mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : "jpg";
    return { base64: match[2], extension };
  }

  function stripTransient(value) {
    const next = clone(value);

    next.home?.featuredWorks?.forEach((work) => {
      delete work.previewImage;
    });

    Object.values(next.galleries || {}).forEach((items) => {
      items?.forEach((item) => {
        delete item.previewImage;
      });
    });

    if (next.cv) {
      delete next.cv.previewImage;
    }

    return next;
  }

  async function uploadImageFile(file, title, onPreview) {
    const dataUrl = await imageToDataUrl(file);
    onPreview?.(dataUrl);

    if (!isLiveAdmin || !currentUser()) {
      return dataUrl;
    }

    setStatus("Laddar upp bilden...");
    const { base64, extension } = dataUrlParts(dataUrl);
    const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
    const fileName = `${stamp}-${slugify(title || file.name)}.${extension}`;
    const path = `assets/uploads/${fileName}`;

    await gitGateway(path, {
      method: "PUT",
      body: JSON.stringify({
        message: `Upload ${fileName}`,
        content: base64,
        branch: "main",
      }),
    });

    setStatus("Bilden är uppladdad. Kom ihåg att publicera innehållet också.");
    return `/${path}`;
  }

  async function publishContent() {
    if (!isLiveAdmin) {
      if (exportOutput) {
        exportOutput.value = `window.kamSiteContent = ${JSON.stringify(content, null, 2)};`;
        exportOutput.classList.add("is-visible");
        exportOutput.focus();
      }
      return;
    }

    readForm();
    setStatus("Publicerar ändringarna...");

    const latest = await gitGateway("content/site.json?ref=main");
    contentSha = latest.sha;

    const publishableContent = stripTransient(content);

    await gitGateway("content/site.json", {
      method: "PUT",
      body: JSON.stringify({
        message: "Update site content from admin",
        content: encodeUtf8(`${JSON.stringify(publishableContent, null, 2)}\n`),
        sha: contentSha,
        branch: "main",
      }),
    });

    content = publishableContent;
    window.localStorage.setItem(draftKey, JSON.stringify(content));
    setStatus("Publicerat. Netlify uppdaterar hemsidan om en liten stund.");
  }

  function getPathParts(path) {
    const parts = path.split(".");
    const rootNames = ["home", "cv", "galleries"];
    const root = rootNames.includes(parts[0]) ? content : content.home;
    return { parts, root };
  }

  function getPathValue(path) {
    const { parts, root } = getPathParts(path);
    return parts.reduce((value, key) => value?.[key], root);
  }

  function setPathValue(path, value) {
    const { parts, root } = getPathParts(path);
    const last = parts.pop();
    const target = parts.reduce((current, key) => current[key], root);
    target[last] = value;
  }

  function fillForm() {
    if (!form) return;

    form.querySelectorAll("[name]").forEach((field) => {
      field.value = getPathValue(field.name) || "";
    });
    form.querySelectorAll("[data-list-field]").forEach((field) => {
      const value = getPathValue(field.dataset.listField);
      field.value = Array.isArray(value) ? value.join("\n") : "";
    });
    const cvText = form.querySelector("[data-cv-text]");
    if (cvText) {
      cvText.value = content.cv.rawText || "";
    }

    renderWorks();
    renderGalleryUploads();
  }

  function readForm() {
    form?.querySelectorAll("[name]").forEach((field) => {
      setPathValue(field.name, field.value.trim());
    });
    form?.querySelectorAll("[data-list-field]").forEach((field) => {
      const lines = field.value
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
      setPathValue(field.dataset.listField, lines);
    });
    const cvText = form?.querySelector("[data-cv-text]");
    if (cvText) {
      content.cv.rawText = cvText.value.trim();
    }
    readWorks();
  }

  function renderWorks() {
    if (!workList) return;

    workList.replaceChildren(
      ...content.home.featuredWorks.map((work, index) => {
        const row = document.createElement("fieldset");
        const previewSrc = work.previewImage || work.image;
        const preview = previewSrc
          ? `<img src="${escapeAttribute(previewSrc)}" alt="">`
          : "<span>Ingen bild vald</span>";

        row.className = "admin-work";
        row.innerHTML = `
          <legend>Verk ${index + 1}</legend>
          <div class="admin-image-preview">${preview}</div>
          <label>
            Titel
            <input data-work-field="title" data-work-index="${index}" type="text" value="${escapeAttribute(work.title)}">
          </label>
          <label>
            Teknik/material
            <input data-work-field="medium" data-work-index="${index}" type="text" value="${escapeAttribute(work.medium)}">
          </label>
          <label class="file-button">
            Ladda upp bild
            <input data-work-file data-work-index="${index}" type="file" accept="image/*">
          </label>
          <button class="button button-secondary remove-work" type="button" data-work-index="${index}">Ta bort</button>
        `;
        return row;
      })
    );
  }

  function readWorks() {
    workList?.querySelectorAll("[data-work-field]").forEach((field) => {
      const index = Number(field.dataset.workIndex);
      const key = field.dataset.workField;
      const work = content.home.featuredWorks[index];
      if (!work || !key) return;

      work[key] = field.value.trim();
      work.alt = [work.title, work.medium].filter(Boolean).join(", ");
    });
  }

  function renderGalleryUploads() {
    if (!galleryList) return;

    const sections = Object.entries(galleryLabels).map(([key, label]) => {
      const section = document.createElement("section");
      const heading = document.createElement("h3");
      const grid = document.createElement("div");
      const items = content.galleries[key] || [];

      section.className = "admin-gallery-group";
      heading.textContent = `${label} (${items.length})`;
      grid.className = "admin-gallery-items";

      if (items.length === 0) {
        const empty = document.createElement("p");
        empty.textContent = "Inga extra bilder i utkastet.";
        empty.className = "admin-empty";
        grid.append(empty);
      } else {
        items.forEach((item, index) => {
          const card = document.createElement("article");
          card.className = "admin-gallery-item";
          const previewSrc = item.previewImage || item.image;

          card.innerHTML = `
            <img src="${escapeAttribute(previewSrc)}" alt="">
            <strong>${escapeHtml(item.title || label)}</strong>
            <button class="button button-secondary remove-gallery-image" type="button" data-gallery-key="${key}" data-gallery-index="${index}">Ta bort</button>
          `;
          grid.append(card);
        });
      }

      section.append(heading, grid);
      return section;
    });

    galleryList.replaceChildren(...sections);
  }

  function escapeAttribute(value = "") {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function escapeHtml(value = "") {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function imageToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        const image = new Image();
        image.addEventListener("load", () => {
          const maxSize = 1800;
          const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");

          canvas.width = Math.round(image.width * scale);
          canvas.height = Math.round(image.height * scale);
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.86));
        });
        image.addEventListener("error", reject);
        image.src = reader.result;
      });
      reader.addEventListener("error", reject);
      reader.readAsDataURL(file);
    });
  }

  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    readForm();
    saveDraft();
  });

  form?.addEventListener("input", (event) => {
    if (event.target instanceof HTMLInputElement && event.target.type === "file") return;
    readForm();
    saveDraft("Utkastet är uppdaterat.");
  });

  document.querySelector(".add-work")?.addEventListener("click", () => {
    readForm();
    content.home.featuredWorks.push({
      title: "Nytt verk",
      medium: "",
      image: "",
      alt: "Nytt verk",
    });
    renderWorks();
  });

  workList?.addEventListener("click", (event) => {
    const button = event.target instanceof Element ? event.target.closest(".remove-work") : null;
    if (!(button instanceof HTMLButtonElement)) return;

    readWorks();
    content.home.featuredWorks.splice(Number(button.dataset.workIndex), 1);
    renderWorks();
  });

  workList?.addEventListener("change", async (event) => {
    const input = event.target instanceof Element ? event.target.closest("[data-work-file]") : null;
    if (!(input instanceof HTMLInputElement) || !input.files?.[0]) return;

    readWorks();
    const index = Number(input.dataset.workIndex);
    const work = content.home.featuredWorks[index];
    if (!work) return;

    try {
      work.image = await uploadImageFile(input.files[0], work.title || "utvalt-verk", (preview) => {
        work.previewImage = preview;
        renderWorks();
      });
      work.alt = [work.title, work.medium].filter(Boolean).join(", ");
      renderWorks();
      saveDraft("Bilden är uppladdad och sparad i utkastet.");
    } catch (error) {
      setStatus(`Bilden kunde inte laddas upp: ${error.message}`);
    }
  });

  document.querySelector(".add-gallery-image")?.addEventListener("click", async () => {
    if (!(galleryFile instanceof HTMLInputElement) || !galleryFile.files?.[0]) {
      setStatus("Välj en bild först.");
      return;
    }

    readForm();
    const key = galleryCategory?.value || "collage";
    const label = galleryLabels[key] || "Galleri";
    const title = galleryTitle?.value.trim() || `${label} ${content.galleries[key].length + 1}`;
    let previewImage = "";

    try {
      const image = await uploadImageFile(galleryFile.files[0], `${label}-${title}`, (preview) => {
        previewImage = preview;
      });
      content.galleries[key].push({ title, image, previewImage, alt: title });
      galleryFile.value = "";
      if (galleryTitle) galleryTitle.value = "";
      renderGalleryUploads();
      saveDraft("Galleribilden är uppladdad och sparad i utkastet.");
    } catch (error) {
      setStatus(`Bilden kunde inte laddas upp: ${error.message}`);
    }
  });

  cvImageFile?.addEventListener("change", async () => {
    if (!(cvImageFile instanceof HTMLInputElement) || !cvImageFile.files?.[0]) return;

    readForm();

    try {
      content.cv.image = await uploadImageFile(cvImageFile.files[0], "cv-bild", (preview) => {
        content.cv.previewImage = preview;
      });
      content.cv.imageAlt = content.cv.imageAlt || "Kristina Alexandersson Malmberg";
      cvImageFile.value = "";
      saveDraft("CV-bilden är uppladdad och sparad i utkastet.");
    } catch (error) {
      setStatus(`Bilden kunde inte laddas upp: ${error.message}`);
    }
  });

  galleryList?.addEventListener("click", (event) => {
    const button =
      event.target instanceof Element ? event.target.closest(".remove-gallery-image") : null;
    if (!(button instanceof HTMLButtonElement)) return;

    const key = button.dataset.galleryKey;
    const index = Number(button.dataset.galleryIndex);
    if (!key || !content.galleries[key]) return;

    content.galleries[key].splice(index, 1);
    renderGalleryUploads();
    saveDraft("Bilden är borttagen från utkastet.");
  });

  document.querySelector(".admin-reset")?.addEventListener("click", () => {
    window.localStorage.removeItem(draftKey);
    content = normalizeContent(clone(window.kamSiteContent));
    fillForm();
    setStatus("Utkastet är nollställt.");
  });

  document.querySelector(".export-content")?.addEventListener("click", async () => {
    try {
      await publishContent();
    } catch (error) {
      setStatus(`Kunde inte publicera: ${error.message}`);
    }
  });

  loginButton?.addEventListener("click", () => {
    window.netlifyIdentity?.open?.("login");
  });

  logoutButton?.addEventListener("click", () => {
    window.netlifyIdentity?.logout?.();
  });

  if (isLiveAdmin) {
    window.netlifyIdentity.on("init", () => {
      updateAuthState();
      loadPublishedContent();
    });
    window.netlifyIdentity.on("login", () => {
      window.netlifyIdentity.close();
      updateAuthState();
      loadPublishedContent();
    });
    window.netlifyIdentity.on("logout", () => {
      updateAuthState();
    });
    window.netlifyIdentity.init();
  }

  fillForm();
  updateAuthState();
})();
