FROM nginx:alpine

# 1. Create a non-root user
RUN addgroup -g 1000 -S appgroup && adduser -u 1000 -S appuser -G appgroup

# 2. Ensure directories exist and change ownership
RUN touch /var/run/nginx.pid && \
    mkdir -p /var/cache/nginx /var/lib/nginx /etc/nginx/conf.d && \
    chown -R appuser:appgroup /var/cache/nginx /var/log/nginx /etc/nginx /var/run/nginx.pid /var/lib/nginx


# 3. Set the working directory
WORKDIR /usr/share/nginx/html    

# 4. Copy your JS build files and set ownership
COPY --chown=appuser:appgroup ./app .

# Overwrite the default Nginx config with your custom one (listening on 8080)
COPY --chown=appuser:appgroup nginx.conf /etc/nginx/conf.d/default.conf

# 5. Switch to the non-root user
USER appuser

# 6. Expose the new port
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]