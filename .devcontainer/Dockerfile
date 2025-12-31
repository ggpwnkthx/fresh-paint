FROM denoland/deno:bin AS deno
FROM mcr.microsoft.com/devcontainers/base:debian
COPY --from=deno /deno /usr/local/bin/deno
RUN deno upgrade