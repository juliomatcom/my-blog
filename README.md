# my blog

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