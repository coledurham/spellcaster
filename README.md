# Spellcaster Game Engine

## Description

Exploratory 3D Game Engine

## Spin Up

If you are working on the spellcaster project you can run `make build-local-full` to build a new container with latest local changes and then start the contaienr. The UI can be accessed at `localhost:4001`.

## Spin Down

To bring down the app and all resources use `make down prune`. Docker images will not be deleted.

## Local Startup

### Build base images

`make build-base`

### Build local image

`make build-local`

### Run with docker-compose

`make start-local`

Note that this is run by default when executing `make build-local-full` and is not needed to be run manually
