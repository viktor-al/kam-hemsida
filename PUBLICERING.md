# Publicering

Målet är att behålla Loopia för domän och mail, men låta Netlify publicera själva hemsidan.

## 1. Lägg projektet i GitHub

Skapa ett privat repo, till exempel `kam-hemsida`, och lägg upp hela projektmappen där. GitHub blir backup och historik.

## 2. Koppla GitHub till Netlify

I Netlify:

1. Välj "Add new site" och importera GitHub-repot.
2. Build command ska vara `node scripts/build-content.js`.
3. Publish directory ska vara `.`.
4. Publicera först till Netlifys testadress.

## 3. Aktivera CMS-inloggning

I Netlify:

1. Aktivera Identity.
2. Aktivera Git Gateway.
3. Bjud in de personer som ska kunna ändra sidan.
4. Adminsidan finns sedan på `/admin/`.

## 4. Koppla domänen utan att störa mailen

Behåll Loopia som DNS- och mailleverantör. Ändra bara webbpekningen enligt instruktionerna Netlify ger för `k-a-m.se`.

Viktigt: ändra inte MX-posterna, eftersom de styr mailen hos Loopia.

## 5. Innan skarp lansering

- Testa startsida, galleri, Instagram, arkiv, CV och kontakt på Netlifys testadress.
- Testa att ladda upp en bild i CMS:et.
- Testa att mailen fortfarande fungerar.
- Spara WordPress som backup tills nya sidan har varit live några dagar.

