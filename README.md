# Kristina Alexandersson Malmberg - hemsida

Det här är en lokal statisk hemsida för Kristina Alexandersson Malmberg.

## Viktigt

- Publicera inte nya ändringar till here.now förrän Viktor uttryckligen ber om det.
- Sidan är byggd som vanliga HTML/CSS/JS-filer och kan öppnas direkt i webbläsaren.
- Startsidan finns i `index.html`.
- CV-sidan finns i `cv.html`.

## Nuvarande struktur

- `index.html` - startsida med hero, introduktion, utvalda verk och kontakt.
- `local-admin.html` - lokalt adminläge/prototyp för att testa innehållsändringar, CV och bildval.
- `admin/` - skarpt CMS-läge för Netlify/Decap när sidan publiceras.
- `content/site.json` - redigerbart innehåll som CMS:et uppdaterar.
- `scripts/build-content.js` - bygger om `content/site.json` till `site-content.js`.
- `site-content.js` - innehållsfilen som den statiska sidan läser in.
- `content-manager.js` - läser in startsidans innehåll och eventuellt lokalt utkast.
- `admin.js` - hanterar adminlägets formulär, lokala bildval, CV-redigering och utkast.
- `galleri.html` - separat gallerisida med utvalda verk och teknik-kategorier.
- `instagram.html` - separat Instagram-/ateljéflöde.
- `arkiv.html` - separat arkivsida.
- `cv.html` - separat CV-sida med text från originalets CV-sida.
- `galleri-collage.html` - kategori-sida för Collage.
- `galleri-olja.html` - kategori-sida för Olja.
- `galleri-litografi.html` - kategori-sida för Litografi.
- `galleri-skulptur.html` - kategori-sida för Skulptur.
- `galleri-akvarell.html` - kategori-sida för Akvarell.
- `galleri-teckning.html` - kategori-sida för Teckning.
- `styles.css` - all styling.
- `script.js` - fyller kategorisidorna med bilder och hanterar bildvisning/lightbox.
- `assets/` - lokala bilder och galleribilder.

## Galleribilder

Gallerierna fylls automatiskt från mapparna:

- `assets/gallery/collage/`
- `assets/gallery/olja/`
- `assets/gallery/litografi/`
- `assets/gallery/skulptur/`
- `assets/gallery/akvarell/`
- `assets/gallery/teckning/`

Antalet bilder styrs i `script.js` i objektet `galleryGroups`.

## Senaste designbeslut

- Layouten ska kännas som en portfolio.
- Sidomenyn visar Galleri med underkategorier.
- Startsidan visar en thumbnail per teknik/kategori, och varje thumbnail leder till en egen kategorisida.
- Blogg/Instagram-sektionen ligger på egen sida.
- CV finns bara som egen sida via menyn.
- Arkiv ligger på egen sida via menyn.
- Hero-gridden finns kvar men är nedkortad i höjd.
- Det lokala adminläget sparar utkast i webbläsaren.
- Det skarpa CMS-läget ligger i `admin/` och är tänkt för Netlify + Decap CMS.

## Publicering

Se `PUBLICERING.md` för stegen: GitHub, Netlify, CMS-inloggning och hur `k-a-m.se` kan pekas om utan att störa Loopia-mailen.

## Att fortsätta med

Öppna `index.html` lokalt för att fortsätta granska startsidan:

`file:///Users/viktor.alexandersson/Documents/Mors%20hemsida/index.html`

Öppna `cv.html` för CV-sidan:

`file:///Users/viktor.alexandersson/Documents/Mors%20hemsida/cv.html`
