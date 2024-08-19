FROM public.ecr.aws/docker/library/node:20.16.0

COPY ./app /app

WORKDIR /app

RUN npm install \
    && npm run build

ENV PORT 80

CMD ["npm", "run", "start"]