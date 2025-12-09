SHELL := bash
PLATFORM ?= linux/amd64
REMOTE ?= changeme.com

.PHONY: help

build-base: Dockerfile.build
	@docker build --platform $(PLATFORM) -t spellcaster:base -f Dockerfile.build .

build-local: Dockerfile.build Dockerfile.local
	@docker build --platform $(PLATFORM) -t spellcaster:local -f Dockerfile.local .

build-local-full:
	@docker context use default 
	@make build-base build-local start-local

build-remote: Dockerfile.build Dockerfile.remote
	@make build-base
	@docker build --platform $(PLATFORM) -t $(REMOTE)/spellcaster:cluster -f Dockerfile.remote .

start-local:
	@docker compose -f docker-compose.yml up -d

remove-dangling:
	@docker rmi $$(docker images -q --filter dangling=true)

prune:
	@docker volume prune -f
	@docker network prune -f

down:
	@docker compose down --remove-orphans

down-local-full:
	@make down
	@docker rmi -f $$(docker images --filter "label=project=spellcaster" -aq)
	@make prune

rebuild-local: Dockerfile.local
	@make build-local
	@docker compose -f docker-compose.yml up -d --no-deps

help:
	@echo "build-base           Build the base image used by prod and local."
	@echo "build-local          Build the local image for running spellcaster app locally."
	@echo "build-local-full     Build and run local in full; including base images."
	@echo "rebuild-local        Rebuild spellcaster container and restart"
	@echo "build-remote			Build remote cluster image"
	@echo "start-local          Start the local instance and run it."
	@echo "remove-dangling      Remove dangling images."
	@echo "prune                Remove dangling volumes and networks."
	@echo "down                 Docker down and remove spellcaster volume."
	@echo "down-local-full      Docker down and remove spellcaster volume and all images including base."
