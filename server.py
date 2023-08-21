import asyncio
import websockets

async def handle_connection(websocket, path):
    async for message in websocket:
        # 处理接收到的消息（SDP和ICE信息），然后发送给其他客户端
        await asyncio.gather(
            *(client.send(message) for client in clients if client != websocket)
        )

clients = set()

start_server = websockets.serve(handle_connection, "192.168.1.9", 8080)

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
