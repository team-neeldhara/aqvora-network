# Frontend

Install:
```bash
npm install
```

Optional environment:
```text
NEXT_PUBLIC_API_BASE_URL=http://localhost:8081
```

Run:
```bash
npm run dev
```

The digital twin loads the first state from REST and then listens to `ws://localhost:8081/ws` for new database rows. It filters WebSocket messages by `deviceId`.
