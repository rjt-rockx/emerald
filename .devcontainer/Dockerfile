# See here for image contents: https://github.com/microsoft/vscode-dev-containers/tree/v0.145.1/containers/javascript-node/.devcontainer/base.Dockerfile

ARG VARIANT="22-bookworm"
FROM mcr.microsoft.com/devcontainers/javascript-node:1-${VARIANT}

# [Optional] Uncomment this section to install additional OS packages.
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends gcc g++ make

# [Optional] Uncomment if you want to install an additional version of node using nvm
# ARG EXTRA_NODE_VERSION=10
# RUN su node -c "source /usr/local/share/nvm/nvm.sh && nvm install ${EXTRA_NODE_VERSION}"

# [Optional] Uncomment if you want to install more global node modules
RUN npm install -g pm2
