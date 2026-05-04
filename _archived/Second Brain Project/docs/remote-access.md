# Remote Access Setup

Access your Second Brain from anywhere using one of these methods.

## Option 1: Cloudflare Tunnel (Recommended)

**Free, secure, no port forwarding required.**

### Prerequisites
- A Cloudflare account (free)
- A domain name added to Cloudflare (can be a cheap one)

### Setup

1. **Install cloudflared:**
```bash
# macOS
brew install cloudflared

# Linux
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared.deb
```

2. **Login to Cloudflare:**
```bash
cloudflared tunnel login
```
This opens a browser to authenticate. Select your domain.

3. **Create a tunnel:**
```bash
cloudflared tunnel create second-brain
```
Note the tunnel ID that's returned (e.g., `a1b2c3d4-...`).

4. **Create config file** at `~/.cloudflared/config.yml`:
```yaml
tunnel: YOUR_TUNNEL_ID
credentials-file: /Users/YOUR_USERNAME/.cloudflared/YOUR_TUNNEL_ID.json

ingress:
  - hostname: brain.yourdomain.com
    service: http://localhost:3000
  - service: http_status:404
```

5. **Route DNS:**
```bash
cloudflared tunnel route dns second-brain brain.yourdomain.com
```

6. **Run the tunnel:**
```bash
# Manual (for testing)
cloudflared tunnel run second-brain

# Or install as a service (runs on boot)
sudo cloudflared service install
```

7. **Access from anywhere:**
Open `https://brain.yourdomain.com` on your phone!

---

## Option 2: Tailscale (Recommended for Single User)

**Free for personal use, completely private, no public domain or auth needed.**

Tailscale creates a private network between your devices. Only devices logged into YOUR Tailscale account can see each other - no one else on the internet can access your Second Brain.

### Quick Start (10 minutes)

#### On Your Desktop (Mac)

```bash
# 1. Install
brew install tailscale

# 2. Start and authenticate (opens browser)
sudo tailscale up

# 3. Get your Tailscale IP (you'll need this for iOS Shortcuts)
tailscale ip -4
# Output example: 100.64.123.45
```

Note this IP address - you'll use it in your iOS Shortcuts.

#### On Your iPhone

1. Download **"Tailscale"** from the App Store
2. Open the app and sign in with the **same account** you used on desktop
3. Toggle **"Connected"** on
4. Test it: Open Safari and go to `http://YOUR_TAILSCALE_IP:3000`

#### Verify It Works

From your phone (with Tailscale connected), open Safari and visit:
```
http://100.x.y.z:3000
```
Replace `100.x.y.z` with your actual Tailscale IP from step 3.

You should see your Second Brain dashboard.

### Why Tailscale for Single User?

| Feature | Tailscale |
|---------|-----------|
| Cost | Free (up to 100 devices) |
| Auth needed in app | No (Tailscale IS your auth) |
| Setup time | ~10 minutes |
| Security | End-to-end encrypted |
| Works behind NAT | Yes |
| Public URL | No (only your devices) |

### Troubleshooting

**Can't connect from phone:**
- Make sure Tailscale is "Connected" on both devices
- Check you're using the Tailscale IP (starts with `100.`), not your local IP
- Verify the dev server is running: `npm run dev`

**Get your IP again:**
```bash
tailscale ip -4
```

**Check Tailscale status:**
```bash
tailscale status
```

---

## Option 3: ngrok (Quick Testing)

**Free tier available, temporary URLs.**

```bash
# Install
brew install ngrok

# Start tunnel (after running `npm run dev`)
ngrok http 3000
```

You'll get a URL like `https://abc123.ngrok.io` - use this on your phone.

---

## Security Notes

- **Cloudflare Tunnel**: Traffic is encrypted, goes through Cloudflare's network
- **Tailscale**: End-to-end encrypted, only your devices can access
- **ngrok**: URLs are public unless you set up auth

For a single-user setup without authentication, Tailscale is the most secure option since the app is only accessible to your own devices.

## Recommended: Add Basic Auth (Optional)

If using Cloudflare Tunnel, you can add Cloudflare Access for authentication:

1. Go to Cloudflare Dashboard → Zero Trust → Access → Applications
2. Add an application for `brain.yourdomain.com`
3. Set policy to allow only your email

This adds a login wall before anyone can access your brain.
