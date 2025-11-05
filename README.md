# Spellcaster Game Engine

## Description

Exploratory 3D Game Engine

## Spin Up

If you are working on the spellcaster project you can run `make build-local-full` to build a new container with latest local changes and then start the contaienr. The UI can be accessed at `localhost:4001`.

## Spin Down

To bring down the app and all resources and delete the image that was built use `make down-local-full`. If you want to retain api and db images between runs you can run `make down prune`.

## Run Webpack

To manually run webpack in the container in watch mode use `make run-webpack`. Normally this is not necessary as `make build-local-full` runs the webpack command by default.


## Local Startup

### Build base images

`make build-base`

### Build local image

`make build-local`

### Run with docker-compose

`make start-local`

Note that this is run by default when executing `make build-local-full` and is not needed to be run manually
