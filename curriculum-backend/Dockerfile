# Use uma imagem base Node.js LTS
FROM node:20-slim AS development

# Define o diretório de trabalho dentro do container
WORKDIR /usr/src/app

# Copia os arquivos de configuração de dependência primeiro para aproveitar o cache do Docker
COPY package*.json ./

# Instala as dependências.
# Se você usar npm ci (clean install), ele usa package-lock.json.
# Caso contrário, npm install.
RUN npm install --omit=dev

# Copia todo o restante do código-fonte para o diretório de trabalho
COPY . .

# Builda a aplicação NestJS
RUN npm run build

# Imagem final de produção
FROM node:20-slim AS production

WORKDIR /usr/src/app

# Copia apenas os arquivos necessários da fase de desenvolvimento
COPY --from=development /usr/src/app/node_modules ./node_modules
COPY --from=development /usr/src/app/dist ./dist
COPY --from=development /usr/src/app/package*.json ./
# Importante: Copia o arquivo da chave de serviço do Firebase
# Assegure-se de que o caminho aqui corresponda ao caminho no seu firebase.provider.ts
COPY --from=development /usr/src/app/src/config/firebase-adminsdk.json ./src/config/firebase-adminsdk.json

# Expõe a porta que o NestJS estará ouvindo (geralmente 3000)
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["node", "dist/main"]
