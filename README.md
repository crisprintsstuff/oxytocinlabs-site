# oxytocinlabs-site

The website of **Oxytocin Labs** at [oxytocin.tools](https://oxytocin.tools/). It's a single static page with the apps, an about section and the Discord link, styled like the OxyBrush site.

The site is plain HTML, CSS and a few lines of JavaScript, with no build step. nginx serves it in Docker on this machine's loopback address, and your Cloudflare Tunnel routes `oxytocin.tools` to it, so your server opens no ports.

```
site/                 the website (edit these files)
  index.html          the page: hero, app cards, about, community
  style.css           all styling (colors and fonts at the top, in :root)
  main.js             app filter buttons, footer year
  404.html            "page not found"
  favicon.svg, robots.txt, sitemap.xml
nginx.conf            caching, security headers, real visitor IPs from Cloudflare
Dockerfile            nginx image with the site inside
docker-compose.yml    web (nginx on 127.0.0.1:8080); optional tunnel (cloudflared)
.env.example          port setting, optional tunnel token
```

## Run it on your server

You need Docker with the Compose plugin, `oxytocin.tools` added to the same Cloudflare account as your tunnel, and `cloudflared` already running on the host as a service.

1. **Start the site:**

   ```bash
   git clone https://github.com/crisprintsstuff/oxytocinlabs-site.git
   cd oxytocinlabs-site
   docker compose up -d --build
   ```

   It listens on `127.0.0.1:8080`, which only this machine can reach. If 8080 is taken, run `cp .env.example .env`, change `SITE_PORT`, and run the `up` command again. Check it with `curl -I http://localhost:8080/`, which should answer `HTTP/1.1 200 OK`.

2. **Route the domain in your existing tunnel.** It already serves other things; you only add a route next to them. How you add it depends on where the tunnel's settings live.

   - **Managed in the dashboard** (installed with a token): in [Zero Trust](https://one.dash.cloudflare.com/) go to **Networks > Tunnels**, open your tunnel, then **Public Hostname** (or **Published application routes**) and **Add**:
     - **Subdomain:** empty. **Domain:** `oxytocin.tools`.
     - **Service:** `HTTP`, URL `localhost:8080`, or your `SITE_PORT`.

     Add another with **Subdomain** `www` if you want `www.oxytocin.tools` too. Cloudflare creates the DNS records itself. If `oxytocin.tools` already has an A or CNAME record, delete it first, or the route can't be added.

   - **Managed in a config file** (`/etc/cloudflared/config.yml` or `~/.cloudflared/config.yml`): add the hostname above the final catch-all rule:

     ```yaml
     ingress:
       # ...your existing rules...
       - hostname: oxytocin.tools
         service: http://localhost:8080
       - hostname: www.oxytocin.tools
         service: http://localhost:8080
       - service: http_status:404    # keep the catch-all last
     ```

     Then create the DNS records and restart the service, using your tunnel's name:

     ```bash
     cloudflared tunnel route dns <your-tunnel> oxytocin.tools
     cloudflared tunnel route dns <your-tunnel> www.oxytocin.tools
     sudo systemctl restart cloudflared
     ```

3. **Check it:** https://oxytocin.tools/ loads, and your other routes still work.

### Without a tunnel on the host

To have Compose run its own `cloudflared` instead:

1. Create a tunnel in the dashboard and put its token in `.env` as `CLOUDFLARE_TUNNEL_TOKEN`.
2. Route the hostname to `http://web:80`.
3. Start with `docker compose --profile tunnel up -d --build`.

## Update the site

Edit the files in `site/`, commit, then on the server:

```bash
git pull
docker compose up -d --build
```

Pages are re-checked on every visit, so changes show up immediately. CSS, JavaScript and images are cached for up to a week, so after changing `style.css` or `main.js` it can take a hard refresh (or a Cloudflare cache purge) to see them.

To look at the site on the server itself, open http://localhost:8080/. On another computer, run `python3 -m http.server -d site` in the repository and open http://localhost:8000/.

## Editing notes

- **App cards** are the `<article class="card">` blocks in `index.html`. Each has a category in `data-category` (`3d`, `2d`, `dev` or `util`) for the filter buttons, and a color: `t-pink`, `t-purple` or `t-blue`.
- **The About text** is marked `EDIT ME` in `index.html`.
- **Icons** are inline SVG symbols at the top of `index.html` (shapes from [Lucide](https://lucide.dev), ISC license). Use one with `<svg><use href="#i-name"/></svg>`.
- **The Content Security Policy** in `nginx.conf` only allows this site's own files plus Google Fonts. If you add an external script, image or embed, add its host there; otherwise the browser blocks it.
- **Google Fonts:** the page loads Inter, Outfit and JetBrains Mono from Google, so visitors' browsers contact Google's font servers. To avoid that, download the font files into `site/` and change the `<link>` in the pages, and `font-src` in `nginx.conf`, to `'self'`.
