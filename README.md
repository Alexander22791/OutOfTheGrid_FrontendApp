# OutofTheGrid frontend

Frontend web di **OutofTheGrid**, una community italiana dedicata ad autosufficienza, sostenibilita e crescita locale.

## Stack

- **Next.js 16**
- **React 19**
- **TypeScript**
- **Tailwind CSS 4**
- **Zustand** per lo stato client
- **Axios** per le chiamate API

## Avvio locale

```bash
npm install
npm run dev
```

App disponibile su `http://localhost:3000`.

## Script

- `npm run dev` - avvia l'ambiente di sviluppo
- `npm run build` - crea la build di produzione
- `npm run start` - avvia la build prodotta
- `npm run lint` - esegue ESLint

## Struttura delle route

Il progetto usa l'App Router di Next.js con un route group `src/app/(app)` per tutte le pagine autenticate.  
Le route dentro `(app)` **ereditano il layout condiviso senza modificare l'URL**.

### Route pubbliche

- `/`
- `/login`
- `/register`

### Route applicative

- `/feed`
- `/catalog`
- `/classroom`
- `/events`
- `/leaderboard`
- `/news`
- `/profile`
- `/profile/[id]`
- `/post/create`
- `/post/[id]`
- `/course/[id]`
- `/course/lesson/[id]`
- `/admin`

## Layout

- `src/app/layout.tsx` definisce il layout root, `AuthGuard` e `ErrorBoundary`
- `src/app/(app)/layout.tsx` gestisce la navigazione condivisa dell'app
- `BottomTabBar` viene renderizzata solo nel layout di `src/app/(app)`

## Note

- Le pagine `login` e `register` restano fuori da `src/app/(app)` per non ereditare la navigazione interna.
- La home `src/app/page.tsx` e una landing minimale con accesso a login e registrazione.
