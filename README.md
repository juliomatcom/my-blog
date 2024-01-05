# my blog

[![Node.js CI](https://github.com/juliomatcom/my-blog/actions/workflows/node.js.yml/badge.svg)](https://github.com/juliomatcom/my-blog/actions/workflows/node.js.yml)

## Setup
- `git clone <repo>`
- `npm i`
- `npm run dev` (need manual reloading of .md and .html)

## Docker compose configuration
```
   my-blog:
     image: "node:20"
     user: "node"
     working_dir: /home/node/app
     environment:
       - NODE_ENV=production
     volumes:
       - ${PWD}/my-blog:/home/node/app
     ports:
       - 3080:3080
     command: bash -c "npm ci && npm start"
```

## Deployment
Automatically handled with tailscale VPN and private ssh to ace server
