# 🖼️ TrackFit – Asset Statici (`public/images/`)

Questa cartella contiene tutte le immagini statiche dell'applicazione.  
In Next.js, ogni file presente in `public/` è accessibile direttamente tramite URL relativo alla root (es. `/images/auth/hero.png`).

---

## Struttura

```
public/images/
├── auth/           # Immagini per le pagine di autenticazione (login, registrazione)
├── coach/          # Immagini per la dashboard e le sezioni del Coach
├── gym/            # Immagini per la dashboard e le sezioni del Gestore Palestra
├── icons/          # Loghi, favicon e icone personalizzate
└── backgrounds/    # Sfondi generici riutilizzabili
```

---

## Come usare le immagini

### Con il componente `<Image>` di Next.js (consigliato)

```tsx
import Image from "next/image";

<Image
  src="/images/auth/Login-backgorund.jpg"
  alt="Sfondo login TrackFit"
  width={1200}
  height={675}
  priority
/>
```

> Usa `priority` sulle immagini above-the-fold per ottimizzare il Largest Contentful Paint (LCP).

### Come background CSS inline

```tsx
<div style={{ backgroundImage: "url('/images/coach/dashboard-hero.png')" }} />
```

### Come background CSS in un modulo

```css
.hero {
  background-image: url('/images/gym/dashboard-hero.png');
  background-size: cover;
}
```

---

## Immagini presenti

| File                             | Utilizzo                                         |
|:---------------------------------|:-------------------------------------------------|
| `auth/Login-backgorund.jpg`      | Sfondo del pannello sinistro nella pagina di login e registrazione |
| `auth/trackfit_icon_crop.png`    | Icona/logo compatta usata nelle pagine di autenticazione |
| `coach/dashboard-hero.png`       | Banner header nella dashboard del Coach          |
| `gym/dashboard-hero.png`         | Banner header nella dashboard del Gestore Palestra |
| `icons/logo-icon.png`            | Logo principale (favicon, splash screen, og:image) |
| `backgrounds/OrangeBackground.jpg` | Sfondo arancione generico riutilizzabile        |

---

## Convenzioni per nuove immagini

- **Formato**: preferire `.webp` per performance, `.png` per immagini con trasparenza, `.svg` per icone vettoriali
- **Nomi file**: lowercase con trattini, es. `hero-banner.webp`, `trainer-avatar.png`
- **Cartella**: posizionare l'immagine nella sottocartella del ruolo o della sezione di riferimento
- **Dimensioni**: ottimizzare le immagini prima del commit (max ~200KB per immagini decorative)

---

## Come aggiungere una nuova immagine

1. Ottimizza l'immagine (es. con [Squoosh](https://squoosh.app/) o [TinyPNG](https://tinypng.com/))
2. Copia il file nella sottocartella corretta (es. `public/images/coach/`)
3. Usala nel codice con il path assoluto dalla root: `/images/coach/nome-file.webp`
4. Aggiorna la tabella "Immagini presenti" in questo README
