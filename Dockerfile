# --- Etapa 1: Build ---
# Usa una imagen de Node.js para construir la aplicación React.
FROM node:20 AS build

# Establece el directorio de trabajo.
WORKDIR /app

# Copia los archivos de definición del proyecto e instala las dependencias.
COPY package.json ./
COPY package-lock.json ./
RUN npm install

# Copia el resto de los archivos del frontend.
COPY . .

# Construye la aplicación para producción.
RUN npm run build

# --- Etapa 2: Production ---
# Usa una imagen de Nginx muy ligera para servir los archivos estáticos.
FROM nginx:stable-alpine

# Copia los archivos construidos de la etapa anterior al directorio web de Nginx.
COPY --from=build /app/dist /usr/share/nginx/html

# Copia la configuración personalizada de Nginx.
# Esto es crucial para que el enrutamiento de React (React Router) funcione correctamente.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expone el puerto 80, que es el puerto por defecto de Nginx.
EXPOSE 80

# El comando para iniciar el servidor Nginx.
CMD ["nginx", "-g", "daemon off;"]
