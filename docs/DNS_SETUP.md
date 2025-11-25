# DNS Setup for dcktokens.com

## Recommended DNS Records

| Type | Name            | Value/Target         | Purpose                  |
|------|-----------------|---------------------|--------------------------|
| A    | @               | YOUR.SERVER.IP      | Main site/API server     |
| CNAME| www             | dcktokens.com       | Redirect to apex domain  |
| A    | api             | YOUR.SERVER.IP      | API subdomain            |

### Provider notes
- Use Cloudflare, Namecheap, or your DNS dashboard for management.
- Enable SSL and use TTL 300.
- Update records if you change your server IP.

### Verification
- Health check: https://api.dcktoken.com/readyz (should return 200)
- Monitor DNS: https://dnschecker.org/
