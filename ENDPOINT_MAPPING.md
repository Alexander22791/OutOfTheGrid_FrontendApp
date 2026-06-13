# Endpoint Mapping Frontend -> Backend

Data: 2026-06-03

## Regola di lettura

- La colonna Frontend path indica il path chiamato nel codice frontend.
- In alcuni casi, src/lib/api.ts applica rewrite automatici verso path backend compatibili.
- Stato:
  - OK: coperto dal backend attuale
  - PARTIAL: funziona con adattamenti/fallback ma non e perfettamente allineato
  - MISSING: endpoint non presente nel backend corrente
  - LEGACY: endpoint frontend legacy da sostituire

## 1) Auth, User, Core Community

| Area | Frontend method/path | Backend method/path | Stato | Note/Azione |
|---|---|---|---|---|
| Auth | POST /api/auth/login | POST /api/auth/login | OK | Allineato |
| Auth | POST /api/auth/register | POST /api/auth/register | OK | Allineato |
| User | GET /api/me | GET /api/me | OK | Allineato |
| User | PATCH /api/me | PATCH /api/me | PARTIAL | Backend aggiorna solo displayName; bio/avatar richiedono estensione backend |
| Posts | GET /posts?page=... | GET /api/posts | OK | Rewrite su /api applicato |
| Posts | POST /posts | POST /api/posts | OK | Payload allineato a title/content/category |
| Posts | POST /posts/{id}/upvote | POST /api/posts/{id}/like | PARTIAL | Gestito via rewrite; toggle like lato backend da confermare |
| Posts | POST /posts/{id}/comments | POST /api/posts/{id}/comments | OK | Allineato |
| Posts | GET /posts/{id}/comments | GET /api/posts/{id}/comments | OK | Allineato |
| Posts | PATCH /posts/{id} | PATCH /api/posts/{id} | OK | Allineato |
| Posts | DELETE /posts/{id} | DELETE /api/posts/{id} | OK | Allineato |
| Cities | GET /cities | GET /api/cities | OK | Allineato |
| Community | POST /cities/{id}/join | n/d | MISSING | Implementare endpoint join citta in backend |
| Community | POST /cities/{id}/leave | n/d | MISSING | Implementare endpoint leave citta in backend |

## 2) Eventi, Catalogo, Gamification, Subscription

| Area | Frontend method/path | Backend method/path | Stato | Note/Azione |
|---|---|---|---|---|
| Events | GET /events | GET /api/events | OK | Allineato |
| Events | POST /events/{id}/attend | POST /api/events/{id}/join | PARTIAL | Rewrite attivo, verificare payload/risposta |
| Events Admin | POST /admin/events | POST /api/admin/events | OK | Allineato |
| Events Admin | DELETE /admin/events/{id} | DELETE /api/admin/events/{id} | OK | Allineato |
| Catalog | GET /catalog/products | GET /api/catalog/products | OK | Allineato |
| Catalog Coupons | GET /catalog/coupons | GET /api/catalog/coupons | OK | Disponibile backend |
| Leaderboard | GET /leaderboard/monthly | GET /api/leaderboard/monthly | OK | Allineato |
| Subscription | POST /subscriptions | POST /api/subscriptions | OK | Attivazione allineata |
| Subscription | POST /unsubscribe | n/d | MISSING | Definire endpoint disattivazione abbonamento |
| User Stats | GET /user/stats | GET /api/user/stats | OK | Disponibile backend |

## 3) Admin Identity/Moderation

| Area | Frontend method/path | Backend method/path | Stato | Note/Azione |
|---|---|---|---|---|
| Admin Users | GET /admin/users | GET /api/admin/users | OK | Allineato |
| Admin Role | PATCH /admin/users/{id}/role | PATCH /api/admin/users/{id}/role | OK | Disponibile backend |
| Admin Posts | DELETE /admin/posts/{id} | DELETE /api/admin/posts/{id} | OK | Allineato |
| Admin Stats | GET /admin/dashboard | GET /api/admin/stats | PARTIAL | Rewrite da dashboard -> stats |
| Admin Cities | GET /admin/cities | GET /api/admin/cities | OK | Disponibile backend |
| Admin Cities | POST /admin/cities | POST /api/admin/cities | OK | Allineato |
| Admin Users edit | PUT /admin/users/{id} | n/d | LEGACY | Sostituire con patch role e endpoint profile dedicati |
| Admin Users delete | DELETE /admin/users/{id} | n/d | MISSING | Implementare se richiesto, altrimenti rimuovere da UI |
| City manager promote/demote | POST /admin/users/{id}/promote-city-manager etc. | n/d | MISSING | Implementare o sostituire con patch role + city assignment |
| Subscription activation admin | POST /admin/users/{id}/activate-subscription etc. | n/d | MISSING | Implementare endpoint admin subscription management |

## 4) Admin Catalog / Courses

| Area | Frontend method/path | Backend method/path | Stato | Note/Azione |
|---|---|---|---|---|
| Admin Products | GET /admin/catalog | GET /api/admin/products | PARTIAL | Necessario riallineare UI su products/coupons |
| Admin Products | POST /admin/catalog | POST /api/admin/products | LEGACY | Cambiare path e payload (name, price, cityId) |
| Admin Products | DELETE /admin/catalog/{id} | DELETE /api/admin/products/{id} | LEGACY | Cambiare path |
| Admin Courses | POST /admin/courses | POST /api/admin/courses | PARTIAL | Payload frontend legacy diverso da CreateCourseRequest backend |
| Admin Courses | PUT /admin/courses/{id} | n/d | MISSING | Backend espone create/list/delete, non update |
| Admin Courses | DELETE /admin/courses/{id} | DELETE /api/admin/courses/{id} | OK | Allineato |
| Admin Modules | POST /admin/modules | n/d | MISSING | Non presente backend |
| Admin Lessons | POST /admin/lessons | n/d | MISSING | Non presente backend |
| Admin Upload | POST /admin/upload | n/d | MISSING | Non presente backend |
| Lesson update | PUT /admin/lessons/{id} | n/d | MISSING | Non presente backend |

## 5) News, QR, Course detail, Profile public

| Area | Frontend method/path | Backend method/path | Stato | Note/Azione |
|---|---|---|---|---|
| News Articles | GET /articles?article_type=... | n/d | MISSING | Usare route interna next e fonti esterne |
| News Refresh | POST /articles/refresh | n/d | MISSING | Rimosso uso diretto lato frontend |
| QR Checkin | POST /checkin | n/d | MISSING | Implementare endpoint backend o disattivare feature |
| Course detail | GET /courses/{id} | n/d | MISSING | Backend ha list + complete, manca detail |
| Course purchase | POST /courses/{id}/purchase | n/d | MISSING | Mancante backend |
| Lesson detail | GET /lessons/{id} | n/d | MISSING | Mancante backend |
| Lesson complete | POST /lessons/{id}/complete | n/d | MISSING | Mancante backend (esiste solo complete corso) |
| Public profile | GET /users/{id} | n/d | MISSING | Mancante backend |

## 6) Admin Settings (decisione backend-first)

Il frontend usa endpoint:
- GET /admin/settings
- PUT /admin/settings/password
- PUT /admin/settings
- PUT /admin/settings/stripe
- DELETE /admin/settings/stripe
- POST /auth/2fa/setup
- POST /auth/2fa/verify
- POST /auth/2fa/disable

Nel backend controller attuali questi endpoint non risultano presenti.

Stato: MISSING

Azione consigliata:
1. Se queste API esistono in modulo non ancora incluso nel repo, collegare e testare.
2. Se non esistono, implementare backend e contratti DTO.
3. Fino ad allora, UI settings deve mostrare banner di non disponibilita per azioni critiche non supportate.

## Piano di allineamento consigliato

1. Bloccare definitivo contratto backend per admin settings, profile esteso e media.
2. Rimuovere route legacy admin/catalog/plans/users edit non supportate.
3. Implementare endpoint mancanti ad alta priorita: join/leave, unsubscribe, course detail/lesson/public profile, QR checkin.
4. Solo dopo, eliminare fallback locali (avatar/post media locale) e passare a persistenza backend completa.
