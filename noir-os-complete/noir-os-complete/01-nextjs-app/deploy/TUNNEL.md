# Serving Afuera via Cloudflare Tunnel (what to run on the VPS)

Afuera / Noir OS is published at **`afuera.wisdombusara.com`** through a **dedicated
Cloudflare Tunnel** (same pattern as koki), not the proxied-A-record + nginx path. No
public port, no origin cert, no nginx block — the tunnel reaches the app directly on
`127.0.0.1:3011`.

The box also runs a **shared** `cloudflared.service` (tunnel `soma`) for other projects,
config `/etc/cloudflared/config.yml`. **Afuera must never go in that file** — it runs as
its own tunnel + its own service.

| Thing | Value |
|---|---|
| Hostname | `afuera.wisdombusara.com` |
| App | Next.js 15 under systemd `afuera`, `npm run start` on `127.0.0.1:3011` |
| App dir | `/opt/afuera-app` → symlink to the nested `…/01-nextjs-app` |
| Database | **dedicated** Mongo replica set, container `afuera-mongo`, `127.0.0.1:27018` |
| Tunnel | dedicated tunnel `afuera`, service `cloudflared-afuera` |

> **Pick a free port.** `3011` is the assumed app port — confirm nothing else uses it:
> `sudo ss -ltnp | grep -E ':3011|:27018'` should be empty before you start.

---

## 1. Get the code on the box

```bash
sudo git clone https://github.com/WisdomBusara/AFUERA.git /opt/afuera
# The Next app is nested; make a clean path for systemd + deploy.sh:
sudo ln -sfn /opt/afuera/noir-os-complete/noir-os-complete/01-nextjs-app /opt/afuera-app
cd /opt/afuera-app
cp deploy/.env.production.example .env.production   # then fill it in (see that file)
```

## 2. Database — dedicated Mongo replica set (Prisma needs one)

```bash
docker compose -f deploy/mongo/docker-compose.mongo.yml up -d
# Initialise the single-node replica set ONCE:
docker exec afuera-mongo mongosh --quiet --eval \
  'rs.initiate({_id:"rs0",members:[{_id:0,host:"127.0.0.1:27018"}]})'
# Confirm it reached PRIMARY (prints "PRIMARY"):
docker exec afuera-mongo mongosh --quiet --eval 'rs.status().myState' # 1 = primary
```

`DATABASE_URL` is already set in `.env.production` to
`mongodb://127.0.0.1:27018/afuera?replicaSet=rs0&directConnection=true`.

> This is **separate** from the shared `mongodb` (27017) that koki and others use — do
> not touch that container; it's a standalone and Prisma can't use it.

## 3. Build + run the app

```bash
cd /opt/afuera-app
npm ci
npm run build          # prisma generate + next build (NEXT_PUBLIC_* are baked in here)
npm run db:push        # create collections + indexes on the fresh DB
npm run db:seed        # optional: load the Northbound demo workspace

sudo cp deploy/afuera.service /etc/systemd/system/afuera.service
sudo systemctl daemon-reload && sudo systemctl enable --now afuera
curl -sI http://127.0.0.1:3011 | head -1    # want HTTP/1.1 200
```

## 4. The tunnel + DNS (this is the "register the tunnel DNS" step)

```bash
cloudflared tunnel login                     # skip if /root/.cloudflared/cert.pem exists
cloudflared tunnel create afuera             # note the printed TUNNEL ID + creds .json path

# Registers a PROXIED CNAME  afuera -> <id>.cfargotunnel.com  in the wisdombusara.com zone:
cloudflared tunnel route dns --overwrite-dns <AFUERA_TUNNEL_ID> afuera.wisdombusara.com

sudo cp deploy/cloudflared/afuera.yml /etc/cloudflared/afuera.yml
sudo sed -i "s/<AFUERA_TUNNEL_ID>/<the-real-id>/g" /etc/cloudflared/afuera.yml  # + fix creds path
sudo cp deploy/cloudflared-afuera.service /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable --now cloudflared-afuera
```

Verify: `cloudflared tunnel list` shows `afuera` with connections, and the Cloudflare DNS
record for `afuera` is a **proxied CNAME → `<id>.cfargotunnel.com`**.

## 5. App configuration elsewhere

- **Supabase → Authentication → URL Configuration:** set Site URL and add a Redirect URL
  for `https://afuera.wisdombusara.com` (so email confirm / sign-in redirects resolve).
- **Supabase → Storage:** confirm the public `assets` bucket + its two policies exist
  (README has the SQL) — needed for the Asset Library.
- **Daily brief (optional, replaces Vercel Cron):**
  ```bash
  sudo cp deploy/afuera-daily-brief.{service,timer} /etc/systemd/system/
  sudo systemctl daemon-reload && sudo systemctl enable --now afuera-daily-brief.timer
  systemctl list-timers afuera-daily-brief --no-pager
  ```

## 6. Health checks

```bash
systemctl status afuera cloudflared-afuera --no-pager
curl -sI http://127.0.0.1:3011 | head -1            # app, want 200
curl -sI https://afuera.wisdombusara.com | head -1  # edge, want 200/307 (redirects to /brief→/login)
```

## 7. Redeploys

```bash
/opt/afuera-app/deploy/deploy.sh          # pull + build + restart
/opt/afuera-app/deploy/deploy.sh --seed   # also db:push + db:seed
```

## Don't

- Don't `cloudflared service install` for afuera (clobbers the shared `cloudflared.service`).
- Don't write afuera into `/etc/cloudflared/config.yml` (that's the shared `soma` tunnel).
- Don't point `DATABASE_URL` at the shared `mongodb` (27017) — it's a standalone; Prisma
  transactions need the dedicated replica set on 27018.
