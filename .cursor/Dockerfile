FROM node:20.19.6-bookworm-slim

SHELL ["/bin/bash", "-o", "pipefail", "-c"]

ARG PNPM_VERSION=8.5.1

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      bash \
      ca-certificates \
      curl \
      git \
      jq \
      less \
      procps \
      ripgrep \
      sudo \
      unzip && \
    rm -rf /var/lib/apt/lists/* && \
    npm install -g "pnpm@${PNPM_VERSION}"

RUN if ! id -u ubuntu >/dev/null 2>&1; then \
      useradd -m -s /bin/bash ubuntu; \
    fi && \
    echo "ubuntu ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/ubuntu && \
    chmod 0440 /etc/sudoers.d/ubuntu && \
    install -d -o ubuntu -g ubuntu /home/ubuntu/.cursor

USER ubuntu
WORKDIR /home/ubuntu
