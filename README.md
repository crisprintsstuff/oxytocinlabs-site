# oxytocinlabs-site

The website of **Oxytocin Labs** at [oxytocin.tools](https://oxytocin.tools/). It's a single static page with the apps, an about section and the Discord link, styled like the OxyBrush site.

The site is plain HTML, CSS and a few lines of JavaScript, with no build step. nginx serves it in Docker, and a Cloudflare Tunnel connects it to the internet, so your server needs no open ports.

```
site/                 the website (edit these files)
  index.html          the page: hero, app cards, about, community
  style.css           all styling (colors and fonts at the top, in :root)
  main.js             app filter buttons, footer year
  404.html            "page not found"
  favicon.svg, robots.txt, sitemap.xml
nginx.conf            caching, security headers, real visitor IPs from Cloudflare
Dockerfile            nginx image with the site inside
docker-compose.yml    web (nginx) + tunnel (cloudflared)
.env.example          template for your tunnel token
```

## Run it on your server

You need Docker with the Compose plugin, and the `oxytocin.tools` domain on your Cloudflare account.

1. **Create the tunnel.** In the [Cloudflare dashboard](https://one.dash.cloudflare.com/), go to **Zero Trust > Networks > Tunnels > Create a tunnel**. Choose **Cloudflared**, name it (for example `oxytocin-site`), and pick **Docker** as the environment. Copy the token: the long string after `--token` in the command it shows. You don't need to run that command.
2. **Route the domain to the site.** In the tunnel's **Public Hostname** tab, add a hostname:
   - **Domain:** `oxytocin.tools`, with **Subdomain** empty.
   - **Service:** type `HTTP`, URL `web:80`. `web` is the nginx container's name inside Compose.

   Add a second hostname with **Subdomain** `www` and the same service, if you want `www.oxytocin.tools` to work too.
3. **Start it:**

   ```bash
   git clone https://github.com/crisprintsstuff/oxytocinlabs-site.git
   cd oxytocinlabs-site
   cp .env.example .env
   nano .env            # paste the token after CLOUDFLARE_TUNNEL_TOKEN=
   docker compose up -d --build
   ```

4. **Check it:** `docker compose ps` should list both containers, with `web` marked **healthy**. The tunnel shows as **Healthy** in the dashboard, and https://oxytocin.tools/ loads.

## Update the site

Edit the files in `site/`, commit, then on the server:

```bash
git pull
docker compose up -d --build
```

Pages are re-checked on every visit, so changes show up immediately. CSS, JavaScript and images are cached for up to a week, so after changing `style.css` or `main.js` it can take a hard refresh (or a Cloudflare cache purge) to see them.

To look at the site locally without the tunnel, uncomment the `ports:` lines in `docker-compose.yml` and open http://localhost:8080/. Or, with Python installed, run `python3 -m http.server -d site` and open http://localhost:8000/.

## Editing notes

- **App cards** are the `<article class="card">` blocks in `index.html`. Each has a category in `data-category` (`3d`, `2d`, `dev` or `util`) for the filter buttons, and a color: `t-pink`, `t-purple` or `t-blue`.
- **The About text** is marked `EDIT ME` in `index.html`.
- **Icons** are inline SVG symbols at the top of `index.html` (shapes from [Lucide](https://lucide.dev), ISC license). Use one with `<svg><use href="#i-name"/></svg>`.
- **The Content Security Policy** in `nginx.conf` only allows this site's own files plus Google Fonts. If you add an external script, image or embed, add its host there; otherwise the browser blocks it.
- **Google Fonts:** the page loads Inter, Outfit and JetBrains Mono from Google, so visitors' browsers contact Google's font servers. To avoid that, download the font files into `site/` and change the `<link>` in the pages, and `font-src` in `nginx.conf`, to `'self'`.
