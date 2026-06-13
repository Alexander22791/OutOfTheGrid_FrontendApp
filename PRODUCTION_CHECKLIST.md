# OutofTheGrid Web - Production Checklist

Data: 2026-06-03

Riferimento mappa tecnica dettagliata: vedi ENDPOINT_MAPPING.md

## Stato Corrente

- Frontend Next.js avviabile in sviluppo.
- Lint frontend pulito.
- Flussi core parzialmente allineati al backend Java.
- Restano endpoint non allineati o non presenti lato backend per alcune schermate admin e funzionalita avanzate.

## Priorita Alta (Blocca Funzioni Chiave)

### 1. Profilo utente completo lato backend

Backend attuale espone solo `displayName` su update profilo.

Da implementare backend:
- Supporto `bio` nel profilo utente.
- Supporto `avatarUrl` o upload media profilo.
- Persistenza DB di campi profilo estesi.

Frontend impattato:
- `src/store/authStore.ts`
- `src/app/(app)/profile/page.tsx`

### 2. Upload media post nativo (non locale)

Backend attuale non supporta immagini nei post community.

Da implementare backend:
- Campo `imageUrl` su post.
- Endpoint upload media (o presigned URL) e validazione file.
- Restituzione `imageUrl` in lista post e dettaglio post.

Frontend impattato:
- `src/app/(app)/post/create/page.tsx`
- `src/app/(app)/feed/page.tsx`
- `src/app/(app)/post/[id]/page.tsx`
- `src/lib/localPostMedia.ts` (da rimuovere dopo supporto backend)

### 3. Subscription lifecycle completo

Backend attuale consente attivazione, ma non flusso completo gestione/disattivazione lato utente.

Da implementare backend:
- Endpoint disattivazione abbonamento.
- Stato abbonamento coerente con date e rinnovo.
- Eventuale integrazione pagamento (Stripe) con webhook.

Frontend impattato:
- `src/app/(app)/profile/page.tsx`

### 4. Community join/leave per citta

Frontend chiama join/leave comunita, backend attuale non espone chiaramente queste route.

Da implementare backend:
- `POST /api/cities/{id}/join`
- `POST /api/cities/{id}/leave`
- Aggiornamento membership utente e policy accesso.

Frontend impattato:
- `src/store/communityStore.ts`

## Priorita Media (Area Admin)

### 5. Admin users allineato alle route reali

Route frontend attuali non mappano con controller backend corrente.

Frontend da riallineare a:
- `GET /api/admin/users`
- `PATCH /api/admin/users/{id}/role`

Da rimuovere o sostituire:
- update utente generico
- delete utente
- promote/demote city manager dedicati
- activate/deactivate subscription dedicati

File:
- `src/app/(app)/admin/users/page.tsx`

### 6. Admin settings/stripe/2FA

Nel backend corrente non risultano endpoint per:
- `/api/admin/settings`
- `/api/admin/settings/password`
- `/api/admin/settings/stripe`
- `/api/auth/2fa/*`

Decisione necessaria:
- Opzione A: implementare endpoint backend.
- Opzione B: rimuovere temporaneamente UI e sostituire con banner "non disponibile".

File:
- `src/app/(app)/admin/settings/page.tsx`

### 7. Admin courses modules lessons upload

Backend espone solo corsi admin base; mancano endpoint moduli/lezioni/upload usati dal frontend.

Da implementare backend o disattivare UI:
- `/api/admin/modules`
- `/api/admin/lessons`
- `/api/admin/upload`
- update lesson

File:
- `src/app/(app)/admin/courses/page.tsx`

### 8. Admin cities esteso

Backend corrente copre create/list city ma non tutte le azioni frontend.

Da verificare/implementare:
- update city
- delete city
- assign/remove manager
- qr code city

File:
- `src/app/(app)/admin/cities/page.tsx`

### 9. Admin catalog/plans/notifications/categories

Route frontend legacy da allineare ai controller backend nuovi.

Casi principali:
- Catalog frontend usa `/admin/catalog*`, backend usa `/api/admin/products` e `/api/admin/coupons`.
- Plans frontend usa `/admin/plans*`, backend compatibile concettualmente con coupons.
- Notifications e categories richiedono conferma endpoint reali backend.

File:
- `src/app/(app)/admin/catalog/page.tsx`
- `src/app/(app)/admin/plans/page.tsx`
- `src/app/(app)/admin/notifications/page.tsx`
- `src/app/(app)/admin/categories/page.tsx`

## Priorita Bassa (Refactor e Qualita)

### 10. Uniformare modello dati frontend

Problema attuale:
- Mix snake_case e camelCase.
- Tipi legacy e nuovi convivono.

Azione:
- Creare mapper centralizzati DTO->ViewModel.
- Ridurre logica di normalizzazione sparsa nelle pagine.

File principali:
- `src/types/index.ts`
- `src/lib/api.ts`
- `src/store/authStore.ts`

### 11. Test automatici minimi

Aggiungere:
- test smoke API mapping su pagine core.
- test UI su login/feed/create post/news.

## Sequenza Consigliata di Chiusura

1. Completare backend profilo/avatar/media/subscription.
2. Allineare admin users e admin settings (o disattivarli temporaneamente).
3. Chiudere admin courses/cities/catalog/plans.
4. Eliminare fallback locali non necessari (`localPostMedia`).
5. Aggiungere test smoke e verifiche finali.

## Criteri di Fine Lavoro

- Nessun endpoint frontend punta a route inesistente backend.
- Nessun fallback locale usato per feature business critiche.
- Flussi core (auth/feed/post/profile/subscription/news/admin base) testati end-to-end.
- Build e lint verdi in CI.
