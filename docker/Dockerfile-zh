FROM jc21/nginx-proxy-manager:2.9.19

ENV NPM_LANGUAGE="zh"

EXPOSE 80 81 443

RUN  rm -rf /app/frontend
COPY frontend/dist /app/frontend

WORKDIR /app

VOLUME [ "/data", "/etc/letsencrypt" ]
ENTRYPOINT [ "/init" ]

LABEL org.label-schema.schema-version="1.0" \
	org.label-schema.license="MIT" \
	org.label-schema.name="nginx-proxy-manager-zh" \
	org.label-schema.description="Docker container for managing Nginx proxy hosts with a simple, powerful interface " \
	org.label-schema.url="https://github.com/xiaoxinpro/nginx-proxy-manager-zh" \
	org.label-schema.vcs-url="https://github.com/xiaoxinpro/nginx-proxy-manager-zh.git" \
	org.label-schema.cmd="docker run --rm -ti chishin/nginx-proxy-manager-zh:latest"
