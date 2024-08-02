import redis
import os

# Connect to Redis server
client = redis.Redis(host=os.getenv('REDIS_HOST', 'localhost'), port=int(os.getenv('REDIS_PORT', 6379)), db=0)

def get_redis_client():
    return client
