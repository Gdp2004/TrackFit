# 📁 TrackFit – Cartella Immagini (`public/images/`)

Questa cartella contiene tutte le immagini statiche del sito.
In Next.js ogni file dentro `public/` è accessibile direttamente via URL relativo.

## Struttura

```
public/images/
├── auth/           # Immagini per le pagine di login e registrazione
├── coach/          # Immagini per la dashboard e le sezioni Coach
├── gym/            # Immagini per la dashboard e le sezioni Gestore Palestra
├── icons/          # Loghi, favicon, icone custom
└── backgrounds/    # Sfondi generici riutilizzabili
```

## Come usare le immagini

### In Next.js con il componente `<Image>` (raccomandato)
```tsx
import Image from "next/image";

<Image
  src="/images/auth/hero-background.png"
  alt="Fitness background"
  width={1200}
  height={675}
  priority
/>
```

### Come background CSS
```tsx
<div style={{ backgroundImage: "url('/images/coach/dashboard-hero.png')" }} />
```

## Immagini presenti

| File | Dove viene usato |
|------|-----------------|
| `auth/hero-background.png` | Layout auth (pannello sinistro login/register) |
| `coach/dashboard-hero.png` | Header banner dashboard Coach |
| `gym/dashboard-hero.png` | Header banner dashboard Gestore |
| `icons/logo-icon.png` | Favicon, splash screen, meta og:image |

## Convenzioni per nuove immagini

- **Formato**: preferire `.webp` per performance, `.png` per trasparenza, `.svg` per icone
- **Nomi file**: lowercase con trattini, es. `hero-background.png`, `trainer-card.webp`
- **Cartella corretta**: mettere l'immagine nella cartella del ruolo/sezione a cui appartiene

## Come aggiungere una nuova immagine e usarla

1. Copia il file nella sottocartella corretta (es. `public/images/coach/`)
2. Referenzia con il path assoluto dalla root: `/images/coach/nome-file.png`

