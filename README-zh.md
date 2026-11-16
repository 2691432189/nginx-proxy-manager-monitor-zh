<p align="center">
	<a href="README.md">English</a> | <a href="README-zh.md">简体中文</a>
</p>

<p align="center">
	<img src="https://nginxproxymanager.com/github.png">
	<br><br>
	<img src="https://img.shields.io/badge/version-2.17.0-green.svg?style=for-the-badge">
	<a href="https://hub.docker.com/repository/docker/jc21/nginx-proxy-manager">
		<img src="https://img.shields.io/docker/stars/jc21/nginx-proxy-manager.svg?style=for-the-badge">
	</a>
	<a href="https://hub.docker.com/repository/docker/jc21/nginx-proxy-manager">
		<img src="https://img.shields.io/docker/pulls/jc21/nginx-proxy-manager.svg?style=for-the-badge">
	</a>
</p>

本项目提供预构建的 Docker 镜像，让您无需深入了解 Nginx 或 Let's Encrypt，即可轻松将家中或其他位置运行的网站转发出来，并免费启用 SSL。

- [快速安装](#快速安装)
- [完整安装说明（英文）](https://nginxproxymanager.com/setup/)
- [界面截图](https://nginxproxymanager.com/screenshots/)

## 项目目标

我创建这个项目是为了满足个人需求：让用户能够以极其简单的方式完成带 SSL 终止的反向代理主机配置，简单到连猴子都能操作。这个目标从未改变。
虽然项目提供了一些高级选项，但它们都是可选的；项目应当尽可能保持简单，以降低使用门槛。

<a href="https://www.buymeacoffee.com/jc21" target="_blank"><img src="http://public.jc21.com/github/by-me-a-coffee.png" alt="Buy Me A Coffee" style="height: 51px !important;width: 217px !important;" ></a>


## 功能特性

- 基于 [Tabler](https://tabler.github.io/) 构建的美观、安全的管理界面
- 无需了解 Nginx，即可轻松创建转发域名、重定向、端口转发和错误页面
- 通过 Let's Encrypt 获取免费 SSL 证书，或上传自己的自定义 SSL 证书
- 为主机提供通信规则和 HTTP 基本认证
- 为高级用户提供自定义 Nginx 配置
- 用户管理、权限控制和审计日志

::: warning
2.14+ 版本不再支持 `armv7`。这是因为 Node.js 已停止支持 armhf。如果您仍需要该架构，请使用 `2.13.7` 镜像标签。
:::

## 托管家庭网络

这里不会讲得太细，以下是面向刚接触自托管的新手的基础步骤。

1. 家用路由器通常都有“端口转发”设置，登录路由器并找到它
2. 将 80 和 443 端口转发到运行本项目的服务器
3. 配置您的域名解析，使其指向您的家庭网络：可以使用固定 IP，也可以使用以下动态 DNS 服务
   - DuckDNS
   - [Amazon Route53](https://github.com/jc21/route53-ddns)
   - [Cloudflare](https://github.com/jc21/cloudflare-ddns)
4. 使用 Nginx Proxy Manager 作为网关，将请求转发到其他基于 Web 的服务

## 快速安装

1. [安装 Docker](https://docs.docker.com/install/)
2. 创建类似下面的 docker-compose.yml 文件：

```yml
services:
  app:
    image: 'docker.io/jc21/nginx-proxy-manager:latest'
    restart: unless-stopped
    ports:
      - '80:80'
      - '81:81'
      - '443:443'
    volumes:
      - ./data:/data
      - ./letsencrypt:/etc/letsencrypt
```

这是所需的最低配置。更多说明请参阅[文档](https://nginxproxymanager.com/setup/)。

3. 运行以下命令启动服务

```bash
docker compose up -d
```

4. 登录管理界面

容器启动后，通过 `81` 端口访问管理界面。首次启动生成密钥可能需要稍等片刻。

[http://127.0.0.1:81](http://127.0.0.1:81)


## 参与贡献

欢迎针对 `develop` 分支提交 Pull Request。正式版本从 `master` 分支创建。

本项目使用 CI。所有 PR 都必须通过 CI 检查后才会被考虑合并。通过检查后，可在 Docker Hub 上获取该 PR 的 Docker 构建，以便手动验证。

`develop` 分支的文档预览地址：
[https://develop.nginxproxymanager.com](https://develop.nginxproxymanager.com)


### 贡献者

特别感谢[所有贡献者](https://github.com/NginxProxyManager/nginx-proxy-manager/graphs/contributors)。


## 获取支持

1. [发现 Bug？](https://github.com/NginxProxyManager/nginx-proxy-manager/issues)
2. [讨论区](https://github.com/NginxProxyManager/nginx-proxy-manager/discussions)
3. [Reddit](https://reddit.com/r/nginxproxymanager)

---

> 本文档为 `README.md` 的简体中文翻译，如与英文版存在不一致之处，请以英文版为准。
