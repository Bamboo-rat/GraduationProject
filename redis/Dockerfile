FROM redis:7-alpine

# Expose Redis port
EXPOSE 6379

# Use redis.conf if needed
# COPY redis.conf /usr/local/etc/redis/redis.conf
# CMD ["redis-server", "/usr/local/etc/redis/redis.conf"]

# Start Redis with password from environment variable
CMD ["sh", "-c", "redis-server --requirepass ${REDIS_PASSWORD:-changeme} --appendonly yes --dir /data"]
