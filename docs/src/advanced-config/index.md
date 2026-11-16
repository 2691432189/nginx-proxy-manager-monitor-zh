---
outline: deep
---

# Advanced Configuration

## Running processes as a user/group

By default, the services (nginx etc) will run as `root` user inside the docker container.
You can change this behaviour by setting the following environment variables.
Not only will they run the services as this user/group, they will change the ownership
on the `data` and `letsencrypt` folders at startup.

```yml
services:
  app:
    image: 'jc21/nginx-proxy-manager:{{VERSION}}'
    environment:
      PUID: 1000
      PGID: 1000
    # ...
```

This may have the side effect of a failed container start due to permission denied trying
to open port 80 on some systems. The only course to fix that is to remove the variables
and run as the default root user.

## Best Practice: Use a Docker network

For those who have a few of their upstream services running in Docker on the same Docker
host as NPM, here's a trick to secure things a bit better. By creating a custom Docker network,
you don't need to publish ports for your upstream services to all of the Docker host's interfaces.

Create a network, ie "scoobydoo":

```bash
docker network create scoobydoo
```

Then add the following to the `docker-compose.yml` file for both NPM and any other
services running on this Docker host:

```yml
networks:
  default:
    external: true
    name: scoobydoo
```

Let's look at a Portainer example:

```yml
services:

  portainer:
    image: portainer/portainer
    privileged: true
    volumes:
      - './data:/data'
      - '/var/run/docker.sock:/var/run/docker.sock'
    restart: unless-stopped

networks:
  default:
    external: true
    name: scoobydoo
```

Now in the NPM UI you can create a proxy host with `portainer` as the hostname,
and port `9000` as the port. Even though this port isn't listed in the docker-compose
file, it's "exposed" by the Portainer Docker image for you and not available on
the Docker host outside of this Docker network. The service name is used as the
hostname, so make sure your service names are unique when using the same network.

## Docker Healthcheck

The `Dockerfile` that builds this project does not include a `HEALTHCHECK` but you can opt in to this
feature by adding the following to the service in your `docker-compose.yml` file:

```yml
healthcheck:
  test: ["CMD", "/usr/bin/check-health"]
  interval: 10s
  timeout: 3s
```

## Docker File Secrets

This image supports the use of Docker secrets to import from files and keep sensitive usernames or passwords from being passed or preserved in plaintext.

You can set any environment variable from a file by appending `__FILE` (double-underscore FILE) to the environmental variable name.

```yml
secrets:
  # Secrets are single-line text files where the sole content is the secret
  # Paths in this example assume that secrets are kept in local folder called ".secrets"
  DB_ROOT_PWD:
    file: .secrets/db_root_pwd.txt
  MYSQL_PWD:
    file: .secrets/mysql_pwd.txt

services:
  app:
    image: 'jc21/nginx-proxy-manager:{{VERSION}}'
    restart: unless-stopped
    ports:
      # Public HTTP Port:
      - '80:80'
      # Public HTTPS Port:
      - '443:443'
      # Admin Web Port:
      - '81:81'
    environment:
      # These are the settings to access your db
      DB_MYSQL_HOST: "db"
      DB_MYSQL_PORT: 3306
      DB_MYSQL_USER: "npm"
      # DB_MYSQL_PASSWORD: "npm"  # use secret instead
      DB_MYSQL_PASSWORD__FILE: /run/secrets/MYSQL_PWD
      DB_MYSQL_NAME: "npm"
      # If you would rather use Sqlite, remove all DB_MYSQL_* lines above
      # Uncomment this if IPv6 is not enabled on your host
      # DISABLE_IPV6: 'true'
    volumes:
      - ./data:/data
      - ./letsencrypt:/etc/letsencrypt
    secrets:
      - MYSQL_PWD
    depends_on:
      - db

  db:
    image: 'linuxserver/mariadb'
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD__FILE: /run/secrets/DB_ROOT_PWD
      MYSQL_DATABASE: 'npm'
      MYSQL_USER: 'npm'
      MYSQL_PASSWORD__FILE: /run/secrets/MYSQL_PWD
      TZ: 'Australia/Brisbane'
    volumes:
      - ./mariadb:/config
    secrets:
      - DB_ROOT_PWD
      - MYSQL_PWD
```


## Disabling IPv6

On some Docker hosts IPv6 may not be enabled. In these cases, the following message may be seen in the log:

> Address family not supported by protocol

The easy fix is to add a Docker environment variable to the Nginx Proxy Manager stack:

```yml
    environment:
      DISABLE_IPV6: 'true'
```

## Disabling IP Ranges Fetch

By default, NPM fetches IP ranges from CloudFront and Cloudflare during application startup. In environments with limited internet access or to speed up container startup, this fetch can be disabled:

```yml
    environment:
      IP_RANGES_FETCH_ENABLED: 'false'
```

## Custom Nginx Configurations

If you are a more advanced user, you might be itching for extra Nginx customizability.

NPM has the ability to include different custom configuration snippets in different places.

You can add your custom configuration snippet files at `/data/nginx/custom` as follow:

 - `/data/nginx/custom/root_top.conf`: Included at the top of nginx.conf
 - `/data/nginx/custom/root.conf`: Included at the very end of nginx.conf
 - `/data/nginx/custom/http_top.conf`: Included at the top of the main http block
 - `/data/nginx/custom/http.conf`: Included at the end of the main http block
 - `/data/nginx/custom/events.conf`: Included at the end of the events block
 - `/data/nginx/custom/stream.conf`: Included at the end of the main stream block
 - `/data/nginx/custom/server_proxy.conf`: Included at the end of every proxy server block
 - `/data/nginx/custom/server_redirect.conf`: Included at the end of every redirection server block
 - `/data/nginx/custom/server_stream.conf`: Included at the end of every stream server block
 - `/data/nginx/custom/server_stream_tcp.conf`: Included at the end of every TCP stream server block
 - `/data/nginx/custom/server_stream_udp.conf`: Included at the end of every UDP stream server block
 - `/data/nginx/custom/server_dead.conf`: Included at the end of every 404 server block

Every file is optional.


## X-FRAME-OPTIONS Header

You can configure the [`X-FRAME-OPTIONS`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options) header
value by specifying it as a Docker environment variable. The default if not specified is `deny`.

```yml
  ...
  environment:
    X_FRAME_OPTIONS: "sameorigin"
  ...
```

## Customising logrotate settings

By default, NPM rotates the access- and error logs weekly and keeps 4 and 10 log files respectively.
Depending on the usage, this can lead to large log files, especially access logs.
You can customise the logrotate configuration through a mount (if your custom config is `logrotate.custom`):

```yml
  volumes:
    ...
    - ./logrotate.custom:/etc/logrotate.d/nginx-proxy-manager
```

For reference, the default configuration can be found [here](https://github.com/NginxProxyManager/nginx-proxy-manager/blob/develop/docker/rootfs/etc/logrotate.d/nginx-proxy-manager).

## Enabling the geoip2 module

To enable the geoip2 module, you can create the custom configuration file `/data/nginx/custom/root_top.conf` and include the following snippet:

```
load_module /usr/lib/nginx/modules/ngx_http_geoip2_module.so;
load_module /usr/lib/nginx/modules/ngx_stream_geoip2_module.so;
```

## Auto Initial User Creation

Setting these environment variables will create the default user on startup, skipping the UI first user setup screen:

```yml
    environment:
      INITIAL_ADMIN_EMAIL: my@example.com
      INITIAL_ADMIN_PASSWORD: mypassword1
```

## Disable Nginx Resolver

On startup, we generate a resolvers directive for Nginx unless this is defined:

```yml
    environment:
      DISABLE_RESOLVER: true
```

In this configuration, all DNS queries performed by Nginx will fall to the `/etc/hosts` file
and then the `/etc/resolv.conf`.


## Changing the Admin UI port from 81 to something else

First, add an env var to your docker compose file:
```yml
    environment:
      NPM_ADMIN_PORT: '8000'
```

And you'll probably want to expose that port as well

```yml
    ports:
      - '8000:8000'
```

Then you'll be able to access admin UI at `http://localhost:8000`

## Custom listen ports for Proxy Hosts

Proxy Hosts can use a custom HTTP and HTTPS listening port instead of the default `80` and `443`.
The ports are set per host in the Proxy Host details:

- **HTTP Listen Port** defaults to `80` and is always used.
- **HTTPS Listen Port** defaults to `443` and is only used when a certificate is selected for the host. If no certificate is selected, the host only has an HTTP listener; the HTTPS port is stored and validated, but it is not rendered into the nginx configuration.

Ports must be integers between `1` and `65535`. When a host uses a non-default port, visitors must include the port in the URL (for example, `https://example.com:8443`).

### Publish custom ports in Docker

`EXPOSE` in an image is metadata only; it does not publish a port. Every custom listen port must also be published in `docker-compose.yml` (or with `docker run -p`), otherwise it is not reachable from outside the container network.

```yml
services:
  app:
    image: 'jc21/nginx-proxy-manager:{{VERSION}}'
    restart: unless-stopped
    ports:
      - '80:80'       # HTTP, also required for Let's Encrypt HTTP-01
      - '443:443'     # HTTPS
      - '81:81'       # Admin UI (change both sides if NPM_ADMIN_PORT is set)
      - '8080:8080'   # Example custom HTTP listen port
      - '8443:8443'   # Example custom HTTPS listen port
```

If `NPM_ADMIN_PORT` is changed, publish that port instead of `81` on both sides of the mapping. With `network_mode: host`, no port mapping is needed; the host firewall must allow the ports.

### Port rules

- Port `80` always serves plain HTTP, and Let's Encrypt HTTP-01 challenges also use port `80` regardless of a host's HTTP listen port. Port `443` always serves TLS and remains the default HTTPS port. A host's HTTP listen port cannot be `443`, and its HTTPS listen port cannot be `80`.
- A port cannot serve plain HTTP for one Proxy Host and TLS for another enabled Proxy Host. nginx requires the same `listen` options for every server on an address and port, so a mismatch would make it reject the generated configuration. For example, if one host listens on `8080` for HTTP, another enabled host cannot use `8080` for HTTPS.
- When a host has a certificate, its HTTP and HTTPS listen ports must be different.

A host without a certificate only listens on its HTTP port, so its HTTPS port does not create a TLS listener or conflict with one. The stored value is still validated, and it is checked against other hosts when a certificate is added.

### Port conflicts

NPM validates the listen ports when a Proxy Host is created, when its listen ports, certificate, or enabled state change, and when it is re-enabled. Other updates skip the check. A conflict returns HTTP `400` and the change is rejected. The following are rejected:

- values that are not integers between `1` and `65535`
- port `3000`, which is used by the NPM backend
- the admin UI port (`81`, or `NPM_ADMIN_PORT` when configured). If you mount your own `production.conf`, NPM cannot read its `listen` port, so keep the reserved port in sync with `NPM_ADMIN_PORT`
- `443` for HTTP, or `80` for HTTPS
- equal HTTP and HTTPS ports on a host with a certificate
- an HTTP listen port already used for HTTPS by another enabled Proxy Host
- an HTTPS listen port already used for HTTP by another enabled Proxy Host when the host has a certificate
- a port used by an enabled TCP Stream

When the container uses `network_mode: host`, nginx binds directly to host ports. NPM cannot detect a conflict with another service already using a port on the host, and `nginx -t` does not perform a bind check, so a reload can appear to succeed while nginx cannot listen. Make sure the port is free on the host before saving the Proxy Host.

The check only runs in one direction: saving a Proxy Host looks at existing Streams, but saving a TCP Stream does not look at existing Proxy Hosts. If you add a Stream after a Proxy Host, make sure the Stream's incoming port is not already used by a Proxy Host.

### Unknown hosts on custom ports

The built-in listeners on `80` and `443` have fallback/default servers, and the fallback on `443` enables `ssl_reject_handshake`. Custom ports do not get an equivalent `default_server`. If a request arrives on a custom port with a Host header or TLS SNI that does not match any Proxy Host:

- nginx uses the first Proxy Host configured on that port.
- on a custom HTTPS port, the client receives that first host's certificate and content.

For high-security deployments, continue to use the default HTTPS port `443`, which rejects unknown SNI.

### HSTS and custom HTTPS ports

HSTS is configured per host and applies to the host name, not to a port. If a Proxy Host uses a custom HTTPS port and HSTS is enabled, a browser that has seen the HSTS header may upgrade later requests to port `443` instead of the custom port. Do not combine HSTS with a custom HTTPS port; use the default `443` if you need HSTS.

### Certificates and port 80

Let's Encrypt HTTP-01 validation always connects to port `80`, not to the HTTP listen port configured on the Proxy Host. If you issue or renew certificates with HTTP-01, the container must keep publishing port `80`, and that port must be reachable from the public internet.

If port `80` is not available, use a DNS-01 challenge instead. A custom HTTPS port does not affect certificate selection: nginx still selects the certificate by SNI.

### Custom nginx configuration and force-ssl.conf

`conf.d/include/force-ssl.conf` is an internal include used by the generated host configuration. It expects `$npm_ssl_redirect_host` to be set by the host template; do not include it directly from a custom configuration. If you do, set that variable first, otherwise `nginx -t` fails with an unknown variable.
